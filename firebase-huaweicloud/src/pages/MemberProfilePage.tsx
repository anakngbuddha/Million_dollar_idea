import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import {
  ArrowLeft,
  User,
  FileText,
  CheckSquare,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import '../styles/ClassroomDetail.css';

interface QuizResult {
  id: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: Timestamp;
}

interface AssignmentSubmission {
  id: string;
  title: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  submittedAt: Timestamp;
}

export const MemberProfilePage: React.FC = () => {
  const { classroomId, memberId } = useParams<{ classroomId: string; memberId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (classroomId && memberId && user) {
      fetchData();
    }
  }, [classroomId, memberId, user]);

  const fetchData = async () => {
    if (!classroomId || !memberId || !user) return;

    try {
      setIsLoading(true);

      // Check if user is a member of the classroom (and is instructor)
      const classroomRef = doc(db, 'classrooms', classroomId);
      const classroomSnap = await getDoc(classroomRef);

      if (!classroomSnap.exists()) {
        setError('Classroom not found');
        return;
      }

      const classroomData = classroomSnap.data();

      // Only instructor can view member profiles
      if (classroomData.authorId !== user.uid) {
        setError('Only instructors can view member profiles');
        return;
      }

      // Fetch member info
      const memberRef = doc(db, 'users', memberId);
      const memberSnap = await getDoc(memberRef);

      if (!memberSnap.exists()) {
        setError('Member not found');
        return;
      }

      const memberData = memberSnap.data();
      setMemberInfo({
        uid: memberId,
        displayName: memberData.displayName || memberData.email,
        email: memberData.email,
      });

      // Fetch quiz attempts for this member in this classroom
      const quizAttemptsRef = collection(db, 'quizAttempts');
      const quizAttemptsQuery = query(
        quizAttemptsRef,
        where('userId', '==', memberId)
      );
      const quizAttemptsSnap = await getDocs(quizAttemptsQuery);

      // Get all quizzes assigned to this classroom by the instructor
      const classroomQuizzesRef = collection(db, 'classroomQuizzes');
      const classroomQuizzesQuery = query(
        classroomQuizzesRef,
        where('classroomId', '==', classroomId),
        where('assignedBy', '==', user.uid)
      );
      const classroomQuizzesSnap = await getDocs(classroomQuizzesQuery);
      const assignedQuizIds = new Set(classroomQuizzesSnap.docs.map(d => d.data().quizId));

      // Filter quiz attempts to only those assigned by this instructor
      const quizzes: QuizResult[] = quizAttemptsSnap.docs
        .map(doc => ({
          id: doc.id,
          quizTitle: doc.data().quizTitle,
          score: doc.data().score,
          maxScore: doc.data().maxScore,
          percentage: doc.data().percentage,
          completedAt: doc.data().completedAt,
        }))
        .filter((_, index) => {
          const doc = quizAttemptsSnap.docs[index];
          return assignedQuizIds.has(doc.data().quizId);
        });

      setQuizResults(quizzes);

      // Fetch assignments for this member in this classroom
      const assignmentsRef = collection(db, 'assignments');
      const assignmentsQuery = query(
        assignmentsRef,
        where('classroomId', '==', classroomId)
      );
      const assignmentsSnap = await getDocs(assignmentsQuery);

      const assignments = assignmentsSnap.docs
        .map(doc => {
          const data = doc.data();
          const submissions = data.submissions || [];
          const memberSubmission = submissions.find((s: any) => s.studentId === memberId);

          if (!memberSubmission) {
            return null;
          }

          return {
            id: doc.id,
            title: data.title,
            score: memberSubmission.score,
            maxScore: data.maxScore,
            percentage: data.maxScore ? (memberSubmission.score / data.maxScore) * 100 : undefined,
            submittedAt: memberSubmission.submittedAt,
          } as AssignmentSubmission;
        })
        .filter((a): a is AssignmentSubmission => a !== null);

      setAssignmentSubmissions(assignments);
    } catch (err) {
      console.error('Error fetching member profile:', err);
      setError('Failed to load member profile');
    } finally {
      setIsLoading(false);
    }
  };

  const exportMemberToExcel = () => {
    if (!memberInfo) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ['Member Profile Summary'],
      ['Name', memberInfo.displayName],
      ['Email', memberInfo.email],
      [''],
      ['Total Quizzes Taken', quizResults.length],
      ['Average Quiz Score', quizResults.length > 0
        ? (quizResults.reduce((sum, q) => sum + q.percentage, 0) / quizResults.length).toFixed(2) + '%'
        : 'N/A'],
      ['Total Assignments', assignmentSubmissions.length],
      ['Average Assignment Score', assignmentSubmissions.length > 0
        ? (assignmentSubmissions.reduce((sum, a) => sum + (a.percentage || 0), 0) / assignmentSubmissions.length).toFixed(2) + '%'
        : 'N/A'],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Sheet 2: Detailed Quizzes with Date
    const quizzesData: any[][] = [
      ['Quizzes - Detailed Scores'],
      [],
      ['Quiz Title', 'Date Taken', 'Score', 'Max Score', 'Percentage'],
      ...quizResults.map(q => [
        q.quizTitle,
        q.completedAt ? new Date(q.completedAt.toMillis()).toLocaleString() : 'N/A',
        q.score,
        q.maxScore,
        q.percentage.toFixed(1) + '%',
      ]),
      [],
      ['Total Quizzes', quizResults.length],
      ['Average Score', quizResults.length > 0
        ? (quizResults.reduce((sum, q) => sum + q.percentage, 0) / quizResults.length).toFixed(1) + '%'
        : 'N/A'],
    ];

    const quizzesSheet = XLSX.utils.aoa_to_sheet(quizzesData);
    quizzesSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, quizzesSheet, 'Quizzes');

    // Sheet 3: Detailed Assignments with Date
    const assignmentsData: any[][] = [
      ['Assignments - Detailed Scores'],
      [],
      ['Assignment Title', 'Date Submitted', 'Score', 'Max Score', 'Percentage'],
      ...assignmentSubmissions.map(a => [
        a.title,
        a.submittedAt ? new Date(a.submittedAt.toMillis()).toLocaleString() : 'Not Submitted',
        a.score !== undefined ? a.score : 'Not Graded',
        a.maxScore || 'N/A',
        a.percentage ? a.percentage.toFixed(1) + '%' : 'Not Graded',
      ]),
      [],
      ['Total Assignments', assignmentSubmissions.length],
      ['Average Score', assignmentSubmissions.length > 0
        ? (assignmentSubmissions.reduce((sum, a) => sum + (a.percentage || 0), 0) / assignmentSubmissions.length).toFixed(1) + '%'
        : 'N/A'],
    ];

    const assignmentsSheet = XLSX.utils.aoa_to_sheet(assignmentsData);
    assignmentsSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, assignmentsSheet, 'Assignments');

    // Sheet 4: Summary Table (Quiz & Assignment scores together)
    const combinedData: any[][] = [
      ['Overall Performance Summary'],
      [],
    ];

    // Create headers for combined view
    const combinedHeaders = ['Assessment Type', 'Name', 'Score', 'Date'];
    combinedData.push(combinedHeaders);

    // Add quiz data
    quizResults.forEach(q => {
      combinedData.push([
        'Quiz',
        q.quizTitle,
        `${q.score}/${q.maxScore} (${q.percentage.toFixed(1)}%)`,
        q.completedAt ? new Date(q.completedAt.toMillis()).toLocaleDateString() : 'N/A',
      ]);
    });

    // Add assignment data
    assignmentSubmissions.forEach(a => {
      combinedData.push([
        'Assignment',
        a.title,
        a.score !== undefined ? `${a.score}/${a.maxScore} (${a.percentage ? a.percentage.toFixed(1) : 'N/A'}%)` : 'Not Graded',
        a.submittedAt ? new Date(a.submittedAt.toMillis()).toLocaleDateString() : 'Not Submitted',
      ]);
    });

    const combinedSheet = XLSX.utils.aoa_to_sheet(combinedData);
    combinedSheet['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, combinedSheet, 'Overall');

    XLSX.writeFile(wb, `${memberInfo.displayName}_Profile_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading member profile...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div style={{ padding: '20px' }}>
          <button
            onClick={() => navigate(`/classroom/${classroomId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} />
            Back to Classroom
          </button>
          <div style={{ marginTop: '20px', color: 'red' }}>
            <p>{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => navigate(`/classroom/${classroomId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            <ArrowLeft size={18} />
            Back to Classroom
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <User size={32} style={{ color: 'var(--color-primary)' }} />
              <div>
                <h2 style={{ margin: '0 0 4px 0' }}>{memberInfo?.displayName}</h2>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                  {memberInfo?.email}
                </p>
              </div>
            </div>

            <button
              onClick={exportMemberToExcel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              <Download size={18} />
              Export Profile
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <p style={{ margin: '0 0 8px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              Quizzes Taken
            </p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              {quizResults.length}
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <p style={{ margin: '0 0 8px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              Avg Quiz Score
            </p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              {quizResults.length > 0
                ? (quizResults.reduce((sum, q) => sum + q.percentage, 0) / quizResults.length).toFixed(1) + '%'
                : 'N/A'}
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <p style={{ margin: '0 0 8px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              Assignments Submitted
            </p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              {assignmentSubmissions.length}
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <p style={{ margin: '0 0 8px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              Avg Assignment Score
            </p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              {assignmentSubmissions.length > 0
                ? (assignmentSubmissions.reduce((sum, a) => sum + (a.percentage || 0), 0) / assignmentSubmissions.length).toFixed(1) + '%'
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Quizzes Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CheckSquare size={20} />
            Quizzes ({quizResults.length})
          </h3>

          {quizResults.length === 0 ? (
            <div
              style={{
                padding: '20px',
                backgroundColor: 'var(--color-background)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}
            >
              No quizzes taken yet
            </div>
          ) : (
            <div
              style={{
                overflow: 'auto',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'var(--color-background)',
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'var(--color-border)',
                      borderBottom: '2px solid var(--color-border)',
                    }}
                  >
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '600',
                      }}
                    >
                      Quiz Title
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                      Score
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                      Percentage
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                      Completed At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quizResults.map((quiz, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <td style={{ padding: '12px' }}>{quiz.quizTitle}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {quiz.score} / {quiz.maxScore}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          color:
                            quiz.percentage >= 70
                              ? '#10B981'
                              : quiz.percentage >= 50
                              ? '#F59E0B'
                              : '#EF4444',
                          fontWeight: '600',
                        }}
                      >
                        {quiz.percentage.toFixed(1)}%
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {quiz.completedAt
                          ? new Date(quiz.completedAt.toMillis()).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assignments Section */}
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FileText size={20} />
            Assignments ({assignmentSubmissions.length})
          </h3>

          {assignmentSubmissions.length === 0 ? (
            <div
              style={{
                padding: '20px',
                backgroundColor: 'var(--color-background)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}
            >
              No assignments submitted yet
            </div>
          ) : (
            <div
              style={{
                overflow: 'auto',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'var(--color-background)',
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'var(--color-border)',
                      borderBottom: '2px solid var(--color-border)',
                    }}
                  >
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '600',
                      }}
                    >
                      Assignment Title
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                      Score
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                      Percentage
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentSubmissions.map((assignment, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <td style={{ padding: '12px' }}>{assignment.title}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {assignment.score !== undefined ? `${assignment.score} / ${assignment.maxScore}` : 'Not Graded'}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          color:
                            assignment.percentage !== undefined
                              ? assignment.percentage >= 70
                                ? '#10B981'
                                : assignment.percentage >= 50
                                ? '#F59E0B'
                                : '#EF4444'
                              : 'var(--color-text-secondary)',
                          fontWeight: '600',
                        }}
                      >
                        {assignment.percentage !== undefined ? assignment.percentage.toFixed(1) + '%' : 'Not Graded'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {assignment.submittedAt
                          ? new Date(assignment.submittedAt.toMillis()).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

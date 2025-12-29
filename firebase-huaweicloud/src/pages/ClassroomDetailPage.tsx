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
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Users,
  Calendar,
  BookOpen,
  FileText,
  CheckSquare,
  Lock,
  Globe,
  AlertCircle,
  Settings,
  Share2,
  Download,
} from 'lucide-react';
import { ModulesTab } from '../components/ModulesTab';
import { AssignmentsTab } from '../components/AssignmentsTab';
import { ClassroomQuizzesTab } from '../components/ClassroomQuizzesTab';
import '../styles/ClassroomDetail.css';

interface Classroom {
  id: string;
  name: string;
  code: string;
  isPublic: boolean;
  maxMembers: number;
  authorId: string;
  authorName: string;
  authorEmail: string;
  members: string[];
  createdAt: any;
  description?: string;
}

interface ClassroomMember {
  uid: string;
  displayName: string;
  email: string;
  isAuthor: boolean;
}

export const ClassroomDetailPage: React.FC = () => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [members, setMembers] = useState<ClassroomMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'quizzes' | 'assignments' | 'members'>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassroomDetails();
  }, [classroomId, user]);

  const fetchClassroomDetails = async () => {
    if (!classroomId || !user) return;

    try {
      setIsLoading(true);
      const classroomRef = doc(db, 'classrooms', classroomId);
      const classroomSnap = await getDoc(classroomRef);

      if (!classroomSnap.exists()) {
        setError('Classroom not found');
        return;
      }

      const classroomData = classroomSnap.data() as Classroom;

      // Check if user is a member
      if (!classroomData.members.includes(user.uid)) {
        setError('You do not have access to this classroom');
        return;
      }

      setClassroom(classroomData);

      // Fetch member details from users collection
      const memberList: ClassroomMember[] = [];
      
      for (const uid of classroomData.members) {
        if (uid === classroomData.authorId) {
          memberList.push({
            uid,
            displayName: classroomData.authorName,
            email: classroomData.authorEmail,
            isAuthor: true,
          });
        } else {
          try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              memberList.push({
                uid,
                displayName: userData.displayName || userData.email || 'User',
                email: userData.email || '',
                isAuthor: false,
              });
            } else {
              memberList.push({
                uid,
                displayName: 'User',
                email: '',
                isAuthor: false,
              });
            }
          } catch (err) {
            console.error('Error fetching user details:', err);
            memberList.push({
              uid,
              displayName: 'User',
              email: '',
              isAuthor: false,
            });
          }
        }
      }

      setMembers(memberList);
    } catch (err) {
      console.error('Error fetching classroom:', err);
      setError('Failed to load classroom');
    } finally {
      setIsLoading(false);
    }
  };

  const isInstructor = classroom?.authorId === user?.uid;

  const handleGoBack = () => {
    navigate('/classrooms');
  };

  const exportClassToExcel = async () => {
    if (!classroom || !classroomId) return;

    try {
      const wb = XLSX.utils.book_new();

      // Fetch all quizzes assigned to this classroom
      const classroomQuizzesRef = collection(db, 'classroomQuizzes');
      const classroomQuizzesQuery = query(
        classroomQuizzesRef,
        where('classroomId', '==', classroomId)
      );
      const classroomQuizzesSnap = await getDocs(classroomQuizzesQuery);
      const assignedQuizIds = new Set(classroomQuizzesSnap.docs.map(d => d.data().quizId));

      // Fetch all quiz attempts
      const quizAttemptsRef = collection(db, 'quizAttempts');
      const quizAttemptsSnap = await getDocs(quizAttemptsRef);

      // Fetch all assignments for this classroom
      const assignmentsRef = collection(db, 'assignments');
      const assignmentsQuery = query(
        assignmentsRef,
        where('classroomId', '==', classroomId)
      );
      const assignmentsSnap = await getDocs(assignmentsQuery);

      // Build comprehensive data structure
      interface MemberData {
        [key: string]: {
          displayName: string;
          email: string;
          quizzes: { [key: string]: { score: number; maxScore: number; percentage: number; date: string } };
          assignments: { [key: string]: { score?: number; maxScore?: number; percentage?: number; date: string } };
        };
      }

      const memberData: MemberData = {};

      // Initialize member data
      for (const member of members) {
        if (!member.isAuthor) {
          memberData[member.uid] = {
            displayName: member.displayName,
            email: member.email,
            quizzes: {},
            assignments: {},
          };
        }
      }

      // Add quiz scores with dates
      quizAttemptsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (assignedQuizIds.has(data.quizId) && memberData[data.userId]) {
          memberData[data.userId].quizzes[data.quizTitle] = {
            score: data.score,
            maxScore: data.maxScore,
            percentage: data.percentage,
            date: data.completedAt ? new Date(data.completedAt.toMillis()).toLocaleDateString() : 'N/A',
          };
        }
      });

      // Add assignment scores with dates
      assignmentsSnap.docs.forEach(doc => {
        const data = doc.data();
        const title = data.title;
        const submissions = data.submissions || [];

        submissions.forEach((submission: any) => {
          if (memberData[submission.studentId]) {
            if (submission.score !== undefined && data.maxScore) {
              memberData[submission.studentId].assignments[title] = {
                score: submission.score,
                maxScore: data.maxScore,
                percentage: (submission.score / data.maxScore) * 100,
                date: submission.submittedAt ? new Date(submission.submittedAt.toMillis()).toLocaleDateString() : 'Not Submitted',
              };
            } else {
              memberData[submission.studentId].assignments[title] = {
                date: submission.submittedAt ? new Date(submission.submittedAt.toMillis()).toLocaleDateString() : 'Not Submitted',
              };
            }
          }
        });
      });

      // Get all unique quiz and assignment titles
      const allQuizzes = new Set<string>();
      const allAssignments = new Set<string>();

      Object.values(memberData).forEach(member => {
        Object.keys(member.quizzes).forEach(q => allQuizzes.add(q));
        Object.keys(member.assignments).forEach(a => allAssignments.add(a));
      });

      // Create detailed sheet with all members' data
      const allMembersData: any[][] = [
        ['Classroom: ' + classroom.name, '', 'Export Date: ' + new Date().toLocaleDateString()],
        [],
      ];

      // Create headers - alternating between quiz/assignment names and dates
      const headerRow1 = ['Student Name', 'Email'];
      const headerRow2 = ['', ''];

      Array.from(allQuizzes).forEach(q => {
        headerRow1.push(q, '');
        headerRow2.push('Score', 'Date');
      });

      Array.from(allAssignments).forEach(a => {
        headerRow1.push(a, '');
        headerRow2.push('Score', 'Date');
      });

      headerRow1.push('Quiz Avg', 'Assignment Avg', 'Overall Avg');
      headerRow2.push('', '', '');

      allMembersData.push(headerRow1);
      allMembersData.push(headerRow2);

      // Data rows
      Object.entries(memberData).forEach(([_, member]) => {
        const row = [member.displayName, member.email];

        // Add quiz scores and dates
        Array.from(allQuizzes).forEach(q => {
          const quiz = member.quizzes[q];
          if (quiz) {
            row.push(
              `${quiz.score}/${quiz.maxScore} (${quiz.percentage.toFixed(1)}%)`,
              quiz.date
            );
          } else {
            row.push('Not Taken', 'N/A');
          }
        });

        // Add assignment scores and dates
        Array.from(allAssignments).forEach(a => {
          const assignment = member.assignments[a];
          if (assignment && assignment.score !== undefined) {
            row.push(
              `${assignment.score}/${assignment.maxScore} (${assignment.percentage?.toFixed(1)}%)`,
              assignment.date
            );
          } else if (assignment) {
            row.push('Not Graded', assignment.date);
          } else {
            row.push('Not Submitted', 'N/A');
          }
        });

        // Calculate averages
        const quizScores = Object.values(member.quizzes).map(q => q.percentage);
        const quizAvg = quizScores.length > 0
          ? (quizScores.reduce((a, b) => a + b, 0) / quizScores.length).toFixed(1) + '%'
          : 'N/A';

        const assignmentScores = Object.values(member.assignments)
          .filter(a => a.percentage !== undefined)
          .map(a => a.percentage!);
        const assignmentAvg = assignmentScores.length > 0
          ? (assignmentScores.reduce((a, b) => a + b, 0) / assignmentScores.length).toFixed(1) + '%'
          : 'N/A';

        const allScores = [...quizScores, ...assignmentScores];
        const overallAvg = allScores.length > 0
          ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) + '%'
          : 'N/A';

        row.push(quizAvg, assignmentAvg, overallAvg);

        allMembersData.push(row);
      });

      const allMembersSheet = XLSX.utils.aoa_to_sheet(allMembersData);
      allMembersSheet['!cols'] = Array(headerRow1.length).fill({ wch: 18 });
      XLSX.utils.book_append_sheet(wb, allMembersSheet, 'Class Report');

      // Create a summary statistics sheet
      const statsData: any[][] = [
        ['Class Statistics Summary'],
        ['Classroom', classroom.name],
        ['Export Date', new Date().toLocaleDateString()],
        [],
        ['Assessment Name', 'Type', 'Avg Score', 'High Score', 'Low Score', 'Students'],
      ];

      // Quiz statistics
      Array.from(allQuizzes).forEach(quiz => {
        const scores = Object.values(memberData)
          .map(m => m.quizzes[quiz]?.percentage)
          .filter(s => s !== undefined) as number[];

        if (scores.length > 0) {
          statsData.push([
            quiz,
            'Quiz',
            (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) + '%',
            Math.max(...scores).toFixed(1) + '%',
            Math.min(...scores).toFixed(1) + '%',
            scores.length,
          ]);
        }
      });

      // Assignment statistics
      Array.from(allAssignments).forEach(assignment => {
        const scores = Object.values(memberData)
          .map(m => m.assignments[assignment]?.percentage)
          .filter(s => s !== undefined) as number[];

        if (scores.length > 0) {
          statsData.push([
            assignment,
            'Assignment',
            (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) + '%',
            Math.max(...scores).toFixed(1) + '%',
            Math.min(...scores).toFixed(1) + '%',
            scores.length,
          ]);
        }
      });

      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      statsSheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, statsSheet, 'Statistics');

      // Save the file
      XLSX.writeFile(
        wb,
        `${classroom.name}_Class_Report_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } catch (error) {
      console.error('Error exporting class data:', error);
      alert('Failed to export class data');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="classroom-detail-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading classroom...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !classroom) {
    return (
      <AppLayout>
        <div className="classroom-detail-container">
          <button className="back-button" onClick={handleGoBack}>
            <ArrowLeft size={20} />
            Back to Classrooms
          </button>
          <div className="error-container">
            <AlertCircle size={48} />
            <h2>{error || 'Classroom not found'}</h2>
            <button className="btn btn-primary" onClick={handleGoBack}>
              Return to Classrooms
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="classroom-detail-container">
        {/* Header */}
        <div className="detail-header">
          <button className="back-button" onClick={handleGoBack}>
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="header-info">
            <div className="title-section">
              <h1>{classroom.name}</h1>
              <div className="badges">
                {classroom.isPublic ? (
                  <span className="badge badge-public">
                    <Globe size={14} />
                    Public
                  </span>
                ) : (
                  <span className="badge badge-private">
                    <Lock size={14} />
                    Private
                  </span>
                )}
                {isInstructor && (
                  <span className="badge badge-instructor">
                    <Settings size={14} />
                    Instructor
                  </span>
                )}
              </div>
            </div>

            {classroom.description && (
              <p className="header-description">{classroom.description}</p>
            )}

            <div className="header-meta">
              <div className="meta-item">
                <Users size={16} />
                <span>{classroom.members.length} / {classroom.maxMembers} Members</span>
              </div>
              <div className="meta-item">
                <Calendar size={16} />
                <span>
                  Created {classroom.createdAt?.toDate
                    ? new Date(classroom.createdAt.toDate()).toLocaleDateString()
                    : 'Recently'}
                </span>
              </div>
              <div className="meta-item">
                <FileText size={16} />
                <span>Instructor: {classroom.authorName}</span>
              </div>
            </div>
          </div>

          {isInstructor && (
            <div className="header-actions">
              <button className="btn btn-secondary btn-sm">
                <Share2 size={16} />
                Share
              </button>
              <button className="btn btn-secondary btn-sm">
                <Settings size={16} />
                Settings
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BookOpen size={18} />
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'modules' ? 'active' : ''}`}
            onClick={() => setActiveTab('modules')}
          >
            <FileText size={18} />
            Modules
          </button>
          <button
            className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quizzes')}
          >
            <CheckSquare size={18} />
            Quizzes
          </button>
          <button
            className={`tab ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            <FileText size={18} />
            Assignments
          </button>
          <button
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={18} />
            Members
          </button>
        </div>

        {/* Content Area */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="content-grid">
                <div className="content-card">
                  <div className="card-icon">
                    <FileText size={24} />
                  </div>
                  <h3>Modules</h3>
                  <p>Course materials and lessons</p>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('modules')}>
                    View Modules
                  </button>
                </div>

                <div className="content-card">
                  <div className="card-icon">
                    <CheckSquare size={24} />
                  </div>
                  <h3>Quizzes</h3>
                  <p>Assessment and practice tests</p>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('quizzes')}>
                    Take Quiz
                  </button>
                </div>

                <div className="content-card">
                  <div className="card-icon">
                    <FileText size={24} />
                  </div>
                  <h3>Assignments</h3>
                  <p>Homework and projects</p>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('assignments')}>
                    View Assignments
                  </button>
                </div>

                <div className="content-card">
                  <div className="card-icon">
                    <Users size={24} />
                  </div>
                  <h3>Members</h3>
                  <p>{classroom.members.length} students enrolled</p>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('members')}>
                    View Members
                  </button>
                </div>
              </div>

              {classroom.description && (
                <div className="info-section">
                  <h2>About This Classroom</h2>
                  <p>{classroom.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <ModulesTab classroomId={classroomId || ''} isInstructor={isInstructor} />
          )}

          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && (
            <ClassroomQuizzesTab classroomId={classroomId || ''} isInstructor={isInstructor} userId={user?.uid || ''} />
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <AssignmentsTab
              classroomId={classroomId || ''}
              isInstructor={isInstructor}
              userId={user?.uid || ''}
            />
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="tab-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Classroom Members ({members.length})</h2>
                {isInstructor && (
                  <button
                    onClick={exportClassToExcel}
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
                    Export Class Report
                  </button>
                )}
              </div>
              <div className="members-grid">
                {members.map((member) => (
                  <div
                    key={member.uid}
                    className="member-card"
                    onClick={() => {
                      // Only allow instructors to view member profiles
                      if (isInstructor && !member.isAuthor) {
                        navigate(`/classroom/${classroomId}/member/${member.uid}`);
                      }
                    }}
                    style={{
                      cursor: isInstructor && !member.isAuthor ? 'pointer' : 'default',
                      transition: 'all 0.3s ease',
                      ...(!member.isAuthor && isInstructor && {
                        ':hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }
                      })
                    }}
                  >
                    <div className="member-avatar">
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <h3>{member.displayName}</h3>
                    {member.isAuthor && (
                      <span className="member-badge">Instructor</span>
                    )}
                    {member.email && (
                      <p className="member-email">{member.email}</p>
                    )}
                    {!member.isAuthor && isInstructor && (
                      <p style={{ fontSize: '12px', color: 'var(--color-primary)', marginTop: '8px' }}>
                        Click to view profile
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ClassroomDetailPage;

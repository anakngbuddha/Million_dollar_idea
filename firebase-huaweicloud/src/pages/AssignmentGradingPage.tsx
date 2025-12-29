import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { getAssignmentById, gradeAssignmentSubmission } from '../services/classroomService';
import type { Assignment } from '../services/classroomService';
import { downloadFile as utilDownloadFile, downloadFileByPublicId } from '../utils/downloadUtils';
import { ArrowLeft, Download, CheckCircle2, AlertCircle, Calendar, User } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export const AssignmentGradingPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [gradingScore, setGradingScore] = useState<number | ''>('');
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  const fetchAssignment = async () => {
    if (!assignmentId) return;

    try {
      setIsLoading(true);
      const assignmentData = await getAssignmentById(assignmentId);
      
      if (!assignmentData) {
        setError('Assignment not found');
        return;
      }

      // Check if user is the assignment author
      if (assignmentData.assignedBy !== user?.uid) {
        setError('You do not have permission to grade this assignment');
        return;
      }

      setAssignment(assignmentData);
    } catch (err) {
      console.error('Error fetching assignment:', err);
      setError('Failed to load assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSubmission = selectedStudentId
    ? assignment?.submissions?.find((s) => s.studentId === selectedStudentId)
    : null;

  const handleGradeSubmit = async () => {
    if (!assignment?.id || !selectedStudentId || gradingScore === '') return;

    setSaving(true);
    try {
      await gradeAssignmentSubmission(
        assignment.id,
        selectedStudentId,
        Number(gradingScore),
        gradingFeedback
      );

      // Update local state
      const updatedSubmissions = (assignment.submissions || []).map((s) =>
        s.studentId === selectedStudentId
          ? { ...s, score: Number(gradingScore), feedback: gradingFeedback, status: 'graded' as const }
          : s
      );
      
      setAssignment({
        ...assignment,
        submissions: updatedSubmissions,
      });
      
      setGradingScore('');
      setGradingFeedback('');
      setSelectedStudentId(null);
    } catch (err) {
      console.error('Error grading submission:', err);
      setError('Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (timestamp: Timestamp | any) => {
    if (!timestamp) return 'Unknown';
    const date =
      timestamp.toDate && typeof timestamp.toDate === 'function'
        ? timestamp.toDate()
        : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatDateTime = (timestamp: Timestamp | any) => {
    if (!timestamp) return 'Unknown';
    const date =
      timestamp.toDate && typeof timestamp.toDate === 'function'
        ? timestamp.toDate()
        : new Date(timestamp);
    return date.toLocaleString();
  };

  const downloadFileHandler = (fileUrl: string, fileName: string, file?: any) => {
    // Use publicId + format if available for more reliable download
    if (file?.publicId) {
      downloadFileByPublicId(
        file.publicId,
        file.fileName || fileName,
        file.resourceType || 'raw',
        file.format
      );
    } else {
      utilDownloadFile(fileUrl, fileName);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ padding: '24px' }}>
          <div className="loading-spinner">Loading assignment...</div>
        </div>
      </AppLayout>
    );
  }

  if (error || !assignment) {
    return (
      <AppLayout>
        <div style={{ padding: '24px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#4285F4',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '16px',
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#dc2626',
            }}
          >
            {error || 'Assignment not found'}
          </div>
        </div>
      </AppLayout>
    );
  }

  const submissions = assignment.submissions || [];
  const gradedCount = submissions.filter((s) => s.status === 'graded').length;

  return (
    <AppLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#4285F4',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '24px',
          }}
        >
          <ArrowLeft size={16} />
          Back to Classroom
        </button>

        {/* Assignment Header */}
        <div
          style={{
            padding: '24px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            marginBottom: '24px',
          }}
        >
          <h1 style={{ margin: '0 0 12px 0', color: 'var(--color-text)', fontSize: '28px', fontWeight: '700' }}>
            {assignment.title}
          </h1>
          <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            {assignment.description}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>Due Date</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text)', fontWeight: '600' }}>
                <Calendar size={18} />
                {formatDate(assignment.dueDate)}
              </div>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>Max Score</p>
              <div style={{ color: 'var(--color-text)', fontWeight: '600', fontSize: '16px' }}>
                {assignment.maxScore} points
              </div>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>Grading Progress</p>
              <div style={{ color: 'var(--color-text)', fontWeight: '600', fontSize: '16px' }}>
                {gradedCount} / {submissions.length} graded
              </div>
            </div>
          </div>
        </div>

        {/* Grading Interface */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
          {/* Submissions List */}
          <div
            style={{
              padding: '20px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              height: 'fit-content',
              position: 'sticky',
              top: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--color-text)', fontSize: '16px', fontWeight: '600' }}>
              Submissions ({submissions.length})
            </h3>
            <div style={{ display: 'grid', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
              {submissions.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
                  No submissions yet
                </p>
              ) : (
                submissions.map((submission) => (
                  <button
                    key={submission.studentId}
                    onClick={() => {
                      setSelectedStudentId(submission.studentId);
                      setGradingScore(submission.score ?? '');
                      setGradingFeedback(submission.feedback ?? '');
                    }}
                    style={{
                      padding: '12px',
                      backgroundColor:
                        selectedStudentId === submission.studentId
                          ? 'rgba(66, 133, 244, 0.1)'
                          : 'var(--color-background)',
                      border:
                        selectedStudentId === submission.studentId
                          ? '2px solid #4285F4'
                          : '1px solid var(--color-border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ margin: 0, color: 'var(--color-text)', fontSize: '14px', fontWeight: '600', flex: 1 }}>
                        {submission.studentName}
                      </p>
                      {submission.status === 'graded' && (
                        <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      )}
                    </div>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                      {submission.status === 'graded'
                        ? `${submission.score}/${submission.maxScore}`
                        : 'Not graded'}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                      {formatDate(submission.submittedAt)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Grading Panel */}
          <div>
            {selectedSubmission ? (
              <div
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <User size={32} style={{ color: '#4285F4' }} />
                  <div>
                    <h2 style={{ margin: '0 0 4px 0', color: 'var(--color-text)', fontSize: '20px', fontWeight: '600' }}>
                      {selectedSubmission.studentName}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                      {selectedSubmission.studentEmail}
                    </p>
                  </div>
                </div>

                {/* Submission Files */}
                {selectedSubmission.submissionFiles && selectedSubmission.submissionFiles.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text)', fontSize: '14px', fontWeight: '600' }}>
                      Submitted Files
                    </h4>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {selectedSubmission.submissionFiles.map((file, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px',
                            backgroundColor: 'var(--color-background)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <p style={{ margin: '0 0 4px 0', color: 'var(--color-text)', fontSize: '14px', fontWeight: '600' }}>
                              {file.fileName}
                            </p>
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                              {formatDateTime(file.uploadedAt)}
                            </p>
                          </div>
                          <button
                            onClick={() => downloadFileHandler(file.fileUrl, file.fileName, file)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#4285F4',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Download size={14} />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submission Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                      Submitted At
                    </p>
                    <p style={{ margin: 0, color: 'var(--color-text)', fontSize: '14px', fontWeight: '600' }}>
                      {formatDateTime(selectedSubmission.submittedAt)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                      Status
                    </p>
                    <p style={{ margin: 0, color: selectedSubmission.status === 'graded' ? '#10b981' : '#f59e0b', fontSize: '14px', fontWeight: '600' }}>
                      {selectedSubmission.status === 'graded' ? 'Graded' : 'Submitted, not graded'}
                    </p>
                  </div>
                </div>

                {/* Grading Form */}
                <div style={{ display: 'grid', gap: '16px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
                  <h4 style={{ margin: 0, color: 'var(--color-text)', fontSize: '16px', fontWeight: '600' }}>
                    Enter Grade
                  </h4>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                      Score *
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        value={gradingScore}
                        onChange={(e) => setGradingScore(e.target.value === '' ? '' : Number(e.target.value))}
                        min="0"
                        max={assignment.maxScore}
                        placeholder="Enter score"
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text)',
                          fontSize: '14px',
                        }}
                      />
                      <span
                        style={{
                          padding: '12px 16px',
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text)',
                          fontSize: '14px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        / {assignment.maxScore}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                      Feedback
                    </label>
                    <textarea
                      value={gradingFeedback}
                      onChange={(e) => setGradingFeedback(e.target.value)}
                      placeholder="Provide feedback to the student..."
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        color: 'var(--color-text)',
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <button
                    onClick={handleGradeSubmit}
                    disabled={saving || gradingScore === ''}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: saving || gradingScore === '' ? '#6b7280' : '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: saving || gradingScore === '' ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Grade'}
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}
              >
                <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--color-text-secondary)' }} />
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '16px' }}>
                  Select a submission from the list to grade
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

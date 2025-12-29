import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Calendar, CheckCircle2, AlertCircle, Eye, Download, Upload } from 'lucide-react';
import type {
  Assignment,
  AssignmentSubmission,
  SubmissionFile,
} from '../services/classroomService';
import {
  getClassroomAssignments,
  getStudentAssignments,
  deleteAssignment,
  submitAssignment,
  createAssignment,
} from '../services/classroomService';
import { FileUploadModal } from './FileUploadModal';
import { downloadFile as utilDownloadFile, downloadFileByPublicId } from '../utils/downloadUtils';
import { formatFileSize } from '../utils/cloudinaryUtils';
import { useAuth } from '../context/AuthContext';
import { Timestamp } from 'firebase/firestore';

interface AssignmentsTabProps {
  classroomId: string;
  isInstructor: boolean;
  userId: string;
}

export const AssignmentsTab: React.FC<AssignmentsTabProps> = ({
  classroomId,
  isInstructor,
  userId,
}) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, [classroomId]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      let assignmentList: Assignment[];

      if (isInstructor) {
        assignmentList = await getClassroomAssignments(classroomId);
      } else {
        assignmentList = await getStudentAssignments(classroomId, userId);
      }

      setAssignments(assignmentList);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await deleteAssignment(assignmentId);
      setAssignments(assignments.filter((a) => a.id !== assignmentId));
    } catch (err) {
      console.error('Error deleting assignment:', err);
      setError('Failed to delete assignment');
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

  const isOverdue = (dueDate: Timestamp | any) => {
    if (!dueDate) return false;
    const due =
      dueDate.toDate && typeof dueDate.toDate === 'function'
        ? dueDate.toDate()
        : new Date(dueDate);
    return due < new Date();
  };

  const getStudentSubmission = (assignment: Assignment): AssignmentSubmission | undefined => {
    return assignment.submissions?.find((s) => s.studentId === userId);
  };

  if (isLoading) {
    return (
      <div className="tab-section">
        <h2>Assignments</h2>
        <div className="loading-spinner">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="tab-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Assignments</h2>
        {isInstructor && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            <Plus size={16} />
            Create Assignment
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#dc2626',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {showCreateForm && isInstructor && (
        <AssignmentCreateForm
          classroomId={classroomId}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchAssignments();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {assignments.length === 0 ? (
        <div className="empty-state-small">
          <FileText size={48} />
          <p>No assignments yet</p>
          {isInstructor && <p className="secondary">Click "Create Assignment" to add homework</p>}
          {!isInstructor && <p className="secondary">Check back later for assignments</p>}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {assignments.map((assignment) => {
            const submission = getStudentSubmission(assignment);
            const overdue = isOverdue(assignment.dueDate);

            return (
              <div
                key={assignment.id}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, color: 'var(--color-text)', fontSize: '16px', fontWeight: '600' }}>
                        {assignment.title}
                      </h3>
                      {!isInstructor && submission?.status === 'graded' && (
                        <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                      )}
                      {overdue && !isInstructor && !submission && (
                        <AlertCircle size={20} style={{ color: '#ef4444' }} />
                      )}
                    </div>
                    {assignment.description && (
                      <p style={{ margin: '0 0 8px 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        {assignment.description}
                      </p>
                    )}
                    
                    {assignment.attachmentUrl && (
                      <div style={{ marginTop: '12px' }}>
                        <button
                          onClick={() => {
                            if (assignment.attachmentPublicId) {
                              // Use publicId + format for reliable download
                              downloadFileByPublicId(
                                assignment.attachmentPublicId,
                                assignment.attachmentFileName || 'assignment-file',
                                assignment.attachmentResourceType || 'raw',
                                assignment.attachmentFormat
                              );
                            } else if (assignment.attachmentUrl) {
                              // Fallback to URL if publicId not available
                              utilDownloadFile(assignment.attachmentUrl, assignment.attachmentFileName || 'assignment-file');
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Download size={14} />
                          {assignment.attachmentFileName || 'Download File'}
                        </button>
                      </div>
                    )}
                  </div>
                  {isInstructor && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          if (assignment.id) {
                            navigate(`/grade-assignment/${assignment.id}`);
                          }
                        }}
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
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={() => assignment.id && handleDeleteAssignment(assignment.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#dc2626',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                      Due Date
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text)', fontSize: '14px', fontWeight: '600' }}>
                      <Calendar size={16} />
                      {formatDate(assignment.dueDate)}
                      {overdue && <span style={{ color: '#ef4444' }}>(Overdue)</span>}
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                      Points
                    </p>
                    <div style={{ color: 'var(--color-text)', fontSize: '14px', fontWeight: '600' }}>
                      {assignment.maxScore} pts
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                      Status
                    </p>
                    {isInstructor ? (
                      <div style={{ color: 'var(--color-text)', fontSize: '14px', fontWeight: '600' }}>
                        {assignment.submissions?.length || 0} / {(() => {
                          if (assignment.assignedTo === 'all') {
                            return 'All students'; // Would need classroom member count
                          }
                          return Array.isArray(assignment.assignedTo) ? assignment.assignedTo.length : 0;
                        })()}
                      </div>
                    ) : (
                      <div style={{ fontSize: '14px', fontWeight: '600', color: submission ? '#10b981' : '#ef4444' }}>
                        {submission ? `Submitted (${submission.score ?? '?'}/${submission.maxScore})` : 'Not submitted'}
                      </div>
                    )}
                  </div>
                </div>

                {!isInstructor && !submission && (
                  <button
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setShowSubmissionModal(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Submit Assignment
                  </button>
                )}

                {!isInstructor && submission?.feedback && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'rgba(66, 133, 244, 0.1)',
                      border: '1px solid rgba(66, 133, 244, 0.2)',
                      borderRadius: '4px',
                      marginTop: '12px',
                    }}
                  >
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Feedback:
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text)' }}>{submission.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {showSubmissionModal && selectedAssignment && (
        <SubmissionModal
          assignment={selectedAssignment}
          classroomId={classroomId}
          userId={userId}
          userName={''} // Would get from auth context
          userEmail={''} // Would get from auth context
          onClose={() => {
            setShowSubmissionModal(false);
            setSelectedAssignment(null);
            fetchAssignments();
          }}
        />
      )}
    </div>
  );
};

interface AssignmentCreateFormProps {
  classroomId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const AssignmentCreateForm: React.FC<AssignmentCreateFormProps> = ({
  classroomId,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [assignedTo, setAssignedTo] = useState<'all' | 'specific'>('all');
  const [uploadedFiles, setUploadedFiles] = useState<SubmissionFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleFileUploadSuccess = (uploadData: {
    publicId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    resourceType: string;
    format: string;
  }) => {
    const newFile: SubmissionFile = {
      fileName: uploadData.fileName,
      fileUrl: uploadData.fileUrl,
      uploadedAt: Timestamp.now(),
      fileSize: uploadData.fileSize,
      publicId: uploadData.publicId,
      resourceType: uploadData.resourceType,
      format: uploadData.format,
    };
    setUploadedFiles([...uploadedFiles, newFile]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user) {
      setError('You must be logged in to create an assignment');
      return;
    }

    setSaving(true);
    try {
      const assignment: Assignment = {
        classroomId,
        title,
        description,
        instructions,
        dueDate: Timestamp.fromDate(new Date(dueDate)),
        maxScore: Number(maxScore),
        assignedBy: user.uid,
        assignedByName: user.email || 'Unknown',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        assignedTo: assignedTo === 'all' ? 'all' : [],
        submissions: [],
      };

      if (uploadedFiles.length > 0) {
        assignment.attachmentUrl = uploadedFiles[0].fileUrl;
        assignment.attachmentFileName = uploadedFiles[0].fileName;
        assignment.attachmentPublicId = uploadedFiles[0].publicId;
        assignment.attachmentFormat = uploadedFiles[0].format;
        assignment.attachmentResourceType = uploadedFiles[0].resourceType;
      }

      await createAssignment(assignment);
      onSuccess();
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        marginBottom: '20px',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', color: 'var(--color-text)', fontSize: '16px', fontWeight: '600' }}>
        Create New Assignment
      </h3>

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#dc2626',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chapter 1 Reading Assignment"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-text)',
              fontSize: '14px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the assignment"
            rows={2}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-text)',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
            Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Detailed instructions for the assignment"
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-text)',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
            Assignment File (Optional)
          </label>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Upload a file for students to download
          </p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Upload size={16} />
            Click to upload file
          </button>
        </div>

        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onFileUploaded={handleFileUploadSuccess}
          title="Upload Assignment File"
          folder={`assignments/${classroomId}`}
        />

        {uploadedFiles.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text)' }}>
              Uploaded Files ({uploadedFiles.length})
            </label>
            <div style={{ display: 'grid', gap: '8px' }}>
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
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
                      {formatFileSize(file.fileSize)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
              Due Date *
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                color: 'var(--color-text)',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
              Max Score
            </label>
            <input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              min="0"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                color: 'var(--color-text)',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
            Assign To
          </label>
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text)', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="radio"
                value="all"
                checked={assignedTo === 'all'}
                onChange={(e) => setAssignedTo(e.target.value as any)}
              />
              All Students
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text)', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="radio"
                value="specific"
                checked={assignedTo === 'specific'}
                onChange={(e) => setAssignedTo(e.target.value as any)}
              />
              Specific Students
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-text)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 16px',
              backgroundColor: saving ? '#6b7280' : '#10b981',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {saving ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface SubmissionModalProps {
  assignment: Assignment;
  classroomId: string;
  userId: string;
  userName: string;
  userEmail: string;
  onClose: () => void;
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({
  assignment,
  classroomId,
  userId,
  userName,
  userEmail,
  onClose,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<SubmissionFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleFileUploadSuccess = (uploadData: {
    publicId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    resourceType: string;
    format: string;
  }) => {
    const newFile: SubmissionFile = {
      fileName: uploadData.fileName,
      fileUrl: uploadData.fileUrl,
      uploadedAt: Timestamp.now(),
      fileSize: uploadData.fileSize,
      publicId: uploadData.publicId,
      resourceType: uploadData.resourceType,
      format: uploadData.format,
    };
    setUploadedFiles([...uploadedFiles, newFile]);
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      if (!window.confirm('You haven\'t attached any files. Are you sure you want to submit an empty assignment?')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      await submitAssignment(
        assignment.id || '',
        userId,
        userName,
        userEmail,
        {
          submissionFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
        }
      );
      onClose();
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setError('Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginTop: 0, marginBottom: '8px', color: 'var(--color-text)' }}>
          Submit Assignment
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
          {assignment.title}
        </p>

        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#dc2626',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text)', fontSize: '14px', fontWeight: '600' }}>
            Upload Files
          </h4>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Upload size={16} />
            Click to upload files
          </button>
        </div>

        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onFileUploaded={handleFileUploadSuccess}
          title="Upload Assignment Files"
          folder={`assignments/${classroomId}/${assignment.id}/submissions`}
        />

        {uploadedFiles.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text)', fontSize: '14px', fontWeight: '600' }}>
              Files to Submit ({uploadedFiles.length})
            </h4>
            <div style={{ display: 'grid', gap: '8px' }}>
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
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
                      {formatFileSize(file.fileSize)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--color-border)',
              color: 'var(--color-text)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '10px 20px',
              backgroundColor: submitting ? '#6b7280' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsTab;

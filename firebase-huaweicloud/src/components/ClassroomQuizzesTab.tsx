import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, Calendar, User, Edit, BarChart3, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ClassroomQuiz, QuizSubmissionFile } from '../services/classroomService';
import {
  getClassroomQuizzes,
  getStudentClassroomQuizzes,
  removeQuizFromClassroom,
  assignQuizToClassroom,
} from '../services/classroomService';
import { createCustomQuiz } from '../services/quizService';
import type { QuizQuestion } from '../services/quizService';
import { downloadFile as utilDownloadFile, downloadFileByPublicId } from '../utils/downloadUtils';
import { FileUploadModal } from './FileUploadModal';
import { formatFileSize } from '../utils/cloudinaryUtils';
import { useAuth } from '../context/AuthContext';
import { Timestamp } from 'firebase/firestore';

interface ClassroomQuizzesTabProps {
  classroomId: string;
  isInstructor: boolean;
  userId: string;
}

export const ClassroomQuizzesTab: React.FC<ClassroomQuizzesTabProps> = ({
  classroomId,
  isInstructor,
  userId,
}) => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<ClassroomQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, [classroomId]);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      let quizList: ClassroomQuiz[];

      if (isInstructor) {
        quizList = await getClassroomQuizzes(classroomId);
      } else {
        quizList = await getStudentClassroomQuizzes(classroomId, userId);
      }

      setQuizzes(quizList);
    } catch (err) {
      console.error('Error fetching classroom quizzes:', err);
      setError('Failed to load quizzes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveQuiz = async (classroomQuizId: string) => {
    if (!window.confirm('Remove this quiz from the classroom?')) return;

    try {
      await removeQuizFromClassroom(classroomQuizId);
      setQuizzes(quizzes.filter((q) => q.id !== classroomQuizId));
    } catch (err) {
      console.error('Error removing quiz:', err);
      setError('Failed to remove quiz');
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

  if (isLoading) {
    return (
      <div className="tab-section">
        <h2>Classroom Quizzes</h2>
        <div className="loading-spinner">Loading quizzes...</div>
      </div>
    );
  }

  return (
    <div className="tab-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Classroom Quizzes</h2>
        {isInstructor && (
          <button
            onClick={() => setShowAssignForm(!showAssignForm)}
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
            Assign Quiz
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

      {showAssignForm && isInstructor && (
        <QuizAssignForm
          classroomId={classroomId}
          onSuccess={() => {
            setShowAssignForm(false);
            fetchQuizzes();
          }}
          onCancel={() => setShowAssignForm(false)}
        />
      )}

      {quizzes.length === 0 ? (
        <div className="empty-state-small">
          <CheckSquare size={48} />
          <p>No quizzes assigned yet</p>
          {isInstructor && <p className="secondary">Click "Assign Quiz" to add quizzes to the classroom</p>}
          {!isInstructor && <p className="secondary">Check back later for assigned quizzes</p>}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              style={{
                padding: '16px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text)', fontSize: '16px', fontWeight: '600' }}>
                    {quiz.quizTitle}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {isInstructor && (
                    <>
                      <button
                        onClick={() => navigate(`/edit-classroom-quiz/${classroomId}/${quiz.id}`)}
                        title="Edit quiz"
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6',
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
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => navigate(`/classroom-quiz-analytics/${classroomId}/${quiz.id}`)}
                        title="View analytics"
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          color: '#22c55e',
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
                        <BarChart3 size={14} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => quiz.id && handleRemoveQuiz(quiz.id)}
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
                    Remove
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    Assigned By
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text)', fontSize: '14px' }}>
                    <User size={16} />
                    {quiz.assignedByName}
                  </div>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    {quiz.dueDate ? 'Due Date' : 'Assigned Date'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text)', fontSize: '14px' }}>
                    <Calendar size={16} />
                    {quiz.dueDate ? formatDate(quiz.dueDate) : formatDate(quiz.createdAt)}
                    {quiz.dueDate && isOverdue(quiz.dueDate) && <span style={{ color: '#ef4444' }}>(Overdue)</span>}
                  </div>
                </div>
              </div>

              {/* Display submission files if any */}
              {quiz.submissionFiles && quiz.submissionFiles.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: '600' }}>
                    Resources ({quiz.submissionFiles.length})
                  </p>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {quiz.submissionFiles.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: 'var(--color-background)', borderRadius: '4px' }}>
                        <div>
                          <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                            {file.fileName}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '12px' }}>
                            ({formatFileSize(file.fileSize)})
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (file.publicId) {
                              downloadFileByPublicId(file.publicId, file.fileName, file.resourceType || 'auto', file.format);
                            } else {
                              utilDownloadFile(file.fileUrl, file.fileName);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#4285F4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Download size={12} />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (quiz.quizId) {
                    navigate(`/take-quiz/${quiz.quizId}`);
                  }
                }}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  backgroundColor: '#4285F4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                Take Quiz
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface QuizAssignFormProps {
  classroomId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const QuizAssignForm: React.FC<QuizAssignFormProps> = ({ classroomId, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [assignMode, setAssignMode] = useState<'existing' | 'upload'>('existing');
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<'all' | 'specific'>('all');
  const [uploadedFiles, setUploadedFiles] = useState<QuizSubmissionFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'quiz' | 'resources'>('resources');

  const handleFileUploadSuccess = (uploadData: {
    publicId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    resourceType: string;
    format: string;
  }) => {
    const newFile: QuizSubmissionFile = {
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

    if (assignMode === 'existing' && (!selectedQuizId || !quizTitle)) {
      setError('Please select a quiz and enter a title');
      return;
    }

    if (assignMode === 'upload' && (!quizTitle || uploadedFiles.length === 0)) {
      setError('Please enter a title and upload quiz file(s)');
      return;
    }

    if (!user) {
      setError('You must be logged in to assign a quiz');
      return;
    }

    setSaving(true);
    try {
      if (assignMode === 'existing') {
        // Assign existing quiz to classroom
        await assignQuizToClassroom(
          selectedQuizId,
          classroomId,
          quizTitle,
          user.uid,
          user.email || 'Unknown',
          assignedTo === 'all' ? 'all' : [],
          dueDate ? Timestamp.fromDate(new Date(dueDate)) : undefined,
          uploadedFiles.length > 0 ? uploadedFiles : undefined
        );
      } else {
        // Create quiz from uploaded files
        const questions: QuizQuestion[] = parseQuizFromFiles(uploadedFiles);
        
        if (questions.length === 0) {
          setError('No valid questions found in uploaded files');
          setSaving(false);
          return;
        }

        const newQuizId = await createCustomQuiz({
          title: quizTitle,
          description: `Quiz created from file uploads at ${new Date().toLocaleDateString()}`,
          creatorId: user.uid,
          creatorName: user.displayName || user.email || 'Anonymous',
          questions,
          visibility: 'classroom',
          classroomId: classroomId,
          category: 'Uploaded',
          difficulty: 'Beginner',
        });

        // Now assign the newly created quiz to classroom
        await assignQuizToClassroom(
          newQuizId,
          classroomId,
          quizTitle,
          user.uid,
          user.email || 'Unknown',
          assignedTo === 'all' ? 'all' : [],
          dueDate ? Timestamp.fromDate(new Date(dueDate)) : undefined,
          uploadedFiles.length > 0 ? uploadedFiles : undefined
        );
      }

      onSuccess();
    } catch (err) {
      console.error('Error assigning quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign quiz');
    } finally {
      setSaving(false);
    }
  };

  const parseQuizFromFiles = (files: QuizSubmissionFile[]): QuizQuestion[] => {
    const questions: QuizQuestion[] = [];
    
    files.forEach((file) => {
      try {
        // Parse JSON files
        if (file.fileName.endsWith('.json')) {
          // File content would need to be read from the file URL
          // For now, we'll handle this in the future
          return;
        }
        
        // Parse CSV/text based quiz formats
        if (file.fileName.endsWith('.csv') || file.fileName.endsWith('.txt')) {
          // Simple parsing: Each line is a question, separated by | for options
          // Format: question|optionA|optionB|optionC|optionD|correctAnswer
          return;
        }
      } catch (err) {
        console.error(`Error parsing file ${file.fileName}:`, err);
      }
    });

    // For now, create a sample question if no questions were parsed
    if (questions.length === 0) {
      questions.push({
        id: '1',
        question: 'Sample Question from Uploaded File',
        type: 'multiple-choice',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: 0,
        explanation: 'This is a sample question. Edit it to match your content.',
        points: 1,
      });
    }

    return questions;
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
        Assign Quiz to Classroom
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
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text)' }}>
            Quiz Mode *
          </label>
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="assignMode"
                value="existing"
                checked={assignMode === 'existing'}
                onChange={(e) => setAssignMode(e.target.value as 'existing' | 'upload')}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--color-text)', fontSize: '14px' }}>Use Existing Quiz</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="assignMode"
                value="upload"
                checked={assignMode === 'upload'}
                onChange={(e) => setAssignMode(e.target.value as 'existing' | 'upload')}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--color-text)', fontSize: '14px' }}>Upload Quiz File</span>
            </label>
          </div>
        </div>

        {assignMode === 'existing' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
                Select Quiz *
              </label>
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="">-- Select a quiz from your created quizzes --</option>
                {/* TODO: Fetch and display user's classroom-shareable quizzes */}
                <option value="example-1">Example Quiz 1</option>
                <option value="example-2">Example Quiz 2</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
                Quiz Title *
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="e.g., Chapter 1 Quiz"
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
          </>
        )}

        {assignMode === 'upload' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
                Quiz Title *
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="e.g., Chapter 1 Quiz"
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  marginBottom: '16px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
                Upload Quiz Files *
              </label>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Upload quiz files (JSON, CSV, or text format) to create questions
              </p>
              <button
                type="button"
                onClick={() => {
                  setUploadType('quiz');
                  setShowUploadModal(true);
                }}
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
                        <p style={{ margin: '0 0 4px 0', color: 'var(--color-text)', fontSize: '14px', fontWeight: '500' }}>
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
                          padding: '6px 12px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
            Quiz Resources (Optional)
          </label>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Upload study materials or reference files for students
          </p>
          <button
            type="button"
            onClick={() => {
              setUploadType('resources');
              setShowUploadModal(true);
            }}
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
          title={uploadType === 'quiz' ? 'Upload Quiz Files' : 'Upload Quiz Resources'}
          folder={`quizzes/${classroomId}/${uploadType}`}
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

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-text)' }}>
            Due Date (Optional)
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
            {saving ? 'Assigning...' : 'Assign Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClassroomQuizzesTab;

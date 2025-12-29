import React, { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Calendar, User, Download } from 'lucide-react';
import type { Module, ModuleFile } from '../services/classroomService';
import { getClassroomModules, deleteModule, createModule } from '../services/classroomService';
import { downloadFile, downloadFileByPublicId } from '../utils/downloadUtils';
import { formatFileSize } from '../utils/cloudinaryUtils';
import { useAuth } from '../context/AuthContext';
import { FileUploadModal } from './FileUploadModal';
import { Timestamp } from 'firebase/firestore';

interface ModulesTabProps {
  classroomId: string;
  isInstructor: boolean;
}

export const ModulesTab: React.FC<ModulesTabProps> = ({ classroomId, isInstructor }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, [classroomId]);

  const fetchModules = async () => {
    try {
      setIsLoading(true);
      const moduleList = await getClassroomModules(classroomId);
      setModules(moduleList);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError('Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this module?')) return;

    try {
      await deleteModule(moduleId);
      setModules(modules.filter((m) => m.id !== moduleId));
    } catch (err) {
      console.error('Error deleting module:', err);
      setError('Failed to delete module');
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

  if (isLoading) {
    return (
      <div className="tab-section">
        <h2>Modules</h2>
        <div className="loading-spinner">Loading modules...</div>
      </div>
    );
  }

  return (
    <div className="tab-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Modules</h2>
        {isInstructor && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
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
            <Upload size={16} />
            Upload Module
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

      {showUploadForm && isInstructor && (
        <ModuleUploadForm
          classroomId={classroomId}
          onSuccess={() => {
            setShowUploadForm(false);
            fetchModules();
          }}
          onCancel={() => setShowUploadForm(false)}
        />
      )}

      {modules.length === 0 ? (
        <div className="empty-state-small">
          <FileText size={48} />
          <p>No modules yet</p>
          {isInstructor && <p className="secondary">Click "Upload Module" to add course materials</p>}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {modules.map((module) => (
            <div
              key={module.id}
              style={{
                padding: '16px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <FileText size={20} style={{ color: '#4285F4' }} />
                    <h3 style={{ margin: 0, color: 'var(--color-text)', fontSize: '16px', fontWeight: '600' }}>
                      {module.title}
                    </h3>
                  </div>
                  {module.description && (
                    <p style={{ margin: '0 0 8px 32px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                      {module.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '16px', marginLeft: '32px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={14} />
                      {module.uploadedByName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} />
                      {formatDate(module.createdAt)}
                    </div>
                  </div>
                </div>
                {isInstructor && (
                  <button
                    onClick={() => module.id && handleDeleteModule(module.id)}
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
                )}
              </div>

              {/* Display files */}
              {(module.files && module.files.length > 0) || module.fileUrl ? (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: '600' }}>
                    Files ({(module.files?.length || 0) + (module.fileUrl ? 1 : 0)})
                  </p>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {/* Legacy single file */}
                    {module.fileUrl && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: 'var(--color-background)', borderRadius: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                          {module.fileName || 'Module File'}
                        </span>
                        <button
                          onClick={() => downloadFile(module.fileUrl!, module.fileName || 'file')}
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
                    )}
                    {/* Multiple files */}
                    {module.files?.map((file, idx) => (
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
                              downloadFile(file.fileUrl, file.fileName);
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
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ModuleUploadFormProps {
  classroomId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const ModuleUploadForm: React.FC<ModuleUploadFormProps> = ({ classroomId, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<ModuleFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleFileUploadModalSuccess = (uploadData: {
    publicId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    resourceType: string;
    format: string;
  }) => {
    const newFile: ModuleFile = {
      fileName: uploadData.fileName,
      fileUrl: uploadData.fileUrl,
      publicId: uploadData.publicId,
      resourceType: uploadData.resourceType,
      format: uploadData.format, // Store Cloudinary format
      uploadedAt: Timestamp.now(),
      fileSize: uploadData.fileSize,
      fileType: uploadData.fileName.split('.').pop() || 'unknown',
    };
    
    setUploadedFiles([...uploadedFiles, newFile]);
    setError(null);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please enter a module title');
      return;
    }

    if (uploadedFiles.length === 0) {
      setError('Please upload at least one file');
      return;
    }

    setUploading(true);
    try {
      const moduleData: Module = {
        classroomId,
        title,
        description,
        files: uploadedFiles,
        uploadedBy: user?.uid || 'unknown',
        uploadedByName: user?.displayName || 'Unknown User',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await createModule(moduleData, user?.uid || '');
      onSuccess();
    } catch (err) {
      console.error('Error creating module:', err);
      setError('Failed to create module');
    } finally {
      setUploading(false);
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
        Upload New Module
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
            Module Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chapter 1: Introduction"
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
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for this module (optional)"
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
            Upload Files *
          </label>
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
          onFileUploaded={handleFileUploadModalSuccess}
          title="Upload Module File"
          folder={`modules/${classroomId}`}
        />

        {uploadedFiles.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text)', fontSize: '14px', fontWeight: '600' }}>
              Files to Upload ({uploadedFiles.length})
            </h4>
            <div style={{ display: 'grid', gap: '8px' }}>
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: 'var(--color-text)', fontSize: '14px' }}>
                    {file.fileName}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '3px',
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
            disabled={uploading || uploadedFiles.length === 0}
            style={{
              padding: '10px 16px',
              backgroundColor: uploading || uploadedFiles.length === 0 ? '#6b7280' : '#10b981',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: uploading || uploadedFiles.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {uploading ? 'Uploading...' : 'Create Module'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModulesTab;
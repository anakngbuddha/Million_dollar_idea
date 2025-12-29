import React, { useRef, useState } from 'react';
import { Upload, X, FileIcon, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { uploadFile, validateFile, type UploadResponse } from '../services/uploadService';

interface FileUploadProps {
  classroomId: string;
  assignmentId: string;
  submissionId?: string;
  onUploadSuccess?: (uploadData: UploadResponse) => void;
  onUploadError?: (error: string) => void;
  allowedTypes?: string[]; // Now unused - all types accepted
  maxSizeMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  classroomId,
  assignmentId,
  submissionId,
  onUploadSuccess,
  onUploadError,
  allowedTypes = [], // Empty - accept all file types
  maxSizeMB = 100, // Increased to 100MB
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      setError(null);

      // Validate file
      const validation = validateFile(file, maxSizeMB, allowedTypes);
      if (!validation.valid) {
        const errorMsg = validation.error || 'Invalid file';
        setError(errorMsg);
        onUploadError?.(errorMsg);
        return;
      }

      setUploading(true);

      // Upload file
      const uploadData = await uploadFile(
        file,
        classroomId,
        assignmentId,
        submissionId
      );

      setUploadedFiles([...uploadedFiles, uploadData]);
      onUploadSuccess?.(uploadData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      onUploadError?.(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      Array.from(files).forEach(file => {
        handleFileSelect(file);
      });
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach(file => {
        handleFileSelect(file);
      });
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <ImageIcon size={16} />;
    }
    return <FileIcon size={16} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        multiple
      />

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: dragActive
            ? '2px dashed #10b981'
            : error
            ? '2px dashed #ef4444'
            : '2px dashed var(--color-border)',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragActive
            ? 'rgba(16, 185, 129, 0.05)'
            : 'rgba(0, 0, 0, 0)',
          transition: 'all 0.2s ease',
        }}
      >
        <Upload
          size={32}
          style={{
            margin: '0 auto 12px',
            color: uploading
              ? 'var(--color-text-secondary)'
              : error
              ? '#ef4444'
              : '#10b981',
          }}
        />
        <p
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--color-text)',
            margin: '8px 0 4px',
          }}
        >
          {uploading ? 'Uploading...' : 'Drag and drop your files here'}
        </p>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            margin: '0 0 12px',
          }}
        >
          or click to select
        </p>
        <p
          style={{
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            margin: '0',
          }}
        >
          Max file size: {maxSizeMB}MB per file
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
          {uploadedFiles.map((file, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid #10b981',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={20} style={{ color: '#10b981' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {getFileIcon(file.fileName)}
                    <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: 'var(--color-text)' }}>
                      {file.fileName}
                    </p>
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      margin: 0,
                    }}
                  >
                    {formatFileSize(file.fileSize)} • Uploaded successfully
                  </p>
                </div>
                <button
                  onClick={() => {
                    setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx));
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px',
            color: '#ef4444',
          }}
        >
          <AlertCircle size={16} />
          <span style={{ fontSize: '13px' }}>{error}</span>
        </div>
      )}
    </div>
  );
};

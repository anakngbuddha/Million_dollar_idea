import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { uploadFileToCloudinary, type UploadProgressEvent } from '../utils/cloudinaryUtils';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUploaded: (uploadData: {
    publicId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    resourceType: string;
    format: string;
  }) => void;
  title?: string;
  folder?: string;
  acceptedFileTypes?: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFileUploaded,
  title = 'Upload File',
  folder = 'modules',
  acceptedFileTypes = '*',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      setSuccess(false);
      setIsUploading(true);
      setUploadProgress(0);

      const response = await uploadFileToCloudinary(file, folder, (event: UploadProgressEvent) => {
        setUploadProgress(event.percentage);
      });

      const uploadData = {
        publicId: response.public_id,
        fileName: response.original_filename,
        fileUrl: response.secure_url,
        fileSize: response.bytes,
        resourceType: response.resource_type,
        format: response.format, // Cloudinary file format (pdf, docx, jpg, etc)
      };

      setSuccess(true);
      setUploadProgress(100);

      // Call callback after a short delay to show success state
      setTimeout(() => {
        onFileUploaded(uploadData);
        handleClose();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, color: 'var(--color-text)', fontSize: '18px', fontWeight: '600' }}>
            {title}
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
            }}
          >
            <X size={24} />
          </button>
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
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              color: '#10b981',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} />
            File uploaded successfully!
          </div>
        )}

        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed',
            borderColor: isDragging ? '#3b82f6' : 'var(--color-border)',
            borderRadius: '8px',
            padding: '40px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={isUploading}
          />

          {!isUploading ? (
            <>
              <Upload size={40} style={{ color: '#3b82f6', marginBottom: '16px' }} />
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-text)', fontSize: '16px', fontWeight: '600' }}>
                Drag and drop your file here
              </h4>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                or click to select a file
              </p>
            </>
          ) : (
            <>
              <Upload size={40} style={{ color: '#3b82f6', marginBottom: '16px', opacity: 0.5 }} />
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-text)', fontSize: '16px', fontWeight: '600' }}>
                Uploading...
              </h4>
              <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                {uploadProgress}%
              </p>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            disabled={isUploading}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-border)',
              color: 'var(--color-text)',
              border: 'none',
              borderRadius: '6px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: isUploading ? 0.5 : 1,
            }}
          >
            {isUploading ? 'Uploading...' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

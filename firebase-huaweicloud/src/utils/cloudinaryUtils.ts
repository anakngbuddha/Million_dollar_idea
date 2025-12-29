/**
 * Complete Cloudinary Utility
 * Handles uploads, downloads, and file management
 */

import {
  CLOUDINARY_UPLOAD_URL,
  CLOUDINARY_CONFIG,
  ALLOWED_FILE_TYPES,
  getMaxFileSize,
} from '../config/cloudinary';

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

export interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
  [key: string]: any;
}

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Validate file before upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!ALLOWED_FILE_TYPES.ALL.some(type => type === file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${file.type}`,
    };
  }

  // Check file size
  const maxSize = getMaxFileSize(file.type);
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
};

/**
 * Upload file to Cloudinary using unsigned upload preset
 */
export const uploadFileToCloudinary = async (
  file: File,
  folder?: string,
  onProgress?: (event: UploadProgressEvent) => void
): Promise<CloudinaryUploadResponse> => {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  if (folder) {
    formData.append('folder', `firebase-classroom/${folder}`);
  } else {
    formData.append('folder', 'firebase-classroom');
  }
  
  formData.append('resource_type', 'auto');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          });
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText) as CloudinaryUploadResponse;
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        const error = JSON.parse(xhr.responseText);
        reject(new Error(error.error?.message || 'Upload failed'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);
    xhr.send(formData);
  });
};

/**
 * Batch upload multiple files
 */
export const uploadMultipleFilesToCloudinary = async (
  files: File[],
  folder?: string,
  onProgress?: (fileIndex: number, event: UploadProgressEvent) => void
): Promise<CloudinaryUploadResponse[]> => {
  const results: CloudinaryUploadResponse[] = [];

  for (let i = 0; i < files.length; i++) {
    const response = await uploadFileToCloudinary(files[i], folder, (event) => {
      if (onProgress) {
        onProgress(i, event);
      }
    });
    results.push(response);
  }

  return results;
};

// ============================================================================
// DOWNLOAD FUNCTIONS
// ============================================================================

/**
 * Extract public ID from Cloudinary URL
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    
    const afterUpload = url.substring(uploadIndex + 8);
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    const publicId = withoutVersion.split('?')[0].replace(/\.[^.]+$/, '');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

/**
 * Get resource type from Cloudinary URL or file extension
 */
export const getResourceType = (url: string, fileName?: string): string => {
  if (url.includes('/image/upload')) return 'image';
  if (url.includes('/video/upload')) return 'video';
  if (url.includes('/raw/upload')) return 'raw';
  
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  }
  
  return 'raw';
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Generate Cloudinary download URL using query parameters
 * This avoids 401 errors with unsigned uploads
 */
export const getCloudinaryDownloadUrl = (
  publicId: string,
  fileName: string,
  resourceType: string = 'raw',
  format?: string
): string => {
  const cleanPublicId = publicId.trim().replace(/^\/+|\/+$/g, '');
  
  let url = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload/${cleanPublicId}`;
  
  if (format) {
    url += `.${format}`;
  }
  
  // Use response-content-disposition to force download
  const disposition = encodeURIComponent(`attachment; filename="${fileName}"`);
  url += `?response-content-disposition=${disposition}`;
  
  console.log('Generated download URL:', url);
  return url;
};

/**
 * Convert existing Cloudinary URL to download URL
 */
export const convertSecureUrlToDownloadUrl = (secureUrl: string, fileName?: string): string | null => {
  try {
    console.log('Converting URL:', secureUrl);
    
    const publicId = extractPublicIdFromUrl(secureUrl);
    const resourceType = getResourceType(secureUrl, fileName);
    
    if (!publicId) {
      console.error('Could not extract public ID from URL');
      return null;
    }
    
    console.log('Extracted public ID:', publicId);
    console.log('Resource type:', resourceType);
    
    const formatMatch = secureUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    const format = formatMatch ? formatMatch[1] : undefined;
    
    const urlFileName = fileName || secureUrl.split('/').pop()?.split('?')[0] || 'download';
    
    return getCloudinaryDownloadUrl(publicId, urlFileName, resourceType, format);
  } catch (error) {
    console.error('Error converting URL:', error);
    return null;
  }
};

/**
 * Get preview URL for images and videos
 */
export const getCloudinaryPreviewUrl = (publicId: string, resourceType: string = 'auto', options?: any): string => {
  const defaultOptions = resourceType === 'video' ? 'w_400,h_300,c_fill' : 'w_400,h_300,c_fill,q_auto';
  const transformations = options?.transformations || defaultOptions;
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload/${transformations}/${publicId}`;
};

/**
 * Get secure URL (direct file serving)
 */
export const getCloudinarySecureUrl = (publicId: string, resourceType: string = 'auto'): string => {
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload/${publicId}`;
};

/**
 * Get file extension from MIME type
 */
export const getFileExtension = (mimeType: string): string => {
  const extensions: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/quicktime': 'mov',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/plain': 'txt',
  };
  return extensions[mimeType] || 'file';
};

/**
 * Delete file from Cloudinary
 * Note: Requires backend API (cannot be done from frontend with unsigned uploads)
 */
export const deleteFileFromCloudinary = async (): Promise<boolean> => {
  console.warn('File deletion from frontend is not supported. Please use backend API.');
  return false;
};
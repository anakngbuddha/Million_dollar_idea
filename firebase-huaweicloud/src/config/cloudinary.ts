/**
 * Cloudinary Configuration
 * Handles all Cloudinary API interactions for file upload and download
 */

export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
};

// Cloudinary API endpoints
export const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}`;
export const CLOUDINARY_UPLOAD_URL = `${CLOUDINARY_API_URL}/upload`;

// Cloudinary resource types
export const RESOURCE_TYPES = {
  AUTO: 'auto',
  IMAGE: 'image',
  VIDEO: 'video',
  RAW: 'raw',
  PDF: 'raw', // PDFs are treated as raw files
} as const;

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  PDF: 50 * 1024 * 1024, // 50MB
  DOCUMENT: 25 * 1024 * 1024, // 25MB
  DEFAULT: 25 * 1024 * 1024, // 25MB
} as const;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEOS: ['video/mp4', 'video/mpeg', 'video/quicktime'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ],
  ALL: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ],
} as const;

// Validation helper
export const getMaxFileSize = (mimeType: string): number => {
  if (ALLOWED_FILE_TYPES.IMAGES.some(type => type === mimeType)) return MAX_FILE_SIZES.IMAGE;
  if (ALLOWED_FILE_TYPES.VIDEOS.some(type => type === mimeType)) return MAX_FILE_SIZES.VIDEO;
  if (mimeType === 'application/pdf') return MAX_FILE_SIZES.PDF;
  if (ALLOWED_FILE_TYPES.DOCUMENTS.some(type => type === mimeType)) return MAX_FILE_SIZES.DOCUMENT;
  return MAX_FILE_SIZES.DEFAULT;
};

export const getResourceType = (mimeType: string): string => {
  if (ALLOWED_FILE_TYPES.IMAGES.some(type => type === mimeType)) return RESOURCE_TYPES.IMAGE;
  if (ALLOWED_FILE_TYPES.VIDEOS.some(type => type === mimeType)) return RESOURCE_TYPES.VIDEO;
  return RESOURCE_TYPES.RAW;
};

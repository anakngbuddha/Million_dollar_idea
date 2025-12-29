/**
 * Download utility functions
 * Handles file downloads from Cloudinary and other sources
 */

import { getCloudinaryDownloadUrl, convertSecureUrlToDownloadUrl } from './cloudinaryUtils';

/**
 * Download file from Cloudinary using public ID (RECOMMENDED METHOD)
 * @param publicId - Cloudinary public ID
 * @param fileName - Name to save the file as
 * @param resourceType - Cloudinary resource type (image, video, raw)
 * @param format - Cloudinary file format (pdf, docx, jpg, etc.)
 */
export const downloadFileByPublicId = (
  publicId: string,
  fileName: string,
  resourceType: string = 'raw',
  format?: string
): void => {
  try {
    console.log('=== Download by Public ID ===');
    console.log('Public ID:', publicId);
    console.log('File Name:', fileName);
    console.log('Resource Type:', resourceType);
    console.log('Format:', format);
    
    const downloadUrl = getCloudinaryDownloadUrl(publicId, fileName, resourceType, format);
    console.log('Download URL:', downloadUrl);
    
    // Create temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    
    // Small delay before removing to ensure click registers
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
    
    console.log('✅ Download initiated successfully');
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    alert(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Download file directly from Cloudinary URL (FALLBACK METHOD)
 * @param fileUrl - Cloudinary secure URL 
 * @param fileName - Name to save the file as
 */
export const downloadFile = (fileUrl: string, fileName: string = 'download'): void => {
  try {
    console.log('=== Download by URL ===');
    console.log('URL:', fileUrl);
    console.log('File Name:', fileName);
    
    // Check if this is a Cloudinary URL
    if (fileUrl.includes('res.cloudinary.com')) {
      // Try to convert to download URL
      const downloadUrl = convertSecureUrlToDownloadUrl(fileUrl, fileName);
      
      if (downloadUrl) {
        console.log('✅ Using converted download URL');
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
        return;
      }
      
      console.log('⚠️ Conversion failed, trying fetch fallback');
    }
    
    // Final fallback: Force download using fetch and blob
    // This works even when Cloudinary URL doesn't support direct download
    console.log('Using fetch + blob fallback');
    fetch(fileUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL after a short delay
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
        console.log('✅ Download completed via blob');
      })
      .catch(error => {
        console.error('❌ Fetch fallback failed:', error);
        // Last resort: just open in new tab
        console.log('⚠️ Opening file in new tab as last resort');
        window.open(fileUrl, '_blank');
      });
    
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    alert(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get downloadable URL for Cloudinary file
 * @param fileUrl - Cloudinary URL or public ID
 * @param fileName - Original file name
 * @param publicId - Cloudinary public ID (optional, for better download handling)
 * @param resourceType - Resource type (optional)
 * @param format - File format (optional)
 */
export const getDownloadUrl = (
  fileUrl: string, 
  fileName: string = 'file', 
  publicId?: string,
  resourceType?: string,
  format?: string
): string => {
  if (publicId) {
    return getCloudinaryDownloadUrl(publicId, fileName, resourceType || 'raw', format);
  }
  return convertSecureUrlToDownloadUrl(fileUrl, fileName) || fileUrl;
};

/**
 * Download multiple files as a batch
 * @param files - Array of file objects with url and name
 */
export const downloadMultipleFiles = (
  files: Array<{ url: string; name: string; publicId?: string; resourceType?: string; format?: string }>
): void => {
  files.forEach((file, index) => {
    // Add a small delay between downloads to avoid browser blocking
    setTimeout(() => {
      if (file.publicId) {
        downloadFileByPublicId(file.publicId, file.name, file.resourceType || 'raw', file.format);
      } else {
        downloadFile(file.url, file.name);
      }
    }, index * 500); // 500ms delay between each download
  });
};
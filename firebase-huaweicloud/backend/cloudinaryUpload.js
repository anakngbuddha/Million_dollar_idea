import cloudinary from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary with API credentials
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxtpglyvo',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Secure upload handler for files and images
 * @param {Buffer|Stream} fileData - File data to upload
 * @param {string} resourceType - 'auto', 'image', 'video', 'raw'
 * @param {Object} options - Additional cloudinary options
 * @returns {Promise<Object>} - Upload result with URL and public_id
 */
export const uploadToCloudinary = async (fileData, resourceType = 'auto', options = {}) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          resource_type: resourceType,
          // DO NOT use folder option - the full path is included in public_id
          max_file_size: 52428800, // 50MB limit
          type: 'upload',
          access_mode: 'public', // Make files publicly accessible
          ...options,
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary] Upload failed:', error);
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            console.log('[Cloudinary] Upload successful');
            console.log('[Cloudinary] Public ID:', result.public_id);
            console.log('[Cloudinary] Resource Type:', result.resource_type);
            console.log('[Cloudinary] Format:', result.format);
            console.log('[Cloudinary] Size:', result.bytes, 'bytes');
            
            // Generate clean secure URL without transformation flags
            // Transformations (like attachment flag) will be added at download time
            const cleanUrl = cloudinary.v2.url(result.public_id, {
              resource_type: result.resource_type,
              type: 'upload',
              secure: true,
            });
            
            resolve({
              url: cleanUrl,
              publicId: result.public_id, // This is the exact publicId from Cloudinary
              resourceType: result.resource_type,
              size: result.bytes,
              format: result.format,
            });
          }
        }
      );

      uploadStream.end(fileData);
    });
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error);
    throw new Error(`Upload error: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @param {string} resourceType - Type of resource ('image', 'video', 'raw')
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    console.log('[Cloudinary] Deleting file with publicId:', publicId);
    
    const result = await cloudinary.v2.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    
    console.log('[Cloudinary] Delete result:', result);
    return result;
  } catch (error) {
    console.error('[Cloudinary] Delete error:', error);
    throw new Error(`Delete error: ${error.message}`);
  }
};

/**
 * Generate signed URL for secure access
 * @param {string} publicId - Public ID of the file
 * @param {Object} options - URL generation options
 * @returns {string} - Signed URL
 */
export const generateSignedUrl = (publicId, options = {}) => {
  try {
    const url = cloudinary.v2.url(publicId, {
      secure: true,
      ...options,
    });
    
    console.log('[Cloudinary] Generated URL for publicId:', publicId);
    return url;
  } catch (error) {
    console.error('[Cloudinary] URL generation error:', error);
    throw new Error(`URL generation error: ${error.message}`);
  }
};
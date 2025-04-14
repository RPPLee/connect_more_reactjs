import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faImage, faVideo, faTimes } from '@fortawesome/free-solid-svg-icons';
import api from '../../../../services/api';
import { auth } from '../../../../config/firebase';

// File size limits
const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const VIDEO_SIZE_LIMIT = 20 * 1024 * 1024; // 20MB

// Supported file types
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

// Define response types
interface PresignedUrlResponse {
  presignedUrl: string;
  fileUrl: string;
  key: string;
  quotaRemaining: number;
}

// Get organizer ID - In a real app, you would get this from your auth context
// This is just a placeholder, you'll need to implement this according to your app's state management
const getOrganizerId = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // For now, we're using a hardcoded ID since we haven't fully implemented the
  // organizer profile connection to user accounts yet
  return 1;
};

interface FileUploaderProps {
  type: 'image' | 'thumbnail' | 'video';
  value: string;
  onChange: (url: string) => void;
}

const FileUploader = ({ type, value, onChange }: FileUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isImageType = type === 'image' || type === 'thumbnail';
  const allowedTypes = isImageType ? IMAGE_TYPES : VIDEO_TYPES;
  const sizeLimit = isImageType ? IMAGE_SIZE_LIMIT : VIDEO_SIZE_LIMIT;
  
  // Format file size to human-readable format
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Handle file upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Supported types: ${allowedTypes.join(', ')}`);
      return;
    }
    
    // Validate file size
    if (file.size > sizeLimit) {
      setError(`File too large. Maximum size: ${formatFileSize(sizeLimit)}`);
      return;
    }
    
    // Reset state
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Step 1: Get pre-signed URL from Lambda
      const organizerId = getOrganizerId();
      console.log('Sending upload request with organizerId:', organizerId);
      
      const response = await api.post('/upload/generate-presigned-url', {
        fileType: file.type,
        contentLength: file.size,
        fileCategory: type,
        organizerId
      });
      
      // Log the raw response to see its structure
      console.log('Raw upload response:', response);
      console.log('Response type:', typeof response);
      console.log('Has presignedUrl?', 'presignedUrl' in response);
      
      // Our API interceptor already extracts the data property,
      // so cast the response to our expected type
      const presignedUrlResponse = response as unknown as PresignedUrlResponse;
      
      // Log the processed response to see its structure
      console.log('Presigned URL response after cast:', presignedUrlResponse);
      
      if (!presignedUrlResponse || !presignedUrlResponse.presignedUrl) {
        console.error('Missing presignedUrl in response:', presignedUrlResponse);
        throw new Error('Failed to get upload URL');
      }
      
      // Step 2: Upload file directly to S3 with presigned URL
      try {
        console.log('Starting S3 upload with presigned URL:', presignedUrlResponse.presignedUrl);
        await uploadFileToS3(file, presignedUrlResponse.presignedUrl, (progress) => {
          setUploadProgress(progress);
        });
        console.log('S3 upload completed successfully');
      } catch (uploadError) {
        console.error('S3 upload error:', uploadError);
        throw uploadError;
      }
      
      // Step 3: Track the upload in our backend
      await api.post('/upload/track-upload', {
        organizerId,
        fileKey: presignedUrlResponse.key,
        fileSize: file.size,
        fileType: file.type
      });
      
      // Update form with URL from the response
      onChange(presignedUrlResponse.fileUrl);
      
      // Set upload as complete
      setIsUploading(false);
      setUploadProgress(100);
      
    } catch (e) {
      console.error('Upload error:', e);
      setError('Upload failed. Please try again.');
      setIsUploading(false);
    }
  };
  
  // Upload file to S3 with progress tracking
  const uploadFileToS3 = (file: File, presignedUrl: string, onProgress: (progress: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });
      
      // Set up the request
      xhr.open('PUT', presignedUrl);
      
      // Set content type header - important for S3
      xhr.setRequestHeader('Content-Type', file.type);
      
      // Send the file
      xhr.send(file);
    });
  };
  
  // Handle URL input submission
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setShowUrlInput(false);
    }
  };
  
  // Clear the current value
  const handleClear = async () => {
    // If there's a value and it contains a file key, send delete request
    if (value && value.includes('/')) {
      try {
        // Extract file key from URL - more robust extraction
        let fileKey = '';
        if (value.includes('amazonaws.com')) {
          // Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
          // or: https://{bucket}.s3-{region}.amazonaws.com/{key}
          const urlWithoutProtocol = value.split('//')[1];
          const pathParts = urlWithoutProtocol.split('/');
          // Remove domain part (first element)
          pathParts.shift();
          fileKey = pathParts.join('/');
        } else if (value.startsWith('/')) {
          // Format: /path/to/file.jpg
          fileKey = value.substring(1);
        } else {
          // Just use the value as is
          fileKey = value;
        }
        
        console.log('Deleting file with key:', fileKey);
        
        await api.post('/upload/delete-file', {
          organizerId: getOrganizerId(),
          fileKey
        });
      } catch (e) {
        console.error('Error deleting file:', e);
        // Continue with UI cleanup even if delete fails
      }
    }
    
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="space-y-3">
      {/* File preview */}
      {value && !isUploading && (
        <div className="relative">
          {isImageType ? (
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
              <img 
                src={value} 
                alt={type === 'thumbnail' ? "Thumbnail preview" : "Image preview"} 
                className="w-full h-full object-contain"
                onError={() => setError('Failed to load image. URL may be invalid.')}
              />
            </div>
          ) : (
            <div className="relative aspect-video bg-black rounded overflow-hidden">
              <video 
                src={value}
                controls
                className="w-full h-full object-contain"
                onError={() => setError('Failed to load video. URL may be invalid or video format is not supported.')}
              />
            </div>
          )}
          
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            aria-label="Remove file"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}
      
      {/* URL input form */}
      {showUrlInput && (
        <form onSubmit={handleUrlSubmit} className="flex space-x-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={`Enter ${type} URL`}
            className="flex-1 px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-cm-blue text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </form>
      )}
      
      {/* Upload status/progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-cm-blue dark:bg-cm-yellow h-2 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-cm-red dark:text-red-400">
          {error}
        </p>
      )}
      
      {/* Upload options */}
      {!isUploading && !showUrlInput && (
        <div className="flex flex-wrap gap-2">
          {/* File upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-light-text-primary dark:text-dark-text-primary bg-light-bg-primary dark:bg-dark-bg-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cm-blue dark:focus:ring-cm-yellow"
          >
            <FontAwesomeIcon icon={isImageType ? faImage : faVideo} className="mr-2" />
            {`Upload ${isImageType ? (type === 'thumbnail' ? 'Thumbnail' : 'Image') : 'Video'}`}
          </button>
          
          {/* URL input button */}
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-light-text-primary dark:text-dark-text-primary bg-light-bg-primary dark:bg-dark-bg-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cm-blue dark:focus:ring-cm-yellow"
          >
            <FontAwesomeIcon icon={faLink} className="mr-2" />
            {`Enter URL`}
          </button>
        </div>
      )}
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileChange}
        className="hidden"
        aria-label={`Upload ${type}`}
      />
      
      {/* Helper text */}
      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
        {isImageType
          ? `Supported formats: JPEG, PNG, GIF, WebP, SVG. Max size: ${formatFileSize(IMAGE_SIZE_LIMIT)}.`
          : `Supported formats: MP4, WebM, MOV. Max size: ${formatFileSize(VIDEO_SIZE_LIMIT)}.`
        }
      </p>
    </div>
  );
};

export default FileUploader; 
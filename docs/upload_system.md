# Connect More Upload System

This document describes the file upload system for the Connect More platform, which enables organizers to upload images and videos for their events.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technical Components](#technical-components)
3. [Security and Authentication](#security-and-authentication)
4. [Quota Management](#quota-management)
5. [Implementation Details](#implementation-details)
6. [Frontend Integration](#frontend-integration)
7. [API Reference](#api-reference)
8. [Database Schema](#database-schema)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

The Connect More upload system uses a hybrid architecture that combines direct-to-S3 uploads with backend validation and management:

1. Files are uploaded directly from the browser to Amazon S3
2. A Lambda function generates pre-signed URLs for secure uploads
3. The system tracks usage and implements quota management per organizer
4. The frontend provides a user-friendly interface with progress indicators

This approach provides several benefits:
- Improved performance by uploading directly to S3 from the browser
- Enhanced security through pre-signed URLs and server-side validation
- Better user experience with progress tracking
- Efficient resource usage by bypassing Lambda for the actual file transfer

## Technical Components

### Backend Components

- **AWS Lambda**: Handles authentication, URL generation, and quota management
- **Amazon S3**: Stores uploaded files in organizer-specific paths
- **PostgreSQL**: Tracks file metadata and quota usage
- **API Gateway**: Exposes Lambda endpoints for frontend integration

### Frontend Components

- **FileUploader Component**: React component that handles file selection, validation, and upload
- **XHR Upload**: Direct-to-S3 upload with progress tracking
- **React State**: Manages upload state and UI feedback

## Security and Authentication

### Authentication Flow

1. Users authenticate with Firebase Authentication
2. Firebase JWT tokens are validated by the Lambda function
3. The Lambda function checks if the user has organizer permissions

### S3 Security

- No public access to S3 bucket objects
- Files are only accessible via pre-signed URLs or authenticated requests
- CORS is configured to allow uploads only from the application domain
- Pre-signed URLs expire after 1 hour

## Quota Management

Each organizer has a storage quota that limits the total amount of storage they can use:

- Default quota: 100 MB per organizer
- Quotas are enforced before generating pre-signed URLs
- The system tracks file sizes in the `organizer_files` table
- Uploads are rejected if they would exceed the organizer's quota
- Deleting files frees up quota space

## Implementation Details

### S3 Bucket Structure

Files are organized in the following structure:

```
connectmore/
├── organizers/
│   ├── 1/                   # Organizer ID
│   │   ├── images/          # Event images
│   │   │   ├── 20230101120000-abcd1234.jpg
│   │   ├── thumbnails/      # Event thumbnails
│   │   │   ├── 20230101120000-efgh5678.jpg
│   │   ├── videos/          # Event videos
│   │   │   ├── 20230101120000-ijkl9012.mp4
```

### File Naming Convention

Files are named using the following pattern:
- `{timestamp}-{unique_id}.{extension}`
  - `timestamp`: Current date and time (YYYYMMDDHHMMSS)
  - `unique_id`: First 8 characters of a UUID
  - `extension`: File extension based on MIME type

### File Type and Size Limits

- **Images**: JPEG, PNG, GIF, WebP, SVG (max 5 MB)
- **Videos**: MP4, WebM, MOV (max 20 MB)

## Frontend Integration

### FileUploader Component

The `FileUploader` component provides a complete UI for file uploads, including:

- File selection
- Drag-and-drop support
- Progress tracking
- File preview
- Error handling
- URL input option

### Usage in Forms

```jsx
// Example usage in a form
<FileUploader
  type="image"
  value={imageUrl}
  onChange={setImageUrl}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `type` | `'image' \| 'thumbnail' \| 'video'` | Type of file to upload |
| `value` | `string` | Current file URL (can be empty) |
| `onChange` | `(url: string) => void` | Callback when URL changes |

## API Reference

### Generate Pre-signed URL

**Endpoint**: `POST /upload/generate-presigned-url`

**Request Body**:
```json
{
  "fileType": "image/jpeg",
  "contentLength": 1048576,
  "fileCategory": "image",
  "organizerId": 123
}
```

**Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "presignedUrl": "https://connectmore.s3.us-east-2.amazonaws.com/...",
    "fileUrl": "https://connectmore.s3.us-east-2.amazonaws.com/organizers/123/images/...",
    "key": "organizers/123/images/20230101120000-abcd1234.jpg",
    "quotaRemaining": 104857600
  }
}
```

### Track Upload

**Endpoint**: `POST /upload/track-upload`

**Request Body**:
```json
{
  "organizerId": 123,
  "fileKey": "organizers/123/images/20230101120000-abcd1234.jpg",
  "fileSize": 1048576,
  "fileType": "image/jpeg"
}
```

**Response**:
```json
{
  "success": true,
  "message": "File upload recorded successfully",
  "data": {
    "fileId": 456,
    "fileKey": "organizers/123/images/20230101120000-abcd1234.jpg"
  }
}
```

### Delete File

**Endpoint**: `POST /upload/delete-file`

**Request Body**:
```json
{
  "organizerId": 123,
  "fileKey": "organizers/123/images/20230101120000-abcd1234.jpg"
}
```

**Response**:
```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": {
    "fileKey": "organizers/123/images/20230101120000-abcd1234.jpg",
    "bytesFreed": 1048576
  }
}
```

## Database Schema

### organizer_files Table

```sql
CREATE TABLE organizer_files (
    id SERIAL PRIMARY KEY,
    organizer_id INTEGER NOT NULL,
    file_key VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_key)
);

CREATE INDEX idx_organizer_files_organizer_id ON organizer_files(organizer_id);
```

### organizer_quota Table

```sql
CREATE TABLE organizer_quota (
    organizer_id INTEGER PRIMARY KEY,
    quota_limit BIGINT NOT NULL DEFAULT 104857600, -- 100MB default
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Common Issues

#### CORS Errors

If you encounter CORS errors during upload:

1. Verify the S3 bucket CORS configuration:
```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT",
            "POST",
            "GET"
        ],
        "AllowedOrigins": [
            "https://yourdomain.com"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

2. Ensure the request is coming from an allowed origin

#### Upload Failures

If uploads are failing:

1. Check browser console for errors
2. Verify Lambda function logs in CloudWatch
3. Ensure the S3 bucket permissions allow uploads
4. Verify the file size and type are within limits

#### Authentication Issues

If authentication is failing:

1. Ensure the Firebase token is being passed correctly
2. Verify the `@require_auth` decorator is working properly
3. Check that the user has organizer permissions

### Logging and Monitoring

- Lambda function logs are available in CloudWatch
- S3 bucket access logs can be enabled for troubleshooting
- Database queries are logged in the PostgreSQL logs

### Support

For issues with the upload system, contact the development team at support@connectmore.com. 
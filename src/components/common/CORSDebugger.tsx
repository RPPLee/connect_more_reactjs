import { useState } from 'react';
import api from '../../services/api';

const CORSDebugger = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [bucketName, setBucketName] = useState('connectmore');
  const [region, setRegion] = useState('us-east-2');

  const testPresignedUrl = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Test getting a presigned URL
      const organizerId = 1; // You might want to get this from your app state
      const presignedUrlResponse = await api.post('/upload/generate-presigned-url', {
        fileType: 'image/jpeg',
        contentLength: 1024, // 1KB
        fileCategory: 'image',
        organizerId
      });
      
      setResult(presignedUrlResponse);
      
      // Test if we can access this URL with a HEAD request
      try {
        const response = await fetch(presignedUrlResponse.data.presignedUrl, {
          method: 'HEAD',
        });
        
        if (response.ok) {
          setResult(prev => ({
            ...prev,
            headRequest: {
              success: true,
              status: response.status,
              statusText: response.statusText
            }
          }));
        } else {
          setResult(prev => ({
            ...prev,
            headRequest: {
              success: false,
              status: response.status,
              statusText: response.statusText
            }
          }));
        }
      } catch (headErr: any) {
        setResult(prev => ({
          ...prev,
          headRequest: {
            success: false,
            error: headErr.message
          }
        }));
      }
      
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      console.error('CORS Debugger error:', e);
    } finally {
      setLoading(false);
    }
  };

  const testS3Connection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Try a simple HEAD request to the bucket root to check CORS
      const url = `https://${bucketName}.s3.${region}.amazonaws.com/`;
      const response = await fetch(url, {
        method: 'HEAD',
      });
      
      setResult({
        bucketHead: {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          url
        }
      });
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      console.error('S3 connection test error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">CORS Debug Tool</h2>
      
      <div className="mb-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Bucket Name</label>
            <input
              type="text"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Region</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={testS3Connection}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test S3 Connection
          </button>
          <button
            onClick={testPresignedUrl}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Presigned URL
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="text-center py-4">Loading...</div>
      )}
      
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h3 className="text-md font-semibold mb-2">Results:</h3>
          <pre className="bg-gray-200 dark:bg-gray-700 p-3 rounded overflow-auto max-h-80">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6 text-sm">
        <h3 className="font-semibold mb-2">Common CORS Issues:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Missing or misconfigured CORS settings on the S3 bucket</li>
          <li>Incorrect AllowedOrigins in the CORS configuration</li>
          <li>Missing required headers in the CORS AllowedHeaders</li>
          <li>Using the wrong HTTP method in your requests</li>
          <li>Trying to access a bucket or object that doesn't exist</li>
        </ul>
      </div>
    </div>
  );
};

export default CORSDebugger; 
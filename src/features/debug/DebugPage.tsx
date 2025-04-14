import React from 'react';
import CORSDebugger from '../../components/common/CORSDebugger';

const DebugPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload System Debugging</h2>
        <CORSDebugger />
      </div>
      
      <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Important Notes</h3>
        <p className="mb-2">
          This page contains tools for debugging the Connect More platform. 
          It should only be accessible to developers and administrators.
        </p>
        <p>
          If you're experiencing CORS issues with file uploads, use the tools above to diagnose
          the problem. Common issues include incorrect S3 bucket CORS configuration, authentication problems,
          and incorrect file paths.
        </p>
      </div>
    </div>
  );
};

export default DebugPage; 
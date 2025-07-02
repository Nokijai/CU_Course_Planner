import React from 'react';

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <a href="/" className="text-blue-600 hover:underline">Go back to Home</a>
    </div>
  );
}

export default NotFoundPage; 
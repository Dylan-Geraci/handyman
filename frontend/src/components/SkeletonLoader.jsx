import React from 'react';

// This is a simple skeleton loader component.
// It creates a grey, pulsing placeholder.
function SkeletonLoader() {
  return (
    <div className="bg-gray-200 p-4 rounded-lg shadow-sm animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-full"></div>
      <div className="h-3 bg-gray-300 rounded w-5/6 mt-1"></div>
    </div>
  );
}

export default SkeletonLoader;
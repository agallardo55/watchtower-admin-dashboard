import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-4xl mb-6">
        🔍
      </div>
      <h1 className="text-4xl font-bold text-slate-100 mb-2">404</h1>
      <p className="text-lg text-slate-400 mb-1">Page not found</p>
      <p className="text-sm text-slate-500 mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

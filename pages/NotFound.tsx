import React from 'react';
import { Link } from 'react-router-dom';
import { icons } from '../constants';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-none bg-[#0f0f0f] border border-[#1e293b] flex items-center justify-center mb-6 text-slate-400">
        <icons.search className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-bold text-slate-100 mb-2">404</h1>
      <p className="text-sm text-slate-400 mb-1">Page not found</p>
      <p className="text-xs text-slate-500 mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-semibold transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

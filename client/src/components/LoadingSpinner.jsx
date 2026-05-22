/**
 * components/LoadingSpinner.jsx – Reusable Loading States
 */

export const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} rounded-full border-blue-500/30 border-t-blue-500 animate-spin`}
      />
      {text && <p className="text-sm text-slate-400 animate-pulse">{text}</p>}
    </div>
  );
};

export const PageLoader = () => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin mx-auto" />
      <p className="text-slate-400 text-sm">Loading DevTrackr...</p>
    </div>
  </div>
);

export const SkeletonCard = () => (
  <div className="glass-card p-5 space-y-3">
    <div className="skeleton h-4 w-1/3 rounded" />
    <div className="skeleton h-8 w-2/3 rounded" />
    <div className="skeleton h-3 w-1/2 rounded" />
  </div>
);

export default LoadingSpinner;

import React from 'react';

interface SkeletonProps {
    className?: string; // Allow override of height/width/rounded
    style?: React.CSSProperties;
}

/**
 * Basic Skeleton component using Tailwind animate-pulse.
 * Extend styling with className (e.g., 'w-full h-8 rounded-lg').
 */
const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
    return (
        <div
            className={`animate-pulse bg-slate-200 dark:bg-white/10 ${className}`}
            style={style}
        ></div>
    );
};

export default Skeleton;

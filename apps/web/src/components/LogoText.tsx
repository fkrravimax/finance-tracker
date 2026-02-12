import React from 'react';

interface LogoTextProps {
    className?: string;
    dotClassName?: string;
}

const LogoText: React.FC<LogoTextProps> = ({ className = "text-xl", dotClassName = "" }) => {
    return (
        <span className={`font-black tracking-tighter bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent transition-all ${className}`}>
            Rupiku<span className={`text-primary inline-block transform translate-y-[1px] md:translate-y-[2px] ${dotClassName}`}>.</span>
        </span>
    );
};

export default LogoText;

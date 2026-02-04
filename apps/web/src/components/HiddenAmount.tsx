import React from 'react';
import { useAppearance } from '../contexts/AppearanceContext';

interface HiddenAmountProps {
    value: number | string;
    isImportant?: boolean; // If true, hidden in 'hidden' (soft) mode. If false, only hidden in 'extreme' mode.
    className?: string; // To allow styling passthrough
    prefix?: string; // Currency symbol etc.
}

const HiddenAmount: React.FC<HiddenAmountProps> = ({ value, isImportant = false, className = '', prefix = '' }) => {
    const { privacyMode } = useAppearance();

    const shouldHide =
        (privacyMode === 'extreme') ||
        (privacyMode === 'hidden' && isImportant);

    if (shouldHide) {
        return (
            <span className={`${className} inline-flex items-center select-none`} title="Hidden for privacy">
                <span className="opacity-50 tracking-widest text-inherit">•••••</span>
            </span>
        );
    }

    return (
        <span className={className}>
            {prefix}{typeof value === 'number' ? value.toLocaleString('id-ID', { maximumFractionDigits: 0 }) : value}
        </span>
    );
};

export default HiddenAmount;

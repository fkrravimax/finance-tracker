import { useAppearance } from '../contexts/AppearanceContext';

const MASK = '•••••';

/**
 * Custom hook for privacy masking of financial values.
 * 
 * - `extreme` mode: hides ALL financial numbers
 * - `hidden` (soft) mode: hides only values marked as `isImportant`
 * - `none` mode: shows everything
 * 
 * Usage:
 *   const { maskCurrency, isExtremeHide } = usePrivacyMask();
 *   <span>{maskCurrency(formatCurrency(amount))}</span>
 */
export const usePrivacyMask = () => {
    const { privacyMode } = useAppearance();

    const isExtremeHide = privacyMode === 'extreme';
    const isSoftHide = privacyMode === 'hidden';

    /**
     * Mask a pre-formatted currency/number string.
     * Returns the mask placeholder if privacy mode requires hiding.
     */
    const maskCurrency = (formatted: string, isImportant = false): string => {
        if (isExtremeHide || (isSoftHide && isImportant)) return MASK;
        return formatted;
    };

    return { maskCurrency, isExtremeHide, isSoftHide, MASK };
};

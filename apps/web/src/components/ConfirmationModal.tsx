import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false
}) => {
    if (!isOpen) return null;

    const getVariantClasses = () => {
        switch (variant) {
            case 'danger':
                return 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25';
            case 'warning':
                return 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-500/25';
            case 'info':
                return 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/25';
            default:
                return 'bg-primary hover:bg-primary/90 text-slate-900 shadow-primary/20';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={isLoading ? undefined : onClose}
            ></div>
            <div className="relative bg-white dark:bg-[#2a2515] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in border border-slate-100 dark:border-[#493f22]">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                            variant === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                                'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        }`}>
                        <span className="material-symbols-outlined text-2xl">
                            {variant === 'danger' ? 'warning' : 'info'}
                        </span>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                        <p className="text-slate-500 dark:text-[#cbbc90] text-sm leading-relaxed">{message}</p>
                    </div>

                    <div className="flex gap-3 w-full mt-2">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-[#493f22] text-slate-700 dark:text-[#cbbc90] font-bold text-sm hover:bg-slate-50 dark:hover:bg-[#36301d] transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${getVariantClasses()}`}
                        >
                            {isLoading && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;

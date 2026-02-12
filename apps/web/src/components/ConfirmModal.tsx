import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#342d18] rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in border border-slate-100 dark:border-[#493f22]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-slate-600 dark:text-[#cbbc90] mb-6">{message}</p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-[#cbbc90] hover:bg-slate-100 dark:hover:bg-[#493f22] rounded-xl transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-xl shadow-md transition-colors ${isDestructive
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                                : 'bg-primary hover:bg-primary-hover shadow-primary/30'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;

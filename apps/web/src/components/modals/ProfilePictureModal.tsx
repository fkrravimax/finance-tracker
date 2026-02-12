import React, { useState } from 'react';
import { authClient } from '../../lib/auth-client';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import type { User } from '../../types';

interface ProfilePictureModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
    onUpdate?: (newImage: string) => void;
}

const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({ isOpen, onClose, currentUser, onUpdate }) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const [isUpdating, setIsUpdating] = useState(false);

    if (!isOpen) return null;

    const handleUpdateProfilePicture = async (imagePath: string) => {
        setIsUpdating(true);
        try {
            await authClient.updateUser({
                image: imagePath
            });

            // Update local storage
            const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
            currentUserData.image = imagePath;
            localStorage.setItem('user', JSON.stringify(currentUserData));

            // Dispatch event for other components to listen
            window.dispatchEvent(new Event('user-updated'));

            if (onUpdate) {
                onUpdate(imagePath);
            }

            showNotification("Profile picture updated!");
            onClose();
        } catch (error: any) {
            console.error("Failed to update profile picture", error);
            showNotification(error.message || "Failed to update profile picture", 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-[#2a2515] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                <div className="p-4 border-b border-slate-100 dark:border-[#493f22] flex justify-between items-center bg-surface-light dark:bg-[#342d18]">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('settings.profilePicture')}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-[#cbbc90] dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    <div className="flex flex-wrap justify-center gap-4">
                        {/* Current/Custom Image */}
                        {currentUser?.image && !currentUser.image.startsWith('/default-profiles/') && (
                            <div className="relative group cursor-pointer" onClick={() => handleUpdateProfilePicture(currentUser.image!)}>
                                <img
                                    src={currentUser.image}
                                    alt="Current"
                                    className="w-20 h-20 rounded-full object-cover border-4 border-primary"
                                />
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-bold">Current</span>
                                </div>
                            </div>
                        )}

                        {/* Default Options */}
                        {[1, 2, 3, 4].map((num) => {
                            const imgPath = `/default-profiles/profilepict${num}.png`;
                            const isSelected = currentUser?.image === imgPath;
                            return (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleUpdateProfilePicture(imgPath)}
                                    disabled={isUpdating}
                                    className={`relative w-20 h-20 rounded-full overflow-hidden border-2 transition-all ${isSelected ? 'border-primary ring-4 ring-primary/30 scale-105' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}
                                >
                                    <img
                                        src={imgPath}
                                        alt={`Profile ${num}`}
                                        className="w-full h-full object-cover"
                                    />
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white drop-shadow-md text-3xl">check</span>
                                        </div>
                                    )}
                                    {isUpdating && isSelected && (
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePictureModal;

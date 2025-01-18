import React from "react";
import { useTranslation } from "react-i18next";

interface ConfirmationExitModalProps {
    title?: string;
    message?: string;
    onLeave: () => void;
    onCancel: () => void;
}

const ConfirmationExitModal: React.FC<ConfirmationExitModalProps> = ({
    title,
    message,
    onLeave,
    onCancel,
}) => {
    const { t: trans } = useTranslation();
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    {title ?? trans("generals.modal_game_exit.title")}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {message ?? trans("generals.modal_game_exit.message")}
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 rounded font-semibold text-gray-700 dark:text-gray-200"
                    >
                        {trans("generals.cancel")}
                    </button>
                    <button
                        onClick={onLeave}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
                    >
                        {trans("generals.modal_game_exit.btn_leave")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationExitModal;

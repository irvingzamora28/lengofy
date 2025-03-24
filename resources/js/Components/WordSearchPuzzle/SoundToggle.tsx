import { motion } from 'framer-motion';
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';

interface SoundToggleProps {
    isMuted: boolean;
    onToggle: () => void;
    className?: string;
}

const SoundToggle: React.FC<SoundToggleProps> = ({ isMuted, onToggle, className = '' }) => {
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={onToggle}
            className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors ${className}`}
            aria-label={isMuted ? "Unmute sound effects" : "Mute sound effects"}
        >
            {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
        </motion.button>
    );
};

export default SoundToggle;
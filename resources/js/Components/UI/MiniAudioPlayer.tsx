import { AudioPlayerProps } from "@/types/props";
import { FiPauseCircle, FiPlayCircle } from "react-icons/fi";
import { motion } from 'framer-motion';


const MiniAudioPlayer: React.FC<AudioPlayerProps> = ({ isPlaying, handlePlayPause }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="inline-flex bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:shadow-xl transition-all"
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handlePlayPause}
        className="text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full p-2"
      >
        {isPlaying ? (
          <FiPauseCircle size={24} className="transition-all" />
        ) : (
          <FiPlayCircle size={24} className="transition-all" />
        )}
      </motion.button>
    </motion.div>
  );

export default MiniAudioPlayer;

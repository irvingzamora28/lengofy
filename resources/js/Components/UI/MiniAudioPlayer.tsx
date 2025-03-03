import { AudioPlayerProps } from "@/types/props";
import { FiPauseCircle, FiPlayCircle } from "react-icons/fi";
import { motion } from "framer-motion";

const MiniAudioPlayer: React.FC<AudioPlayerProps> = ({ isPlaying, handlePlayPause }) => (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      onClick={handlePlayPause}
      className="w-8 h-8 rounded-full bg-indigo-500 hover:bg-indigo-600 shadow-lg text-white flex items-center justify-center transition-all duration-200"
    >
      {isPlaying ? <FiPauseCircle size={20} /> : <FiPlayCircle size={20} />}
    </motion.button>
  );

export default MiniAudioPlayer;

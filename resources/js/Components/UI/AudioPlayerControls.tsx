import { AudioPlayerProps } from "@/types/props";
import { MouseEventHandler } from "react";
import { FiPauseCircle, FiPlayCircle, FiRepeat, FiRewind } from "react-icons/fi";

interface AudioPlayerControlsProps extends AudioPlayerProps {
	isRepeating: boolean;
    isPlaying: boolean;
	handleRepeat: MouseEventHandler<HTMLButtonElement>;
	handleRestart: MouseEventHandler<HTMLButtonElement>;
    handlePlayPause: MouseEventHandler<HTMLButtonElement>;
}

const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
    isPlaying,
    isRepeating,
    handlePlayPause,
    handleRepeat,
    handleRestart
  }) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleRestart}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
      >
        <FiRewind size={20} />
      </button>
      <button
        onClick={handlePlayPause}
        className="p-3 rounded-full bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
      >
        {isPlaying ? <FiPauseCircle size={24} /> : <FiPlayCircle size={24} />}
      </button>
      <button
        onClick={handleRepeat}
        className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
          isRepeating ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        <FiRepeat size={20} />
      </button>
    </div>
  );
export default AudioPlayerControls;

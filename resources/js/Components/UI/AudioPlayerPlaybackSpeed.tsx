import { AudioPlayerPlaybackSpeedProps } from "@/types/props";
import { MdSpeed } from "react-icons/md";

const AudioPlayerPlaybackSpeed: React.FC<AudioPlayerPlaybackSpeedProps> = ({ playbackRate, setPlaybackRate, setShowSpeedControls, showSpeedControls }) => (
	<div className="relative">
            <button
              onClick={() => setShowSpeedControls(!showSpeedControls)}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <MdSpeed size={18} />
              <span>{playbackRate}x</span>
            </button>
            {showSpeedControls && (
                <div
                  className="absolute top-full mt-2 w-24 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-10"
                >
                  {[0.5, 1, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setPlaybackRate(rate);
                        setShowSpeedControls(false);
                      }}
                      className={`w-full px-4 py-2 text-sm ${
                        playbackRate === rate
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
            )}
          </div>
);

export default AudioPlayerPlaybackSpeed;

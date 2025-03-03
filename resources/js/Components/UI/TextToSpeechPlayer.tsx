import useAudioPlayer from "@/Hooks/useAudioPlayer";
import FullAudioPlayer from "./FullAudioPlayer";
import MiniAudioPlayer from "./MiniAudioPlayer";

interface TextToSpeechPlayerProps {
	text?: string;
	displayText?: boolean;
	miniPlayer?: boolean;
	mp3File?: string;
	autoplay?: boolean;
}

const TextToSpeechPlayer: React.FC<TextToSpeechPlayerProps> = ({ text = "", displayText = false, miniPlayer = false, mp3File = "", autoplay = false }) => {
	const { isPlaying, isPaused, isRepeating, isRestarting, currentTime, duration, playbackRate, handleAudioPlayerProgressBarClick, handlePlayPause, handleRepeat, handleRestart, setPlaybackRate } = useAudioPlayer({ text, mp3File, autoplay });

	return (
		<>
			{displayText && <p className={`bg-primary-200 dark:bg-primary-800`}>{text}</p>}
			{miniPlayer ? (
				<MiniAudioPlayer isPlaying={isPlaying} handlePlayPause={handlePlayPause} />
			) : (
				<FullAudioPlayer
					isPlaying={isPlaying}
					currentTime={currentTime}
					duration={duration}
					playbackRate={playbackRate}
					setPlaybackRate={setPlaybackRate}
					isRepeating={isRepeating}
					handlePlayPause={handlePlayPause}
					handleRepeat={handleRepeat}
					handleRestart={handleRestart}
					handleAudioPlayerProgressBarClick={handleAudioPlayerProgressBarClick}
				/>
			)}
		</>
	);
};

export default TextToSpeechPlayer;

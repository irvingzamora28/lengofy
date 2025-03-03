import { AudioPlayerProgressBarProps } from "@/types/props";

const AudioPlayerProgressBar: React.FC<AudioPlayerProgressBarProps> = ({ currentTime, duration, handleAudioPlayerProgressBarClick }) => (
	<div className="w-full md:w-auto">
		<input type="range" min={0} max={duration} value={currentTime} onChange={handleAudioPlayerProgressBarClick} className="w-full md:w-auto slider accent-blue-600" />
	</div>
);

export default AudioPlayerProgressBar;

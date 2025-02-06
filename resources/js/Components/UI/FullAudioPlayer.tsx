import React, { ChangeEvent, MouseEventHandler } from "react";
import AudioPlayerControls from "./AudioPlayerControls";
import AudioPlayerProgressBar from "./AudioPlayerProgressBar";
import AudioPlayerPlaybackSpeed from "./AudioPlayerPlaybackSpeed";
import { AudioPlayerProps } from "@/types/props";

interface FullAudioPlayerProps extends AudioPlayerProps {
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	playbackRate: number;
	setPlaybackRate: (value: number) => void;
	isRepeating: boolean;
	handleRepeat: MouseEventHandler<HTMLButtonElement>;
	handleRestart: MouseEventHandler<HTMLButtonElement>;
	handleAudioPlayerProgressBarClick: (event: ChangeEvent<HTMLInputElement>) => void;
	handlePlayPause: MouseEventHandler<HTMLButtonElement>;
}

const FullAudioPlayer: React.FC<FullAudioPlayerProps> = ({ isPlaying, currentTime, duration, playbackRate, setPlaybackRate, isRepeating, handlePlayPause, handleRepeat, handleRestart, handleAudioPlayerProgressBarClick }) => {
    const [showSpeedControls, setShowSpeedControls] = React.useState(false);

    return (
        <div className="w-full max-w-xl mx-auto bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg">
		<div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
			<div className="flex flex-row justify-center md:justify-start space-x-4">
				<AudioPlayerControls isPlaying={isPlaying} isRepeating={isRepeating} handlePlayPause={handlePlayPause} handleRepeat={handleRepeat} handleRestart={handleRestart} />

				<AudioPlayerPlaybackSpeed playbackRate={playbackRate} setPlaybackRate={setPlaybackRate} setShowSpeedControls={setShowSpeedControls} showSpeedControls={showSpeedControls} />
			</div>
			<div className="w-full self-center">
				<AudioPlayerProgressBar currentTime={currentTime} duration={duration} handleAudioPlayerProgressBarClick={handleAudioPlayerProgressBarClick} />
			</div>
		</div>
	</div>
    );
};

export default FullAudioPlayer;

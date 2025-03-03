import { useState, useEffect, useRef } from "react";

interface UseAudioPlayerProps {
	text: string;
	mp3File?: string;
	autoplay: boolean;
}

const useAudioPlayer = ({ text, mp3File, autoplay = false }: UseAudioPlayerProps) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [isRepeating, setIsRepeating] = useState(false);
	const [isRestarting, setIsRestarting] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [playbackRate, setPlaybackRate] = useState(1);

	const utteranceRef = useRef(new SpeechSynthesisUtterance(text));
	utteranceRef.current.lang = "de-DE";

	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		if (mp3File?.endsWith(".mp3")) {
			audioRef.current = new Audio(mp3File);
            if (autoplay) {
                handlePlay();
            }
		}
	}, [mp3File, autoplay]);

	useEffect(() => {
		utteranceRef.current.text = text;

		if (audioRef.current) {
			audioRef.current.addEventListener("timeupdate", () => {
				setCurrentTime(audioRef.current?.currentTime || 0);
			});

			audioRef.current.addEventListener("loadedmetadata", () => {
				setDuration(audioRef.current?.duration || 0);
			});

			audioRef.current.addEventListener("ended", () => {
				setIsPlaying(false);
			});

			const handleEnd = () => {
				if (isRepeating) {
					handleRestart();
				}
			};

			if (isRepeating) {
				audioRef.current.addEventListener("ended", handleEnd);
			} else {
				audioRef.current.removeEventListener("ended", handleEnd);
			}

			audioRef.current.playbackRate = playbackRate;
		}
	}, [text, mp3File, audioRef.current, isRepeating, playbackRate]);

	const handleAudioPlayerProgressBarClick = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newTime = Number(event.target.value);
		setCurrentTime(newTime);
		if (audioRef.current) {
			audioRef.current.currentTime = newTime;
		}
	};

	const handlePlay = () => {
		if (audioRef.current) {
			audioRef.current.play();
			setIsPlaying(true);
			setIsPaused(false);
		} else {
			utteranceRef.current.rate = 0.8;
			utteranceRef.current.pitch = 1;
			window.speechSynthesis.cancel();
			setIsPlaying(true);
			setIsPaused(false);

			const voices = window.speechSynthesis.getVoices();
			const selectedVoice = voices.find((voice) => voice.lang === "de-DE");
			if (selectedVoice) {
				utteranceRef.current.voice = selectedVoice;
			}
			window.speechSynthesis.speak(utteranceRef.current);
		}
	};

	const handlePause = () => {
		if (audioRef.current) {
			audioRef.current.pause();
			setIsPlaying(false);
			setIsPaused(true);
		} else {
			setIsPaused(true);
			setIsPlaying(false);
			window.speechSynthesis.pause();
		}
	};

	const handleResume = () => {
		if (audioRef.current) {
			audioRef.current.play();
			setIsPlaying(true);
			setIsPaused(false);
		} else {
			setIsPaused(false);
			setIsPlaying(true);
			window.speechSynthesis.resume();
		}
	};

	const handlePlayPause = () => {
		if (!isPlaying && !isPaused) handlePlay();
		else if (isPaused) handleResume();
		else handlePause();
	};

	const handleRepeat = () => {
		setIsRepeating(!isRepeating);
	};

	const handleRestart = () => {
		if (audioRef.current) {
			audioRef.current.currentTime = 0;
			audioRef.current.play();
		} else {
			window.speechSynthesis.cancel();
			setIsPlaying(false);
			setIsPaused(false);
			setIsRestarting(true);
		}
	};

	useEffect(() => {
		if ((isRepeating || isRestarting) && !isPlaying && !isPaused) {
			handlePlayPause();
		}
	}, [isPlaying, isPaused, isRepeating, isRestarting]);

	useEffect(() => {
		utteranceRef.current.onend = () => {
			setIsPlaying(false);
			setIsPaused(false);
		};
	}, []);

	return {
		isPlaying,
		isPaused,
		isRepeating,
		isRestarting,
		currentTime,
		duration,
		playbackRate,
		handleAudioPlayerProgressBarClick,
		handlePlayPause,
		handleRepeat,
		handleRestart,
		setPlaybackRate,
	};
};

export default useAudioPlayer;

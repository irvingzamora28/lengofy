import { useState, useRef, useEffect } from 'react';
import { PitchDetector } from 'pitchy';
import { FaMicrophone, FaStop, FaRedo, FaPlay, FaVolumeUp } from 'react-icons/fa';
import { IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';
import { RiSoundModuleFill } from 'react-icons/ri';

interface RecordPromptProps {
  text: string;
  nativeAudio: string;
}

type WaveformData = {
  samples: number[];
  duration: number;
};

const VoiceRecorder = ({ text, nativeAudio }: RecordPromptProps) => {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [nativePitch, setNativePitch] = useState<number>(0);
  const [userPitch, setUserPitch] = useState<number>(0);
  const [nativeWaveform, setNativeWaveform] = useState<WaveformData>({ samples: [], duration: 0 });
  const [userWaveform, setUserWaveform] = useState<WaveformData>({ samples: [], duration: 0 });
  const [isPlayingExample, setIsPlayingExample] = useState(false);
  const [nativeProgress, setNativeProgress] = useState(0);
  const [userProgress, setUserProgress] = useState(0);
  const progressRef = useRef({
    native: { current: 0, target: 0, isPlaying: false },
    user: { current: 0, target: 0, isPlaying: false },
    animationFrame: 0
  });
  const lastTimeRef = useRef(0);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const comparisonCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Analyze native audio when component mounts
  useEffect(() => {
    const analyzeNativeAudio = async () => {
      try {
        const response = await fetch(nativeAudio);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const data = audioBuffer.getChannelData(0);
        const sampleRate = audioContext.sampleRate;
        const windowSize = 4096;

        // Pitch detection
        const detector = PitchDetector.forFloat32Array(windowSize);
        const pitches: number[] = [];
        for (let i = 0; i < data.length - windowSize; i += windowSize) {
          const chunk = data.subarray(i, i + windowSize);
          const [pitch, clarity] = detector.findPitch(chunk, sampleRate);
          if (clarity > 0.8) pitches.push(pitch);
        }
        setNativePitch(pitches.reduce((a, b) => a + b, 0) / pitches.length);

        // Waveform data
        const samples = downsample(data, 500);
        setNativeWaveform({
          samples,
          duration: audioBuffer.duration
        });
        drawWaveform(comparisonCanvasRef.current!, samples, '#4ecdc4');

      } catch (error) {
        console.error('Error analyzing native audio:', error);
      }
    };

    analyzeNativeAudio();
  }, [nativeAudio]);

  const handleTryAgain =  async() => {
    // Reset states
    setAudioUrl(null);
    setUserPitch(0);
    setUserWaveform({ samples: [], duration: 0 });
    audioChunks.current = [];

    // Start recording immediately
    await startRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const mediaRecorderInstance = new MediaRecorder(stream);
      mediaRecorder.current = mediaRecorderInstance;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      mediaRecorderInstance.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorderInstance.start();
      setRecording(true);

      // Real-time waveform
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!liveCanvasRef.current) return;

        const canvas = liveCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = 'rgb(17 24 39)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * canvas.height / 2 + canvas.height / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        animationRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);

        try {
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const data = audioBuffer.getChannelData(0);
          const sampleRate = audioContext.sampleRate;
          const windowSize = 4096;

          // Pitch detection
          const detector = PitchDetector.forFloat32Array(windowSize);
          const pitches: number[] = [];
          for (let i = 0; i < data.length - windowSize; i += windowSize) {
            const chunk = data.subarray(i, i + windowSize);
            const [pitch, clarity] = detector.findPitch(chunk, sampleRate);
            if (clarity > 0.8) pitches.push(pitch);
          }
          setUserPitch(pitches.reduce((a, b) => a + b, 0) / pitches.length);

          // Waveform data
          const samples = downsample(data, 500);
          setUserWaveform({
            samples,
            duration: audioBuffer.duration
          });

        } catch (error) {
          console.error('Error analyzing user audio:', error);
        }
      };
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Draw comparison waveforms
  useEffect(() => {
    if (userWaveform.samples.length > 0 && nativeWaveform.samples.length > 0) {
      const canvas = comparisonCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw native waveform
      drawWaveform(canvas, nativeWaveform.samples, '#4ecdc4', 0.3);

      // Draw user waveform
      drawWaveform(canvas, userWaveform.samples, '#f87171', 0.3);

      // Draw pitch match overlay
      const similarity = 1 - Math.min(Math.abs(userPitch - nativePitch) / 50, 1);
      ctx.fillStyle = `rgba(74, 222, 128, ${similarity * 0.4})`;
      ctx.fillRect(0, 0, canvas.width * similarity, canvas.height);
    }
  }, [userWaveform, nativeWaveform, userPitch, nativePitch]);

  // Helper functions
  const downsample = (data: Float32Array, targetLength: number): number[] => {
    const blockSize = Math.floor(data.length / targetLength);
    return Array.from({ length: targetLength }, (_, i) => {
      const start = i * blockSize;
      const sum = data.slice(start, start + blockSize).reduce((a, b) => a + Math.abs(b), 0);
      return sum / blockSize;
    });
  };

  const drawWaveform = (
    canvas: HTMLCanvasElement,
    samples: number[],
    color: string,
    opacity: number = 1
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 2;

    const maxSample = Math.max(...samples);
    samples.forEach((value, index) => {
      const x = (index / samples.length) * canvas.width;
      const y = (1 - value / maxSample) * canvas.height / 2 + canvas.height / 4;
      index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });

    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const getSimilarityColor = () => {
    if (!nativePitch || !userPitch) return '#cccccc';
    const difference = Math.abs(userPitch - nativePitch);
    const similarity = 1 - Math.min(difference / 50, 1);

    const red = Math.floor(255 * (1 - similarity));
    const green = Math.floor(255 * similarity);
    return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}00`;
  };

  const animateProgress = (timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    const smoothingFactor = deltaTime / 16;

    // Smooth progress updates for native audio
    if (progressRef.current.native.isPlaying && nativeAudioRef.current) {
      progressRef.current.native.target = nativeAudioRef.current.currentTime / nativeAudioRef.current.duration;
      const nativeDiff = progressRef.current.native.target - progressRef.current.native.current;
      progressRef.current.native.current += nativeDiff * smoothingFactor;
      setNativeProgress(progressRef.current.native.current);
    }

    // Smooth progress updates for user audio
    if (progressRef.current.user.isPlaying && userAudioRef.current) {
      progressRef.current.user.target = userAudioRef.current.currentTime / userAudioRef.current.duration;
      const userDiff = progressRef.current.user.target - progressRef.current.user.current;
      progressRef.current.user.current += userDiff * smoothingFactor;
      setUserProgress(progressRef.current.user.current);
    }

    progressRef.current.animationFrame = requestAnimationFrame(animateProgress);
  };

  // Start animation loop when component mounts
  useEffect(() => {
    progressRef.current.animationFrame = requestAnimationFrame(animateProgress);
    return () => {
      if (progressRef.current.animationFrame) {
        cancelAnimationFrame(progressRef.current.animationFrame);
      }
    };
  }, []);

  const handleNativePlay = () => {
    progressRef.current.native.isPlaying = true;
    progressRef.current.native.current = 0;
    setIsPlayingExample(true);
  };

  const handleNativeEnded = () => {
    progressRef.current.native.isPlaying = false;
    progressRef.current.native.current = 0;
    setNativeProgress(0);
    setIsPlayingExample(false);
  };

  const handleUserPlay = () => {
    progressRef.current.user.isPlaying = true;
    progressRef.current.user.current = 0;
  };

  const handleUserEnded = () => {
    progressRef.current.user.isPlaying = false;
    progressRef.current.user.current = 0;
    setUserProgress(0);
  };

  const similarity = userPitch ? 1 - Math.min(Math.abs(userPitch - nativePitch) / 50, 1) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between gap-2 bg-gray-50/50 dark:bg-gray-900/50 p-2 rounded-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <RiSoundModuleFill className="text-xl flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
          <p className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">{text}</p>
        </div>

        <button
          onClick={() => nativeAudioRef.current?.play()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all duration-200 font-medium text-sm flex-shrink-0"
        >
          <FaPlay className="text-xs" />
          <span>Listen</span>
        </button>
      </div>



      <div className="flex items-center justify-center gap-2">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium shadow hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 ${
            recording
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
          disabled={isPlayingExample}
        >
          {recording ? (
            <>
              <FaStop className="text-lg" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <FaMicrophone className="text-lg" />
              <span>Record</span>
            </>
          )}
        </button>

        {audioUrl && (
          <button
            onClick={handleTryAgain}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 shadow hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <FaRedo className="text-lg" />
            <span>Try Again</span>
          </button>
        )}
      </div>

      {/* Live waveform during recording */}
      {recording && (
        <div className="relative">
          <canvas ref={liveCanvasRef} className="w-full h-16 rounded-lg bg-gray-900 shadow-inner" />
          <div className="absolute top-2 left-2 flex items-center gap-2 text-emerald-400 text-sm font-medium bg-gray-900/50 backdrop-blur-sm px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Recording...</span>
          </div>
        </div>
      )}

      {/* Comparison waveform after recording */}
      {!recording && userWaveform.samples.length > 0 && (
        <div className="relative">
          <canvas
            ref={comparisonCanvasRef}
            className="w-full h-20 rounded-lg bg-gray-900 shadow-inner"
            width={800}
            height={200}
          />
          {(nativeProgress > 0 || userProgress > 0) && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400/70 via-white/70 to-emerald-400/70 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              style={{
                left: `${Math.max(nativeProgress, userProgress) * 100}%`,
                transform: 'translateX(-50%)'
              }}
            />
          )}
          <div className="absolute top-2 left-2 flex gap-3 text-sm font-medium bg-gray-900/50 backdrop-blur-sm px-3 py-1 rounded-full">
            <div className="flex items-center gap-1 text-cyan-400">
              <FaVolumeUp className="text-xs" />
              <span>Native</span>
            </div>
            <div className="flex items-center gap-1 text-rose-400">
              <FaMicrophone className="text-xs" />
              <span>You</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              {similarity >= 0.7 ? <IoCheckmarkCircle className="text-sm" /> : <IoCloseCircle className="text-sm" />}
              <span>{Math.round(similarity * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Audio players and feedback */}
      {audioUrl && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Your Recording</h3>
                <button
                  onClick={() => {
                    if (userAudioRef.current) {
                      userAudioRef.current.currentTime = 0;
                      userAudioRef.current.play();
                    }
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all duration-200 text-sm"
                >
                  <FaPlay className="text-xs" />
                  <span>Play</span>
                </button>
              </div>
              <audio
                ref={userAudioRef}
                src={audioUrl}
                className="hidden"
                onPlay={handleUserPlay}
                onEnded={handleUserEnded}
              />
            </div>

            <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Native Speaker</h3>
                <button
                  onClick={() => nativeAudioRef.current?.play()}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all duration-200 text-sm"
                >
                  <FaPlay className="text-xs" />
                  <span>Play</span>
                </button>
              </div>
              <audio
                ref={nativeAudioRef}
                src={nativeAudio}
                className="hidden"
                onPlay={handleNativePlay}
                onEnded={handleNativeEnded}
              />
            </div>
          </div>

          {userPitch > 0 && (
            <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg transition-all duration-300 hover:shadow-md">
              <h3 className="text-sm font-medium mb-1.5 text-gray-800 dark:text-gray-200">
                Pronunciation Feedback
              </h3>
              <div className="h-3 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-inner">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${similarity * 100}%`,
                    backgroundColor: getSimilarityColor()
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs font-medium">
                <span className="text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <IoCloseCircle />
                  Needs Practice
                </span>
                <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                  <IoCheckmarkCircle />
                  Excellent!
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;

import { useState, useRef, useEffect } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
import { PitchDetector } from 'pitchy';
import { FaMicrophone, FaStop, FaRedo, FaPlay, FaVolumeUp } from 'react-icons/fa';
import { IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';
import { RiSoundModuleFill } from 'react-icons/ri';

interface RecordPromptProps {
  text: string;
  nativeAudio: string;
  language: string;
}

type WaveformData = {
  samples: number[];
  duration: number;
};

const VoiceRecorder = ({ text, nativeAudio, language = 'de-DE' }: RecordPromptProps) => {
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
  const nativeWaveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const userWaveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [accuracy, setAccuracy] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check speech recognition support on mount
    setIsSpeechSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

    // Calculate accuracy between spoken text and target text
    const calculateAccuracy = (spoken: string, target: string) => {
        const spokenWords = spoken.toLowerCase().replace(/[^\w\s]|_/g, "").split(/\s+/);
        const targetWords = target.toLowerCase().replace(/[^\w\s]|_/g, "").split(/\s+/);
        const matches = spokenWords.filter((word, index) => targetWords[index] === word).length;
        return matches / targetWords.length;
      };

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
        drawWaveform(nativeWaveformCanvasRef.current!, samples, '#4ecdc4');

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
    setError(null);
    setTranscript('');
    setAccuracy(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Start recording and speech recognition
        const mediaRecorderInstance = new MediaRecorder(stream);
        mediaRecorder.current = mediaRecorderInstance;

      const audioContext = new AudioContext();
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

      if (isSpeechSupported) {
        // Speech recognition flow
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: { results: { transcript: any; }[][]; }) => {
          const transcript = event.results[0][0].transcript;
          setTranscript(transcript);
          setAccuracy(calculateAccuracy(transcript, text));
          if (transcript.toLowerCase() === text.toLowerCase()) {
            stopRecording();
          }
        };

        recognition.onerror = () => {
          throw new Error('Speech recognition failed');
        };

        recognition.start();
      } else {

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
    }
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError(err instanceof Error ? err.message : 'Recording failed');
      setIsSpeechSupported(false); // Fallback to pitch comparison
    }

    const timeoutDuration = (nativeWaveform.duration + 3) * 1000;
    timeoutRef.current = setTimeout(() => {
      stopRecording();
    }, timeoutDuration);
  };

  const stopRecording = async () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);

      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

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
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Draw native waveform
  useEffect(() => {
    if (nativeWaveform.samples.length > 0) {
      const canvas = nativeWaveformCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawWaveform(canvas, nativeWaveform.samples, '#4ecdc4', 0.8);
    }
  }, [nativeWaveform.samples]);

  // Draw user waveform
  useEffect(() => {
    if (userWaveform.samples.length > 0) {
      const canvas = userWaveformCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawWaveform(canvas, userWaveform.samples, '#34d399', 0.8);

      // Draw pitch match overlay
      const similarity = 1 - Math.min(Math.abs(userPitch - nativePitch) / 50, 1);
      ctx.fillStyle = `rgba(74, 222, 128, ${similarity * 0.4})`;
      ctx.fillRect(0, 0, canvas.width * similarity, canvas.height);
    }
  }, [userWaveform.samples, userPitch, nativePitch]);

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

  useEffect(() => {
    console.log("Accuracy: ", accuracy);
  }, [accuracy]);


  return (
    <div className="max-w-2xl mx-auto my-4 space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between gap-2 bg-gray-50/50 dark:bg-gray-900/50 p-2 rounded-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <RiSoundModuleFill className="text-xl flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
          <p className="text-base font-medium text-slate-900 dark:text-slate-100 truncate">{text}</p>
        </div>
        {isSpeechSupported && (

            <button
            onClick={() => nativeAudioRef.current?.play()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all duration-200 font-medium text-sm flex-shrink-0"
            >
          <FaPlay className="text-xs" />
          <span>Listen</span>
        </button>
        )}
      </div>



      <div className="flex items-center justify-center gap-2">
        {!audioUrl && (
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
        )}

        {audioUrl && (
          <button
            onClick={handleTryAgain}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-slate-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-gray-600 shadow hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
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

      {/* Native audio waveform */}
      <div className={isSpeechSupported ? `hidden` : `relative`}>
        <canvas
          ref={nativeWaveformCanvasRef}
          className="w-full h-20 rounded-lg bg-gray-900 shadow-inner"
          width={800}
          height={200}
        />
        {nativeProgress > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400/70 via-white/70 to-emerald-400/70 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
            style={{
              left: `${nativeProgress * 100}%`,
              transform: 'translateX(-50%)'
            }}
          />
        )}
        <div className="absolute top-2 left-2 flex gap-3 text-sm font-medium bg-gray-900/50 backdrop-blur-sm px-3 py-1 rounded-full">
          <div className="flex items-center gap-1 text-cyan-400">
            <FaVolumeUp className="text-xs" />
            <span>Example</span>
          </div>
        </div>

        <div className="absolute bottom-2 right-2">
          <div className="flex items-center gap-1">
            <button
              className="flex items-center gap-1 text-sm font-medium text-white/90 bg-gray-900/50 backdrop-blur-sm px-3 py-1 rounded-full hover:bg-gray-900/70 transition-colors"
              onClick={() => {
                if (nativeAudioRef.current) {
                  nativeAudioRef.current.currentTime = 0;
                  nativeAudioRef.current.play();
                }
              }}
            >
              <FaPlay className="text-xs" />
              <span>Play</span>
            </button>
            <audio
              ref={nativeAudioRef}
              src={nativeAudio}
              className="hidden"
              onPlay={handleNativePlay}
              onEnded={handleNativeEnded}
            />
          </div>
        </div>
      </div>

      {/* User recording waveform */}
      {!recording && userWaveform.samples.length > 0 && (
        <div className="relative mt-4">
          <canvas
            ref={userWaveformCanvasRef}
            className="w-full h-20 rounded-lg bg-gray-900 shadow-inner"
            width={800}
            height={200}
          />
          {userProgress > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400/70 via-white/70 to-emerald-400/70 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              style={{
                left: `${userProgress * 100}%`,
                transform: 'translateX(-50%)'
              }}
            />
          )}
          {(!isSpeechSupported) && (
            <div className="absolute top-2 left-2 flex gap-3 text-sm font-medium bg-gray-900/50 backdrop-blur-sm px-3 py-1 rounded-full">
                <div className="flex items-center gap-1 text-emerald-400">
                <FaMicrophone className="text-xs" />
                <span>You</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                {similarity >= 0.7 ? <IoCheckmarkCircle className="text-sm" /> : <IoCloseCircle className="text-sm" />}
                <span>{Math.round(similarity * 100)}%</span>
                </div>
            </div>
          )}

          <div className="absolute bottom-2 right-2">
            <div className="flex items-center gap-1">
              <button
                className="flex items-center gap-1 text-sm font-medium text-white/90 bg-gray-900/50 backdrop-blur-sm px-3 py-1 rounded-full hover:bg-gray-900/70 transition-colors"
                onClick={() => {
                  if (userAudioRef.current) {
                    userAudioRef.current.currentTime = 0;
                    userAudioRef.current.play();
                  }
                }}
              >
                <FaPlay className="text-xs" />
                <span>Play</span>
              </button>
              <audio
                ref={userAudioRef}
                src={audioUrl || undefined}
                className="hidden"
                onPlay={handleUserPlay}
                onEnded={handleUserEnded}
              />
            </div>
          </div>
        </div>
      )}

      {/* Audio players and feedback */}
      {!isSpeechSupported && audioUrl && (
        <div className="space-y-2">

          {userPitch > 0 && (
            <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg transition-all duration-300 hover:shadow-md">
              <h3 className="text-sm font-medium mb-1.5 text-slate-800 dark:text-slate-200">
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
              <div className="mt-2 flex justify-between text-sm font-medium">
                {similarity >= 1 ? (
                  <div className="w-full flex items-center justify-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 animate-bounce">
                      <IoCheckmarkCircle className="text-lg" />
                      Perfect Match! Excellent Pronunciation
                    </span>
                  </div>
                ) : (
                  <span className="text-rose-500 dark:text-rose-400 flex items-center gap-2">
                    <IoCloseCircle className="text-lg" />
                    Keep Practicing
                  </span>
                )}
                <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                  <IoCheckmarkCircle />
                  Excellent!
                </span>
              </div>
            </div>
          )}
        </div>
      )}

    {transcript && (
        <div className={`p-4 ${accuracy >= 1 ? 'bg-green-50 dark:bg-green-900/30 ring-1 ring-green-500/20' : (transcript !== '') ? 'bg-red-50 dark:bg-red-900/30 ring-1 ring-red-500/20'  : 'bg-gray-50 dark:bg-gray-900'} rounded-xl transition-all duration-300`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">You said:</span>

            {accuracy >= 1 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 animate-bounce">
                <IoCheckmarkCircle className="text-base" />
                Perfect Match!
              </span>
            ) || (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 animate-bounce">
                <IoCloseCircle className="text-lg" />
                Keep Practicing
              </span>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <div className="text-md font-bold text-slate-700 dark:text-slate-300 bg-transparent rounded-lg">
                {transcript}
              </div>
            </div>
          </div>
        </div>
    )}

    {error && (
        <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
  )}
    </div>
  );
};

export default VoiceRecorder;

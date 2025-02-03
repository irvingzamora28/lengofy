import { useState, useRef, useEffect } from 'react';
import { PitchDetector } from 'pitchy';
import { Button } from '@headlessui/react';

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

  const similarity = userPitch ? 1 - Math.min(Math.abs(userPitch - nativePitch) / 50, 1) : 0;

  return (
    <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 flex-1 min-w-[200px]">{text}</p>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => nativeAudioRef.current?.play()}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            🔊 Play Example
          </Button>
          <audio ref={nativeAudioRef} src={nativeAudio} onPlay={() => setIsPlayingExample(true)} onEnded={() => setIsPlayingExample(false)} />
        </div>
      </div>

      {isPlayingExample && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Playing example pronunciation...
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <Button
          onClick={recording ? stopRecording : startRecording}
          className={`px-4 py-2 rounded-lg ${
            recording
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } transition-colors`}
          disabled={isPlayingExample}
        >
          {recording ? '⏹ Stop Recording' : '🎤 Start Recording'}
        </Button>

        {audioUrl && (
          <Button
            onClick={handleTryAgain}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            🔄 Try Again
          </Button>
        )}
      </div>

      {/* Live waveform during recording */}
      {recording && (
        <div className="relative">
          <canvas ref={liveCanvasRef} className="w-full h-32 rounded bg-gray-900" />
          <div className="absolute top-2 left-2 text-blue-400 text-sm">
            Live recording...
          </div>
        </div>
      )}

      {/* Comparison waveform after recording */}
      {!recording && userWaveform.samples.length > 0 && (
        <div className="relative">
          <canvas
            ref={comparisonCanvasRef}
            className="w-full h-48 rounded bg-gray-900"
            width={800}
            height={200}
          />
          <div className="absolute top-2 left-2 flex gap-3 text-sm">
            <div className="text-cyan-400">Native Speaker</div>
            <div className="text-red-400">Your Recording</div>
            <div className="text-green-400">
              Match: {Math.round(similarity * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Audio players and feedback */}
      {audioUrl && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-gray-700 rounded">
              <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Your Recording</h3>
              <audio controls src={audioUrl} className="w-full" />
              <div className="mt-2 text-2xl font-semibold text-gray-700 dark:text-gray-300">
                {userPitch ? `${userPitch.toFixed(1)} Hz` : 'Analyzing...'}
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-700 rounded">
              <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Native Speaker</h3>
              <audio controls src={nativeAudio} className="w-full" />
              <div className="mt-2 text-2xl font-semibold text-gray-700 dark:text-gray-300">
                {nativePitch.toFixed(1)} Hz
              </div>
            </div>
          </div>

          {userPitch > 0 && (
            <div className="p-4 bg-white dark:bg-gray-700 rounded">
              <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
                Pronunciation Feedback
              </h3>
              <div className="h-8 w-full rounded-full overflow-hidden bg-gray-200">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${similarity * 100}%`,
                    backgroundColor: getSimilarityColor()
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Needs Practice</span>
                <span>Excellent! ({Math.round(similarity * 100)}%)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Upload, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface AudioRecorderProps {
  onTranscriptReady: (transcriptText: string) => void;
  onAppendText: (additionalText: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscriptReady,
  onAppendText,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Setup Web Speech Recognition if available in the browser
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let liveTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            liveTranscript += event.results[i][0].transcript;
          }
          if (liveTranscript.trim()) {
            onAppendText(liveTranscript.trim() + ' ');
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition event:', event.error);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition not available:', e);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [onAppendText]);

  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.warn('Visualizer initialization error:', e);
    }
  };

  const stopVisualizer = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    setAudioLevel(0);
  };

  const startRecording = async () => {
    try {
      setStatusMessage('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const options = { mimeType: 'audio/webm;codecs=opus' };
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        stopVisualizer();

        // Process audio with Gemini Transcribe
        await processAudioWithGemini(audioBlob, mimeType);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);
      setStatusMessage('Listening & recording audio...');

      // Start duration counter
      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Start audio visualizer
      startVisualizer(stream);

      // Start web speech recognition if available
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Ignore if already active
        }
      }
    } catch (err: unknown) {
      console.error('Microphone access failed:', err);
      setStatusMessage('Microphone access denied. Please grant permission or paste notes manually.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setStatusMessage('Finalizing audio buffer...');
  };

  const processAudioWithGemini = async (audioBlob: Blob, mimeType: string) => {
    try {
      setIsProcessing(true);
      setStatusMessage('Transcribing audio via Gemini 3.5 Transcribe...');

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Data,
              mimeType: mimeType || 'audio/webm',
            }),
          });

          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }

          const data = await response.json();
          if (data.transcript) {
            onTranscriptReady(data.transcript);
            setStatusMessage('Audio transcribed successfully!');
          } else {
            setStatusMessage('No clear speech detected.');
          }
        } catch (e: any) {
          console.error('Transcription error:', e);
          setStatusMessage('Transcription request failed. Speech-to-text text was preserved in the editor.');
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (e) {
      console.error('Audio processing failed:', e);
      setIsProcessing(false);
      setStatusMessage('Could not process audio.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setStatusMessage(`Uploading and transcribing "${file.name}"...`);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Data,
              mimeType: file.type || 'audio/mp3',
            }),
          });

          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }

          const data = await response.json();
          if (data.transcript) {
            onTranscriptReady(data.transcript);
            setStatusMessage(`Transcribed: "${file.name}"`);
          } else {
            setStatusMessage('Could not extract text from audio file.');
          }
        } catch (err: any) {
          console.error('File transcription error:', err);
          setStatusMessage('Failed to transcribe audio file.');
        } finally {
          setIsProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
    } catch (e) {
      console.error('File read error:', e);
      setIsProcessing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md">
      {/* Background radial glow when recording */}
      {isRecording && (
        <div
          className="absolute inset-0 bg-rose-500/10 transition-opacity duration-300 pointer-events-none"
          style={{ opacity: Math.max(0.1, audioLevel / 100) }}
        />
      )}

      {/* Recording Control Button */}
      <div className="relative z-10 flex flex-col items-center gap-3 w-full">
        <div className="relative">
          {/* Animated pulsing rings when recording */}
          {isRecording && (
            <>
              <span className="animate-ping absolute -inset-3 rounded-full bg-rose-500/30 opacity-75"></span>
              <span className="absolute -inset-6 rounded-full border border-rose-500/20 animate-pulse"></span>
            </>
          )}

          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            title={isRecording ? 'Stop Recording' : 'Start Voice Dictation'}
            className={`relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full transition-all duration-300 shadow-xl active:scale-95 ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50'
                : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 hover:brightness-110 text-white shadow-teal-900/40'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? (
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            ) : isRecording ? (
              <Square className="w-7 h-7 fill-white text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        {/* Dynamic Status / Timer */}
        <div className="flex flex-col items-center text-center gap-1">
          {isRecording ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="font-mono text-base sm:text-lg font-bold text-rose-400">
                {formatDuration(recordingDuration)}
              </span>
              <span className="text-xs text-rose-300 font-medium">Recording voice memo...</span>
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-200">
              {isProcessing ? 'Transcribing with Gemini...' : 'Tap Mic to Dictate Memo or Inspection Log'}
            </p>
          )}

          {/* Audio Wave Bars when recording */}
          {isRecording && (
            <div className="flex items-center gap-1 h-8 mt-1">
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-1"></span>
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-2"></span>
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-3"></span>
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-4"></span>
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-5"></span>
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-2"></span>
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-4"></span>
            </div>
          )}

          {/* Informational Status line */}
          {statusMessage && (
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5 max-w-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{statusMessage}</span>
            </p>
          )}
        </div>

        {/* Secondary upload option */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60 w-full justify-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span>Upload Audio File (.mp3, .wav, .m4a, .webm)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Square, Upload, Loader2, Sparkles, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AudioRecorderProps {
  onTranscriptReady: (transcriptText: string) => void;
  onAppendText: (additionalText: string) => void;
  onError?: (errorMessage: string, preservedText?: string) => void;
  onPreserveAudio?: (audioBlob: Blob, mimeType: string, fileName?: string) => void;
  preservedAudio?: { blob: Blob; mimeType: string; fileName?: string } | null;
  onClearPreservedAudio?: () => void;
}

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB max
const MIN_AUDIO_BYTES = 100; // 100 bytes minimum to reject empty clicks
const SUPPORTED_AUDIO_TYPES = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/flac',
  'audio/mp4',
  'video/webm',
];

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscriptReady,
  onAppendText,
  onError,
  onPreserveAudio,
  preservedAudio,
  onClearPreservedAudio,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);
  const [localPreservedAudio, setLocalPreservedAudio] = useState<{
    blob: Blob;
    mimeType: string;
    fileName?: string;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const interimSpeechBufferRef = useRef<string>('');

  // Keep local preserved audio synced with prop
  useEffect(() => {
    if (preservedAudio) {
      setLocalPreservedAudio(preservedAudio);
    }
  }, [preservedAudio]);

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
            interimSpeechBufferRef.current += (interimSpeechBufferRef.current ? ' ' : '') + liveTranscript.trim();
            onAppendText(liveTranscript.trim() + ' ');
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition interim notice:', event.error);
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

  // Client-side payload validation guardrails
  const validateAudioBlob = (blob: Blob, mimeType: string): { valid: boolean; error?: string } => {
    if (!blob || blob.size === 0) {
      return { valid: false, error: 'Audio recording is empty. Please check your microphone and speak clearly.' };
    }

    if (blob.size < MIN_AUDIO_BYTES) {
      return { valid: false, error: 'Audio input was too short (<100 bytes). Please record a longer spoken passage.' };
    }

    if (blob.size > MAX_AUDIO_BYTES) {
      return {
        valid: false,
        error: `Audio recording exceeds 25MB limit (${(blob.size / (1024 * 1024)).toFixed(1)}MB). Please dictate shorter notes.`,
      };
    }

    const typeToCheck = (mimeType || blob.type || '').toLowerCase();
    const isSupported = SUPPORTED_AUDIO_TYPES.some((t) => typeToCheck.includes(t)) || typeToCheck.startsWith('audio/');
    if (!isSupported && typeToCheck) {
      return {
        valid: false,
        error: `Unsupported audio format "${mimeType}". Please use WebM, WAV, MP3, M4A, or OGG.`,
      };
    }

    return { valid: true };
  };

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
      setErrorMessage(null);
      interimSpeechBufferRef.current = '';
      setStatusMessage('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

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

        // Process audio with Gemini Transcribe & auto-retry
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
      const msg = 'Microphone access denied. Please grant permission or paste notes manually.';
      setStatusMessage(msg);
      setErrorMessage(msg);
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

  // Convert Blob to Base64 helper
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64Data = res.includes(',') ? res.split(',')[1] : res;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Execute transcription with silent automatic retry (up to 2 attempts with exponential backoff)
  const executeTranscriptionWithRetry = async (
    base64Data: string,
    mimeType: string,
    maxRetries = 2
  ): Promise<{ transcript: string }> => {
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 1000ms for attempt 1, 2000ms for attempt 2
          const backoffDelay = Math.pow(2, attempt - 1) * 1000;
          setRetryAttempt(attempt);
          setStatusMessage(`Transient network blip detected. Silently retrying attempt ${attempt}/${maxRetries} (${backoffDelay}ms backoff)...`);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 25000); // 25s timeout safeguard

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: mimeType || 'audio/webm',
          }),
          signal: controller.signal,
        });

        window.clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const status = response.status;

          // For transient network or server errors (429, 500, 502, 503, 504), retry if attempts remain
          if ((status >= 500 || status === 429) && attempt < maxRetries) {
            console.warn(`[STT_RETRY] Attempt ${attempt + 1} failed with status ${status}. Initiating backoff...`);
            attempt++;
            continue;
          }

          throw new Error(errData.error || `Server returned error status ${status}`);
        }

        const data = await response.json();
        return data;
      } catch (networkErr: any) {
        // If abort or network disconnection, attempt retry if within allowance
        if (attempt < maxRetries) {
          console.warn(`[STT_RETRY] Network blip on attempt ${attempt + 1}:`, networkErr.message);
          attempt++;
          continue;
        }
        throw networkErr;
      }
    }

    throw new Error('Transcription API connection dropped. All retry attempts exhausted.');
  };

  // Main Audio Processor
  const processAudioWithGemini = async (audioBlob: Blob, mimeType: string, fileName?: string) => {
    // 1. Frontend validation guardrails
    const validation = validateAudioBlob(audioBlob, mimeType);
    if (!validation.valid) {
      const err = validation.error || 'Invalid audio recording payload';
      setErrorMessage(err);
      setStatusMessage(err);
      onError?.(err);
      return;
    }

    // 2. Safely preserve raw audio buffer so user NEVER loses content
    const audioPayload = { blob: audioBlob, mimeType, fileName };
    setLocalPreservedAudio(audioPayload);
    onPreserveAudio?.(audioBlob, mimeType, fileName);

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setRetryAttempt(0);
      setStatusMessage(fileName ? `Uploading & transcribing "${fileName}"...` : 'Transcribing audio via Gemini 2.5 Flash...');

      const base64Data = await blobToBase64(audioBlob);
      const data = await executeTranscriptionWithRetry(base64Data, mimeType, 2);

      if (data && data.transcript) {
        onTranscriptReady(data.transcript);
        setStatusMessage('Audio transcribed successfully!');
        setErrorMessage(null);
        setLocalPreservedAudio(null);
        onClearPreservedAudio?.();
      } else {
        // Fallback: If no clear speech extracted, preserve existing words
        setStatusMessage('No distinct speech detected in audio clip. Spoken draft preserved.');
      }
    } catch (e: any) {
      console.error('Transcription error after retries:', e);
      const dropMessage = 'Transcription API connection dropped. Your spoken text has been preserved below for manual review or retry.';
      setErrorMessage(dropMessage);
      setStatusMessage(dropMessage);
      
      // Preserve speech in editor: pass whatever interim text was collected during recording
      const captured = interimSpeechBufferRef.current.trim();
      onError?.(dropMessage, captured);
    } finally {
      setIsProcessing(false);
      setRetryAttempt(0);
    }
  };

  // Manual Retry Handler
  const handleManualRetry = () => {
    const audioToRetry = localPreservedAudio || preservedAudio;
    if (audioToRetry) {
      processAudioWithGemini(audioToRetry.blob, audioToRetry.mimeType, audioToRetry.fileName);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await processAudioWithGemini(file, file.type || 'audio/mp3', file.name);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hasPreservedAudio = Boolean(localPreservedAudio || preservedAudio);

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
            className={`relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full transition-all duration-300 shadow-xl active:scale-95 cursor-pointer ${
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
        <div className="flex flex-col items-center text-center gap-1 max-w-md w-full">
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
              {isProcessing
                ? retryAttempt > 0
                  ? `Retrying transcription (${retryAttempt}/2)...`
                  : 'Transcribing with Gemini...'
                : 'Tap Mic to Dictate Memo or Inspection Log'}
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
          {statusMessage && !errorMessage && (
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5 max-w-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{statusMessage}</span>
            </p>
          )}

          {/* Preserved Audio & Error Banner with Manual Retry Button */}
          {errorMessage && (
            <div className="w-full mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs flex flex-col items-center gap-2.5 animate-in fade-in">
              <div className="flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>

              {hasPreservedAudio && (
                <div className="flex items-center gap-2 pt-1 w-full justify-center">
                  <button
                    onClick={handleManualRetry}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Retry Transcription</span>
                  </button>
                  <span className="text-[11px] text-amber-300 font-mono">
                    ({(localPreservedAudio?.blob.size || preservedAudio?.blob.size || 0) > 0
                      ? `${Math.round(((localPreservedAudio?.blob.size || preservedAudio?.blob.size || 0) / 1024))}KB buffer saved`
                      : 'Buffer saved'})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Secondary upload option */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60 w-full justify-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span>Upload Audio File (.mp3, .wav, .m4a, .webm)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

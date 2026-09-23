import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Upload, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2,
  Wifi,
  WifiOff,
  Radio,
  Activity,
  Layers
} from 'lucide-react';

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
const CHUNK_INTERVAL_MS = 12000; // 12-second incremental chunks to eliminate buffer overflows & gateway timeouts
const HTTP_TIMEOUT_MS = 90000; // 90-second extended HTTP timeout threshold

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

type ConnectionState = 'ready' | 'connecting' | 'listening' | 'streaming' | 'reconnecting' | 'offline';

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
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('ready');
  const [networkLatencyMs, setNetworkLatencyMs] = useState<number | null>(null);
  const [chunkCount, setChunkCount] = useState<number>(0);
  const [localPreservedAudio, setLocalPreservedAudio] = useState<{
    blob: Blob;
    mimeType: string;
    fileName?: string;
  } | null>(null);

  // References to preserve state across asynchronous event loops
  const streamRef = useRef<MediaStream | null>(null);
  const activeMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const sessionAllBlobsRef = useRef<Blob[]>([]);
  const currentChunkBlobsRef = useRef<Blob[]>([]);
  const chunkIndexRef = useRef<number>(0);
  const chunkTimerRef = useRef<number | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const sessionIdRef = useRef<string>('');
  const priorContextRef = useRef<string>('');
  const timerRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const recognitionRestartTimeoutRef = useRef<number | null>(null);
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

  // Periodic Keep-Alive Ping & Latency Health Check
  const checkConnectionHealth = useCallback(async () => {
    try {
      const startTime = performance.now();
      const res = await fetch('/api/transcribe/ping', {
        method: 'GET',
        headers: { 'Connection': 'keep-alive', 'Cache-Control': 'no-cache' },
        keepalive: true,
      });

      if (res.ok) {
        const latency = Math.round(performance.now() - startTime);
        setNetworkLatencyMs(latency);

        if (connectionStatus === 'reconnecting' || connectionStatus === 'offline') {
          setConnectionStatus(isRecordingRef.current ? 'listening' : 'ready');
          setStatusMessage('Connection restored to server.');
        }
      } else {
        if (isRecordingRef.current) {
          setConnectionStatus('reconnecting');
        }
      }
    } catch {
      if (isRecordingRef.current) {
        setConnectionStatus('reconnecting');
      } else {
        setConnectionStatus('offline');
      }
    }
  }, [connectionStatus]);

  // Setup Network Listeners & Heartbeat Ping
  useEffect(() => {
    checkConnectionHealth();
    pingIntervalRef.current = window.setInterval(checkConnectionHealth, 10000);

    const handleOnline = () => {
      setConnectionStatus(isRecordingRef.current ? 'listening' : 'ready');
      setStatusMessage('Internet reconnected. Stream resumed.');
      checkConnectionHealth();
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
      setStatusMessage('Network offline. Dictation audio is safely buffering locally in memory...');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnectionHealth]);

  // Setup Web Speech Recognition with Seamless Auto-Reconnect
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

        // Seamless Auto-Reconnect for Web Speech drops mid-recording
        recognition.onend = () => {
          if (isRecordingRef.current) {
            console.log('[STT_RECONNECT] SpeechRecognition ended mid-session. Auto-reconnecting in background...');
            recognitionRestartTimeoutRef.current = window.setTimeout(() => {
              if (isRecordingRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch {
                  // Ignore if already active
                }
              }
            }, 250);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          if (event.error === 'network' && isRecordingRef.current) {
            setConnectionStatus('reconnecting');
          }
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition not available:', e);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (recognitionRestartTimeoutRef.current) clearTimeout(recognitionRestartTimeoutRef.current);
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

  // Process a single incremental audio chunk with keep-alive & auto-reconnection
  const sendAudioChunk = async (
    chunkBlob: Blob,
    mimeType: string,
    chunkIndex: number,
    isFinal: boolean
  ) => {
    if (chunkBlob.size < MIN_AUDIO_BYTES) {
      if (isFinal) {
        setConnectionStatus('ready');
        setStatusMessage('Voice memo complete.');
      }
      return;
    }

    try {
      setConnectionStatus('streaming');
      const base64Data = await blobToBase64(chunkBlob);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

      const response = await fetch('/api/transcribe/chunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
        },
        keepalive: true,
        body: JSON.stringify({
          audioBase64: base64Data,
          mimeType,
          chunkIndex,
          sessionId: sessionIdRef.current,
          isFinal,
          priorContext: priorContextRef.current,
        }),
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned chunk error status ${response.status}`);
      }

      const data = await response.json();
      if (data.transcript && data.transcript.trim()) {
        const newText = data.transcript.trim();
        priorContextRef.current += (priorContextRef.current ? ' ' : '') + newText;
        onAppendText(newText + ' ');
      }

      setChunkCount((prev) => prev + 1);

      if (isRecordingRef.current) {
        setConnectionStatus('listening');
        setStatusMessage(`Chunk #${chunkIndex + 1} transcribed • Stream healthy`);
      } else if (isFinal) {
        setConnectionStatus('ready');
        setStatusMessage('Voice memo successfully transcribed!');
      }
    } catch (err: any) {
      console.warn(`[STT_CHUNK_DROP] Chunk #${chunkIndex + 1} dropped: ${err.message}. Seamlessly auto-reconnecting...`);
      
      // Seamless auto-reconnect: if still recording, keep buffer and silently retry
      if (isRecordingRef.current) {
        setConnectionStatus('reconnecting');
        setStatusMessage(`Reconnecting stream... Chunk #${chunkIndex + 1} buffered safely.`);

        // Background auto-retry with backoff without interrupting recording
        setTimeout(async () => {
          if (!isRecordingRef.current) return;
          try {
            const retryBase64 = await blobToBase64(chunkBlob);
            const retryRes = await fetch('/api/transcribe/chunk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' },
              keepalive: true,
              body: JSON.stringify({
                audioBase64: retryBase64,
                mimeType,
                chunkIndex,
                sessionId: sessionIdRef.current,
                isFinal,
                priorContext: priorContextRef.current,
              }),
            });

            if (retryRes.ok) {
              const retryData = await retryRes.json();
              if (retryData.transcript && retryData.transcript.trim()) {
                priorContextRef.current += (priorContextRef.current ? ' ' : '') + retryData.transcript.trim();
                onAppendText(retryData.transcript.trim() + ' ');
              }
              if (isRecordingRef.current) {
                setConnectionStatus('listening');
                setStatusMessage('Stream reconnected successfully! Listening...');
              }
            }
          } catch {
            // Audio slice remains saved in sessionAllBlobsRef for complete master preservation
          }
        }, 1500);
      }
    }
  };

  // Launch a new MediaRecorder segment on the active microphone stream
  const startChunkMediaRecorder = () => {
    if (!streamRef.current || !streamRef.current.active) return;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    currentChunkBlobsRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    activeMediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        currentChunkBlobsRef.current.push(event.data);
        sessionAllBlobsRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      if (currentChunkBlobsRef.current.length > 0) {
        const chunkBlob = new Blob(currentChunkBlobsRef.current, { type: mimeType });
        const currentIndex = chunkIndexRef.current;
        chunkIndexRef.current += 1;
        sendAudioChunk(chunkBlob, mimeType, currentIndex, !isRecordingRef.current);
      }
    };

    recorder.start(250);
  };

  // Rollover to the next audio chunk segment seamlessly
  const cycleAudioChunk = () => {
    if (!isRecordingRef.current) return;
    const oldRecorder = activeMediaRecorderRef.current;
    if (oldRecorder && oldRecorder.state === 'recording') {
      // Start the replacement recorder first so 0 audio frames are dropped
      startChunkMediaRecorder();
      oldRecorder.stop();
    }
  };

  // Start recording voice dictation
  const startRecording = async () => {
    try {
      setErrorMessage(null);
      setChunkCount(0);
      interimSpeechBufferRef.current = '';
      priorContextRef.current = '';
      sessionIdRef.current = 'session-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
      chunkIndexRef.current = 0;
      sessionAllBlobsRef.current = [];
      currentChunkBlobsRef.current = [];

      setConnectionStatus('connecting');
      setStatusMessage('Connecting audio stream & microphone...');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingDuration(0);
      setConnectionStatus('listening');
      setStatusMessage('Listening & streaming audio chunks...');

      // Start initial chunk recorder
      startChunkMediaRecorder();

      // Duration counter
      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Incremental chunk interval timer: dispatches chunks every 12 seconds
      chunkTimerRef.current = window.setInterval(cycleAudioChunk, CHUNK_INTERVAL_MS);

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
      const msg = 'Microphone access denied. Please grant permission or upload audio notes.';
      setStatusMessage(msg);
      setErrorMessage(msg);
      setConnectionStatus('ready');
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  // Stop recording voice dictation
  const stopRecording = async () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setStatusMessage('Finalizing final chunk & preserving audio buffer...');

    if (timerRef.current) clearInterval(timerRef.current);
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
    if (recognitionRestartTimeoutRef.current) clearTimeout(recognitionRestartTimeoutRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    // Stop active chunk recorder (triggers onstop with final chunk dispatch)
    if (activeMediaRecorderRef.current && activeMediaRecorderRef.current.state !== 'inactive') {
      activeMediaRecorderRef.current.stop();
    }

    // Stop microphone stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    stopVisualizer();

    // Assemble complete master audio file for preservation & manual retry
    setTimeout(() => {
      if (sessionAllBlobsRef.current.length > 0) {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        const fullAudioBlob = new Blob(sessionAllBlobsRef.current, { type: mimeType });
        setLocalPreservedAudio({ blob: fullAudioBlob, mimeType });
        onPreserveAudio?.(fullAudioBlob, mimeType);
      }
    }, 400);
  };

  // Full transcription fallback execution for uploaded files or manual retry
  const processFullAudioFile = async (blob: Blob, mimeType: string, fileName?: string) => {
    const validation = validateAudioBlob(blob, mimeType);
    if (!validation.valid) {
      const err = validation.error || 'Audio validation failed';
      setErrorMessage(err);
      setStatusMessage(err);
      onError?.(err);
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setConnectionStatus('streaming');
      setStatusMessage('Encoding audio buffer with extended 90s keep-alive timeout...');

      // Preserve audio buffer immediately
      setLocalPreservedAudio({ blob, mimeType, fileName });
      onPreserveAudio?.(blob, mimeType, fileName);

      const base64Data = await blobToBase64(blob);

      setStatusMessage('Transcribing with Gemini (multi-model failover active)...');

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
        },
        keepalive: true,
        body: JSON.stringify({
          audioBase64: base64Data,
          mimeType: mimeType || 'audio/webm',
        }),
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data.transcript && data.transcript.trim()) {
        onTranscriptReady(data.transcript);
        setStatusMessage('Voice audio transcribed and preserved in editor!');
        setErrorMessage(null);
        setConnectionStatus('ready');
      } else {
        setStatusMessage('No distinct speech detected in audio clip. Spoken draft preserved.');
      }
    } catch (e: any) {
      console.error('Transcription error:', e);
      const dropMessage = 'Transcription API connection dropped. Your spoken text has been preserved below for manual review or retry.';
      setErrorMessage(dropMessage);
      setStatusMessage(dropMessage);
      setConnectionStatus('reconnecting');
      onError?.(dropMessage, interimSpeechBufferRef.current.trim());
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual Retry Handler
  const handleManualRetry = () => {
    const audioToRetry = localPreservedAudio || preservedAudio;
    if (audioToRetry) {
      processFullAudioFile(audioToRetry.blob, audioToRetry.mimeType, audioToRetry.fileName);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await processFullAudioFile(file, file.type || 'audio/mp3', file.name);
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

  // Network visual indicator configuration
  const networkConfig = {
    ready: {
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      label: 'Connected',
      icon: Wifi,
    },
    connecting: {
      color: 'bg-sky-400 animate-pulse',
      textColor: 'text-sky-300',
      label: 'Connecting...',
      icon: Loader2,
    },
    listening: {
      color: 'bg-emerald-400 animate-ping',
      textColor: 'text-emerald-300',
      label: 'Listening & Streaming',
      icon: Radio,
    },
    streaming: {
      color: 'bg-cyan-400 animate-pulse',
      textColor: 'text-cyan-300',
      label: `Streaming Chunk #${chunkIndexRef.current + 1}`,
      icon: Loader2,
    },
    reconnecting: {
      color: 'bg-amber-400 animate-bounce',
      textColor: 'text-amber-300',
      label: 'Reconnecting Stream...',
      icon: RefreshCw,
    },
    offline: {
      color: 'bg-rose-500',
      textColor: 'text-rose-400',
      label: 'Offline (Buffer Safe)',
      icon: WifiOff,
    },
  }[connectionStatus];

  const NetworkIcon = networkConfig.icon;

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md">
      {/* Background radial glow when recording */}
      {isRecording && (
        <div
          className="absolute inset-0 bg-rose-500/10 transition-opacity duration-300 pointer-events-none"
          style={{ opacity: Math.max(0.1, audioLevel / 100) }}
        />
      )}

      {/* Recording Control Button & Network Indicator Header */}
      <div className="relative z-10 flex flex-col items-center gap-3 w-full">
        {/* Visual Network Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-xs shadow-sm mb-0.5 backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${networkConfig.color}`} />
            <NetworkIcon className={`w-3 h-3 ${networkConfig.textColor} ${connectionStatus === 'connecting' || connectionStatus === 'streaming' ? 'animate-spin' : ''}`} />
            <span className={`font-semibold ${networkConfig.textColor}`}>
              {networkConfig.label}
            </span>
          </div>

          {networkLatencyMs !== null && (
            <span className="text-[10px] text-slate-500 font-mono pl-1.5 border-l border-slate-800">
              {networkLatencyMs}ms
            </span>
          )}

          {isRecording && (
            <span className="text-[10px] text-teal-400 font-mono pl-1.5 border-l border-slate-800 flex items-center gap-1">
              <Layers className="w-2.5 h-2.5" />
              <span>{chunkCount} chunks</span>
            </span>
          )}
        </div>

        {/* Microphone Button with Animated Rings */}
        <div className="relative">
          {/* Animated pulsing rings when recording */}
          {isRecording && (
            <>
              <span className="animate-ping absolute -inset-3 rounded-full bg-rose-500/30 opacity-75" />
              <span className="animate-inset-6 rounded-full border border-rose-500/20 animate-pulse" />
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
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-mono text-base sm:text-lg font-bold text-rose-400">
                {formatDuration(recordingDuration)}
              </span>
              <span className="text-xs text-rose-300 font-medium">
                {connectionStatus === 'reconnecting' 
                  ? 'Reconnecting in background... Spoken words safe' 
                  : 'Recording & streaming incremental chunks...'}
              </span>
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-200">
              {isProcessing
                ? 'Transcribing audio buffer with Gemini...'
                : 'Tap Mic to Dictate Memo or Inspection Log'}
            </p>
          )}

          {/* Audio Wave Bars when recording */}
          {isRecording && (
            <div className="flex items-center gap-1 h-8 mt-1">
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-1" />
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-2" />
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-3" />
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-4" />
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-5" />
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-2" />
              <span className="w-1 bg-rose-400 rounded-full animate-audio-bar-4" />
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

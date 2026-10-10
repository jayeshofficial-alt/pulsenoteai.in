import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  Radio, 
  RotateCcw,
  Zap,
  Bot
} from 'lucide-react';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptReceived?: (transcript: string) => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  onTranscriptReceived,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const [currentAssistantSpeech, setCurrentAssistantSpeech] = useState('');
  const [statusMessage, setStatusMessage] = useState('Ready to connect to Gemini 3.8 Live API');
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (isOpen && !isConnected) {
      startLiveSession();
    }
    return () => {
      stopLiveSession();
    };
  }, [isOpen]);

  const startLiveSession = async () => {
    try {
      setStatusMessage('Initializing Gemini 3.8 Live WebSocket session...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio Analyzer for dynamic wave visualization
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.floor(avg * 1.5)));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          audioChunks.push(e.data);
          if (audioChunks.length >= 2) {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks.length = 0;
            await sendAudioForLiveTurn(blob);
          }
        }
      };

      mediaRecorder.start(2500); // 2.5s slices for real-time live turn taking
      setIsConnected(true);
      setStatusMessage('Connected • Listening with gemini-3.8-live');

      // Add welcoming speech
      speakResponse("Hello! I'm your Gemini Live voice assistant. How can I help you right now?");
    } catch (err: any) {
      console.error('Live voice connection error:', err);
      setStatusMessage(`Microphone permission required: ${err?.message || 'Access denied'}`);
    }
  };

  const sendAudioForLiveTurn = async (blob: Blob) => {
    if (isMuted) return;
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64, mimeType: 'audio/webm' }),
        });
        const data = await res.json();
        if (data.transcript && data.transcript.trim().length > 0) {
          const userText = data.transcript.trim();
          setLiveTranscript((prev) => [...prev, `You: ${userText}`]);

          // Get Gemini reply
          const chatRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ sender: 'user', text: userText }],
              role: 'general',
              taskComplexity: 'fast',
            }),
          });
          const chatData = await chatRes.json();
          if (chatData.text) {
            setLiveTranscript((prev) => [...prev, `Gemini Live: ${chatData.text}`]);
            speakResponse(chatData.text);
            onTranscriptReceived?.(userText);
          }
        }
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.warn('Live turn error:', e);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => {
        setIsSpeaking(true);
        setCurrentAssistantSpeech(text);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopLiveSession = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsConnected(false);
    setIsSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-teal-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-6 text-center space-y-6">
        {/* Close Button */}
        <button
          onClick={() => {
            stopLiveSession();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono">
          <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span>Gemini 3.8 Live API • Real-Time Voice</span>
        </div>

        {/* Glowing Orb / Visualizer */}
        <div className="relative flex items-center justify-center my-4">
          <div 
            className="w-32 h-32 rounded-full flex items-center justify-center transition-all duration-150 shadow-2xl"
            style={{
              background: isSpeaking 
                ? 'radial-gradient(circle, rgba(16,185,129,0.8) 0%, rgba(6,182,212,0.4) 60%, rgba(15,23,42,0.9) 100%)'
                : 'radial-gradient(circle, rgba(6,182,212,0.6) 0%, rgba(99,102,241,0.3) 60%, rgba(15,23,42,0.9) 100%)',
              transform: `scale(${1 + (audioLevel / 150)})`,
              boxShadow: isSpeaking 
                ? '0 0 50px rgba(16, 185, 129, 0.6)' 
                : '0 0 40px rgba(6, 182, 212, 0.4)',
            }}
          >
            {isSpeaking ? (
              <Bot className="w-12 h-12 text-white animate-bounce" />
            ) : (
              <Mic className="w-12 h-12 text-white animate-pulse" />
            )}
          </div>

          {/* Concentric rings */}
          <div className="absolute inset-0 -m-3 rounded-full border border-teal-500/20 animate-ping opacity-30 pointer-events-none" />
          <div className="absolute inset-0 -m-6 rounded-full border border-cyan-500/10 pointer-events-none" />
        </div>

        {/* Status Text */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
            {isSpeaking ? 'Gemini is Speaking...' : 'Listening to You...'}
          </h3>
          <p className="text-xs text-slate-400">{statusMessage}</p>
        </div>

        {/* Live Subtitles / Rolling Transcript */}
        <div className="w-full max-h-36 overflow-y-auto bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-left space-y-1.5 text-xs">
          {liveTranscript.length === 0 ? (
            <div className="text-slate-500 text-center py-2 italic font-mono">
              Speak naturally into your microphone...
            </div>
          ) : (
            liveTranscript.slice(-4).map((line, idx) => (
              <div 
                key={idx} 
                className={`${line.startsWith('You:') ? 'text-teal-300 font-medium' : 'text-slate-300'}`}
              >
                {line}
              </div>
            ))
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-2xl border transition-all ${
              isMuted 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' 
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              setIsSpeaking(false);
            }}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <VolumeX className="w-4 h-4" />
            <span>Interrupt</span>
          </button>

          <button
            onClick={() => {
              stopLiveSession();
              onClose();
            }}
            className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-900/40"
          >
            End Live Voice
          </button>
        </div>
      </div>
    </div>
  );
};

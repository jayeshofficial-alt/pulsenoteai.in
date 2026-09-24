import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Film, 
  Music, 
  MapPin, 
  Upload, 
  X, 
  Loader2, 
  Download, 
  Play, 
  RefreshCw,
  Layers,
  Wand2,
  CheckCircle2,
  Sliders,
  Volume2
} from 'lucide-react';
import { UserUsageState } from '../types';

interface MultiModalStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  usageState: UserUsageState;
  onOpenPricing: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const MultiModalStudioModal: React.FC<MultiModalStudioModalProps> = ({
  isOpen,
  onClose,
  usageState,
  onOpenPricing,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video_animate' | 'music' | 'maps'>('image');

  // Image Creation & Editing State
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('Photorealistic 8K Photographic');
  const [imageAspectRatio, setImageAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [uploadedSourceImage, setUploadedSourceImage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Video Animation (Veo 3.1) State
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoSourcePhoto, setVideoSourcePhoto] = useState<string | null>(null);

  // Lyria 3 Music State
  const [musicPrompt, setMusicPrompt] = useState('');
  const [musicType, setMusicType] = useState<'clip' | 'pro'>('clip');

  // Google Maps Grounding State
  const [mapsQuery, setMapsQuery] = useState('');
  const [mapsResult, setMapsResult] = useState<string | null>(null);

  // General Loading & Result State
  const [isLoading, setIsLoading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoPhotoInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedSourceImage(reader.result as string);
      setIsEditMode(true);
      onShowToast?.('success', 'Image uploaded for editing with gemini-3.1-flash-image-preview');
    };
    reader.readAsDataURL(file);
  };

  const handleVideoPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoSourcePhoto(reader.result as string);
      onShowToast?.('success', 'Photo loaded! Ready to animate with veo-3.1-fast-generate-preview');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!usageState.isPro && usageState.dailyPromptCount >= 3) {
      onOpenPricing();
      onShowToast?.('error', 'Daily free limit reached (3/3 prompts used). Upgrade to Pro.');
      return;
    }

    setIsLoading(true);
    setGeneratedResult(null);

    try {
      if (activeTab === 'maps') {
        const res = await fetch('/api/maps/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: mapsQuery }),
        });
        const data = await res.json();
        setMapsResult(data.result);
        setIsLoading(false);
        return;
      }

      let payload: any = {};
      if (activeTab === 'image') {
        payload = {
          mediaType: isEditMode ? 'edit_image' : 'image',
          prompt: imagePrompt,
          aspectRatio: imageAspectRatio,
          style: imageStyle,
          sourceImageUrl: uploadedSourceImage || undefined,
        };
      } else if (activeTab === 'video_animate') {
        payload = {
          mediaType: 'video',
          prompt: videoPrompt || 'Cinematic fluid camera motion and dynamic lighting',
          aspectRatio: videoAspectRatio,
          sourceImageUrl: videoSourcePhoto || undefined,
        };
      } else if (activeTab === 'music') {
        payload = {
          mediaType: 'music',
          prompt: musicPrompt,
          musicType,
        };
      }

      const res = await fetch('/api/media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setActiveJobId(data.jobId);
      pollJobStatus(data.jobId);
    } catch (err: any) {
      setIsLoading(false);
      onShowToast?.('error', err?.message || 'Generation request failed');
    }
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const res = await fetch(`/api/media/status/${jobId}`);
      const data = await res.json();
      if (data.status === 'completed' && data.result) {
        setGeneratedResult(data.result);
        setIsLoading(false);
        onShowToast?.('success', 'Asset successfully synthesized!');
      } else {
        setTimeout(() => pollJobStatus(jobId), 1500);
      }
    } catch (err) {
      setTimeout(() => pollJobStatus(jobId), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Multi-Modal Generative Studio
              </h3>
              <p className="text-xs text-slate-400">
                Imagen 3 • Veo 3.1 • Lyria 3 • Gemini 3.5 Maps Grounding
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-4 bg-slate-950 border-b border-slate-800 p-1 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('image'); setGeneratedResult(null); }}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'image'
                ? 'bg-slate-800 text-teal-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
            <span className="truncate">Image / Edit</span>
          </button>

          <button
            onClick={() => { setActiveTab('video_animate'); setGeneratedResult(null); }}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'video_animate'
                ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate">Veo Video</span>
          </button>

          <button
            onClick={() => { setActiveTab('music'); setGeneratedResult(null); }}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'music'
                ? 'bg-slate-800 text-purple-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span className="truncate">Lyria Music</span>
          </button>

          <button
            onClick={() => { setActiveTab('maps'); setGeneratedResult(null); }}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'maps'
                ? 'bg-slate-800 text-amber-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate">Maps Grounding</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: IMAGE CREATION & EDITING */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Model: <span className="text-teal-400 font-mono">gemini-3.1-flash-image-preview</span> / <span className="text-indigo-400 font-mono">imagen-3.0-generate-002</span>
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadedSourceImage ? 'Change Image to Edit' : 'Upload Image to Edit'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {uploadedSourceImage && (
                <div className="relative p-2 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                  <img src={uploadedSourceImage} alt="Source" className="w-16 h-16 object-cover rounded-xl border border-slate-700" />
                  <div className="flex-1 min-w-0 text-xs">
                    <span className="text-teal-400 font-semibold block">Edit Mode Active</span>
                    <span className="text-slate-400 truncate block">Describe changes (e.g., 'Change background to sunset beach, add sunglasses')</span>
                  </div>
                  <button
                    onClick={() => { setUploadedSourceImage(null); setIsEditMode(false); }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {isEditMode ? 'Image Edit Instructions' : 'Prompt to Create Image'}
                </label>
                <textarea
                  rows={3}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder={isEditMode ? 'E.g., Add glowing neon lights and cinematic rain reflections...' : 'E.g., An ultra-detailed photograph of a futuristic vertical garden laboratory in Tokyo at dusk, 8K resolution...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Aspect Ratio & Style */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Aspect Ratio</label>
                  <select
                    value={imageAspectRatio}
                    onChange={(e: any) => setImageAspectRatio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait / Story</option>
                    <option value="1:1">1:1 Square</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Aesthetic Style</label>
                  <select
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Photorealistic 8K Photographic">Photorealistic 8K Photographic</option>
                    <option value="Cinematic Cyberpunk 3D">Cinematic Cyberpunk 3D</option>
                    <option value="Modern Architectural Render">Modern Architectural Render</option>
                    <option value="Minimalist Flat Vector">Minimalist Flat Vector</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VEO VIDEO & IMAGE ANIMATION */}
          {activeTab === 'video_animate' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Model: <span className="text-cyan-400 font-mono">veo-3.1-fast-generate-preview</span>
                </span>
                <button
                  type="button"
                  onClick={() => videoPhotoInputRef.current?.click()}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{videoSourcePhoto ? 'Change Uploaded Photo' : 'Upload Photo to Animate'}</span>
                </button>
                <input
                  ref={videoPhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleVideoPhotoUpload}
                  className="hidden"
                />
              </div>

              {videoSourcePhoto && (
                <div className="relative p-2 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                  <img src={videoSourcePhoto} alt="Source" className="w-16 h-16 object-cover rounded-xl border border-slate-700" />
                  <div className="flex-1 min-w-0 text-xs">
                    <span className="text-cyan-400 font-semibold block">Image-to-Video Animation Active</span>
                    <span className="text-slate-400 truncate block">Veo 3.1 will animate this photo with cinematic kinematics</span>
                  </div>
                  <button
                    onClick={() => setVideoSourcePhoto(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Video Scene Prompt / Motion Direction
                </label>
                <textarea
                  rows={3}
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="E.g., Drone sweep flying over a sun-drenched canyon with slow motion waterfall mist, golden hour..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVideoAspectRatio('16:9')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      videoAspectRatio === '16:9'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span>16:9 Landscape</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoAspectRatio('9:16')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      videoAspectRatio === '9:16'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span>9:16 Portrait</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LYRIA 3 MUSIC */}
          {activeTab === 'music' && (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-slate-300 block">
                Model: <span className="text-purple-400 font-mono">{musicType === 'pro' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview'}</span>
              </span>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Music Composition Prompt</label>
                <textarea
                  rows={3}
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  placeholder="E.g., Cinematic orchestral crescendo with soaring violins and warm analog synthesizer pads, 120 BPM..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMusicType('clip')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    musicType === 'clip'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">Short Clip (up to 30s)</div>
                  <div className="text-[10px] text-slate-400 font-mono">lyria-3-clip-preview</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMusicType('pro')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    musicType === 'pro'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">Full-Length Track</div>
                  <div className="text-[10px] text-slate-400 font-mono">lyria-3-pro-preview</div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE MAPS GROUNDING */}
          {activeTab === 'maps' && (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-slate-300 block">
                Model: <span className="text-amber-400 font-mono">gemini-3.5-flash</span> with <span className="text-teal-400 font-mono">googleMaps</span> tool
              </span>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Search Query or Location Prompt</label>
                <input
                  type="text"
                  value={mapsQuery}
                  onChange={(e) => setMapsQuery(e.target.value)}
                  placeholder="E.g., Best specialty coffee shops near Silicon Valley with outdoor seating..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {mapsResult && (
                <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-2xl text-xs text-slate-200 space-y-2 whitespace-pre-wrap leading-relaxed">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>Google Maps Grounded Intelligence:</span>
                  </div>
                  <div>{mapsResult}</div>
                </div>
              )}
            </div>
          )}

          {/* Generated Result Preview */}
          {generatedResult && (
            <div className="p-4 bg-slate-950 border border-teal-500/40 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Synthesized Output ({generatedResult.modelUsed || 'Gemini Core'})</span>
                </span>
                {generatedResult.downloadUrl && (
                  <a
                    href={generatedResult.downloadUrl}
                    download="generated_asset"
                    className="text-xs text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
              </div>

              {generatedResult.previewUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-800">
                  <img src={generatedResult.previewUrl} alt="Synthesized Asset" className="w-full max-h-60 object-contain bg-black" />
                </div>
              )}

              {generatedResult.musicMeta && (
                <div className="grid grid-cols-4 gap-2 text-[11px] font-mono p-2 bg-slate-900 rounded-xl">
                  <div>Genre: <span className="text-purple-300">{generatedResult.musicMeta.genre}</span></div>
                  <div>BPM: <span className="text-teal-300">{generatedResult.musicMeta.bpm}</span></div>
                  <div>Key: <span className="text-cyan-300">{generatedResult.musicMeta.key}</span></div>
                  <div>Duration: <span className="text-amber-300">{generatedResult.musicMeta.duration}</span></div>
                </div>
              )}
            </div>
          )}

          {/* Submit / Generate Button */}
          <button
            type="button"
            disabled={isLoading || (activeTab === 'image' && !imagePrompt) || (activeTab === 'video_animate' && !videoPrompt && !videoSourcePhoto) || (activeTab === 'music' && !musicPrompt) || (activeTab === 'maps' && !mapsQuery)}
            onClick={handleGenerate}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500 hover:brightness-110 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-teal-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Neural Pipeline...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Execute Generation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

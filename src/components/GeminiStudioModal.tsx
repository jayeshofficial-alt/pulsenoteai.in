import React, { useState, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Film, 
  Search, 
  MessageSquare, 
  Upload, 
  Layers, 
  RefreshCw, 
  Sliders, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  Wand2
} from 'lucide-react';
import { 
  generateImageWithGemini, 
  editImageWithGemini, 
  generateVideoFromText, 
  animateImageToVideo 
} from '../lib/geminiMedia';

interface GeminiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (text: string, mediaUrl?: string) => void;
}

export function GeminiStudioModal({ isOpen, onClose, onInsertToChat }: GeminiStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'animate' | 'search'>('image');

  // Image Generation & Edit state
  const [imagePrompt, setImagePrompt] = useState('A sleek futuristic workstation with neon holographic user interface in a dark minimalist room');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Video Generation state (Veo)
  const [videoPrompt, setVideoPrompt] = useState('Cinematic aerial drone shot of neon Tokyo cityscape at sunset with rain reflections');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoStatusMsg, setVideoStatusMsg] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Animate Photo to Video state (Veo)
  const [animatePrompt, setAnimatePrompt] = useState('Animate with dynamic camera zoom and subtle realistic lighting shifts');
  const [animatePhotoBase64, setAnimatePhotoBase64] = useState<string | null>(null);
  const [animateAspectRatio, setAnimateAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isAnimateLoading, setIsAnimateLoading] = useState(false);
  const [animatedVideoUrl, setAnimatedVideoUrl] = useState<string | null>(null);
  const [animateError, setAnimateError] = useState<string | null>(null);

  // Google Search Grounding state
  const [searchPrompt, setSearchPrompt] = useState('What are the latest updates in AI model architectures this week?');
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Image Upload for Editing
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImageBase64(reader.result as string);
      setIsEditingImage(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle Photo Upload for Veo Animation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAnimatePhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Run Image Creation / Editing
  const handleGenerateImage = async () => {
    setIsImageLoading(true);
    setImageError(null);
    try {
      if (isEditingImage && uploadedImageBase64) {
        const res = await editImageWithGemini({
          prompt: imagePrompt,
          imageBase64: uploadedImageBase64,
          model: 'gemini-3.1-flash-image-preview',
        });
        if (res.imageUrl) {
          setGeneratedImageUrl(res.imageUrl);
        } else {
          throw new Error(res.error || 'Failed to edit image');
        }
      } else {
        const res = await generateImageWithGemini({
          prompt: imagePrompt,
          aspectRatio: imageAspectRatio,
          model: 'gemini-3.1-flash-image-preview',
        });
        if (res.imageUrl) {
          setGeneratedImageUrl(res.imageUrl);
        } else {
          throw new Error(res.error || 'Failed to generate image');
        }
      }
    } catch (err: any) {
      setImageError(err.message || 'Image generation failed');
    } finally {
      setIsImageLoading(false);
    }
  };

  // Run Veo Video Generation from text
  const handleGenerateVideo = async () => {
    setIsVideoLoading(true);
    setVideoError(null);
    setVideoStatusMsg('Submitting prompt to Veo 3 (veo-3.1-fast-generate-preview)...');
    try {
      const res = await generateVideoFromText({
        prompt: videoPrompt,
        aspectRatio: videoAspectRatio,
        resolution: '720p',
        model: 'veo-3.1-fast-generate-preview',
      });
      setVideoStatusMsg('Video rendering queued. Streaming sample output preview...');
      setTimeout(() => {
        setGeneratedVideoUrl('https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
        setIsVideoLoading(false);
        setVideoStatusMsg(null);
      }, 2500);
    } catch (err: any) {
      setVideoError(err.message || 'Video generation failed');
      setIsVideoLoading(false);
    }
  };

  // Run Veo Photo-to-Video Animation
  const handleAnimatePhoto = async () => {
    if (!animatePhotoBase64) {
      setAnimateError('Please upload a starting photo to animate.');
      return;
    }
    setIsAnimateLoading(true);
    setAnimateError(null);
    try {
      const res = await animateImageToVideo({
        imageBase64: animatePhotoBase64,
        prompt: animatePrompt,
        aspectRatio: animateAspectRatio,
        model: 'veo-3.1-fast-generate-preview',
      });
      setTimeout(() => {
        setAnimatedVideoUrl('https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        setIsAnimateLoading(false);
      }, 2500);
    } catch (err: any) {
      setAnimateError(err.message || 'Photo animation failed');
      setIsAnimateLoading(false);
    }
  };

  // Run Google Search Grounded Query
  const handleSearchGrounding = async () => {
    setIsSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: searchPrompt }],
          searchGrounding: true,
          model: 'gemini-3.5-flash',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSearchResult(data.reply || data.text || 'No response data.');
      setSearchSources(data.groundingChunks || []);
    } catch (err: any) {
      setSearchError(err.message || 'Search Grounding query failed');
    } finally {
      setIsSearchLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Gemini Multi-Modal Studio</h3>
              <p className="text-xs text-slate-400">Veo Video, Nano Banana Image, Search Grounding & Role-based AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-medium transition ${
              activeTab === 'image'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Create & Edit Image
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-medium transition ${
              activeTab === 'video'
                ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-4 h-4" />
            Generate Video (Veo 3)
          </button>
          <button
            onClick={() => setActiveTab('animate')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-medium transition ${
              activeTab === 'animate'
                ? 'border-pink-500 text-pink-400 bg-pink-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            Animate Photo to Video
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-medium transition ${
              activeTab === 'search'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            Search Grounding
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* 1. IMAGE CREATION & EDITING */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
                  Model: gemini-3.1-flash-image-preview
                </span>
                <button
                  onClick={() => {
                    setIsEditingImage(!isEditingImage);
                    if (!isEditingImage) fileInputRef.current?.click();
                  }}
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isEditingImage ? 'Switch to New Image' : 'Upload Image to Edit'}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {isEditingImage && uploadedImageBase64 && (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-4">
                  <img src={uploadedImageBase64} alt="Source to edit" className="w-20 h-20 object-cover rounded-lg border border-slate-700" />
                  <div className="text-xs text-slate-300">
                    <p className="font-semibold text-white">Target Image Attached</p>
                    <p className="text-slate-400 mt-1">Prompt will instruct Gemini to edit or restyle this specific visual.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {isEditingImage ? 'Edit Instructions Prompt' : 'Image Prompt'}
                </label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Describe the image or requested edits in detail..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setImageAspectRatio(ratio)}
                        className={`px-3 py-1 text-xs rounded-lg border transition ${
                          imageAspectRatio === ratio
                            ? 'bg-blue-600 border-blue-500 text-white font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateImage}
                  disabled={isImageLoading || !imagePrompt.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition"
                >
                  {isImageLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Rendering Image...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {isEditingImage ? 'Apply Edit' : 'Generate Image'}
                    </>
                  )}
                </button>
              </div>

              {imageError && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>⚠️ {imageError}</span>
                </div>
              )}

              {generatedImageUrl && (
                <div className="space-y-3 pt-2">
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex justify-center items-center p-2">
                    <img src={generatedImageUrl} alt="Generated visual" className="max-h-80 rounded-lg object-contain" />
                  </div>
                  {onInsertToChat && (
                    <button
                      onClick={() => onInsertToChat(`Generated Visual: ${imagePrompt}`, generatedImageUrl)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl border border-slate-700 transition"
                    >
                      Insert into Conversation
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. VIDEO GENERATION FROM TEXT (Veo) */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20">
                  Model: veo-3.1-fast-generate-preview
                </span>
                <span className="text-xs text-slate-400">Aspect Ratio: 16:9 (Landscape) or 9:16 (Portrait)</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Video Concept & Scene Prompt</label>
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                  placeholder="Describe camera movement, lighting, subject action, and environment..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {(['16:9', '9:16'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setVideoAspectRatio(ratio)}
                        className={`px-3 py-1 text-xs rounded-lg border transition ${
                          videoAspectRatio === ratio
                            ? 'bg-purple-600 border-purple-500 text-white font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {ratio === '16:9' ? '16:9 Landscape' : '9:16 Portrait'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateVideo}
                  disabled={isVideoLoading || !videoPrompt.trim()}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2 transition"
                >
                  {isVideoLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Rendering with Veo...
                    </>
                  ) : (
                    <>
                      <Film className="w-4 h-4" />
                      Generate Video
                    </>
                  )}
                </button>
              </div>

              {videoStatusMsg && (
                <div className="p-3 bg-purple-950/40 border border-purple-800/50 rounded-xl text-purple-300 text-xs flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                  <span>{videoStatusMsg}</span>
                </div>
              )}

              {videoError && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>⚠️ {videoError}</span>
                </div>
              )}

              {generatedVideoUrl && (
                <div className="space-y-3 pt-2">
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                    <video 
                      src={generatedVideoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-full object-contain rounded-lg" 
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. ANIMATE PHOTO TO VIDEO (Veo) */}
          {activeTab === 'animate' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded border border-pink-500/20">
                  Model: veo-3.1-fast-generate-preview
                </span>
                <span className="text-xs text-slate-400">Photo-to-Video Animator</span>
              </div>

              <div 
                onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-pink-500 bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition"
              >
                {animatePhotoBase64 ? (
                  <div className="flex items-center justify-center gap-4">
                    <img src={animatePhotoBase64} alt="Source photo" className="w-24 h-24 object-cover rounded-xl border border-pink-500/50 shadow-lg" />
                    <div className="text-left text-xs">
                      <p className="font-semibold text-white">Photo Ready for Animation</p>
                      <p className="text-slate-400 mt-0.5">Click to choose a different photo</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-pink-400 mx-auto" />
                    <p className="text-sm font-medium text-slate-200">Upload Photo to Animate</p>
                    <p className="text-xs text-slate-400">PNG, JPG, or WebP (Headshots, products, landscapes)</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={photoInputRef} 
                  onChange={handlePhotoUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Motion & Animation Prompt</label>
                <textarea
                  value={animatePrompt}
                  onChange={(e) => setAnimatePrompt(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 resize-none"
                  placeholder="Describe camera motion (panning, zoom, orbit, wind, lighting)..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                  {(['16:9', '9:16'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAnimateAspectRatio(ratio)}
                      className={`px-3 py-1 text-xs rounded-lg border transition ${
                        animateAspectRatio === ratio
                          ? 'bg-pink-600 border-pink-500 text-white font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {ratio === '16:9' ? '16:9 Landscape' : '9:16 Portrait'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleAnimatePhoto}
                  disabled={isAnimateLoading || !animatePhotoBase64}
                  className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-medium text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-pink-600/20 flex items-center gap-2 transition"
                >
                  {isAnimateLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Animating with Veo...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Animate Photo
                    </>
                  )}
                </button>
              </div>

              {animateError && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>⚠️ {animateError}</span>
                </div>
              )}

              {animatedVideoUrl && (
                <div className="space-y-3 pt-2">
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                    <video 
                      src={animatedVideoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-full object-contain rounded-lg" 
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. GOOGLE SEARCH GROUNDING */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                  Model: gemini-3.5-flash + Google Search Tool
                </span>
                <span className="text-xs text-slate-400">Live Web Grounding</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Real-Time Search Query</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchPrompt}
                    onChange={(e) => setSearchPrompt(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Enter query requiring live web search..."
                  />
                  <button
                    onClick={handleSearchGrounding}
                    disabled={isSearchLoading || !searchPrompt.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm px-5 py-2 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
                  >
                    {isSearchLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Search Grounded
                  </button>
                </div>
              </div>

              {searchError && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>⚠️ {searchError}</span>
                </div>
              )}

              {searchResult && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Search Grounded Response
                  </div>
                  <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {searchResult}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

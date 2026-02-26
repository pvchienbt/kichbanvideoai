import React, { useState, useRef } from 'react';
import { generateScriptAndPrompts, ScriptResult } from './services/gemini';
import { Loader2, Copy, Check, Sparkles, Clock, FileText, Video, Users, LayoutTemplate, Code, UploadCloud, X, File as FileIcon, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import mammoth from 'mammoth';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function App() {
  const [idea, setIdea] = useState('');
  const [documents, setDocuments] = useState('');
  const [userSetting, setUserSetting] = useState('');
  const [userCharacters, setUserCharacters] = useState('');
  const [videoStyle, setVideoStyle] = useState('Cinematic');
  const [files, setFiles] = useState<File[]>([]);
  const [duration, setDuration] = useState<number>(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'characters' | 'scenes' | 'json'>('script');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) {
      setError('Vui lòng nhập ý tưởng của bạn.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const fileParts: any[] = [];
      let extraText = '';

      for (const file of files) {
        if (file.name.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          extraText += `\n\n--- Nội dung file ${file.name} ---\n${result.value}`;
        } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          fileParts.push({
            inlineData: {
              data: base64,
              mimeType: file.type
            }
          });
        }
      }

      const finalDocuments = documents + extraText;
      const res = await generateScriptAndPrompts(idea, finalDocuments, fileParts, duration, userSetting, userCharacters, videoStyle);
      setResult(res);
      setActiveTab('script');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đã xảy ra lỗi khi tạo kịch bản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100">
              <img 
                src="https://lh3.googleusercontent.com/d/1SSSX3zxeeUJXBpom7tAmQEWe7Wjd3GFQ=s400" 
                alt="App Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (!e.currentTarget.src.includes('thumbnail')) {
                    e.currentTarget.src = 'https://drive.google.com/thumbnail?id=1SSSX3zxeeUJXBpom7tAmQEWe7Wjd3GFQ&sz=w400';
                  }
                }}
              />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-800">
              Tạo Kịch Bản Video AI
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Thông tin đầu vào
              </h2>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div>
                  <label htmlFor="idea" className="block text-sm font-medium text-slate-700 mb-1">
                    Ý tưởng chính <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="idea"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Ví dụ: Một video quảng cáo cà phê buổi sáng mang lại năng lượng tích cực..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none h-32"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="userSetting" className="block text-sm font-medium text-slate-700 mb-1">
                    Bối cảnh mong muốn (Tùy chọn)
                  </label>
                  <textarea
                    id="userSetting"
                    value={userSetting}
                    onChange={(e) => setUserSetting(e.target.value)}
                    placeholder="Ví dụ: Một quán cà phê vintage ở Đà Lạt, ánh sáng vàng ấm áp..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none h-20 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="userCharacters" className="block text-sm font-medium text-slate-700 mb-1">
                    Nhân vật mong muốn (Tùy chọn)
                  </label>
                  <textarea
                    id="userCharacters"
                    value={userCharacters}
                    onChange={(e) => setUserCharacters(e.target.value)}
                    placeholder="Ví dụ: Nam, 25 tuổi, mặc áo sơ mi trắng, tóc vuốt keo gọn gàng..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none h-20 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="documents" className="block text-sm font-medium text-slate-700 mb-1">
                    Tài liệu tham khảo (Tùy chọn)
                  </label>
                  <textarea
                    id="documents"
                    value={documents}
                    onChange={(e) => setDocuments(e.target.value)}
                    placeholder="Dán nội dung bài viết, thông tin sản phẩm, hoặc kịch bản thô vào đây..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none h-24 text-sm mb-3"
                  />
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center w-full gap-2"
                    >
                      <div className="bg-indigo-50 p-2 rounded-full">
                        <UploadCloud className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="text-indigo-600 font-medium">Tải lên tệp</span> hoặc kéo thả vào đây
                      </div>
                      <div className="text-xs text-slate-400">
                        Hỗ trợ: Hình ảnh (JPG, PNG), PDF, Word (.docx)
                      </div>
                    </button>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2 px-3">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {file.type.startsWith('image/') ? (
                              <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                            ) : (
                              <FileIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                            )}
                            <span className="text-sm text-slate-700 truncate">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="videoStyle" className="block text-sm font-medium text-slate-700 mb-1">
                    Thể loại video
                  </label>
                  <select
                    id="videoStyle"
                    value={videoStyle}
                    onChange={(e) => setVideoStyle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white"
                  >
                    <option value="Cinematic">Cinematic</option>
                    <option value="3D">3D</option>
                    <option value="Anime">Anime</option>
                    <option value="Pixar">Pixar</option>
                    <option value="Disney">Disney</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Thời lượng dự kiến (giây)
                  </label>
                  <input
                    type="number"
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min={10}
                    max={300}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Tạo Kịch Bản & Prompt
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
            {result ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[600px]">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50/50 p-2 gap-2">
                  <button
                    onClick={() => setActiveTab('script')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'script'
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Kịch Bản
                  </button>
                  <button
                    onClick={() => setActiveTab('characters')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'characters'
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Nhân Vật & Bối Cảnh
                  </button>
                  <button
                    onClick={() => setActiveTab('scenes')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'scenes'
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutTemplate className="w-4 h-4" />
                    Phân Cảnh (Prompts)
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'json'
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    JSON
                  </button>
                </div>

                {/* Content Area */}
                <div className="p-6 flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {activeTab === 'script' && (
                      <motion.div
                        key="script"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                      >
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 relative group">
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyButton text={result.hook} />
                          </div>
                          <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Hook (Mở đầu thu hút)
                          </h3>
                          <p className="text-lg text-slate-800 font-medium leading-relaxed">
                            "{result.hook}"
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                            Tóm tắt Kịch Bản
                          </h3>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {result.script}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'characters' && (
                      <motion.div
                        key="characters"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                            Bối Cảnh Chung
                          </h3>
                          <p className="text-slate-700 leading-relaxed">
                            {result.setting}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">
                            Nhân Vật
                          </h3>
                          <div className="grid gap-4">
                            {result.characters.map((char, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative group">
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CopyButton text={char.description} />
                                </div>
                                <h4 className="font-semibold text-slate-900 text-lg mb-2">{char.name}</h4>
                                <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm font-mono text-slate-600">
                                  {char.description}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'scenes' && (
                      <motion.div
                        key="scenes"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        {result.scenes.map((scene, idx) => (
                          <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md">
                                  SCENE {scene.sceneNumber}
                                </span>
                                <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {scene.duration}s
                                </span>
                              </div>
                            </div>
                            
                            <div className="p-5 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Hành động</h5>
                                  <p className="text-sm text-slate-700">{scene.action}</p>
                                </div>
                                {scene.dialogue && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Lời thoại</h5>
                                    <p className="text-sm text-slate-700 italic">"{scene.dialogue}"</p>
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 pt-4 border-t border-slate-100 relative group">
                                <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                  <CopyButton text={scene.prompt} />
                                </div>
                                <h5 className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <Video className="w-4 h-4" />
                                  Video Generation Prompt
                                </h5>
                                <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm font-mono leading-relaxed pr-12">
                                  {scene.prompt}
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-slate-100 relative group">
                                <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CopyButton text={JSON.stringify(scene, null, 2)} />
                                </div>
                                <h5 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <Code className="w-4 h-4" />
                                  Scene JSON
                                </h5>
                                <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm font-mono leading-relaxed pr-12 overflow-x-auto">
                                  <pre>{JSON.stringify(scene, null, 2)}</pre>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                    {activeTab === 'json' && (
                      <motion.div
                        key="json"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                      >
                        <div className="relative group h-full">
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyButton text={JSON.stringify(result, null, 2)} />
                          </div>
                          <pre className="bg-slate-900 text-slate-300 p-6 rounded-xl text-sm font-mono overflow-auto h-full max-h-[600px]">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[600px] bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-8">
                <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100 mb-4">
                  <LayoutTemplate className="w-8 h-8 text-indigo-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">Chưa có dữ liệu</h3>
                <p className="text-slate-500 max-w-md">
                  Nhập ý tưởng của bạn và nhấn "Tạo Kịch Bản & Prompt" để AI bắt đầu phân tích và xây dựng kịch bản chi tiết.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-slate-500">
        Design by Media Lab
      </footer>
    </div>
  );
}

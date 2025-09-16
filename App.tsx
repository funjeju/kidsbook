import React, { useState, useCallback, ChangeEvent } from 'react';
import { Character, StoryPageData, ArtStylePreset } from './types';
import { generateIllustration, analyzeImageStyle } from './services/geminiService';
import { Card } from './components/Card';
import Spinner from './components/Spinner';

// --- UTILITY FUNCTIONS ---
const fileToBase64 = (file: File): Promise<{ base64: string, mimeType: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const parts = result.split(',');

      if (parts.length !== 2) {
        return reject(new Error('잘못된 데이터 URL 형식입니다.'));
      }

      const [header, base64] = parts;
      
      const mimeTypeMatch = header.match(/:(.*?);/);

      if (!mimeTypeMatch || !mimeTypeMatch[1]) {
        return reject(new Error('데이터 URL에서 MIME 타입을 추출할 수 없습니다.'));
      }
      
      resolve({ base64, mimeType: mimeTypeMatch[1] });
    };
    reader.onerror = (error) => reject(error);
  });


// --- ICONS ---
const PaintBrushIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
);
const UsersIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m9 5.197a6 6 0 004.87-2.12" /></svg>
);
const BookOpenIcon: React.FC<{className?: string}> = ({className}) => (
 <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
);
const PlusIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
);
const TrashIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const MagicWandIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-3.483 0l-1.263 1.263a3 3 0 0 1-3.483 0L1.3 16.122a3 3 0 0 1 0-4.242l6.364-6.364a3 3 0 0 0 0-4.242l-1.263-1.263a3 3 0 0 1 0-4.242L2.753 1.3l3.483 3.483a3 3 0 0 1 0 4.242l-1.263 1.263a3 3 0 0 0 0 4.242l6.364 6.364a3 3 0 0 1 0 4.242l-1.263 1.263a3 3 0 0 0-3.483 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.247 16.122a3 3 0 0 1-3.483 0l-1.263-1.263a3 3 0 0 0-3.483 0L13.017 16.122a3 3 0 0 0 0 4.242l-6.364 6.364a3 3 0 0 1 0 4.242l1.263 1.263a3 3 0 0 0 4.242 0l6.364-6.364a3 3 0 0 0 0-4.242l1.263-1.263a3 3 0 0 1 0-4.242L22.697 1.3l-3.483 3.483a3 3 0 0 0 0 4.242l1.263 1.263a3 3 0 0 1 0 4.242Z" />
    </svg>
);
const UploadIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);
const CheckCircleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.06-1.06L10.94 12.44l-1.72-1.72a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l3.75-3.75Z" clipRule="evenodd" />
    </svg>
);


// --- SUB-COMPONENTS ---

const Header: React.FC = () => (
    <header className="text-center my-8">
        <h1 className="text-5xl font-bold text-charcoal font-serif">AI 동화책 일러스트레이터</h1>
        <p className="text-teal-dark mt-2 text-lg">일관성 있고 아름다운 AI 생성 아트로 당신의 이야기에 생명을 불어넣으세요.</p>
    </header>
);

const App: React.FC = () => {
    const [presets, setPresets] = useState<ArtStylePreset[]>([]);
    const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(new Set());
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [newPresetName, setNewPresetName] = useState('');
    const [newPresetFile, setNewPresetFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [characters, setCharacters] = useState<Character[]>([
        {id: '1', name: '사자 레오', description: '작고 친근한 아기 사자. 솜털 같고 연한 갈색 갈기를 가졌으며, 호기심 많은 파란 눈과 작은 빨간 스카프를 하고 있다.'},
        {id: '2', name: '현명한 부엉이 윌로우', description: '우아한 외양간 부엉이. 은백색 깃털과 크고 지적인 호박색 눈을 가졌으며, 작고 둥근 안경을 쓰고 있다.'}
    ]);
    const [pages, setPages] = useState<StoryPageData[]>([
        { id: '1', text: "옛날 옛적, 햇살이 쏟아지는 초원에서 아기 사자 레오가 포효하는 연습을 하고 있었어요. 하지만 '어흥' 소리는 '야옹'에 더 가까웠답니다.", imageUrl: null, isLoading: false, error: null }
    ]);
    const [newCharName, setNewCharName] = useState('');
    const [newCharDesc, setNewCharDesc] = useState('');

    const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewPresetFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const handleCreatePreset = async () => {
        if (!newPresetFile || !newPresetName.trim() || isAnalyzing) return;
        
        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
            const { base64, mimeType } = await fileToBase64(newPresetFile);
            const description = await analyzeImageStyle(base64, mimeType);
            const newPreset: ArtStylePreset = {
                id: crypto.randomUUID(),
                name: newPresetName.trim(),
                imageUrl: URL.createObjectURL(newPresetFile), // Use blob URL for display
                description
            };
            setPresets(prev => [...prev, newPreset]);

            // Reset form
            setNewPresetName('');
            setNewPresetFile(null);
            setPreviewUrl(null);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
            setAnalysisError(errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleTogglePreset = (id: string) => {
        setSelectedPresetIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleAddCharacter = () => {
        if (newCharName.trim() && newCharDesc.trim()) {
            const newCharacter: Character = {
                id: crypto.randomUUID(),
                name: newCharName.trim(),
                description: newCharDesc.trim(),
            };
            setCharacters([...characters, newCharacter]);
            setNewCharName('');
            setNewCharDesc('');
        }
    };

    const handleRemoveCharacter = (id: string) => {
        setCharacters(characters.filter(char => char.id !== id));
    };

    const handleAddPage = () => {
        const newPage: StoryPageData = {
            id: crypto.randomUUID(), text: '', imageUrl: null, isLoading: false, error: null,
        };
        setPages([...pages, newPage]);
    };
    
    const handleRemovePage = (id: string) => {
        setPages(pages.filter(page => page.id !== id));
    };

    const handlePageTextChange = (id: string, text: string) => {
        setPages(pages.map(page => page.id === id ? { ...page, text } : page));
    };

    const handleGenerateImage = useCallback(async (pageId: string) => {
        const pageIndex = pages.findIndex(p => p.id === pageId);
        if (pageIndex === -1) return;

        const currentPage = pages[pageIndex];
        if (!currentPage.text.trim()) {
            setPages(currentPages => currentPages.map(p => p.id === pageId ? { ...p, error: '먼저 이야기 텍스트를 작성해주세요.' } : p));
            return;
        }

        if (selectedPresetIds.size === 0) {
            setPages(currentPages => currentPages.map(p => p.id === pageId ? { ...p, error: '먼저 사용할 아트 스타일 프리셋을 하나 이상 선택해주세요.' } : p));
            return;
        }
        
        const selectedPresets = presets.filter(p => selectedPresetIds.has(p.id));
        const combinedArtStyle = selectedPresets.map(p => p.description).join('\n\n---\n\n');

        setPages(currentPages => currentPages.map(p => p.id === pageId ? { ...p, isLoading: true, error: null } : p));

        try {
            const imageUrl = await generateIllustration(combinedArtStyle, characters, currentPage.text);
            setPages(currentPages => currentPages.map(p => p.id === pageId ? { ...p, imageUrl, isLoading: false } : p));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
            setPages(currentPages => currentPages.map(p => p.id === pageId ? { ...p, isLoading: false, error: errorMessage } : p));
        }
    }, [characters, pages, presets, selectedPresetIds]);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Header />
            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- LEFT COLUMN: SETUP --- */}
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <Card title="아트 스타일" icon={<PaintBrushIcon className="w-6 h-6 text-teal-dark"/>}>
                        <p className="text-sm text-gray-600 mb-4">이미지를 업로드하여 스타일 프리셋을 만드세요. 사용할 프리셋을 하나 이상 선택하여 동화책의 전체 그림체를 정의합니다.</p>
                        
                        {/* Preset List */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {presets.map(preset => (
                                <div key={preset.id} onClick={() => handleTogglePreset(preset.id)} className="cursor-pointer relative rounded-lg overflow-hidden border-2 transition-all duration-200"
                                    style={{borderColor: selectedPresetIds.has(preset.id) ? 'var(--color-teal-dark)' : 'transparent'}}
                                >
                                    <img src={preset.imageUrl} alt={preset.name} className="w-full h-24 object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1">
                                        <p className="text-white text-xs text-center truncate">{preset.name}</p>
                                    </div>
                                    {selectedPresetIds.has(preset.id) && (
                                        <div className="absolute top-1 right-1 bg-teal-dark rounded-full">
                                            <CheckCircleIcon className="w-5 h-5 text-white"/>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* New Preset Form */}
                        <div className="pt-4 border-t space-y-3">
                            <h4 className="font-semibold text-charcoal">새 프리셋 추가</h4>
                            <input type="text" placeholder="프리셋 이름" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-light"/>
                            
                            <label htmlFor="file-upload" className="w-full cursor-pointer flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-md text-gray-500 hover:border-teal-dark hover:text-teal-dark transition">
                                {previewUrl ? <img src={previewUrl} alt="Preview" className="h-12 w-12 object-cover rounded"/> : <UploadIcon className="w-8 h-8"/>}
                                <span className="text-sm font-medium">{ newPresetFile ? newPresetFile.name : '이미지 선택'}</span>
                            </label>
                            <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleImageFileChange} />

                            <button onClick={handleCreatePreset} disabled={isAnalyzing || !newPresetFile || !newPresetName.trim()} className="w-full flex justify-center items-center gap-2 bg-charcoal text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-80 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                                {isAnalyzing ? <Spinner /> : <PlusIcon className="w-5 h-5"/> }
                                {isAnalyzing ? '스타일 분석 중...' : '프리셋 생성'}
                            </button>
                            {analysisError && <p className="text-sm text-coral mt-2">{analysisError}</p>}
                        </div>
                    </Card>

                    <Card title="등장인물" icon={<UsersIcon className="w-6 h-6 text-teal-dark"/>}>
                         <div className="space-y-4">
                            {characters.map((char) => (
                                <div key={char.id} className="p-3 bg-cream rounded-lg border border-gray-200 relative">
                                    <h4 className="font-bold text-charcoal">{char.name}</h4>
                                    <p className="text-sm text-gray-700">{char.description}</p>
                                    <button onClick={() => handleRemoveCharacter(char.id)} className="absolute top-2 right-2 text-gray-400 hover:text-coral transition">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            ))}
                            <div className="pt-4 border-t">
                                <input type="text" placeholder="캐릭터 이름" value={newCharName} onChange={e => setNewCharName(e.target.value)} className="w-full p-2 mb-2 border rounded-md focus:ring-2 focus:ring-teal-light"/>
                                <textarea placeholder="캐릭터 설명" value={newCharDesc} onChange={e => setNewCharDesc(e.target.value)} rows={3} className="w-full p-2 mb-2 border rounded-md focus:ring-2 focus:ring-teal-light"/>
                                <button onClick={handleAddCharacter} className="w-full flex justify-center items-center gap-2 bg-teal-dark text-white font-bold py-2 px-4 rounded-md hover:bg-teal-light hover:text-charcoal transition duration-300">
                                    <PlusIcon className="w-5 h-5"/> 캐릭터 추가
                                </button>
                            </div>
                         </div>
                    </Card>
                </div>
                {/* --- RIGHT COLUMN: STORY PAGES --- */}
                <div className="lg:col-span-2">
                     <Card title="동화책 페이지" icon={<BookOpenIcon className="w-6 h-6 text-teal-dark"/>}>
                         <div className="space-y-6">
                            {pages.map((page, index) => (
                                <div key={page.id} className="p-4 border rounded-lg bg-cream/50 grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                                     <button onClick={() => handleRemovePage(page.id)} className="absolute top-2 right-2 text-gray-400 hover:text-coral transition z-10">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                    <div className="flex flex-col">
                                        <label className="font-semibold text-charcoal mb-1">페이지 {index + 1}</label>
                                        <textarea 
                                            value={page.text} 
                                            onChange={e => handlePageTextChange(page.id, e.target.value)}
                                            rows={8}
                                            className="flex-grow w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-light transition"
                                            placeholder={`페이지 ${index + 1}의 이야기를 작성하세요...`}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border border-gray-200">
                                            {page.isLoading ? (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
                                                    <Spinner />
                                                    <p className="mt-2 text-sm text-charcoal">그림 그리는 중...</p>
                                                </div>
                                            ) : page.error ? (
                                                <div className="p-4 text-center text-coral">
                                                    <h4 className="font-bold">오류</h4>
                                                    <p className="text-sm">{page.error}</p>
                                                </div>
                                            ) : page.imageUrl ? (
                                                <img src={page.imageUrl} alt={`페이지 ${index + 1} 삽화`} className="w-full h-full object-cover"/>
                                            ) : (
                                                <div className="text-center text-gray-500">
                                                    <MagicWandIcon className="w-12 h-12 mx-auto text-gray-300"/>
                                                    <p className="mt-2 text-sm">삽화가 여기에 표시됩니다</p>
                                                </div>
                                            )}
                                        </div>
                                         <button onClick={() => handleGenerateImage(page.id)} disabled={page.isLoading} className="mt-2 w-full flex justify-center items-center gap-2 bg-teal-dark text-white font-bold py-2 px-4 rounded-md hover:bg-teal-light hover:text-charcoal transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                           <MagicWandIcon className="w-5 h-5"/> 삽화 생성
                                        </button>
                                    </div>
                                </div>
                            ))}
                         </div>
                         <div className="mt-6">
                            <button onClick={handleAddPage} className="w-full flex justify-center items-center gap-2 bg-charcoal text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-80 transition duration-300">
                                <PlusIcon className="w-5 h-5"/> 새 페이지 추가
                            </button>
                         </div>
                     </Card>
                </div>
            </main>
        </div>
    );
};

export default App;
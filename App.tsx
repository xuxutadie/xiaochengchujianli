import React, { useState, useRef, useEffect } from 'react';
import { ResumeData, INITIAL_RESUME_DATA, ImageItem } from './types';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import ThemeSelector from './components/ThemeSelector';
import { Printer, Save, RotateCcw, AlertCircle, Loader2, Download, Layout, LayoutGrid, Columns } from 'lucide-react';

const STORAGE_KEY = 'smart-resume-kid-data-v1';

// Migration helper to ensure old data works with new types
const migrateData = (data: any): ResumeData => {
  // Deep merge or careful shallow merge of top-level objects
  const newData = { 
    ...INITIAL_RESUME_DATA, 
    ...data,
    cover: { ...INITIAL_RESUME_DATA.cover, ...(data?.cover || {}) },
    backCover: { ...INITIAL_RESUME_DATA.backCover, ...(data?.backCover || {}) },
    basicInfo: { ...INITIAL_RESUME_DATA.basicInfo, ...(data?.basicInfo || {}) },
    contact: { ...INITIAL_RESUME_DATA.contact, ...(data?.contact || {}) },
    hobbies: { ...INITIAL_RESUME_DATA.hobbies, ...(data?.hobbies || {}) },
  };
  
  // Ensure basic arrays exist
  if (!Array.isArray(newData.certificates)) newData.certificates = [];
  if (!Array.isArray(newData.qualityReports)) newData.qualityReports = [];
  if (!newData.family || !Array.isArray(newData.family)) newData.family = [];
  if (!newData.awards || !Array.isArray(newData.awards)) newData.awards = [];

  // Migrate Certificates (string[] -> ImageItem[])
  newData.certificates = newData.certificates.map((item: any, index: number) => {
    if (typeof item === 'string') {
      return { id: `migrated-cert-${index}`, url: item, caption: '' };
    }
    return item;
  });

  // Migrate qualityReports (string[] -> ImageItem[])
  newData.qualityReports = newData.qualityReports.map((item: any, index: number) => {
    if (typeof item === 'string') {
      return { id: `migrated-quality-${index}`, url: item, caption: '' };
    }
    return item;
  });

  // Migrate Hobbies Images (string[] -> ImageItem[])
  if (!newData.hobbies) newData.hobbies = { ...INITIAL_RESUME_DATA.hobbies };
  if (!Array.isArray(newData.hobbies.images)) newData.hobbies.images = [];
  if (!Array.isArray(newData.hobbies.specialties)) newData.hobbies.specialties = [];

  // Enforce specialty limit (max 3)
  if (newData.hobbies.specialties.length > 3) {
    newData.hobbies.specialties = newData.hobbies.specialties.slice(0, 3);
  }

  newData.hobbies.images = newData.hobbies.images.map((item: any, index: number) => {
    if (typeof item === 'string') {
      return { id: `migrated-hobby-${index}`, url: item, caption: '' };
    }
    return item;
  });

  // Ensure 8 award items by default
  if (!Array.isArray(newData.awards) || newData.awards.length === 0) {
    newData.awards = [...INITIAL_RESUME_DATA.awards];
  } else if (newData.awards.length < 8) {
    // If fewer than 8, pad with defaults from INITIAL_RESUME_DATA
    const existingIds = new Set(newData.awards.map(a => a.id));
    const missingAwards = INITIAL_RESUME_DATA.awards.filter(a => !existingIds.has(a.id));
    newData.awards = [...newData.awards, ...missingAwards.slice(0, 8 - newData.awards.length)];
  }

  // Ensure BackCover exists
  if (!newData.backCover) {
    newData.backCover = { backgroundImage: '' };
  }

  return newData;
};

const isLightColor = (color: string) => {
  if (!color || typeof color !== 'string') return false;
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 185;
};

function App() {
  // Initialize with default data
  const [data, setData] = useState<ResumeData>(INITIAL_RESUME_DATA);
  const [scale, setScale] = useState(0.5);
  const [layoutMode, setLayoutMode] = useState<'single' | 'grid'>('single'); // 'single' 为单列, 'grid' 为三列并排
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false); 
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);

  // Compute theme variables
  const themeVars = {
    '--theme-primary': data.themeColor,
    '--theme-readable-primary': data.darkMode ? '#ffffff' : (isLightColor(data.themeColor) ? '#334155' : data.themeColor),
    '--theme-border': data.darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    '--theme-card': data.darkMode ? '#1c1c1e' : '#ffffff',
    '--theme-input': data.darkMode ? '#2c2c2e' : '#f8fafc',
    '--theme-surface': data.darkMode ? '#000000' : '#f8f9fb',
    '--theme-accent': data.themeColor,
  } as React.CSSProperties;
  
  // Ref for the scaling container (sizing logic)
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 1. Load from LocalStorage on Mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedWidth) setSidebarWidth(parseInt(savedWidth));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated = migrateData(parsed);
        setData(migrated);
      } catch (e) {
        console.error("Failed to load saved resume", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. Save to LocalStorage on Change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSaveError(false);
      } catch (e) {
        // Silently fail but update UI state, don't crash
        console.warn("Storage Quota Exceeded:", e);
        setSaveError(true);
      }
    }
  }, [data, isLoaded]);

  // Resize Observer for Scaling
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const availableWidth = containerWidth - 60; 
        const baseWidth = layoutMode === 'grid' ? (794 * 3 + 100) : 794; 
        const newScale = Math.min(availableWidth / baseWidth, 1);
        setScale(Math.max(newScale, 0.2)); // 在网格模式下允许更小的缩放
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, [layoutMode]); // 添加 layoutMode 依赖项

  // Resizing logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth > 350 && newWidth < 800) {
        setSidebarWidth(newWidth);
        localStorage.setItem('sidebar-width', newWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = 'auto';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handlePrint = () => {
    const originalTitle = document.title;
    const fileName = `小升初简历-${data.basicInfo.name || '未命名'}`;
    document.title = fileName;
    
    // 进入导出模式
    setIsExporting(true);
    setIsPrinting(true);
    
    // 如果当前是网格模式，先临时切换回单列模式
    const currentMode = layoutMode;
    if (currentMode === 'grid') {
      setLayoutMode('single');
    }

    // Create a temporary toast to guide user
    const toast = document.createElement('div');
    toast.className = 'fixed top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl z-[9999] font-bold no-print animate-bounce';
    toast.innerHTML = '🚀 正在为您生成高清 PDF，请稍等...';
    document.body.appendChild(toast);
    
    // 延迟更长时间确保渲染完成，特别是图片和布局切换
    setTimeout(() => {
      try {
        window.print();
      } catch (error) {
        console.error('Print failed:', error);
      } finally {
        document.title = originalTitle;
        setIsPrinting(false);
        setIsExporting(false);
        if (currentMode === 'grid') {
          setLayoutMode('grid');
        }
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }
    }, 1000); 
  };

  const handleReset = () => {
    if (confirm('确定要重置所有内容吗？这将清除当前的编辑。')) {
      const resetData = { ...INITIAL_RESUME_DATA };
      setData(resetData);
      try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(resetData)); 
          setSaveError(false);
      } catch (e) {
          // Ignore
      }
    }
  };

  const sidebarContent = (
    <>
      <div className={`p-8 flex justify-between items-center relative overflow-hidden transition-colors duration-500 ${data.darkMode ? 'bg-[#121212] text-white' : 'bg-dark text-white'}`}>
        {/* Decorative element */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-accent/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg rotate-3 group-hover:rotate-0 transition-all ${data.darkMode ? 'bg-accent text-dark shadow-accent/20' : 'bg-accent text-dark shadow-accent/20'}`}>
            <Layout size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none">
              智绘简历
            </h1>
            <p className={`text-[10px] uppercase tracking-[0.2em] font-extrabold mt-1.5 opacity-90 ${data.darkMode ? 'text-accent' : 'text-accent'}`}>
              Smart Resume Builder
            </p>
          </div>
        </div>
        <button 
          onClick={handleReset}
          className={`relative z-10 w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 active:scale-90 ${data.darkMode ? 'text-white/20 hover:text-white hover:bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
          title="重置简历内容"
        >
          <RotateCcw size={20} />
        </button>
      </div>
      
      <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar transition-colors duration-500 ${data.darkMode ? 'bg-[#1a1a1a]' : 'bg-surface'}`}>
        <ThemeSelector 
          currentTheme={data.theme} 
          currentColor={data.themeColor}
          darkMode={data.darkMode || false}
          onThemeChange={(t, c) => setData({ ...data, theme: t, themeColor: c })} 
          onDarkModeToggle={(isDark) => setData({ ...data, darkMode: isDark })}
        />
        <ResumeForm data={data} onChange={setData} />
      </div>
    </>
  );

  return (
    // Add print: classes to unlock layout constraints
    <div className={`flex h-screen overflow-hidden font-sans print:block print:h-auto print:overflow-visible transition-colors duration-500 ${data.darkMode ? 'bg-[#121212] text-white' : 'bg-surface text-dark'}`} style={themeVars}>
      
      {/* Left: Editor Sidebar (Desktop) */}
      <div 
        className={`hidden md:flex flex-shrink-0 flex-col no-print z-20 shadow-xl border-r-2 border-[var(--theme-border)] transition-colors duration-500 ${data.darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}
        style={{ width: `${sidebarWidth}px` }}
      >
        {sidebarContent}
      </div>

      {/* Resize Handle (The "Red Area" requested by user) */}
      <div 
        onMouseDown={() => setIsResizing(true)}
        className={`hidden md:block w-1.5 h-full cursor-col-resize no-print z-30 transition-all duration-300 relative group
          ${isResizing ? 'bg-red-500' : 'bg-transparent hover:bg-red-400/30'}`}
      >
        <div className={`absolute inset-y-0 -left-1 -right-1 z-0`}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 rounded-full transition-all duration-300
          ${isResizing ? 'bg-white' : 'bg-red-500/20 group-hover:bg-red-500'}`}></div>
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden w-full flex-shrink-0 flex flex-col no-print z-20 shadow-xl border-b-2 border-[var(--theme-border)] h-[50vh]">
        {sidebarContent}
      </div>

      {/* Right: Preview Area */}
      <div className={`flex-1 flex flex-col relative print:block print:bg-white print:static print:h-auto print:overflow-visible overflow-hidden z-10 transition-colors duration-500 ${data.darkMode ? 'bg-[#121212]' : 'bg-surface'}`}>
        {/* Toolbar */}
        <div className={`h-24 flex items-center justify-between px-10 no-print z-20 sticky top-0 backdrop-blur-xl transition-colors duration-500 ${data.darkMode ? 'bg-[#121212]/80' : 'bg-surface/80'}`}>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className={`text-lg font-black tracking-tight ${data.darkMode ? 'text-white' : 'text-dark'}`}>预览实时更新</h2>
              <div className="flex items-center gap-2">
                {saveError ? (
                  <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <AlertCircle size={10} /> 存储空间已满
                  </span>
                ) : (
                  <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> 已自动保存
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white/10 p-1 rounded-2xl no-print">
              <button 
                onClick={() => setLayoutMode('single')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${layoutMode === 'single' ? 'bg-white text-dark shadow-sm' : 'text-white/60 hover:text-white'}`}
                title="单列排版"
              >
                <Columns size={16} />
                <span>单列</span>
              </button>
              <button 
                onClick={() => setLayoutMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${layoutMode === 'grid' ? 'bg-white text-dark shadow-sm' : 'text-white/60 hover:text-white'}`}
                title="三列并排"
              >
                <LayoutGrid size={16} />
                <span>三列</span>
              </button>
            </div>

            <button 
              onClick={handlePrint}
              disabled={isExporting}
              className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-extrabold transition-all duration-300 shadow-2xl active:scale-95 disabled:opacity-50 group ${data.darkMode ? 'bg-accent text-dark hover:bg-accent/90 shadow-accent/10' : 'bg-dark text-white hover:bg-dark/90 shadow-dark/10'}`}
            >
              <Download size={20} className={`group-hover:-translate-y-0.5 transition-transform ${data.darkMode ? 'text-dark' : 'text-accent'}`} />
              <span className="text-sm tracking-tight">导出 PDF 下载</span>
            </button>
          </div>
        </div>

        {/* Preview Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto flex items-start justify-center p-8 custom-scrollbar relative print:p-0 print:block print:overflow-visible print:h-auto z-10"
        >
           {/* We attach the print ref here to capture the content layout */}
           <div 
             ref={contentRef}
             // Override specific widths and paddings for print
             className={`transition-all duration-500 ease-out ${isPrinting ? 'm-0 shadow-none !transition-none' : 'mx-auto'}`}
              style={{ 
                width: isPrinting ? '794px' : (layoutMode === 'grid' ? (794 * 3 + 200) * scale : 794 * scale), 
                height: 'auto', 
                paddingBottom: isPrinting ? '0' : '80px',
                filter: isPrinting ? 'none' : 'drop-shadow(0 25px 50px -12px rgb(0 0 0 / 0.15))',
                // 在打印时强制移除任何可能导致偏移的样式
                ...(isPrinting ? { transform: 'none' } : {})
              }}
           >
              <ResumePreview data={data} scale={isPrinting ? 1 : scale} layoutMode={isPrinting ? 'single' : layoutMode} isPrinting={isPrinting} />
           </div>
        </div>

      </div>
    </div>
  );
}

export default App;
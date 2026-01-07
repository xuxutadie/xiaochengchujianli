import React, { useState, useRef, useEffect } from 'react';
import { ResumeData, INITIAL_RESUME_DATA, ImageItem, LayoutType, ThemeType } from './types';
import { verificationService } from './services/verificationService';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import ThemeSelector from './components/ThemeSelector';
import LayoutSelector from './components/LayoutSelector';
import AdminDashboard from './components/AdminDashboard';
import { Printer, Save, RotateCcw, AlertCircle, Loader2, Download, Layout, LayoutGrid, Columns, X, CheckCircle2, CreditCard, QrCode, FileText, Star, UserPlus, Ticket, Settings, Edit, Eye } from 'lucide-react';

const STORAGE_KEY = 'smart-resume-kid-data-v1';

// Payment Modal Component
const PaymentModal = ({ 
  data, 
  onClose, 
  onPrint 
}: { 
  data: ResumeData; 
  onClose: () => void; 
  onPrint: (pro: boolean) => void;
}) => {
  const [step, setStep] = useState<'options' | 'pay' | 'code' | 'manual'>('options');
  const [inputCode, setInputCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleVerifyCode = async () => {
    if (inputCode.length !== 8) {
      setCodeError('请输入8位数字验证码');
      return;
    }
    
    setIsValidating(true);
    const result = await verificationService.verifyCode(inputCode);
    
    if (result.success) {
      onPrint(true);
      onClose();
    } else {
      setCodeError(result.message || '验证码无效');
    }
    setIsValidating(false);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
      <div className={`relative w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl transition-all duration-500 animate-in fade-in zoom-in slide-in-from-bottom-10 ${data.darkMode ? 'bg-[#1c1c1e] text-[var(--theme-label)]' : 'bg-white text-dark'}`}>
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 md:p-10">
          {step === 'options' && (
            <>
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-accent/10 rounded-[30px] flex items-center justify-center mx-auto mb-6 text-accent">
                  <Download size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-2">选择服务方式</h3>
                <p className="opacity-60 font-medium text-sm">成长记录，值得更好的呈现</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Free Option */}
                <div 
                  onClick={() => onPrint(false)}
                  className={`group p-6 rounded-[32px] border-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${data.darkMode ? 'bg-white/5 border-white/10 hover:border-white/20 text-[var(--theme-label)]' : 'bg-surface border-black/5 hover:border-black/10 text-dark'}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <FileText size={24} className="opacity-60" />
                    </div>
                    <div>
                      <h4 className="font-bold">免费预览版</h4>
                      <p className="text-[10px] opacity-50">适合快速查看效果</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-black">¥0</span>
                  </div>
                  <ul className="space-y-2 text-[11px] font-bold opacity-60">
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> 包含全部内容</li>
                    <li className="flex items-center gap-2"><X size={12} className="text-red-500" /> 包含预览版水印</li>
                  </ul>
                </div>

                {/* Pro Option */}
                <div 
                  onClick={() => setStep('pay')}
                  className={`group p-6 rounded-[32px] border-2 border-accent transition-all cursor-pointer hover:scale-[1.02] active:scale-95 bg-accent/5`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-accent/20 rounded-2xl text-accent">
                      <Star size={24} fill="currentColor" />
                    </div>
                    <div>
                      <h4 className="font-bold text-accent">高清正式版</h4>
                      <p className="text-[10px] text-accent/60 font-bold">推荐用于正式提交</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-black text-accent">¥39.9</span>
                  </div>
                  <ul className="space-y-2 text-[11px] font-bold text-accent/80">
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} /> 彻底移除所有水印</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} /> 印刷级超清画质</li>
                  </ul>
                </div>

                {/* Code Redeem Option */}
                <div 
                  onClick={() => setStep('code')}
                  className={`group p-6 rounded-[32px] border-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${data.darkMode ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-accent/5 border-accent/10 hover:border-accent/20'}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                      <Ticket size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-accent">验证码兑换</h4>
                      <p className="text-[10px] text-accent/60 font-bold">使用 8 位码免费兑换</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-black text-accent">兑换</span>
                  </div>
                  <ul className="space-y-2 text-[11px] font-bold text-accent/80">
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} /> 输入兑换码直接下载</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} /> 同样享受高清无水印</li>
                  </ul>
                </div>

                {/* Manual Service Option */}
                <div 
                  onClick={() => setStep('manual')}
                  className={`group p-6 rounded-[32px] border-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${data.darkMode ? 'bg-white/5 border-white/10 hover:border-orange-500/20 text-[var(--theme-label)]' : 'bg-orange-500/5 border-orange-500/10 hover:border-orange-500/20 text-orange-500'}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                      <UserPlus size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-500">私人定制</h4>
                      <p className="text-[10px] text-orange-500/60 font-bold">专业 1对1 深度优化</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-black text-orange-500">¥158</span>
                  </div>
                  <ul className="space-y-2 text-[11px] font-bold text-orange-500/80">
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} /> 设计师专业排版文案</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} /> 满意为止，省时省力</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {step === 'pay' && (
            <div className="text-center animate-in fade-in slide-in-from-right-10">
              <button onClick={() => setStep('options')} className="absolute left-10 top-10 text-xs font-bold opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1">
                ← 返回选择
              </button>
              <h3 className="text-2xl font-black mb-2">扫码获取正式版</h3>
              <p className="text-sm opacity-60 mb-8">请扫码支付 ¥39.9，支付后联系微信领码</p>
              
              <div className="bg-white p-4 rounded-[32px] shadow-xl border-2 border-accent/10 mb-6 inline-block">
                <img 
                  src="/pay-qr.png" 
                  className="w-48 h-48 object-contain" 
                  alt="收款码"
                  onError={(e) => e.currentTarget.src = "https://placehold.co/200x200?text=QR+Code+Pending"}
                />
              </div>

              <div className="space-y-4 max-w-xs mx-auto">
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-black border border-emerald-500/20">
                    <QrCode size={14} /> 仅支持微信支付
                  </div>
                </div>
                
                <div className="p-6 bg-emerald-50 rounded-[24px] border border-emerald-100 text-left">
                  <p className="text-[12px] text-emerald-800 font-bold mb-4 leading-relaxed">
                    ✨ <span className="text-emerald-600 underline decoration-2 underline-offset-4">支付流程：</span><br/>
                    1. 截图并识别上方二维码支付<br/>
                    2. 添加微信：<span className="text-lg font-black mx-1">18685442407</span><br/>
                    3. 发送支付截图，领取 8 位验证码
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText('18685442407');
                        alert('微信号已复制到剪贴板！');
                      }}
                      className="py-3 bg-white text-emerald-600 border border-emerald-200 text-xs font-black rounded-xl hover:bg-emerald-100 transition-colors"
                    >
                      复制微信号
                    </button>
                    <button 
                      onClick={() => setStep('code')}
                      className="py-3 bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-1"
                    >
                      去输入验证码 <Ticket size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'code' && (
            <div className="text-center animate-in fade-in slide-in-from-right-10 py-4">
              <button onClick={() => setStep('options')} className="absolute left-10 top-10 text-xs font-bold opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1">
                ← 返回选择
              </button>
              <h3 className="text-2xl font-black mb-2">验证码兑换</h3>
              <p className="text-sm opacity-60 mb-8">输入 8 位数字验证码即可免费下载正式版</p>
              
              <div className="max-w-xs mx-auto space-y-4">
                <input 
                  type="text"
                  maxLength={8}
                  placeholder="请输入 8 位数字验证码"
                  value={inputCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setInputCode(val);
                    setCodeError('');
                  }}
                  className={`w-full py-4 px-6 rounded-2xl text-center text-2xl font-black tracking-[0.2em] border-2 transition-all outline-none bg-white/5 text-white ${codeError ? 'border-red-500 bg-red-500/5' : 'border-white/20 focus:border-white'}`}
                />
                {codeError && <p className="text-red-500 text-xs font-bold">{codeError}</p>}
                
                <button 
                  onClick={handleVerifyCode}
                  disabled={isValidating || inputCode.length !== 8}
                  className="w-full py-4 bg-dark text-white font-black rounded-2xl shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isValidating ? <Loader2 className="animate-spin" size={20} /> : '立即兑换'}
                </button>
              </div>
            </div>
          )}

          {step === 'manual' && (
            <div className="text-center animate-in fade-in slide-in-from-right-10">
              <button onClick={() => setStep('options')} className="absolute left-10 top-10 text-xs font-bold opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1">
                ← 返回选择
              </button>
              <div className="w-20 h-20 bg-orange-500/10 rounded-[30px] flex items-center justify-center mx-auto mb-6 text-orange-500">
                <UserPlus size={40} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black mb-2">私人高级定制服务</h3>
              <p className="text-sm opacity-60 mb-8">专业设计师 1对1 深度优化，助您在众多简历中脱颖而出</p>
              
              <div className={`p-8 rounded-[32px] border-2 border-orange-500/20 mb-8 text-left ${data.darkMode ? 'bg-white/5' : 'bg-orange-500/5'}`}>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-orange-500 font-black px-4 py-1 bg-orange-500/10 rounded-full text-xs">尊享版服务</span>
                  <span className="text-2xl font-black text-orange-500">¥158.00</span>
                </div>
                <ul className="space-y-3 text-xs font-bold opacity-80">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange-500" /> 专业排版设计，风格完美适配申请学校</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange-500" /> 文案深度润色，挖掘亮点，提升吸引力</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange-500" /> 包含 3 次深度修改，满意为止</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-white rounded-2xl border-2 border-orange-500/10 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                      <QrCode size={24} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-dark/40 font-bold uppercase">联系微信</p>
                      <p className="text-lg font-black text-dark">18685442407</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('18685442407');
                      alert('微信已复制到剪贴板！');
                    }}
                    className="px-4 py-2 bg-orange-500 text-white text-xs font-black rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    复制微信
                  </button>
                </div>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">添加时请备注：简历定制</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
    portfolio: { ...INITIAL_RESUME_DATA.portfolio, ...(data?.portfolio || {}) },
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

  // Migrate Portfolio Images
  if (!newData.portfolio) newData.portfolio = { ...INITIAL_RESUME_DATA.portfolio };
  if (!Array.isArray(newData.portfolio.images)) newData.portfolio.images = [];
  newData.portfolio.images = newData.portfolio.images.map((item: any, index: number) => {
    if (typeof item === 'string') {
      return { id: `migrated-portfolio-${index}`, url: item, caption: '' };
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Compute theme variables
  const themeVars = {
          '--theme-primary': data.themeColor,
          '--theme-readable-primary': '#ffffff',
          '--theme-label': '#ffffff', 
          '--theme-border': 'rgba(255,255,255,0.06)',
          '--theme-card': '#1c1c1e',
          '--theme-input': '#2c2c2e',
          '--theme-surface': '#000000',
          '--theme-accent': '#D9F217',
          '--theme-secondary': '#D9F217', 
        } as React.CSSProperties;
  
  // Ref for the scaling container (sizing logic)
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 1. Load from LocalStorage on Mount
  useEffect(() => {
    // Check for admin route
    if (window.location.hash === '#/admin') {
      setShowAdmin(true);
    }
    const handleHashChange = () => {
      if (window.location.hash === '#/admin') setShowAdmin(true);
    };
    window.addEventListener('hashchange', handleHashChange);

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
    const checkBackend = async () => {
      let backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      
      // 处理域名，确保以 https:// 开头
      if (backendUrl && !backendUrl.startsWith('http')) {
        backendUrl = `https://${backendUrl}`;
      }
      
      // 去掉末尾的斜杠
      backendUrl = backendUrl.replace(/\/$/, '');
      
      console.log('🔍 正在检测后端连接...', backendUrl);
      try {
        const res = await fetch(`${backendUrl}/api/health`);
        if (res.ok) {
          console.log('✅ 后端连接成功！域名：', backendUrl);
        } else {
          console.error('❌ 后端返回异常状态码:', res.status, '请检查后端服务是否正常运行');
        }
      } catch (err) {
        console.error('❌ 无法连接到后端。当前配置域名:', backendUrl, '错误原因:', err.message);
        console.warn('💡 提示：请确保在 Zeabur 前端设置中 VITE_BACKEND_URL 已更新为新的后端域名');
      }
    };
    checkBackend();
  }, []);

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
        if (containerWidth === 0) return; // Skip if hidden

        const availableWidth = containerWidth - 60; 
        const baseWidth = layoutMode === 'grid' ? (794 * 3 + 100) : 794; 
        const newScale = Math.min(availableWidth / baseWidth, 1);
        setScale(Math.max(newScale, 0.2)); // 在网格模式下允许更小的缩放
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Initial calculation and recalculation on tab switch
    // Use timeout to ensure layout is updated
    const timer = setTimeout(handleResize, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [layoutMode, mobileTab]);

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

  const handlePrint = (withWatermark: boolean = true) => {
    const originalTitle = document.title;
    const fileName = `小升初简历-${data.basicInfo.name || '未命名'}${withWatermark ? '-水印预览版' : '-高清正式版'}`;
    document.title = fileName;
    
    // 进入导出模式
    setIsExporting(true);
    setIsPrinting(true);
    setShowWatermark(withWatermark);
    
    // 如果当前是网格模式，先临时切换回单列模式
    const currentMode = layoutMode;
    if (currentMode === 'grid') {
      setLayoutMode('single');
    }

    // Create a temporary toast to guide user
    const toast = document.createElement('div');
    toast.className = 'fixed top-10 left-1/2 -translate-x-1/2 bg-[#D9F217] text-[#1A1C1E] px-6 py-3 rounded-full shadow-2xl z-[9999] font-bold no-print animate-bounce';
    toast.innerHTML = withWatermark ? '🚀 正在为您生成【水印预览版】PDF...' : '✨ 正在为您生成【高清无水印版】PDF...';
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
        setShowWatermark(true); // 打印完恢复编辑状态下的水印（如果不是Pro）
        if (currentMode === 'grid') {
          setLayoutMode('grid');
        }
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }
    }, 1500); 
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
      <div className={`p-4 md:p-8 flex justify-between items-center relative overflow-hidden transition-colors duration-500 ${data.darkMode ? 'bg-[#121212] text-white' : 'bg-dark text-white'}`}>
        {/* Decorative element */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-accent/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg rotate-3 group-hover:rotate-0 transition-all ${data.darkMode ? 'bg-accent text-dark shadow-accent/20' : 'bg-accent text-dark shadow-accent/20'}`}>
            <Layout size={20} className="md:w-6 md:h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none text-[var(--theme-label)]">
              智绘简历
            </h1>
            <p className={`text-[10px] uppercase tracking-[0.2em] font-extrabold mt-1.5 opacity-90 text-[var(--theme-label)]`}>
              Smart Resume Builder
            </p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <button 
            onClick={() => setShowAdmin(true)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 active:scale-90 ${data.darkMode ? 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10' : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/20'}`}
            title="管理后台"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={handleReset}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 active:scale-90 ${data.darkMode ? 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10' : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'}`}
            title="重置简历内容"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
      
      <div className={`flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar transition-colors duration-500 ${data.darkMode ? 'bg-[#1a1a1a]' : 'bg-surface'}`}>
        <ThemeSelector 
          currentTheme={data.theme} 
          currentColor={data.themeColor}
          onThemeChange={(t, c) => setData({ ...data, theme: t, themeColor: c })} 
        />
        <LayoutSelector 
          currentLayout={data.layout || LayoutType.Classic}
          onLayoutChange={(l) => setData({ ...data, layout: l })}
          darkMode={data.darkMode || false}
        />
        <ResumeForm data={data} onChange={setData} />
      </div>
    </>
  );

  return (
    // Add print: classes to unlock layout constraints
    <div className={`flex h-screen overflow-hidden font-sans print:block print:h-auto print:overflow-visible transition-colors duration-500 flex-col md:flex-row ${data.darkMode ? 'bg-[#121212] text-white' : 'bg-surface text-dark'}`} style={themeVars}>
      
      {/* Admin Dashboard */}
      {showAdmin && (
        <AdminDashboard 
          onClose={() => {
            setShowAdmin(false);
            window.location.hash = '';
          }} 
          darkMode={data.darkMode}
        />
      )}

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

      {/* Mobile Editor View (Replaces Mobile Sidebar) */}
      <div className={`md:hidden flex-1 flex flex-col no-print z-20 overflow-hidden ${mobileTab === 'editor' ? 'flex' : 'hidden'}`}>
        {sidebarContent}
      </div>

      {/* Right: Preview Area */}
      <div className={`flex-1 flex flex-col relative print:block print:bg-white print:static print:h-auto print:overflow-visible overflow-hidden z-10 transition-colors duration-500 ${data.darkMode ? 'bg-[#121212]' : 'bg-surface'} ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
        {/* Toolbar */}
        <div className={`h-16 md:h-24 flex items-center justify-between px-4 md:px-10 no-print z-20 sticky top-0 backdrop-blur-xl transition-colors duration-500 ${data.darkMode ? 'bg-[#121212]/80' : 'bg-surface/80'}`}>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className={`text-lg font-black tracking-tight text-[var(--theme-label)]`}>预览实时更新</h2>
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
            <div className="hidden md:flex bg-white/10 p-1 rounded-2xl no-print">
              <button 
                onClick={() => setLayoutMode('single')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${layoutMode === 'single' ? 'bg-white text-dark shadow-sm' : 'text-[var(--theme-label)] opacity-60 hover:text-[var(--theme-label)] hover:opacity-100'}`}
                title="单列排版"
              >
                <Columns size={16} />
                <span>单列</span>
              </button>
              <button 
                onClick={() => setLayoutMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${layoutMode === 'grid' ? 'bg-white text-dark shadow-sm' : 'text-[var(--theme-label)] opacity-60 hover:text-[var(--theme-label)] hover:opacity-100'}`}
                title="三列并排"
              >
                <LayoutGrid size={16} />
                <span>三列</span>
              </button>
            </div>

            <button 
              onClick={() => setShowPaymentModal(true)}
              disabled={isExporting}
              className={`flex items-center gap-3 px-4 md:px-8 py-3 md:py-4 rounded-3xl font-extrabold transition-all duration-300 shadow-2xl active:scale-95 disabled:opacity-50 group ${data.darkMode ? 'bg-accent text-dark hover:bg-accent/90 shadow-accent/10' : 'bg-dark text-white hover:bg-dark/90 shadow-dark/10'}`}
            >
              <Download size={20} className={`group-hover:-translate-y-0.5 transition-transform ${data.darkMode ? 'text-dark' : 'text-accent'}`} />
              <span className="text-sm tracking-tight hidden md:inline">导出 PDF 下载</span>
              <span className="text-sm tracking-tight md:hidden">导出</span>
            </button>
          </div>
        </div>

        {/* Preview Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto flex items-start justify-center p-4 md:p-8 custom-scrollbar relative print:p-0 print:block print:overflow-visible print:h-auto z-10"
        >
           {/* We attach the print ref here to capture the content layout */}
           <div 
             ref={contentRef}
             // Override specific widths and paddings for print
             className={`transition-all duration-500 ease-out ${isPrinting ? 'm-0 shadow-none !transition-none' : 'mx-auto'}`}
              style={{ 
                width: isPrinting ? '210mm' : (layoutMode === 'grid' ? (794 * 3 + 200) * scale : 794 * scale), 
                height: 'auto', 
                paddingBottom: isPrinting ? '0' : '80px',
                filter: isPrinting ? 'none' : 'drop-shadow(0 25px 50px -12px rgb(0 0 0 / 0.15))',
                // 在打印时强制移除任何可能导致偏移的样式
                ...(isPrinting ? { transform: 'none' } : {})
              }}
           >
              <ResumePreview 
                data={data} 
                scale={isPrinting ? 1 : scale} 
                layoutMode={isPrinting ? 'single' : layoutMode} 
                isPrinting={isPrinting}
                showWatermark={isPro ? false : showWatermark} 
              />
           </div>
        </div>

      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div 
        className={`md:hidden shrink-0 z-50 flex items-center justify-around border-t ${data.darkMode ? 'bg-[#1a1a1a] border-white/5 text-white' : 'bg-white border-dark/5 text-dark'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(4rem + env(safe-area-inset-bottom))' }}
      >
        <button 
          onClick={() => setMobileTab('editor')}
          className={`flex flex-col items-center gap-1 transition-all ${mobileTab === 'editor' ? 'opacity-100 scale-110' : 'opacity-40'}`}
        >
          <div className={`p-1.5 rounded-xl ${mobileTab === 'editor' ? (data.darkMode ? 'bg-white/10' : 'bg-dark/5') : ''}`}>
            <Edit size={24} className={mobileTab === 'editor' ? 'text-accent' : ''} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider">编辑简历</span>
        </button>
        <button 
          onClick={() => setMobileTab('preview')}
          className={`flex flex-col items-center gap-1 transition-all ${mobileTab === 'preview' ? 'opacity-100 scale-110' : 'opacity-40'}`}
        >
           <div className={`p-1.5 rounded-xl ${mobileTab === 'preview' ? (data.darkMode ? 'bg-white/10' : 'bg-dark/5') : ''}`}>
            <Eye size={24} className={mobileTab === 'preview' ? 'text-accent' : ''} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider">实时预览</span>
        </button>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal 
          data={data}
          onClose={() => setShowPaymentModal(false)}
          onPrint={(pro) => handlePrint(!pro)}
        />
      )}
    </div>
  );
}

export default App;
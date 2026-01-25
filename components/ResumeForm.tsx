import React, { useRef, useState } from 'react';
import { 
  User, Mail, Phone, MapPin, Plus, Trash2, Image as ImageIcon, 
  ChevronRight, ChevronDown, Sparkles, Wand2, GraduationCap, 
  Trophy, Heart, Palette, Camera, Layout, Settings, BookOpen, 
  MessageSquare, UserCircle, Star, School, Calendar, Upload,
  Frame, Square, Circle, Hexagon, Shield, Loader2, Ticket, Scissors, Smile,
  Users, CheckCircle, ClipboardCheck, Award as AwardIcon, FileText, PenTool
} from 'lucide-react';
import { ResumeData, FamilyMember, Award, AvatarFrameType, AvatarShape, HobbyShape } from '../types';
import { compressImage } from '../utils/imageUtils';
import { polishContent, generateClosingMessage } from '../services/geminiService';

interface ResumeFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const AVATAR_SHAPES = [
  { id: AvatarShape.Circle, name: '圆形', icon: Circle },
  { id: AvatarShape.Square, name: '方圆', icon: Square },
  { id: AvatarShape.Hexagon, name: '六边形', icon: Hexagon },
  { id: AvatarShape.Shield, name: '盾牌', icon: Shield },
];

const AVATAR_FRAMES = [
  { id: AvatarFrameType.None, name: '无边框', icon: Square },
  { id: AvatarFrameType.Classic, name: '经典', icon: Circle },
  { id: AvatarFrameType.Wreath, name: '花环', icon: Frame },
  { id: AvatarFrameType.Polygon, name: '多边形', icon: Hexagon },
  { id: AvatarFrameType.Playful, name: '活泼', icon: Sparkles },
  { id: AvatarFrameType.Crayon, name: '蜡笔', icon: Heart },
  { id: AvatarFrameType.Stamp, name: '邮票', icon: Ticket },
  { id: AvatarFrameType.PaperCut, name: '剪纸', icon: Scissors },
  { id: AvatarFrameType.Cartoon, name: '卡通', icon: Smile },
];

const HOBBY_SHAPES = [
  { id: HobbyShape.Circle, name: '圆形', icon: Circle },
  { id: HobbyShape.Square, name: '方圆', icon: Square },
  { id: HobbyShape.Diamond, name: '菱形', icon: Layout },
  { id: HobbyShape.Hexagon, name: '六边形', icon: Hexagon },
];

const SectionHeader = ({ icon: Icon, title, description, isOpen, onToggle, onAiAssist }: { 
  icon: any, 
  title: string, 
  description?: string,
  isOpen: boolean, 
  onToggle: () => void,
  onAiAssist?: () => void
}) => (
  <div 
    className={`flex items-center justify-between p-7 cursor-pointer group transition-all duration-500 rounded-[32px] ${isOpen ? 'bg-[#2c2c2e]/80' : 'bg-transparent hover:bg-[#2c2c2e]/40'}`}
    onClick={onToggle}
  >
    <div className="flex items-center gap-6">
      <div className={`w-14 h-14 rounded-[24px] flex items-center justify-center transition-all duration-500 shadow-sm ${isOpen ? 'bg-accent text-[#1A1C1E] shadow-accent/30 scale-105' : 'bg-[#2c2c2e] text-accent/40 group-hover:text-accent group-hover:scale-105'}`}>
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-xl font-black text-[var(--theme-label)] tracking-tight group-hover:translate-x-1 transition-transform duration-300">{title}</h3>
      {description && <p className="text-[10px] font-bold text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em] mt-1 group-hover:translate-x-1 transition-transform duration-300 delay-75">{description}</p>}
      </div>
    </div>
    <div className="flex items-center gap-5">
      {onAiAssist && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAiAssist();
          }}
          className="px-6 py-2.5 rounded-[32px] bg-accent/10 text-accent hover:bg-accent hover:text-[#1A1C1E] transition-all duration-300 flex items-center gap-2.5 group/ai border border-accent/20 shadow-sm hover:shadow-md active:scale-95"
        >
          <Sparkles size={16} className="group-hover/ai:rotate-12 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-widest">AI 智能编辑</span>
        </button>
      )}
      <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center text-[var(--theme-label)] opacity-20 transition-all duration-500 group-hover:opacity-60 ${isOpen ? 'rotate-180 opacity-80 bg-accent/10' : 'bg-[var(--theme-label)]/5'}`}>
        <ChevronDown size={20} />
      </div>
    </div>
  </div>
);

const ResumeForm: React.FC<ResumeFormProps> = ({ data, onChange }) => {
  const [openSections, setOpenSections] = useState<string[]>(['cover', 'basicInfo', 'grades', 'quality', 'awards', 'certificates', 'hobbies', 'portfolio', 'socialPractice', 'essays', 'closing']);
  const [isPolishing, setIsPolishing] = useState<Record<string, boolean>>({});
  const [aiEditConfig, setAiEditConfig] = useState<{
    isOpen: boolean;
    text: string;
    section: string;
    field: string;
    nestedField?: string;
    instruction: string;
  }>({
    isOpen: false,
    text: '',
    section: '',
    field: '',
    instruction: ''
  });
  
  const handleAIEdit = async (text: string, section: string, field: string, nestedField?: string) => {
    setAiEditConfig({
      isOpen: true,
      text,
      section,
      field,
      nestedField,
      instruction: ''
    });
  };

  const executeAIEdit = async () => {
    const { text, section, field, nestedField, instruction } = aiEditConfig;
    if (isPolishing[field]) return;
    
    setIsPolishing(prev => ({ ...prev, [field]: true }));
    setAiEditConfig(prev => ({ ...prev, isOpen: false }));
    
    try {
      const edited = await polishContent(text, section, instruction);
      if (nestedField) {
        updateNested(field as any, nestedField, edited);
      } else {
        onChange({ ...data, [field]: edited });
      }
    } finally {
      setIsPolishing(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleGenerateClosing = async () => {
    const context = `姓名: ${data.basicInfo.name || ''}\n学校: ${data.basicInfo.school || ''}\n奖项: ${data.awards?.map(a => a.name).join(', ') || ''}\n兴趣爱好: ${data.hobbies?.content || ''}\n自我介绍: ${data.coverLetter || ''}\n社会实践: ${data.socialPractice?.content || ''}`;
    
    setAiEditConfig({
      isOpen: true,
      text: context,
      section: '封底寄语',
      field: 'closingMessage',
      instruction: '请为我生成一段简洁感人的封底寄语，字数控制在30字以内。'
    });
  };
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadType, setUploadType] = useState<'avatar' | 'cover' | 'pageBackground' | 'quality' | 'awards' | 'hobbies' | 'recommendation' | 'backCover' | 'socialPractice' | 'portfolio' | 'coverLetter' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const updateNested = (section: string, field: string, value: any) => {
    onChange({
      ...data,
      [section]: {
        ...(data as any)[section],
        [field]: value
      }
    });
  };

  const triggerUpload = (type: 'avatar' | 'cover' | 'pageBackground' | 'quality' | 'awards' | 'hobbies' | 'recommendation' | 'backCover' | 'socialPractice' | 'portfolio' | 'coverLetter') => {
    setUploadType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadType) return;

    setIsCompressing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result as string;
        // 直接使用 compressImage 处理原图，不进行手动裁剪
        const processed = await compressImage(base64Image, 2560, 2560, 0.98);
        
        if (uploadType === 'avatar') {
          updateNested('basicInfo', 'avatarUrl', processed);
        } else if (uploadType === 'cover') {
          updateNested('cover', 'backgroundImage', processed);
        } else if (uploadType === 'pageBackground') {
          onChange({ ...data, pageBackground: processed });
        } else if (uploadType === 'quality') {
          const newItem = {
            id: Date.now().toString(),
            url: processed,
            caption: '素质报告'
          };
          onChange({ ...data, qualityReports: [...data.qualityReports, newItem] });
        } else if (uploadType === 'awards') {
          const newItem = {
            id: Date.now().toString(),
            url: processed,
            caption: '证书名称'
          };
          onChange({ ...data, certificates: [...data.certificates, newItem] });
        } else if (uploadType === 'hobbies') {
          if (data.hobbies.images.length >= 5) {
            alert('最多只能上传 5 张兴趣特长照片');
            setIsCompressing(false);
            return;
          }
          const newItem = {
            id: Date.now().toString(),
            url: processed,
            caption: '爱好照片'
          };
          const newImages = [...data.hobbies.images, newItem];
          updateNested('hobbies', 'images', newImages);
        } else if (uploadType === 'recommendation') {
          onChange({ ...data, recommendationLetterImage: processed });
        } else if (uploadType === 'coverLetter') {
          onChange({ ...data, coverLetterImage: processed });
        } else if (uploadType === 'backCover') {
          updateNested('backCover', 'backgroundImage', processed);
        } else if (uploadType === 'socialPractice') {
          if (data.socialPractice.images.length >= 4) {
            alert('最多只能上传 4 张社会实践照片');
            setIsCompressing(false);
            return;
          }
          const newItem = {
            id: Date.now().toString(),
            url: processed,
            caption: '社会实践'
          };
          const newImages = [...data.socialPractice.images, newItem];
          updateNested('socialPractice', 'images', newImages);
        } else if (uploadType === 'portfolio') {
          if (data.portfolio.images.length >= 8) {
            alert('最多只能上传 8 张作品集照片');
            setIsCompressing(false);
            return;
          }
          const newItem = {
            id: Date.now().toString(),
            url: processed,
            caption: '作品名称'
          };
          const newImages = [...data.portfolio.images, newItem];
          updateNested('portfolio', 'images', newImages);
        }
        
        // 重置状态
        setUploadType(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File processing failed:', error);
      setIsCompressing(false);
    }
  };

  // 移除不再需要的裁剪函数和相关状态
  // (这些将在下一步中清理)

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-[800px] mx-auto p-4 md:p-8 space-y-6">
        {/* 隐藏的文件输入 */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        {/* 压缩状态 */}
        {isCompressing && (
          <div className="fixed inset-0 bg-[var(--theme-label)]/10 z-50 flex items-center justify-center backdrop-blur-md">
            <div className="bg-[var(--theme-card)] p-8 rounded-[40px] shadow-2xl flex flex-col items-center gap-4 border border-[var(--theme-border)]">
              <div className="w-16 h-16 bg-accent rounded-3xl flex items-center justify-center shadow-lg shadow-accent/20">
                <Loader2 className="animate-spin text-white" size={32} />
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-[var(--theme-label)] opacity-90">处理中...</p>
                <p className="text-[10px] font-bold text-[var(--theme-label)] opacity-60 uppercase tracking-[0.2em] mt-1">正在优化您的图片</p>
              </div>
            </div>
          </div>
        )}

        {/* 封面设置 */}
        <div className={`bg-[var(--theme-card)] rounded-[32px] transition-all duration-700 overflow-hidden border ${openSections.includes('cover') ? 'border-accent shadow-2xl shadow-accent/5 ring-4 ring-accent/10' : 'border-[var(--theme-border)] shadow-sm'}`}>
          <SectionHeader 
            icon={Layout} 
            title="封面设置" 
            description="Cover & Background"
            isOpen={openSections.includes('cover')} 
            onToggle={() => toggleSection('cover')}
          />
          {openSections.includes('cover') && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex flex-col ml-1">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">封面标题</label>
                  <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Cover Title</span>
                  </div>
                  <input
                    value={data.cover.title}
                    onChange={e => updateNested('cover', 'title', e.target.value)}
                    placeholder="请输入简历主标题"
                    className="w-full p-5 border border-white/5 rounded-[32px] text-sm bg-[#2c2c2e] focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all font-bold text-white outline-none"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col ml-1">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">封面副标题</label>
                  <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Sub Title</span>
                  </div>
                  <input
                    value={data.cover.subtitle}
                    onChange={e => updateNested('cover', 'subtitle', e.target.value)}
                    placeholder="请输入简历副标题"
                    className="w-full p-5 border border-white/5 rounded-[32px] text-sm bg-[#2c2c2e] focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all font-bold text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col ml-1">
                  <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">封面标语</label>
                  <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Cover Slogan</span>
                </div>
                <input
                  value={data.cover.slogan}
                  onChange={e => updateNested('cover', 'slogan', e.target.value)}
                  placeholder="不仅要读万卷书，更要行万里路"
                  className="w-full p-5 border border-white/5 rounded-[32px] text-sm bg-[#2c2c2e] focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all font-bold text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-12 gap-8 pt-8 border-t border-[var(--theme-border)]">
                <div className="col-span-12 lg:col-span-7 space-y-8">
                  <div 
                    className="flex items-center justify-between p-6 bg-gradient-to-br from-[#1c1c1e] to-[#252529] rounded-[32px] border border-white/5 group cursor-pointer transition-all hover:border-accent/30 hover:shadow-md"
                    onClick={() => updateNested('cover', 'showAvatar', !data.cover.showAvatar)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-[24px] flex items-center justify-center transition-all ${data.cover.showAvatar ? 'bg-accent text-[#1A1C1E] shadow-lg shadow-accent/20' : 'bg-[#2c2c2e] text-white/20'}`}>
                        <UserCircle size={28} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white/90 uppercase tracking-widest">封面显示头像</span>
                        <span className="text-[10px] text-accent font-bold uppercase">Show Avatar</span>
                      </div>
                    </div>
                    <div className={`w-14 h-7 rounded-full p-1 transition-colors duration-500 ${data.cover.showAvatar ? 'bg-accent' : 'bg-white/5'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-500 ${data.cover.showAvatar ? 'translate-x-7' : 'translate-x-0'}`} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col ml-1">
                      <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">头像形状</label>
                      <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Avatar Shape</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {AVATAR_SHAPES.map((shape) => (
                        <button
                          key={shape.id}
                          onClick={() => updateNested('cover', 'avatarShape', shape.id)}
                          className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-[20px] border transition-all ${data.cover.avatarShape === shape.id ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20 scale-[1.02]' : 'bg-[#2c2c2e] border-white/5 text-white/40 hover:border-accent/40 hover:bg-[#1c1c1e]'}`}
                        >
                          <shape.icon size={18} />
                          <span className="text-[9px] font-black uppercase tracking-wider">{shape.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col ml-1">
                      <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">头像边框样式</label>
                      <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Avatar Frame</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {AVATAR_FRAMES.map((frame) => (
                        <button
                          key={frame.id}
                          onClick={() => updateNested('cover', 'avatarFrame', frame.id)}
                          className={`flex items-center justify-center gap-2 p-2.5 rounded-[16px] border transition-all ${data.cover.avatarFrame === frame.id ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20 scale-[1.02]' : 'bg-[#2c2c2e] border-white/5 text-white/40 hover:border-accent/40 hover:bg-[#1c1c1e]'}`}
                        >
                          <frame.icon size={14} />
                          <span className="text-[9px] font-black uppercase tracking-tighter whitespace-nowrap">{frame.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-5 space-y-8">
                  <div className="space-y-4">
                    <div className="flex flex-col ml-1">
                      <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">封面背景图片</label>
                      <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Cover Background</span>
                    </div>
                    {data.cover.backgroundImage ? (
                      <div className="relative group rounded-[32px] overflow-hidden border border-[var(--theme-border)] shadow-sm aspect-[3/4] bg-[#2c2c2e] max-w-[240px] mx-auto lg:mx-0">
                        <img 
                          src={data.cover.backgroundImage} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          alt="Background" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-xl z-10">
                          <button onClick={() => triggerUpload('cover')} className="w-12 h-12 bg-white text-black rounded-[20px] hover:scale-110 transition-transform shadow-2xl flex items-center justify-center">
                            <ImageIcon size={20} />
                          </button>
                          <button onClick={() => updateNested('cover', 'backgroundImage', '')} className="w-12 h-12 bg-red-500 text-white rounded-[20px] hover:scale-110 transition-transform shadow-2xl flex items-center justify-center">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => triggerUpload('cover')}
                        className="group w-full py-12 border-2 border-dashed border-white/5 rounded-[32px] text-[var(--theme-label)]/30 hover:border-accent/40 hover:text-[var(--theme-label)] hover:bg-[#2c2c2e]/50 transition-all duration-500 flex flex-col items-center justify-center gap-3"
                      >
                        <div className="w-16 h-16 rounded-[24px] bg-[#2c2c2e] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:bg-accent/10 group-hover:text-accent">
                          <ImageIcon size={28} />
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-black uppercase tracking-[0.2em] block text-[var(--theme-label)] opacity-90">上传封面背景</span>
                          <span className="text-[9px] font-bold opacity-60 mt-1 block text-[var(--theme-label)]">建议 3:4 比例</span>
                        </div>
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 pt-8 border-t border-[var(--theme-border)] lg:border-t-0 lg:pt-0">
                    <div className="flex flex-col ml-1">
                      <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">内容页水印背景</label>
                      <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Page Watermark</span>
                    </div>
                    {data.pageBackground ? (
                      <div className="relative group rounded-[32px] overflow-hidden border border-[var(--theme-border)] shadow-sm aspect-[3/4] bg-[#2c2c2e] max-w-[240px] mx-auto lg:mx-0">
                        <img 
                          src={data.pageBackground} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          alt="Page Background" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-xl z-10">
                          <button onClick={() => triggerUpload('pageBackground')} className="w-12 h-12 bg-white text-black rounded-[20px] hover:scale-110 transition-transform shadow-2xl flex items-center justify-center">
                            <ImageIcon size={20} />
                          </button>
                          <button onClick={() => onChange({ ...data, pageBackground: '' })} className="w-12 h-12 bg-red-500 text-white rounded-[20px] hover:scale-110 transition-transform shadow-2xl flex items-center justify-center">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => triggerUpload('pageBackground')}
                        className="group w-full py-12 border-2 border-dashed border-white/5 rounded-[32px] text-[var(--theme-label)]/40 hover:border-accent/40 hover:text-[var(--theme-label)]/80 hover:bg-[#2c2c2e]/50 transition-all duration-500 flex flex-col items-center justify-center gap-3"
                      >
                        <div className="w-16 h-16 rounded-[24px] bg-[#2c2c2e] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:bg-accent/10 group-hover:text-accent">
                          <ImageIcon size={28} />
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-black uppercase tracking-[0.2em] block">上传页面水印</span>
                          <span className="text-[9px] font-bold opacity-40 mt-1 block">建议使用透明装饰图</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 基本信息 */}
        <div className={`bg-[var(--theme-card)] rounded-[32px] transition-all duration-700 overflow-hidden border ${openSections.includes('basicInfo') ? 'border-accent shadow-2xl shadow-accent/5 ring-4 ring-accent/10' : 'border-[var(--theme-border)] shadow-sm'}`}>
          <SectionHeader 
            icon={User} 
            title="基本信息" 
            description="Personal Profile"
            isOpen={openSections.includes('basicInfo')} 
            onToggle={() => toggleSection('basicInfo')}
          />
          {openSections.includes('basicInfo') && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="flex-shrink-0 flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="w-40 h-40 rounded-[40px] bg-gradient-to-br from-[#1c1c1e] to-[#252529] border-4 border-white shadow-2xl overflow-hidden group-hover:border-accent transition-all duration-500">
                      {data.basicInfo.avatarUrl ? (
                        <img src={data.basicInfo.avatarUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Avatar" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/10">
                          <UserCircle size={64} strokeWidth={1} />
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => triggerUpload('avatar')}
                      className="absolute -bottom-2 -right-2 w-14 h-14 bg-accent text-[#1A1C1E] rounded-[24px] flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all z-10 border-4 border-[#1c1c1e]"
                    >
                      <Camera size={24} />
                    </button>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">个人照片</span>
                    <span className="text-[9px] text-accent font-bold uppercase">Profile Photo</span>
                  </div>
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex flex-col ml-1">
                      <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">姓名</label>
                      <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Full Name</span>
                    </div>
                    <input 
                      value={data.basicInfo.name} 
                      onChange={e => updateNested('basicInfo', 'name', e.target.value)} 
                      placeholder="请输入真实姓名"
                      className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[32px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all text-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-col ml-1">
                      <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">性别</label>
                      <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Gender</span>
                    </div>
                    <div className="relative">
                      <select 
                        value={data.basicInfo.gender} 
                        onChange={e => updateNested('basicInfo', 'gender', e.target.value)} 
                        className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[32px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all text-white appearance-none cursor-pointer"
                      >
                        <option value="男">男 (Boy)</option>
                        <option value="女">女 (Girl)</option>
                      </select>
                      <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-white" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-col ml-1">
                      <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">出生日期</label>
                      <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Birthday</span>
                    </div>
                    <input 
                      type="date" 
                      value={data.basicInfo.birthday} 
                      onChange={e => updateNested('basicInfo', 'birthday', e.target.value)} 
                      className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[32px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all text-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-col ml-1">
                      <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">现就读学校</label>
                      <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Current School</span>
                    </div>
                    <input 
                      value={data.basicInfo.school} 
                      onChange={e => updateNested('basicInfo', 'school', e.target.value)} 
                      placeholder="例如：智绘童心小学"
                      className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[32px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all text-white"
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <div className="flex flex-col ml-1">
                      <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">意向学校</label>
                      <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Target School</span>
                    </div>
                    <input 
                      value={data.basicInfo.intendedSchool} 
                      onChange={e => updateNested('basicInfo', 'intendedSchool', e.target.value)} 
                      placeholder="想去的中学/小学"
                      className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[32px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all text-white"
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <div className="flex flex-col ml-1">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">座右铭</label>
                    <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Personal Motto</span>
                  </div>
                    <input 
                      value={data.basicInfo.motto} 
                      onChange={e => updateNested('basicInfo', 'motto', e.target.value)} 
                      placeholder="写一句你最喜欢的话吧"
                      className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[32px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 家庭成员 */}
              <div className="space-y-6 pt-10 border-t border-[var(--theme-border)]">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">家庭成员</label>
                    <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Family Members</span>
                  </div>
                  <button 
                    onClick={() => {
                      const newMember = { id: Date.now().toString(), relation: '', name: '', job: '', phone: '' };
                      onChange({ ...data, family: [...data.family, newMember] });
                    }}
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-accent text-[#1A1C1E] rounded-[32px] text-[13px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"
                  >
                    <Plus size={18} />
                    添加成员
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {data.family.map((member, index) => (
                    <div key={member.id} className="p-8 bg-gradient-to-br from-[#1c1c1e] to-[#252529] rounded-[40px] border border-white/5 space-y-8 relative group hover:border-accent/30 transition-all shadow-2xl hover:shadow-accent/10 duration-500 overflow-hidden">
                      {/* 装饰背景 */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl -mr-16 -mt-16 group-hover:bg-accent/10 transition-colors"></div>
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-[24px] bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-accent shadow-inner">
                            <UserCircle size={28} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-white/90 uppercase tracking-[0.2em]">家庭成员 #{index + 1}</span>
                            <span className="text-[10px] text-accent font-bold uppercase tracking-wider opacity-80">Family Member</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const newFamily = data.family.filter(m => m.id !== member.id);
                            onChange({ ...data, family: newFamily });
                          }}
                          className="w-12 h-12 flex items-center justify-center text-white/20 hover:text-white hover:bg-red-500 rounded-[20px] transition-all bg-white/5 shadow-sm active:scale-95 shrink-0"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                        <div className="space-y-3">
                          <div className="flex flex-col ml-1">
                            <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">关系</label>
                            <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Relation</span>
                          </div>
                          <input 
                            value={member.relation} 
                            onChange={e => {
                              const newFamily = [...data.family];
                              newFamily[index].relation = e.target.value;
                              onChange({ ...data, family: newFamily });
                            }}
                            placeholder="如：爸爸"
                            className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[28px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent/50 transition-all text-white placeholder:text-white/10"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-col ml-1">
                            <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">姓名</label>
                            <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Name</span>
                          </div>
                          <input 
                            value={member.name} 
                            onChange={e => {
                              const newFamily = [...data.family];
                              newFamily[index].name = e.target.value;
                              onChange({ ...data, family: newFamily });
                            }}
                            placeholder="成员姓名"
                            className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[28px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent/50 transition-all text-white placeholder:text-white/10"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-col ml-1">
                            <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">职业</label>
                            <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Job</span>
                          </div>
                          <input 
                            value={member.job} 
                            onChange={e => {
                              const newFamily = [...data.family];
                              newFamily[index].job = e.target.value;
                              onChange({ ...data, family: newFamily });
                            }}
                            placeholder="工作单位/职业"
                            className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[28px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent/50 transition-all text-white placeholder:text-white/10"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-col ml-1">
                            <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">电话</label>
                            <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Phone</span>
                          </div>
                          <input 
                            value={member.phone} 
                            onChange={e => {
                              const newFamily = [...data.family];
                              newFamily[index].phone = e.target.value;
                              onChange({ ...data, family: newFamily });
                            }}
                            placeholder="联系电话"
                            className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[28px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent/50 transition-all text-white placeholder:text-white/10"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 联系方式 */}
              <div className="space-y-6 pt-10 border-t border-[var(--theme-border)]">
                <div className="flex flex-col ml-1">
                  <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">联系方式</label>
                  <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Contact Information</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <div className="flex flex-col ml-1">
                      <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">家长电话</label>
                      <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Contact Phone</span>
                    </div>
                    <div className="relative">
                      <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 opacity-40 text-[var(--theme-label)]" />
                      <input 
                        value={data.contact.phone} 
                        onChange={e => updateNested('contact', 'phone', e.target.value)} 
                        placeholder="家长联系电话"
                        className="w-full p-5 pl-14 bg-[#2c2c2e] border border-white/5 rounded-[32px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-col ml-1">
                      <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">家庭住址</label>
                      <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Home Address</span>
                    </div>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 opacity-40 text-[var(--theme-label)]" />
                      <input 
                        value={data.contact.address} 
                        onChange={e => updateNested('contact', 'address', e.target.value)} 
                        placeholder="省市区/街道门牌号"
                        className="w-full p-5 pl-14 bg-[#2c2c2e] border border-white/5 rounded-[32px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 学习成绩 */}
        <div className={`bg-[var(--theme-card)] rounded-[32px] transition-all duration-700 overflow-hidden border ${openSections.includes('grades') ? 'border-accent shadow-2xl shadow-accent/5 ring-4 ring-accent/10' : 'border-[var(--theme-border)] shadow-sm'}`}>
          <SectionHeader 
            icon={BookOpen} 
            title="成绩展示" 
            description="Academic Performance"
            isOpen={openSections.includes('grades')} 
            onToggle={() => toggleSection('grades')}
          />
          {openSections.includes('grades') && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between ml-1">
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">录入学科成绩</label>
                  <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Enter Grades</span>
                </div>
                <button 
                  onClick={() => {
                    const newRow = { rowName: '新学期', subjects: [{name: '语文', value: ''}, {name: '数学', value: ''}, {name: '英语', value: ''}] };
                    onChange({ ...data, grades: [...data.grades, newRow] });
                  }}
                  className="flex items-center gap-2.5 px-6 py-3.5 bg-accent text-[#1A1C1E] rounded-[32px] text-[13px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"
                >
                  <Plus size={18} />
                  添加学期
                </button>
              </div>
              <div className="space-y-6">
                {data.grades.map((row, rowIndex) => (
                  <div key={rowIndex} className="p-8 bg-gradient-to-br from-[#1c1c1e] to-[#252529] rounded-[40px] border border-white/5 space-y-8 relative group hover:border-accent/30 transition-all shadow-xl hover:shadow-accent/5 duration-500 overflow-hidden">
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="flex flex-col ml-1">
                          <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">学期名称</label>
                          <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Semester Name</span>
                        </div>
                        <input 
                          value={row.rowName} 
                          onChange={e => {
                            const newGrades = [...data.grades];
                            newGrades[rowIndex].rowName = e.target.value;
                            onChange({ ...data, grades: newGrades });
                          }}
                          placeholder="如：一年级上学期"
                          className="w-full p-5 text-sm font-bold text-white bg-[#2c2c2e] border border-white/5 rounded-[32px] outline-none focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all placeholder:text-white/10"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newGrades = data.grades.filter((_, i) => i !== rowIndex);
                          onChange({ ...data, grades: newGrades });
                        }}
                        className="w-12 h-12 flex items-center justify-center text-white/20 hover:text-white hover:bg-red-500 rounded-[20px] transition-all bg-white/5 shadow-sm active:scale-95 shrink-0 mt-8"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                      {row.subjects.map((sub, subIndex) => (
                        <div key={subIndex} className="space-y-3">
                          <div className="flex flex-col ml-1">
                            <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">{sub.name}</label>
                            <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Grade</span>
                          </div>
                          <input 
                            value={sub.value} 
                            onChange={e => {
                              const newGrades = [...data.grades];
                              newGrades[rowIndex].subjects[subIndex].value = e.target.value;
                              onChange({ ...data, grades: newGrades });
                            }}
                            placeholder="成绩"
                            className="w-full p-5 border border-white/5 rounded-[32px] text-sm bg-[#2c2c2e] focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none font-bold text-center text-white transition-all placeholder:text-white/10"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 素质报告 */}
        <div className={`bg-[var(--theme-card)] rounded-[32px] transition-all duration-700 overflow-hidden border ${openSections.includes('quality') ? 'border-accent shadow-2xl shadow-accent/5 ring-4 ring-accent/10' : 'border-[var(--theme-border)] shadow-sm'}`}>
          <SectionHeader 
            icon={ClipboardCheck} 
            title="素质报告" 
            description="Quality Assessment"
            isOpen={openSections.includes('quality')} 
            onToggle={() => toggleSection('quality')}
          />
          {openSections.includes('quality') && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.qualityReports.map((report, index) => (
                  <div key={report.id} className="relative group rounded-[40px] overflow-hidden border border-white/5 bg-gradient-to-br from-[#1c1c1e] to-[#252529] aspect-[3/4] flex flex-col shadow-xl hover:shadow-accent/10 transition-all duration-700">
                    <img src={report.url} className="w-full h-full object-cover flex-1 transition-transform duration-700 group-hover:scale-110" alt={report.caption} />
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-black/60 backdrop-blur-xl translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <input 
                        value={report.caption} 
                        onChange={e => {
                          const newReports = [...data.qualityReports];
                          newReports[index].caption = e.target.value;
                          onChange({ ...data, qualityReports: newReports });
                        }}
                        className="w-full bg-transparent text-white text-[10px] font-black outline-none border-b border-white/20 pb-2 focus:border-accent transition-colors uppercase tracking-widest"
                        placeholder="报告名称..."
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newReports = data.qualityReports.filter(r => r.id !== report.id);
                        onChange({ ...data, qualityReports: newReports });
                      }}
                      className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-white/20 hover:text-white hover:bg-red-500 rounded-[20px] transition-all bg-white/5 shadow-sm hover:shadow-md active:scale-95 shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => triggerUpload('quality')}
                  className="group aspect-[3/4] border-2 border-dashed border-white/5 rounded-[40px] text-white/10 hover:border-accent/30 hover:text-accent hover:bg-accent/5 transition-all duration-500 flex flex-col items-center justify-center gap-6 active:scale-[0.98]"
                >
                  <div className="w-20 h-20 rounded-[28px] bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:bg-accent/10 group-hover:text-accent shadow-inner">
                    <Plus size={36} />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.2em]">添加素质报告</span>
                    <span className="text-[10px] opacity-30 font-bold">支持多图上传</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 荣誉汇总 */}
        <div className={`bg-[var(--theme-card)] rounded-[32px] transition-all duration-700 overflow-hidden border ${openSections.includes('awards') ? 'border-accent shadow-2xl shadow-accent/5 ring-4 ring-accent/10' : 'border-[var(--theme-border)] shadow-sm'}`}>
          <SectionHeader 
            icon={Star} 
            title="荣誉汇总" 
            description="Awards Summary"
            isOpen={openSections.includes('awards')} 
            onToggle={() => toggleSection('awards')}
          />
          {openSections.includes('awards') && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">获奖寄语</label>
                    <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Awards Quote</span>
                  </div>
                  <button 
                    onClick={() => handleAIEdit(data.awardsQuote || '', '荣誉奖项', 'awardsQuote')}
                    disabled={isPolishing['awardsQuote']}
                    className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 text-accent rounded-[32px] text-[10px] font-bold hover:bg-accent/20 active:scale-95 transition-all disabled:opacity-30"
                  >
                    {isPolishing['awardsQuote'] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI 编辑
                  </button>
                </div>
                <textarea
                  value={data.awardsQuote}
                  onChange={e => onChange({ ...data, awardsQuote: e.target.value })}
                  placeholder="输入一段激励人心的话语..."
                  className="w-full p-5 border border-white/5 rounded-[32px] text-sm bg-[#2c2c2e] focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all font-bold text-white outline-none min-h-[140px] resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-6 pt-8 border-t border-[var(--theme-border)]">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">奖项列表</label>
                    <span className="text-[9px] text-[var(--theme-label)] opacity-60 font-bold uppercase">Awards List</span>
                  </div>
                  <button 
                    onClick={() => {
                      const newAward = { id: Date.now().toString(), name: '', date: '', level: '' };
                      onChange({ ...data, awards: [...data.awards, newAward] });
                    }}
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-accent text-[#1A1C1E] rounded-[32px] text-[13px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"
                  >
                    <Plus size={18} />
                    添加奖项
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {data.awards.map((award, index) => (
                    <div key={award.id} className="p-6 bg-gradient-to-br from-[#1c1c1e] to-[#252529] rounded-[36px] border border-white/5 space-y-6 relative group hover:border-accent/30 transition-all shadow-xl hover:shadow-accent/5 duration-500 overflow-hidden">
                      <div className="flex items-center gap-6 relative z-10">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <div className="flex flex-col ml-1">
                              <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">奖项名称</label>
                              <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Award Name</span>
                            </div>
                            <input 
                              value={award.name} 
                              onChange={e => {
                                const newAwards = [...data.awards];
                                newAwards[index].name = e.target.value;
                                onChange({ ...data, awards: newAwards });
                              }}
                              placeholder="如：三好学生"
                              className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[28px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent/50 transition-all text-white placeholder:text-white/10"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex flex-col ml-1">
                              <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">级别/等级</label>
                              <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Level</span>
                            </div>
                            <input 
                              value={award.level} 
                              onChange={e => {
                                const newAwards = [...data.awards];
                                newAwards[index].level = e.target.value;
                                onChange({ ...data, awards: newAwards });
                              }}
                              placeholder="如：校级一等奖"
                              className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[28px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent/50 transition-all text-white placeholder:text-white/10"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex flex-col ml-1">
                              <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">获奖时间</label>
                              <span className="text-[9px] text-[var(--theme-label)] opacity-40 font-bold uppercase">Date</span>
                            </div>
                            <input 
                              type="month"
                              value={award.date} 
                              onChange={e => {
                                const newAwards = [...data.awards];
                                newAwards[index].date = e.target.value;
                                onChange({ ...data, awards: newAwards });
                              }}
                              className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[28px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent/50 transition-all text-white"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const newAwards = data.awards.filter(a => a.id !== award.id);
                            onChange({ ...data, awards: newAwards });
                          }}
                          className="w-12 h-12 flex items-center justify-center text-white/20 hover:text-white hover:bg-red-500 rounded-[20px] transition-all bg-white/5 shadow-sm active:scale-95 shrink-0"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 荣誉奖状 */}
        <div className={`bg-[var(--theme-card)] rounded-[32px] transition-all duration-700 overflow-hidden border ${openSections.includes('certificates') ? 'border-accent shadow-2xl shadow-accent/5 ring-4 ring-accent/10' : 'border-[var(--theme-border)] shadow-sm'}`}>
          <SectionHeader 
            icon={AwardIcon} 
            title="荣誉奖状" 
            description="Certificates"
            isOpen={openSections.includes('certificates')} 
            onToggle={() => toggleSection('certificates')}
          />
          {openSections.includes('certificates') && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between ml-1">
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">证书展示</label>
                  <span className="text-[9px] text-accent font-bold uppercase">Certificates</span>
                </div>
                <button 
                  onClick={() => triggerUpload('awards')}
                  className="flex items-center gap-2.5 px-6 py-3.5 bg-accent text-[#1A1C1E] rounded-[32px] text-[13px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"
                >
                  <Plus size={18} />
                  添加证书
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {data.certificates.map((cert, index) => (
                  <div key={cert.id} className="relative group rounded-[40px] overflow-hidden border border-white/5 bg-gradient-to-br from-[#1c1c1e] to-[#252529] aspect-[3/4] flex flex-col shadow-xl hover:shadow-accent/10 transition-all duration-700">
                    <img src={cert.url} className="w-full h-full object-cover flex-1 transition-transform duration-700 group-hover:scale-110" alt={cert.caption} />
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-black/60 backdrop-blur-xl translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <input 
                        value={cert.caption} 
                        onChange={e => {
                          const newCerts = [...data.certificates];
                          newCerts[index].caption = e.target.value;
                          onChange({ ...data, certificates: newCerts });
                        }}
                        className="w-full bg-transparent text-white text-[10px] font-black outline-none border-b border-white/20 pb-2 focus:border-accent transition-colors uppercase tracking-widest"
                        placeholder="证书名称..."
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newCerts = data.certificates.filter(c => c.id !== cert.id);
                        onChange({ ...data, certificates: newCerts });
                      }}
                      className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-white/20 hover:text-white hover:bg-red-500 rounded-[20px] transition-all bg-white/5 shadow-sm hover:shadow-md active:scale-95 shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 个人作品集 */}
        <div className={`bg-[var(--theme-card)] rounded-[32px] transition-all duration-700 overflow-hidden border ${openSections.includes('portfolio') ? 'border-accent shadow-2xl shadow-accent/5 ring-4 ring-accent/10' : 'border-[var(--theme-border)] shadow-sm'}`}>
          <SectionHeader 
            icon={Frame} 
            title="个人作品集" 
            description="Personal Portfolio"
            isOpen={openSections.includes('portfolio')} 
            onToggle={() => toggleSection('portfolio')}
          />
          {openSections.includes('portfolio') && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="space-y-4">
                <div className="flex flex-col ml-1">
                  <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">个人网站/主页</label>
                  <span className="text-[9px] text-accent font-bold uppercase">Personal Website</span>
                </div>
                <input 
                  value={data.portfolio.website} 
                  onChange={e => updateNested('portfolio', 'website', e.target.value)} 
                  placeholder="https://your-portfolio.com"
                  className="w-full p-5 bg-[#2c2c2e] border border-white/5 rounded-[32px] text-sm font-bold outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all text-white"
                />
              </div>

              <div className="space-y-6 pt-6 border-t border-[var(--theme-border)]">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">作品展示</label>
                    <span className="text-[9px] text-accent font-bold uppercase">Portfolio Images</span>
                  </div>
                  <button 
                    onClick={() => triggerUpload('portfolio')}
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-accent text-[#1A1C1E] rounded-[32px] text-[13px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"
                  >
                    <Plus size={18} />
                    添加作品
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {data.portfolio.images.map((img, index) => (
                    <div key={img.id} className="relative group rounded-[40px] overflow-hidden border border-white/5 bg-gradient-to-br from-[#1c1c1e] to-[#252529] aspect-square flex flex-col shadow-xl hover:shadow-accent/10 transition-all duration-700">
                      <img src={img.url} className="w-full h-full object-cover flex-1 transition-transform duration-700 group-hover:scale-110" alt={img.caption} />
                      <div className="absolute inset-x-0 bottom-0 p-6 bg-black/60 backdrop-blur-xl translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                        <input 
                          value={img.caption} 
                          onChange={e => {
                            const newImages = [...data.portfolio.images];
                            newImages[index].caption = e.target.value;
                            updateNested('portfolio', 'images', newImages);
                          }}
                          className="w-full bg-transparent text-white text-[10px] font-black outline-none border-b border-white/20 pb-2 focus:border-accent transition-colors uppercase tracking-widest"
                          placeholder="作品名称..."
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newImages = data.portfolio.images.filter(i => i.id !== img.id);
                          updateNested('portfolio', 'images', newImages);
                        }}
                        className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-white/20 hover:text-white hover:bg-red-500 rounded-[20px] transition-all bg-white/5 shadow-sm hover:shadow-md active:scale-95 shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 兴趣特长 */}
        <div className={`bg-[var(--theme-card)] rounded-[32px] transition-all duration-700 overflow-hidden border ${openSections.includes('hobbies') ? 'border-accent shadow-2xl shadow-accent/5 ring-4 ring-accent/10' : 'border-[var(--theme-border)] shadow-sm'}`}>
          <SectionHeader 
            icon={Heart} 
            title="兴趣特长" 
            description="Hobbies & Interests"
            isOpen={openSections.includes('hobbies')} 
            onToggle={() => toggleSection('hobbies')}
          />
          {openSections.includes('hobbies') && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">爱好描述</label>
                    <span className="text-[9px] text-accent font-bold uppercase">Hobby Description</span>
                  </div>
                  <button 
                    onClick={() => handleAIEdit(data.hobbies.content, '兴趣爱好', 'hobbies', 'content')}
                    disabled={isPolishing['hobbies']}
                    className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 text-accent rounded-[32px] text-[10px] font-bold hover:bg-accent/20 active:scale-95 transition-all disabled:opacity-30"
                  >
                    {isPolishing['hobbies'] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI 编辑
                  </button>
                </div>
                <textarea
                  value={data.hobbies.content}
                  onChange={e => updateNested('hobbies', 'content', e.target.value)}
                  placeholder="描述你的兴趣爱好，如：喜欢阅读、运动、绘画等..."
                  className="w-full p-5 border border-white/5 rounded-[32px] text-sm bg-[#2c2c2e] focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all font-bold text-white outline-none min-h-[140px] resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-col ml-1">
                  <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">照片展示形状</label>
                  <span className="text-[9px] text-accent font-bold uppercase">Photo Shape</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {HOBBY_SHAPES.map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => updateNested('hobbies', 'imageShape', shape.id)}
                      className={`flex items-center justify-center gap-3 p-4 rounded-[24px] border transition-all active:scale-95 ${data.hobbies.imageShape === shape.id ? 'bg-accent border-accent text-[#1A1C1E] shadow-lg shadow-accent/20' : 'bg-[#2c2c2e] border-white/5 text-white/40 hover:border-accent/40 hover:bg-[#1c1c1e]'}`}
                    >
                      <shape.icon size={18} />
                      <span className="text-[10px] font-bold">{shape.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-[var(--theme-border)]">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">特长标签</label>
                    <span className="text-[9px] text-accent font-bold uppercase">Specialties</span>
                  </div>
                  <button 
                    onClick={() => {
                      const newSpecs = [...data.hobbies.specialties, '新特长'];
                      updateNested('hobbies', 'specialties', newSpecs);
                    }}
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-accent text-[#1A1C1E] rounded-[32px] text-[13px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"
                  >
                    <Plus size={18} />
                    添加特长
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {data.hobbies.specialties.map((spec, index) => (
                    <div key={index} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-[#1c1c1e] to-[#252529] border border-white/5 rounded-[32px] group hover:border-accent/30 hover:shadow-md transition-all duration-300">
                      <input 
                        value={spec}
                        onChange={e => {
                          const newSpecs = [...data.hobbies.specialties];
                          newSpecs[index] = e.target.value;
                          updateNested('hobbies', 'specialties', newSpecs);
                        }}
                        className="bg-transparent text-xs font-bold text-white/90 outline-none min-w-[80px]"
                        placeholder="输入特长..."
                      />
                      <button 
                        onClick={() => {
                          const newSpecs = data.hobbies.specialties.filter((_, i) => i !== index);
                          updateNested('hobbies', 'specialties', newSpecs);
                        }}
                        className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-white hover:bg-red-500 rounded-full transition-all bg-white/5 shadow-sm active:scale-95 shrink-0 ml-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-[var(--theme-border)]">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">
                      爱好照片 <span className="text-accent ml-1">(最多5张)</span>
                    </label>
                    <span className="text-[9px] text-accent font-bold uppercase">Hobby Photos</span>
                  </div>
                  <button 
                    onClick={() => triggerUpload('hobbies')}
                    disabled={data.hobbies.images.length >= 5}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-[32px] text-xs font-bold transition-all shadow-lg 
                      ${data.hobbies.images.length >= 5 
                        ? 'bg-white/5 text-white/20 cursor-not-allowed shadow-none' 
                        : 'bg-accent text-[#1A1C1E] hover:scale-105 active:scale-95 shadow-accent/20'}`}
                  >
                    <Plus size={14} />
                    {data.hobbies.images.length >= 5 ? '已达上限' : '添加照片'}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.hobbies.images.map((img, index) => (
                    <div key={img.id} className="relative group rounded-[40px] overflow-hidden border border-white/5 bg-gradient-to-br from-[#1c1c1e] to-[#252529] aspect-[4/3] flex flex-col shadow-xl hover:shadow-accent/10 hover:-translate-y-1 transition-all duration-300">
                      <img src={img.url} className="w-full h-full object-cover flex-1" alt={img.caption} />
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-black/60 backdrop-blur-xl translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <input 
                          value={img.caption} 
                          onChange={e => {
                            const newImages = [...data.hobbies.images];
                            newImages[index].caption = e.target.value;
                            updateNested('hobbies', 'images', newImages);
                          }}
                          className="w-full bg-transparent text-white text-[10px] font-bold outline-none border-b border-white/20 pb-1 focus:border-accent transition-colors"
                          placeholder="照片描述..."
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newImages = data.hobbies.images.filter(i => i.id !== img.id);
                          updateNested('hobbies', 'images', newImages);
                        }}
                        className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-white/20 hover:text-white hover:bg-red-500 rounded-[20px] transition-all bg-white/5 shadow-sm hover:shadow-md active:scale-95 shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 社会实践 */}
        <div className={`bg-[var(--theme-card)] rounded-[32px] transition-all duration-700 overflow-hidden border ${openSections.includes('socialPractice') ? 'border-accent shadow-2xl shadow-accent/5 ring-4 ring-accent/10' : 'border-[var(--theme-border)] shadow-sm'}`}>
          <SectionHeader 
            icon={Users} 
            title="社会实践" 
            description="Social Practice"
            isOpen={openSections.includes('socialPractice')} 
            onToggle={() => toggleSection('socialPractice')}
          />
          {openSections.includes('socialPractice') && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">实践描述</label>
                    <span className="text-[9px] text-accent font-bold uppercase">Practice Description</span>
                  </div>
                  <button 
                    onClick={() => handleAIEdit(data.socialPractice.content, '社会实践', 'socialPractice', 'content')}
                    disabled={isPolishing['socialPractice']}
                    className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 text-accent rounded-[32px] text-[10px] font-bold hover:bg-accent/20 active:scale-95 transition-all disabled:opacity-30"
                  >
                    {isPolishing['socialPractice'] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI 编辑
                  </button>
                </div>
                <textarea
                  value={data.socialPractice.content}
                  onChange={e => updateNested('socialPractice', 'content', e.target.value)}
                  placeholder="描述你的社会实践经历，如：志愿者活动、社会调研等..."
                  className="w-full p-5 border border-white/5 rounded-[32px] text-sm bg-[#2c2c2e] focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all font-bold text-white outline-none min-h-[140px] resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-4 pt-6 border-t border-[var(--theme-border)]">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">实践照片</label>
                    <span className="text-[9px] text-accent font-bold uppercase">Practice Photos (Max 4)</span>
                  </div>
                  {data.socialPractice.images.length < 4 && (
                    <button 
                      onClick={() => triggerUpload('socialPractice')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-accent text-[#1A1C1E] rounded-[32px] text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"
                    >
                      <Plus size={14} />
                      添加照片
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.socialPractice.images.map((img, index) => (
                    <div key={img.id} className="relative group rounded-[40px] overflow-hidden border border-white/5 bg-gradient-to-br from-[#1c1c1e] to-[#252529] aspect-[4/3] flex flex-col shadow-xl hover:shadow-accent/10 hover:-translate-y-1 transition-all duration-300">
                      <img src={img.url} className="w-full h-full object-cover flex-1" alt={img.caption} />
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-black/60 backdrop-blur-xl translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <input 
                          value={img.caption} 
                          onChange={e => {
                            const newImages = [...data.socialPractice.images];
                            newImages[index].caption = e.target.value;
                            updateNested('socialPractice', 'images', newImages);
                          }}
                          className="w-full bg-transparent text-white text-[10px] font-bold outline-none border-b border-white/20 pb-1 focus:border-accent transition-colors"
                          placeholder="照片描述..."
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newImages = data.socialPractice.images.filter(i => i.id !== img.id);
                          updateNested('socialPractice', 'images', newImages);
                        }}
                        className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-white/20 hover:text-white hover:bg-red-500 rounded-[20px] transition-all bg-white/5 shadow-sm hover:shadow-md active:scale-95 shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 自荐推荐 */}
        <div className={`bg-[var(--theme-card)] rounded-[32px] transition-all duration-700 overflow-hidden border ${openSections.includes('essays') ? 'border-accent shadow-2xl shadow-accent/5 ring-4 ring-accent/10' : 'border-[var(--theme-border)] shadow-sm'}`}>
          <SectionHeader 
            icon={FileText} 
            title="自荐推荐" 
            description="Essays & Recommendation"
            isOpen={openSections.includes('essays')} 
            onToggle={() => toggleSection('essays')}
          />
          {openSections.includes('essays') && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">
                      自我介绍 <span className="text-accent ml-1">(建议400字以内)</span>
                    </label>
                    <span className="text-[9px] text-accent font-bold uppercase">Self Introduction</span>
                  </div>
                  <button 
                    onClick={() => handleAIEdit(data.coverLetter, '自我介绍', 'coverLetter')}
                    disabled={isPolishing['coverLetter']}
                    className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 text-accent rounded-[32px] text-[10px] font-bold hover:bg-accent/20 active:scale-95 transition-all disabled:opacity-30"
                  >
                    {isPolishing['coverLetter'] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI 编辑
                  </button>
                </div>
                <textarea
                  value={data.coverLetter}
                  onChange={e => onChange({ ...data, coverLetter: e.target.value.slice(0, 450) })}
                  placeholder="介绍一下你自己，让老师更了解你..."
                  className="w-full p-5 border border-white/5 rounded-[32px] text-sm bg-[#2c2c2e] focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all font-bold text-white outline-none min-h-[240px] resize-none leading-relaxed"
                />
                <div className="flex justify-end pr-4">
                  <span className={`text-[10px] font-bold ${data.coverLetter.length > 400 ? 'text-red-500' : 'text-white/40'}`}>
                    {data.coverLetter.length} / 400
                  </span>
                </div>

                {/* 自荐信图片上传 */}
                <div className="space-y-4 pt-4">
                  <div className="flex flex-col ml-1 mb-2">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">自荐信图片 (上传后将替代文字和格子)</label>
                    <span className="text-[9px] text-accent font-bold uppercase">Self-Recommendation Image</span>
                  </div>
                  
                  {data.coverLetterImage ? (
                    <div className="relative group rounded-[40px] overflow-hidden border border-white/5 aspect-[4/3] max-w-lg mx-auto bg-gradient-to-br from-[#1c1c1e] to-[#252529] shadow-xl hover:shadow-accent/10 transition-all duration-500">
                      <img src={data.coverLetterImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Cover Letter" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-xl">
                        <button 
                          onClick={() => triggerUpload('coverLetter')} 
                          className="w-14 h-14 bg-white text-black rounded-[24px] hover:scale-110 active:scale-95 transition-all shadow-2xl flex items-center justify-center"
                          title="更换图片"
                        >
                          <ImageIcon size={24} />
                        </button>
                        <button 
                          onClick={() => onChange({ ...data, coverLetterImage: '' })} 
                          className="w-14 h-14 bg-red-500 text-white rounded-[24px] hover:scale-110 active:scale-95 transition-all shadow-2xl flex items-center justify-center"
                          title="删除图片"
                        >
                          <Trash2 size={24} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => triggerUpload('coverLetter')}
                      className="group w-full py-12 border-2 border-dashed border-white/5 rounded-[40px] text-white/40 hover:border-accent/40 hover:text-white hover:bg-[#2c2c2e]/50 transition-all duration-500 flex flex-col items-center justify-center gap-4 active:scale-[0.98]"
                    >
                      <div className="w-16 h-16 rounded-[28px] bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:bg-accent/10 group-hover:text-accent">
                        <Upload size={32} />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-black uppercase tracking-[0.1em] text-white/90">点击上传自荐信照片</span>
                        <span className="text-[9px] opacity-40 font-bold uppercase tracking-widest">Support JPG, PNG formats</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-[var(--theme-border)]">
                <div className="flex flex-col ml-1 mb-2">
                  <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">老师推荐信/作品</label>
                  <span className="text-[9px] text-accent font-bold uppercase">Recommendation</span>
                </div>
                
                {data.recommendationLetterImage ? (
                  <div className="relative group rounded-[40px] overflow-hidden border border-white/5 aspect-[4/3] max-w-lg mx-auto bg-gradient-to-br from-[#1c1c1e] to-[#252529] shadow-xl hover:shadow-accent/10 transition-all duration-500">
                    <img src={data.recommendationLetterImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Recommendation" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-xl">
                      <button 
                        onClick={() => triggerUpload('recommendation')} 
                        className="w-14 h-14 bg-white text-black rounded-[24px] hover:scale-110 active:scale-95 transition-all shadow-2xl flex items-center justify-center"
                        title="更换图片"
                      >
                        <ImageIcon size={24} />
                      </button>
                      <button 
                        onClick={() => onChange({ ...data, recommendationLetterImage: '' })} 
                        className="w-14 h-14 bg-red-500 text-white rounded-[24px] hover:scale-110 active:scale-95 transition-all shadow-2xl flex items-center justify-center"
                        title="删除图片"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => triggerUpload('recommendation')}
                    className="group w-full py-20 border-2 border-dashed border-white/5 rounded-[40px] text-white/40 hover:border-accent/40 hover:text-white hover:bg-[#2c2c2e]/50 transition-all duration-500 flex flex-col items-center justify-center gap-6 active:scale-[0.98]"
                  >
                    <div className="w-24 h-24 rounded-[36px] bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:bg-accent/10 group-hover:text-accent">
                      <Upload size={40} />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm font-black uppercase tracking-[0.2em] text-white/90">点击上传推荐信或作品照片</span>
                      <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Support JPG, PNG formats</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 封底 & 寄语 */}
        <div className={`bg-[var(--theme-card)] rounded-[32px] transition-all duration-700 overflow-hidden border ${openSections.includes('closing') ? 'border-accent shadow-2xl shadow-accent/5 ring-4 ring-accent/10' : 'border-[var(--theme-border)] shadow-sm'}`}>
          <SectionHeader 
            icon={CheckCircle} 
            title="封底 & 寄语" 
            description="Closing & Message"
            isOpen={openSections.includes('closing')} 
            onToggle={() => toggleSection('closing')}
          />
          {openSections.includes('closing') && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-[var(--theme-label)] opacity-90 uppercase tracking-[0.2em]">结束语/寄语</label>
                    <span className="text-[9px] text-accent font-bold uppercase">Closing Message</span>
                  </div>
                  <button 
                    onClick={handleGenerateClosing}
                    disabled={isPolishing['closingMessage']}
                    className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 text-accent rounded-[32px] text-[10px] font-bold hover:bg-accent/20 active:scale-95 transition-all disabled:opacity-30"
                  >
                    {isPolishing['closingMessage'] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI 编辑
                  </button>
                </div>
                <textarea
                  value={data.closingMessage}
                  onChange={e => onChange({ ...data, closingMessage: e.target.value })}
                  placeholder="写下最后的心里话..."
                  className="w-full p-5 border border-white/5 rounded-[32px] text-sm bg-[#2c2c2e] focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all font-bold text-white outline-none min-h-[140px] resize-none leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* AI 编辑弹窗 */}
      {aiEditConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-12">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={() => setAiEditConfig(prev => ({ ...prev, isOpen: false }))} />
          <div className="relative bg-[#1c1c1e] w-full max-w-2xl md:max-w-4xl rounded-[48px] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 md:p-16 space-y-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[28px] bg-accent/20 text-accent flex items-center justify-center shadow-inner">
                  <Sparkles size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">AI 智能编辑</h3>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-[0.3em]">AI Intelligent Editor & Generator</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex flex-col ml-1">
                  <label className="text-xs font-black text-white/90 uppercase tracking-[0.2em]">编辑指令 (可选)</label>
                  <span className="text-[10px] text-white/40 font-bold uppercase">What would you like AI to do?</span>
                </div>
                <textarea
                  autoFocus
                  value={aiEditConfig.instruction}
                  onChange={e => setAiEditConfig(prev => ({ ...prev, instruction: e.target.value }))}
                  placeholder="例如：润色得更生动一些、字数再多一点、口吻要更诚恳..."
                  className="w-full p-8 border border-white/10 rounded-[40px] text-lg bg-[#2c2c2e] focus:ring-8 focus:ring-accent/20 focus:border-accent transition-all font-bold text-white outline-none min-h-[240px] resize-none leading-relaxed placeholder:text-white/20"
                />
              </div>

              <div className="bg-black/40 p-8 rounded-[40px] border border-white/5">
                <div className="flex flex-col mb-4">
                  <label className="text-xs font-black text-white/30 uppercase tracking-widest">当前内容参考 (Reference)</label>
                </div>
                <p className="text-base font-bold text-white/50 line-clamp-6 leading-relaxed italic">
                  "{aiEditConfig.text || '暂无内容'}"
                </p>
              </div>

              <div className="flex gap-6 pt-4">
                <button
                  onClick={() => setAiEditConfig(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-6 rounded-[32px] border border-white/10 text-base font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all active:scale-95"
                >
                  取消
                </button>
                <button
                  onClick={executeAIEdit}
                  className="flex-1 py-6 rounded-[32px] bg-accent text-white text-base font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-accent/30"
                >
                  立即执行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeForm;

import React, { forwardRef } from 'react';
import { ResumeData, ThemeType, HobbyShape, ImageItem, AvatarFrameType, AvatarShape, LayoutType } from '../types';
import { Phone, MapPin, Award, BookOpen, User, Users, Star, Quote, Heart, FileText, Palette, Scissors, Ticket, Smile, Mail, MessageSquare } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  scale?: number;
  layoutMode?: 'single' | 'grid';
  isPrinting?: boolean;
  showWatermark?: boolean;
}

const chunk = <T,>(arr: T[] | undefined | null, size: number): T[][] => {
  if (!arr || !Array.isArray(arr)) return [];
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
};

const isLightColor = (color: string) => {
  if (!color || typeof color !== 'string') return false;
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 185; // Threshold for "light" color
};

const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(({ data, scale = 1, layoutMode = 'single', isPrinting = false, showWatermark = false }, ref) => {
  
  const getThemeStyles = () => {
    const baseColor = data.themeColor || '#D9F217';
    const isBaseColorLight = isLightColor(baseColor);
    const layout = data.layout || LayoutType.Classic;
    
    // For text that needs to be visible against the primary color
    const contrastText = isBaseColorLight ? '#1e293b' : '#ffffff';
    // For primary color used as text on white background - if too light, use a darkened version
    const readablePrimary = isBaseColorLight ? '#475569' : baseColor; 
    
    // Define gradient mappings
    const gradients: Record<string, string> = {
      // ... same as before ...
      [ThemeType.DopaminePink]: 'linear-gradient(135deg, #ff4d4f, #ff85c0)',
      [ThemeType.DopamineYellow]: 'linear-gradient(135deg, #fadb14, #ffe58f)',
      [ThemeType.DopamineGreen]: 'linear-gradient(135deg, #D9F217, #7cb305)',
      [ThemeType.DopamineBlue]: 'linear-gradient(135deg, #1890ff, #69c0ff)',
      [ThemeType.DopaminePurple]: 'linear-gradient(135deg, #722ed1, #b37feb)',
      [ThemeType.DopamineOrange]: 'linear-gradient(135deg, #fa8c16, #ffd666)',
      
      // 马卡龙系列
      [ThemeType.MacaronMint]: 'linear-gradient(135deg, #D9F217, #fadb14)',
      [ThemeType.MacaronBlue]: 'linear-gradient(135deg, #bae7ff, #91d5ff)',
      [ThemeType.MacaronPurple]: 'linear-gradient(135deg, #efdbff, #d3adf7)',
      [ThemeType.MacaronPeach]: 'linear-gradient(135deg, #ffd8bf, #ffbb96)',
      [ThemeType.MacaronGreen]: 'linear-gradient(135deg, #D9F217, #7cb305)',
      [ThemeType.MacaronCream]: 'linear-gradient(135deg, #fffbe6, #fff1b8)',
      
      // 中国风系列
      [ThemeType.ChineseInk]: 'linear-gradient(135deg, #262626, #595959)',
      [ThemeType.ChineseBamboo]: 'linear-gradient(135deg, #D9F217, #7cb305)',
      [ThemeType.ChineseBlue]: 'linear-gradient(135deg, #1d39c4, #597ef7)',
      [ThemeType.ChineseRed]: 'linear-gradient(135deg, #a8071a, #cf1322)',
      [ThemeType.ChineseGold]: 'linear-gradient(135deg, #874d00, #d4b106)',
      [ThemeType.ChineseJade]: 'linear-gradient(135deg, #237804, #73d13d)',
      
      // 欧美复古系列
      [ThemeType.RetroBrown]: 'linear-gradient(135deg, #873800, #ad4e00)',
      [ThemeType.RetroGreen]: 'linear-gradient(135deg, #00474f, #006d75)',
      [ThemeType.RetroDeepGreen]: 'linear-gradient(135deg, #262626, #135200)',
      [ThemeType.RetroWine]: 'linear-gradient(135deg, #5c0011, #a8071a)',
      [ThemeType.RetroSlate]: 'linear-gradient(135deg, #262626, #434343)',
      
      // 赛博朋克系列
      [ThemeType.CyberNeon]: 'linear-gradient(135deg, #eb2f96, #722ed1)',
      [ThemeType.CyberBlue]: 'linear-gradient(135deg, #0050b3, #4096ff)',
      [ThemeType.CyberElectric]: 'linear-gradient(135deg, #D9F217, #7cb305)',
      [ThemeType.CyberAcid]: 'linear-gradient(135deg, #D9F217, #7cb305)',
      
      // 大自然系列
      [ThemeType.NatureForest]: 'linear-gradient(135deg, #135200, #52c41a)',
      [ThemeType.NatureSunset]: 'linear-gradient(135deg, #d4380d, #faad14)',
      [ThemeType.NatureLake]: 'linear-gradient(135deg, #096dd9, #69c0ff)',
      [ThemeType.NatureOcean]: 'linear-gradient(135deg, #003a8c, #0050b3)',
      [ThemeType.NatureDesert]: 'linear-gradient(135deg, #874d00, #D9F217)',

      // 商务专业系列
      [ThemeType.ProfessionalBlue]: 'linear-gradient(135deg, #002766, #003a8c)',
      [ThemeType.ProfessionalSlate]: 'linear-gradient(135deg, #434343, #8c8c8c)',

      [ThemeType.GreenGradient]: 'linear-gradient(135deg, #D9F217, #7cb305)',
    };

    const isGradient = !!gradients[data.theme];
    const primaryBg = isGradient ? gradients[data.theme] : baseColor;

    const baseStyles = {
      wrapper: {
        '--theme-primary': baseColor,
        '--theme-readable-primary': readablePrimary,
        '--theme-secondary': `${baseColor}20`,
        '--theme-surface': `${baseColor}08`,
        '--theme-shadow': data.darkMode ? 'rgba(0,0,0,0.4)' : `${baseColor}15`,
        '--theme-text': isBaseColorLight ? '#334155' : '#1e293b',
        '--theme-contrast-text': contrastText,
        '--theme-primary-bg': primaryBg,
        '--theme-card': '#ffffff',
        '--theme-input': '#f8fafc',
        '--theme-border': baseColor,
        '--theme-accent': isBaseColorLight ? '#f43f5e' : '#fb7185',
      } as React.CSSProperties,
      pageClass: `a4-page bg-[var(--theme-card)] text-[var(--theme-text)] relative flex flex-col ${isPrinting ? 'shadow-none w-[210mm] h-[296.8mm] overflow-hidden mb-0 border-none !m-0' : 'shadow-[0_30px_60px_-15px_var(--theme-shadow)] h-[297mm] overflow-hidden'}`,
      headerClass: `h-28 px-[55px] flex items-center justify-between relative z-10 flex-shrink-0`,
      headerStyle: { background: 'var(--theme-primary-bg)', color: 'var(--theme-contrast-text)' },
      titleClass: 'text-2xl font-black tracking-[0.2em]',
      subTitleClass: 'opacity-70 text-xs font-bold uppercase tracking-widest whitespace-nowrap',
      sectionTitleClass: 'text-lg font-bold mb-4 pb-2 border-b-2 border-[var(--theme-secondary)] text-[var(--theme-readable-primary)] flex items-center gap-2 relative z-10',
      contentPanelClass: `mx-auto w-[684px] mt-8 mb-10 p-6 bg-[var(--theme-card)] rounded-3xl relative z-10 flex-1 flex flex-col border-[3px] border-[var(--theme-border)] shadow-sm ${isPrinting ? 'overflow-visible min-h-[900px]' : 'overflow-hidden min-h-0'}`,
      imageContainerClass: 'rounded-xl overflow-hidden border-[5px] border-[var(--theme-primary)] transition-all relative z-10 flex items-center justify-center ' + (isPrinting ? 'shadow-none' : 'shadow-lg shadow-[var(--theme-shadow)]'),
    };

    if (layout === LayoutType.Modern) {
      return {
        ...baseStyles,
        headerClass: `h-32 px-14 flex items-center justify-between relative z-10 flex-shrink-0`,
        titleClass: 'text-3xl font-black tracking-tight uppercase',
        subTitleClass: 'opacity-60 text-[10px] font-black tracking-[0.3em] uppercase',
        sectionTitleClass: 'text-xl font-black mb-6 pb-3 border-b-4 border-[var(--theme-primary)] text-dark flex items-center gap-3 relative z-10 uppercase',
        contentPanelClass: `mx-auto w-[700px] mt-10 mb-10 p-10 bg-[var(--theme-card)] rounded-none relative z-10 flex-1 flex flex-col border-l-8 border-[var(--theme-primary)] shadow-2xl ${isPrinting ? 'overflow-visible min-h-[900px]' : 'overflow-hidden min-h-0'}`,
        imageContainerClass: 'rounded-none overflow-hidden border-4 border-dark transition-all relative z-10 flex items-center justify-center ' + (isPrinting ? 'shadow-none' : 'shadow-[10px_10px_0px_0px_var(--theme-primary)]'),
      };
    }

    if (layout === LayoutType.Storybook) {
      return {
        ...baseStyles,
        headerClass: `h-32 px-14 flex items-center justify-between relative z-10 flex-shrink-0 bg-gradient-to-r from-[var(--theme-primary)]/20 to-[var(--theme-secondary)]/20`,
        headerStyle: { background: 'transparent', color: 'var(--theme-readable-primary)' },
        titleClass: 'text-3xl font-black tracking-tight transform -rotate-1 bg-white px-6 py-2 rounded-2xl shadow-sm border-2 border-[var(--theme-primary)]/10',
        subTitleClass: 'text-[10px] font-black tracking-widest uppercase opacity-40 italic',
        sectionTitleClass: 'text-xl font-black mb-6 pb-2 text-[var(--theme-primary)] flex items-center gap-3 relative z-10 before:content-[""] before:absolute before:bottom-0 before:left-0 before:w-12 before:h-1.5 before:bg-[var(--theme-primary)]/30 before:rounded-full',
        contentPanelClass: `mx-auto w-[684px] mt-8 mb-10 p-8 bg-white/80 backdrop-blur-sm rounded-[3rem] relative z-10 flex-1 flex flex-col border-4 border-dashed border-[var(--theme-primary)]/20 shadow-xl ${isPrinting ? 'overflow-visible min-h-[900px]' : 'overflow-hidden min-h-0'}`,
        imageContainerClass: 'rounded-[2rem] overflow-hidden border-[6px] border-white ring-4 ring-[var(--theme-primary)]/10 transition-all relative z-10 flex items-center justify-center ' + (isPrinting ? 'shadow-none' : 'shadow-xl transform hover:scale-[1.02] duration-300'),
      };
    }

    return baseStyles;
  };

  const layout = data.layout || LayoutType.Classic;
  const style = getThemeStyles();
  const certPages = chunk<ImageItem>(data.certificates, 4);
  const showPortfolio = !!(data.portfolio.website || (data.portfolio.images && data.portfolio.images.length > 0));
  const showSocialPractice = !!(data.socialPractice.content || (data.socialPractice.images && data.socialPractice.images.length > 0));
  const portfolioOffset = showPortfolio ? 1 : 0;
  const socialPracticeOffset = showSocialPractice ? 1 : 0;

  const PageBackground = () => {
    if (!data.pageBackground) return null;
    return (
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden print:z-0">
        <img 
          src={data.pageBackground} 
          className="absolute inset-0 w-full h-full object-cover opacity-[0.65]" 
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  };

  const WatermarkOverlay = () => {
    if (!showWatermark) return null;
    return (
      <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden flex flex-col items-center justify-center opacity-[0.08] select-none rotate-[-35deg] scale-150">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-20 mb-20 whitespace-nowrap">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="text-6xl font-black uppercase tracking-[0.5em] text-[var(--theme-primary)]">
                智绘简历 预览版
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const StorybookDecoration = () => {
    if (layout !== LayoutType.Storybook) return null;
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.15]">
        {/* Playful shapes */}
        <div className="absolute top-[8%] left-[4%] w-16 h-16 rounded-full border-4 border-[var(--theme-primary)] rotate-12 animate-pulse"></div>
        <div className="absolute top-[18%] right-[6%] w-12 h-12 bg-[var(--theme-primary)] rounded-2xl rotate-[30deg] opacity-60"></div>
        <div className="absolute top-[45%] left-[-2%] w-24 h-24 bg-accent/20 rounded-full blur-2xl"></div>
        <div className="absolute top-[65%] right-[-3%] w-32 h-32 bg-[var(--theme-primary)] opacity-10 rounded-full blur-3xl"></div>
        
        <div className="absolute bottom-[12%] left-[8%] transform -rotate-12">
          <Star size={40} className="text-[var(--theme-primary)] fill-current" />
        </div>
        
        <div className="absolute bottom-[22%] right-[10%] w-20 h-20 rounded-[2.5rem] border-4 border-dashed border-[var(--theme-primary)] -rotate-[20deg]"></div>
        
        {/* Wavy lines / Doodles using SVG */}
        <svg className="absolute top-[35%] right-[2%] w-24 h-12 text-[var(--theme-primary)] opacity-40" viewBox="0 0 100 40">
          <path d="M0 20 Q 25 5, 50 20 T 100 20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>

        <svg className="absolute bottom-[40%] left-[2%] w-20 h-10 text-[var(--theme-primary)] opacity-30" viewBox="0 0 80 30">
          <path d="M0 15 C 20 0, 60 30, 80 15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 4" />
        </svg>

        {/* Floating dots / Confetti */}
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="absolute rounded-full bg-[var(--theme-primary)]"
            style={{ 
              width: `${Math.random() * 6 + 4}px`,
              height: `${Math.random() * 6 + 4}px`,
              top: `${Math.random() * 90 + 5}%`, 
              left: `${Math.random() * 96 + 2}%`,
              opacity: 0.2 + Math.random() * 0.3,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          ></div>
        ))}
      </div>
    );
  };

  const RenderAvatar = ({ url, frameType, shape = AvatarShape.Circle, size = "w-48 h-48" }: { url: string, frameType: AvatarFrameType, shape?: AvatarShape, size?: string }) => {
    const getShapeStyles = (s: AvatarShape) => {
      switch (s) {
        case AvatarShape.Circle:
          return { borderRadius: '50%' };
        case AvatarShape.Square:
          return { borderRadius: '2rem' };
        case AvatarShape.Hexagon:
          return { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };
        case AvatarShape.Shield:
          // 修正后的盾牌形状：顶部微凸（向上），侧边圆润，底部尖锐
          return { clipPath: 'polygon(50% 0%, 85% 8%, 100% 35%, 100% 75%, 50% 100%, 0% 75%, 0% 35%, 15% 8%)' };
        default:
          return { borderRadius: '50%' };
      }
    };

    const shapeStyle = getShapeStyles(shape);
    const isClipPath = shape === AvatarShape.Hexagon || shape === AvatarShape.Shield;
    
    // 统一处理阴影和边框
    const AvatarWrapper = ({ children, className = "", style = {} }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => {
      if (isClipPath) {
        // 提取边框相关的类
        const borderClasses = className.match(/border-[^ ]+|border|ring-[^ ]+|ring/g) || [];
        const otherClasses = className.replace(/border-[^ ]+|border|ring-[^ ]+|ring/g, "");
        
        // 如果有边框类，我们需要特殊处理，因为 clip-path 会剪裁掉普通的 border
        const hasBorder = borderClasses.length > 0;
        const isThemeBorder = className.includes('ring-[var(--theme-primary)]') || className.includes('border-[var(--theme-primary)]');
        const borderColorClass = isThemeBorder ? 'bg-[var(--theme-primary)]' : 'bg-[var(--theme-card)]';
        
        return (
          <div className={`${size} ${otherClasses}`} style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))', ...style }}>
            <div 
              className={`w-full h-full flex items-center justify-center ${hasBorder ? borderColorClass : 'bg-transparent'}`} 
              style={shapeStyle}
            >
              <div 
                className="w-[calc(100%-10px)] h-[calc(100%-10px)] bg-[var(--theme-card)] flex items-center justify-center overflow-hidden" 
                style={shapeStyle}
              >
                <div className="w-full h-full">
                  {children}
                </div>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className={`${size} overflow-hidden shadow-xl ${className}`} style={{ ...shapeStyle, ...style }}>
          {children}
        </div>
      );
    };

    const frameStyles: Record<AvatarFrameType, React.ReactNode> = {
      [AvatarFrameType.None]: (
        <AvatarWrapper>
          <img src={url} className="w-full h-full object-cover object-top" />
        </AvatarWrapper>
      ),
      [AvatarFrameType.Classic]: (
        <AvatarWrapper className="border-[8px] border-[var(--theme-card)] ring-4 ring-[var(--theme-primary)] ring-opacity-20">
          <img src={url} className="w-full h-full object-cover object-top" />
        </AvatarWrapper>
      ),
      [AvatarFrameType.Wreath]: (
        <div className="relative">
           <div className="absolute inset-[-30%] z-0">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
                <defs>
                  <linearGradient id="wreathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--theme-primary)" />
                    <stop offset="100%" stopColor="var(--theme-readable-primary)" />
                  </linearGradient>
                  <path id="leaf" d="M10 0 C20 10 10 25 0 35 C-10 25 -20 10 -10 0 Z" />
                </defs>
                
                <circle cx="100" cy="100" r="75" fill="none" stroke="var(--theme-primary)" strokeWidth="1" opacity="0.1" />
                
                {[...Array(16)].map((_, i) => {
                  const angle = (i * 360) / 16;
                  return (
                    <g key={i} transform={`rotate(${angle} 100 100) translate(100, 25)`}>
                      <use href="#leaf" transform="rotate(-45) scale(0.6)" fill="url(#wreathGradient)" opacity="0.9" />
                      <use href="#leaf" transform="rotate(45) scale(0.5) translate(10, 5)" fill="var(--theme-primary)" opacity="0.6" />
                      {i % 2 === 0 && (
                        <circle cx="0" cy="-5" r="4" fill="var(--theme-readable-primary)" opacity="0.8" />
                      )}
                    </g>
                  );
                })}
              </svg>
           </div>
           <AvatarWrapper className="border-[8px] border-[var(--theme-card)] relative z-10 ring-2 ring-[var(--theme-primary)] ring-offset-2 ring-offset-[var(--theme-card)]">
             <img src={url} className="w-full h-full object-cover object-top" />
           </AvatarWrapper>
        </div>
      ),
      [AvatarFrameType.Polygon]: (
        <div className="relative">
           <div className="absolute inset-[-20%] z-0">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
                <defs>
                  <path id="hexagon" d="M100 20 L169.3 60 L169.3 140 L100 180 L30.7 140 L30.7 60 Z" />
                </defs>
                <use href="#hexagon" fill="none" stroke="var(--theme-primary)" strokeWidth="8" strokeDasharray="20 10" opacity="0.3" transform="rotate(10 100 100)" />
                <use href="#hexagon" fill="none" stroke="var(--theme-readable-primary)" strokeWidth="4" opacity="0.5" transform="rotate(-5 100 100) scale(1.1)" transform-origin="center" />
                <use href="#hexagon" fill="var(--theme-card)" stroke="var(--theme-card)" strokeWidth="12" opacity="1" />
              </svg>
           </div>
           
           <AvatarWrapper className="border-4 border-[var(--theme-card)] relative z-20 ring-4 ring-[var(--theme-primary)]">
             <img src={url} className="w-full h-full object-cover object-top" />
           </AvatarWrapper>

           {[...Array(3)].map((_, i) => (
             <div 
               key={i}
               className="absolute w-6 h-6 border-4 border-[var(--theme-accent)] z-30 opacity-80 shadow-sm"
               style={{
                 top: `${20 + i * 30}%`,
                 left: i % 2 === 0 ? '-10%' : '100%',
                 transform: `rotate(${i * 45}deg)`,
                 borderRadius: i === 0 ? '50%' : i === 1 ? '4px' : '50% 0 50% 0'
               }}
             />
           ))}
        </div>
      ),
      [AvatarFrameType.Playful]: (
        <div className="relative">
           <div className="absolute inset-[-35%] z-0">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm">
                {[...Array(12)].map((_, i) => {
                  const angle = (i * Math.PI * 2) / 12;
                  const x = 100 + 85 * Math.cos(angle);
                  const y = 100 + 85 * Math.sin(angle);
                  const sizeValue = 12 + (i % 3) * 4;
                  const color = i % 2 === 0 ? 'var(--theme-primary)' : 'var(--theme-readable-primary)';
                  
                  return (
                    <g key={i} transform={`translate(${x}, ${y}) rotate(${i * 30})`}>
                      {i % 3 === 0 ? (
                        <path 
                          d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z" 
                          fill={color} 
                          className="opacity-80"
                          style={{ transform: `scale(${sizeValue/10})` }}
                        />
                      ) : i % 3 === 1 ? (
                        <circle r={sizeValue/2.5} fill={color} className="opacity-70" />
                      ) : (
                        <rect width={sizeValue} height={sizeValue} rx="4" fill={color} className="opacity-50" transform="rotate(45)" />
                      )}
                    </g>
                  );
                })}
              </svg>
           </div>
           
           <AvatarWrapper className="border-[10px] border-[var(--theme-card)] relative z-10 ring-4 ring-[var(--theme-primary)] ring-opacity-30">
             <img src={url} className="w-full h-full object-cover object-top" />
           </AvatarWrapper>

           <div className="absolute -top-4 -right-4 z-20">
              <div className="bg-[var(--theme-card)] rounded-full p-1 shadow-lg">
                <Star size={28} className="text-yellow-400 fill-yellow-400" />
              </div>
           </div>
           <div className="absolute -bottom-2 -left-4 z-20">
              <div className="bg-[var(--theme-card)] rounded-full p-1 shadow-lg">
                <Heart size={24} className="text-red-400 fill-red-400" />
              </div>
           </div>
           <div className="absolute top-1/2 -left-8 -translate-y-1/2 z-20 opacity-80">
              <div className="bg-[var(--theme-card)] rounded-lg p-1.5 shadow-md rotate-[-15deg]">
                <Quote size={16} className="text-[var(--theme-primary)]" />
              </div>
           </div>
        </div>
      ),
      [AvatarFrameType.Crayon]: (
        <div className="relative">
          <div className="absolute inset-[-15%] border-[12px] border-[var(--theme-primary)] opacity-40 blur-[2px]" style={{ ...shapeStyle, clipPath: shape === AvatarShape.Hexagon || shape === AvatarShape.Shield ? (shapeStyle.clipPath as string) : 'polygon(0% 15%, 15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%)' }}></div>
          <div className="absolute inset-[-10%] border-[8px] border-[var(--theme-readable-primary)] opacity-30" style={{ ...shapeStyle, transform: 'rotate(-2deg)' }}></div>
          <AvatarWrapper className="border-[12px] border-[var(--theme-card)] relative z-10 ring-4 ring-[var(--theme-secondary)] ring-offset-4 ring-offset-[var(--theme-card)]">
            <img src={url} className="w-full h-full object-cover" />
          </AvatarWrapper>
          <div className="absolute -bottom-6 -right-6 z-20 bg-[var(--theme-card)] p-2 rounded-2xl shadow-lg rotate-12">
            <Palette size={32} className="text-[var(--theme-primary)]" />
          </div>
        </div>
      ),
      [AvatarFrameType.Stamp]: (
        <div className="relative">
          <div className="absolute inset-[-12%] bg-[var(--theme-primary)] opacity-20" style={{ ...shapeStyle, clipPath: 'polygon(0% 10%, 5% 5%, 10% 0%, 15% 5%, 20% 10%, 25% 5%, 30% 0%, 35% 5%, 40% 10%, 45% 5%, 50% 0%, 55% 5%, 60% 10%, 65% 5%, 70% 0%, 75% 5%, 80% 10%, 85% 5%, 90% 0%, 95% 5%, 100% 10%, 95% 15%, 90% 20%, 95% 25%, 100% 30%, 95% 35%, 90% 40%, 95% 45%, 100% 50%, 95% 55%, 90% 60%, 95% 65%, 100% 70%, 95% 75%, 90% 80%, 95% 85%, 100% 90%, 95% 95%, 90% 100%, 85% 95%, 80% 90%, 75% 95%, 70% 100%, 65% 95%, 60% 90%, 55% 95%, 50% 100%, 45% 95%, 40% 90%, 35% 95%, 30% 100%, 25% 95%, 20% 90%, 15% 95%, 10% 100%, 5% 95%, 0% 90%, 5% 85%, 10% 80%, 5% 75%, 0% 70%, 5% 65%, 10% 60%, 5% 55%, 0% 50%, 5% 45%, 10% 40%, 5% 35%, 0% 30%, 5% 25%, 10% 20%, 5% 15%)' }}></div>
          <AvatarWrapper className="border-[12px] border-[var(--theme-card)] relative z-10 ring-4 ring-[var(--theme-readable-primary)] ring-opacity-10">
            <img src={url} className="w-full h-full object-cover" />
          </AvatarWrapper>
          <div className="absolute -top-4 -left-4 z-20 bg-[var(--theme-primary)] text-white px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-sm shadow-md -rotate-12">
            POSTAGE PAID
          </div>
        </div>
      ),
      [AvatarFrameType.PaperCut]: (
        <div className="relative">
          <div className="absolute inset-[-15%] bg-[var(--theme-card)] shadow-inner border-4 border-dashed border-[var(--theme-primary)] opacity-60" style={shapeStyle}></div>
          <div className="absolute inset-[-8%] bg-[var(--theme-secondary)] shadow-lg" style={{ ...shapeStyle, transform: 'rotate(3deg)' }}></div>
          <AvatarWrapper className="border-[6px] border-[var(--theme-card)] relative z-10">
            <img src={url} className="w-full h-full object-cover" />
          </AvatarWrapper>
          <div className="absolute top-0 right-0 z-20 p-2 bg-[var(--theme-card)] rounded-full shadow-md -translate-y-1/2 translate-x-1/2">
            <Scissors size={24} className="text-[var(--theme-readable-primary)]" />
          </div>
        </div>
      ),
      [AvatarFrameType.Cartoon]: (
        <div className="relative">
          <div className="absolute inset-[-20%] z-0">
            <svg viewBox="0 0 200 200" className="w-full h-full fill-[var(--theme-primary)] opacity-20">
              <path d="M50,20 Q100,0 150,20 T180,80 Q200,130 150,180 T50,180 Q0,130 20,80 T50,20" />
            </svg>
          </div>
          <AvatarWrapper className="border-[12px] border-[var(--theme-card)] relative z-10 ring-[6px] ring-[var(--theme-readable-primary)] ring-opacity-5">
            <img src={url} className="w-full h-full object-cover" />
          </AvatarWrapper>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[var(--theme-card)] px-4 py-1.5 rounded-full shadow-lg border-2 border-[var(--theme-primary)] flex items-center gap-2">
            <Smile size={18} className="text-[var(--theme-primary)]" />
            <span className="text-[10px] font-black text-[var(--theme-readable-primary)] uppercase tracking-wider">Hello!</span>
          </div>
        </div>
      )
    };

    return frameStyles[frameType] || frameStyles[AvatarFrameType.Classic];
  };

  // 分配素质报告：全部放在分页中展示
  const qualityPages = chunk<ImageItem>(data.qualityReports, 2); 

  return (
    <div 
      ref={ref}
      className={`origin-top-left flex font-sans resume-print-root
        ${(isPrinting ? 'single' : layoutMode) === 'grid' ? 'flex-row flex-wrap justify-center gap-10' : 'flex-col gap-20'} 
        ${isPrinting ? '!gap-0 !w-[210mm] !transform-none !m-0 !p-0 !shadow-none !flex-col' : ''}`}
      style={{ 
        transform: isPrinting ? 'none' : `scale(${scale})`, 
        ...style.wrapper,
        width: isPrinting ? '210mm' : ((layoutMode === 'grid' ? 'auto' : '210mm')),
        maxWidth: isPrinting ? '210mm' : ((layoutMode === 'grid' ? 'calc(210mm * 3 + 100px)' : '210mm')),
      }}
    >
      {/* ---------------- COVER PAGE ---------------- */}
      <div className={`a4-page ${style.pageClass} flex flex-col items-center overflow-hidden`}>
        <WatermarkOverlay />
        <StorybookDecoration />
        
        {layout === LayoutType.Modern ? (
          // Modern Cover
          <div className="relative w-full h-full flex flex-col">
            <div className="absolute top-0 left-0 w-full h-[75%] overflow-hidden">
              <img 
                src={data.cover.backgroundImage} 
                className="w-full h-full object-cover" 
                alt=""
              />
              <div className="absolute inset-0 bg-black/10"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[40%] bg-[var(--theme-card)] p-12 flex flex-col justify-end border-t-8 border-[var(--theme-primary)]">
               <div className="flex justify-between items-end">
                 <div>
                   <h1 className="text-7xl font-black text-dark tracking-tighter uppercase leading-none mb-2">
                     {data.cover.title}
                   </h1>
                   <div className="flex items-center gap-4">
                     <div className="h-1 w-20 bg-[var(--theme-primary)]"></div>
                     <h2 className="text-xl font-black uppercase tracking-widest opacity-40">{data.cover.subtitle}</h2>
                   </div>
                 </div>
                 {data.cover.showAvatar && (
                    <div className="mb-4">
                      <RenderAvatar 
                        url={data.basicInfo.avatarUrl} 
                        frameType={data.cover.avatarFrame} 
                        shape={data.cover.avatarShape}
                        size="w-40 h-40"
                      />
                    </div>
                 )}
               </div>
               <div className="mt-8 flex justify-between items-center">
                 <div className="space-y-1">
                   <h3 className="text-4xl font-black text-dark">{data.basicInfo.name}</h3>
                   <p className="text-lg font-bold opacity-50 uppercase tracking-widest">{data.basicInfo.school}</p>
                 </div>
                 <div className="text-right space-y-1">
                   <p className="text-sm font-black text-[var(--theme-primary)]">{data.contact.phone}</p>
                   <p className="text-xs font-bold opacity-40 italic">{data.cover.slogan}</p>
                 </div>
               </div>
            </div>
          </div>
        ) : layout === LayoutType.Storybook ? (
          // Storybook Cover
          <div className="relative w-full h-full flex flex-col items-center justify-center p-12 overflow-hidden bg-[var(--theme-secondary)]/10">
            {/* Playful background elements */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-[var(--theme-primary)] opacity-10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-64 h-64 bg-[var(--theme-primary)] opacity-5 rounded-full blur-3xl animate-pulse delay-700"></div>
            
            <div className="relative z-10 w-full max-w-2xl bg-white/60 backdrop-blur-sm p-10 rounded-[4rem] border-4 border-dashed border-[var(--theme-primary)]/30 flex flex-col items-center shadow-inner">
               <div className="mb-8 transform -rotate-2">
                  <h1 className="text-6xl font-black text-[var(--theme-primary)] tracking-tight drop-shadow-sm mb-2">
                    {data.cover.title}
                  </h1>
                  <div className="h-2 w-full bg-[var(--theme-primary)] opacity-20 rounded-full"></div>
               </div>

               {data.cover.showAvatar && (
                  <div className="mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <RenderAvatar 
                      url={data.basicInfo.avatarUrl} 
                      frameType={data.cover.avatarFrame} 
                      shape={data.cover.avatarShape}
                      size="w-52 h-52"
                    />
                  </div>
               )}

               <div className="text-center space-y-4 mb-10">
                  <h3 className="text-4xl font-black text-[var(--theme-readable-primary)] tracking-wider">
                    {data.basicInfo.name}
                  </h3>
                  <div className="inline-block px-6 py-2 bg-[var(--theme-primary)] text-white rounded-full font-bold text-lg shadow-lg transform -rotate-1">
                    {data.basicInfo.school}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8 w-full border-t-2 border-dashed border-[var(--theme-primary)]/20 pt-8">
                  <div className="flex items-center gap-3 justify-center">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--theme-secondary)] flex items-center justify-center text-[var(--theme-primary)] shadow-sm">
                      <Phone size={20} />
                    </div>
                    <span className="font-bold text-[var(--theme-readable-primary)]/70">{data.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--theme-secondary)] flex items-center justify-center text-[var(--theme-primary)] shadow-sm">
                      <Star size={20} />
                    </div>
                    <span className="font-bold text-[var(--theme-readable-primary)]/70 italic">{data.cover.slogan}</span>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          // Classic Cover (Original)
          <>
            <div className="absolute top-0 left-0 w-full h-[65%] overflow-hidden z-0">
              <img 
                src={data.cover.backgroundImage} 
                className="absolute inset-0 w-full h-full object-cover opacity-90" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[var(--theme-card)] to-transparent z-10"></div>
            </div>
            
            {data.cover.showAvatar && (
                <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                   <RenderAvatar 
                     url={data.basicInfo.avatarUrl} 
                     frameType={data.cover.avatarFrame} 
                     shape={data.cover.avatarShape}
                   />
                </div>
            )}

            <div className="absolute bottom-0 w-full h-[35%] flex flex-col items-center justify-start pt-12 z-20 bg-[var(--theme-card)] rounded-t-[3rem]">
               <h1 className="text-6xl font-extrabold text-[var(--theme-readable-primary)] mb-2 tracking-wide drop-shadow-sm">
                 {data.cover.title}
               </h1>
               {data.cover.subtitle && (
                 <h2 className="text-xl tracking-[0.3em] text-[var(--theme-readable-primary)] opacity-30 uppercase font-light mb-6">
                   {data.cover.subtitle}
                 </h2>
               )}
               <div className="w-16 h-1.5 bg-[var(--theme-primary)] rounded-full mb-8 opacity-50"></div>
               <div className="text-center space-y-2 mb-8">
                <h3 className="text-3xl font-bold text-[var(--theme-readable-primary)]">{data.basicInfo.name}</h3>
                <p className="text-[var(--theme-readable-primary)]/60 font-medium">{data.basicInfo.school}</p>
              </div>
              <div className="flex gap-6 text-sm text-[var(--theme-readable-primary)]/70 bg-[var(--theme-secondary)]/30 px-8 py-3 rounded-full border border-[var(--theme-primary)]/10 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <Phone size={14} className="text-[var(--theme-readable-primary)]" /> 
                  {data.contact.phone}
                </div>
                <div className="w-px h-4 bg-[var(--theme-primary)]/20"></div>
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-[var(--theme-readable-primary)]" />
                  {data.cover.slogan}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ---------------- PAGE 1 ---------------- */}
      <div className={`a4-page ${style.pageClass}`}>
        <PageBackground />
        <WatermarkOverlay />
        <StorybookDecoration />
        <div className={style.headerClass} style={style.headerStyle}>
          <span className={style.titleClass}>基本档案</span>
          <span className={style.subTitleClass}>Profile & Growth</span>
        </div>
        
        <div className={style.contentPanelClass}>
          <div className="flex gap-10 items-center mb-10 bg-[var(--theme-surface)] p-6 rounded-2xl border border-[var(--theme-primary)]/10">
             <div className="relative">
               <img src={data.basicInfo.avatarUrl} className="w-32 h-40 object-cover object-top rounded-xl shadow-lg border-2 border-[var(--theme-card)] relative z-10" />
               <div className="absolute -inset-2 bg-[var(--theme-primary)] opacity-10 rounded-2xl -rotate-3 z-0"></div>
             </div>
             <div className="flex-1 grid grid-cols-2 gap-y-5 gap-x-10 text-sm py-4">
                <div className="border-b border-[var(--theme-primary)]/10 pb-1">
                  <span className="text-[var(--theme-readable-primary)]/40 block text-[10px] font-black uppercase tracking-wider">姓名 / Name</span>
                  <span className="font-black text-xl text-[var(--theme-readable-primary)]">{data.basicInfo.name}</span>
                </div>
                <div className="border-b border-[var(--theme-primary)]/10 pb-1">
                  <span className="text-[var(--theme-readable-primary)]/40 block text-[10px] font-black uppercase tracking-wider">目标校 / Target</span>
                  <span className="font-black text-lg text-[var(--theme-readable-primary)]">{data.basicInfo.intendedSchool}</span>
                </div>
                <div className="border-b border-[var(--theme-primary)]/10 pb-1">
                  <span className="text-[var(--theme-readable-primary)]/40 block text-[10px] font-black uppercase tracking-wider">出生日期 / Birthday</span>
                  <span className="font-bold text-[var(--theme-readable-primary)]/70">{data.basicInfo.birthday}</span>
                </div>
                 <div className="border-b border-[var(--theme-primary)]/10 pb-1">
                  <span className="text-[var(--theme-readable-primary)]/40 block text-[10px] font-black uppercase tracking-wider">就读学校 / School</span>
                  <span className="font-bold text-[var(--theme-readable-primary)]/70">{data.basicInfo.school}</span>
                </div>
                <div className="col-span-2 border-b border-[var(--theme-primary)]/10 pb-1">
                  <span className="text-[var(--theme-readable-primary)]/40 block text-[10px] font-black uppercase tracking-wider">座右铭 / Motto</span>
                  <span className="font-bold text-[var(--theme-readable-primary)]/80 italic">“{data.basicInfo.motto}”</span>
                </div>
                <div className="col-span-2 pt-1 flex flex-wrap gap-x-8 gap-y-3">
                   <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-lg bg-[var(--theme-primary)] flex items-center justify-center text-white shadow-sm">
                       <Phone size={12} strokeWidth={3}/>
                     </div>
                     <span className="text-xs font-black text-[var(--theme-readable-primary)]/80">{data.contact.phone}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-lg bg-[var(--theme-primary)] flex items-center justify-center text-white shadow-sm">
                       <MapPin size={12} strokeWidth={3}/>
                     </div>
                     <span className="text-xs font-black text-[var(--theme-readable-primary)]/80">{data.contact.address}</span>
                   </div>
                </div>
             </div>
          </div>

          <section className="mb-12">
             <h3 className="text-sm font-black mb-5 pb-2 border-b-2 border-[var(--theme-secondary)] text-[var(--theme-readable-primary)] flex items-center gap-2">
               <Users size={16} strokeWidth={3}/> 家庭成员 / Family
             </h3>
             <div className="grid grid-cols-2 gap-4">
               {data.family.map((m, i) => (
                 <div key={i} className="bg-[var(--theme-secondary)] p-4 rounded-xl flex justify-between items-center border border-[var(--theme-primary)] border-opacity-10 hover:bg-[var(--theme-card)] transition-colors group">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg bg-[var(--theme-card)] flex items-center justify-center text-[var(--theme-primary)] font-black text-sm shadow-sm group-hover:bg-[var(--theme-primary)] group-hover:text-white transition-colors">
                       {m.relation[0]}
                     </div>
                     <div>
                       <div className="font-black text-sm text-[var(--theme-readable-primary)]">{m.relation}: {m.name}</div>
                       <div className="text-[10px] font-bold text-[var(--theme-readable-primary)]/50">{m.job}</div>
                     </div>
                   </div>
                   <div className="text-[11px] font-black text-[var(--theme-readable-primary)] bg-[var(--theme-card)] px-2.5 py-1.5 rounded-md shadow-sm border border-[var(--theme-primary)] border-opacity-5">{m.phone}</div>
                 </div>
               ))}
             </div>
          </section>
          
          <section className="mb-10">
             <div className="inline-block bg-[var(--theme-primary)] px-4 py-1.5 mb-6 shadow-[4px_4px_0px_0px_var(--theme-readable-primary)]">
               <h3 className="text-sm font-black text-[var(--theme-contrast-text)] flex items-center gap-2 tracking-widest">
                 我的成绩 / Grades
               </h3>
             </div>
             
             <div className="rounded-xl overflow-hidden border-2 border-[var(--theme-primary)] border-opacity-20 shadow-lg">
               <table className="w-full border-collapse">
                 <thead>
                   <tr className="bg-[var(--theme-primary)]">
                     <th className="py-3 px-4 text-[var(--theme-contrast-text)] text-[11px] font-black tracking-widest border-r border-[var(--theme-border)]/20">科目</th>
                     {data.grades[0]?.subjects.map((sub, i) => (
                       <th key={i} className="py-3 px-4 text-[var(--theme-contrast-text)] text-[11px] font-black tracking-widest border-r border-[var(--theme-border)]/20 last:border-r-0">
                         {sub.name}
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody>
                   {data.grades.map((grade, rowIndex) => (
                     <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-[var(--theme-secondary)] bg-opacity-10' : 'bg-[var(--theme-card)]'}>
                       <td className="py-3 px-4 text-center font-black text-[var(--theme-readable-primary)] border-r border-[var(--theme-primary)] border-opacity-20 text-[12px]">
                         {grade.rowName}
                       </td>
                       {grade.subjects.map((sub, subIndex) => (
                         <td key={subIndex} className={`py-3 px-4 text-center font-black text-[var(--theme-readable-primary)] border-r border-[var(--theme-primary)] border-opacity-20 last:border-r-0 text-base ${subIndex % 2 === 0 ? 'bg-[var(--theme-readable-primary)]/[0.03]' : ''}`}>
                           {sub.value}
                         </td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </section>
        </div>
        <div className="absolute bottom-4 right-8 text-xs text-[var(--theme-readable-primary)] opacity-40 z-10">01</div>
      </div>

      {/* ---------------- PAGE: QUALITY REPORTS (REMAINING) ---------------- */}
      {qualityPages.map((pageItems, pageIndex) => (
          <div key={`quality-${pageIndex}`} className={`a4-page ${style.pageClass}`}>
            <PageBackground />
            <WatermarkOverlay />
          <div className={style.headerClass} style={style.headerStyle}>
            <span className={style.titleClass}>素质表现</span>
            <span className={style.subTitleClass}>Comprehensive Evaluation {pageIndex + 2}</span>
          </div>
          <div className={style.contentPanelClass + " justify-center"}>
            <h3 className={style.sectionTitleClass}><BookOpen size={18}/> 素质报告 & 评价手册 (续)</h3>
            <div className="flex flex-col gap-y-4 px-4 py-2 justify-center min-h-0 overflow-hidden">
               {pageItems.map((item, i) => (
                 <div key={item.id || i} className={`w-full ${style.compactImageContainerClass} flex flex-col shadow-xl flex-1 min-h-0 overflow-hidden !max-h-[380px]`}>
                   <div className="flex-1 bg-[var(--theme-secondary)]/20 border-b border-[var(--theme-secondary)] overflow-hidden flex items-center justify-center">
                     <img 
                       src={item.url} 
                       className="max-w-full max-h-full object-contain" 
                       style={{ width: 'auto', height: 'auto', objectFit: 'contain' }}
                     />
                   </div>
                   {item.caption && (
                    <div className="bg-gradient-to-br from-[var(--theme-secondary)] to-[var(--theme-card)] p-2.5 flex items-center justify-center shrink-0">
                      <p className="text-[10px] font-black text-[var(--theme-readable-primary)] leading-tight text-center tracking-widest uppercase">
                        {item.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
           </div>
         </div>
         <div className="absolute bottom-4 right-8 text-xs text-[var(--theme-readable-primary)] opacity-40 z-10">{String(2 + pageIndex).padStart(2, '0')}</div>
       </div>
     ))}

     {/* ---------------- PAGE: HONORS ---------------- */}
     <div className={`a4-page ${style.pageClass}`}>
       <PageBackground />
       <WatermarkOverlay />
       <StorybookDecoration />
       <div className={style.headerClass} style={style.headerStyle}>
         <span className={style.titleClass}>荣誉汇总</span>
         <span className={style.subTitleClass}>Honors & Awards</span>
       </div>
       <div className={style.contentPanelClass}>
          <div className={`relative border-l-2 border-[var(--theme-primary)] pl-8 ml-4 flex flex-col justify-between py-2`}>
            <div className="space-y-4 flex flex-col justify-start">
              {data.awards.filter(a => a.name || a.date || a.level).map((award, i) => {
                // 根据数量自动计算高度和间距
                const count = data.awards.filter(a => a.name || a.date || a.level).length;
                const isCompact = count > 5;
                const isUltraCompact = count > 8;
                
                return (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-[var(--theme-card)] border-4 border-[var(--theme-primary)] z-10`} />
                    <div className={`bg-[var(--theme-card)] rounded-lg border-2 border-[var(--theme-primary)] border-opacity-30 hover:shadow-md transition-all relative group max-w-[92%] overflow-hidden shadow-sm
                      ${isUltraCompact ? 'p-2' : isCompact ? 'p-3' : 'p-4'}`}>
                      <div className="absolute inset-0 bg-[var(--theme-primary)] opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
                      <div className="relative z-10 flex justify-between items-center">
                        <div className="flex flex-col min-w-0 flex-1 mr-4">
                          <span className={`font-bold text-[var(--theme-readable-primary)] break-words leading-tight ${isUltraCompact ? 'text-sm' : isCompact ? 'text-base' : 'text-lg'}`}>
                            {award.name || '未命名荣誉'}
                          </span>
                          <span className={`text-[var(--theme-readable-primary)]/50 font-medium ${isUltraCompact ? 'text-[10px]' : 'text-xs'}`}>
                            {award.date || '年份未知'}
                          </span>
                        </div>
                        {award.level && (
                          <span 
                            style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-contrast-text)' }}
                            className={`rounded-md font-black uppercase tracking-wider shadow-sm text-center flex-shrink-0
                              ${isUltraCompact ? 'text-[10px] px-3 py-1 min-w-[50px]' : 'text-[14px] px-4 py-1.5 min-w-[80px]'}`}
                          >
                            {award.level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className={`p-6 bg-[var(--theme-secondary)] rounded-xl text-center opacity-60 mt-4
              ${data.awards.length > 8 ? 'scale-90 origin-bottom' : ''}`}>
              <Star className={`${data.awards.length > 8 ? 'w-10 h-10' : 'w-16 h-16'} mx-auto mb-2 text-[var(--theme-readable-primary)]`} />
              <p className={`font-serif italic text-[var(--theme-readable-primary)] ${data.awards.length > 8 ? 'text-xs' : 'text-sm'}`}>
                “ {data.awardsQuote || '每一份荣誉都是汗水的结晶'} ”
              </p>
            </div>
          </div>
       </div>
       <div className="absolute bottom-4 right-8 text-xs text-[var(--theme-readable-primary)] opacity-40 z-10">{String(2 + qualityPages.length).padStart(2, '0')}</div>
     </div>

     {/* ---------------- CERTIFICATES ---------------- */}
     {certPages.map((pageCerts, pageIndex) => (
       <div key={`cert-${pageIndex}`} className={`a4-page ${style.pageClass}`}>
         <PageBackground />
         <WatermarkOverlay />
         <StorybookDecoration />
         <div className={style.headerClass} style={style.headerStyle}>
           <span className={style.titleClass}>证书展示</span>
           <span className={style.subTitleClass}>Certificates {pageIndex + 1}</span>
         </div>
         <div className={style.contentPanelClass + " justify-center"}>
          <div className="grid grid-cols-2 grid-rows-2 gap-8 flex-1 min-h-0 overflow-hidden">
            {pageCerts.map((item, i) => (
               <div key={i} className={`${style.imageContainerClass} flex flex-col min-h-0 overflow-hidden !max-h-[350px]`}>
                 <div className="flex-1 bg-[var(--theme-secondary)]/30 flex items-center justify-center p-2 min-h-0">
                   <img src={item.url} className="max-w-full max-h-full object-contain shadow-sm" style={{ width: 'auto', height: 'auto' }} />
                 </div>
                 {item.caption && (
                    <div className="text-center text-[10px] font-black text-[var(--theme-readable-primary)] bg-gradient-to-br from-[var(--theme-secondary)] to-[var(--theme-card)] py-2 px-4 shrink-0 border-t border-[var(--theme-primary)]/10">
                      {item.caption}
                    </div>
                 )}
               </div>
             ))}
           </div>
         </div>
         <div className="absolute bottom-4 right-8 text-xs text-[var(--theme-readable-primary)] opacity-40 z-10">{String(qualityPages.length + pageIndex + 3).padStart(2, '0')}</div>
       </div>
     ))}

     {/* ---------------- PAGE: PORTFOLIO ---------------- */}
     {showPortfolio && (
       <div className={`a4-page ${style.pageClass}`}>
         <PageBackground />
         <WatermarkOverlay />
         <div className={style.headerClass} style={style.headerStyle}>
           <span className={style.titleClass}>个人作品集</span>
           <span className={style.subTitleClass}>Personal Portfolio</span>
         </div>
         <div className={style.contentPanelClass + " justify-center"}>
           <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-hidden">
             {/* 个人网站 */}
             {data.portfolio.website && (
               <div className="bg-[var(--theme-surface)] p-6 rounded-3xl border-2 border-[var(--theme-primary)] border-opacity-10 shadow-sm relative overflow-hidden shrink-0">
                 <div className="relative z-10 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-[var(--theme-primary)]/10 flex items-center justify-center text-[var(--theme-primary)]">
                       <Palette size={24} />
                     </div>
                     <div>
                       <h4 className="text-lg font-bold text-[var(--theme-readable-primary)]">个人主页</h4>
                       <p className="text-sm text-[var(--theme-readable-primary)]/60">{data.portfolio.website}</p>
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* 作品展示 */}
             {data.portfolio.images.length > 0 && (
               <div className="grid grid-cols-2 gap-4 content-start min-h-0 overflow-hidden flex-1">
                 {data.portfolio.images.slice(0, 8).map((item, i) => (
                   <div key={i} className={`${style.imageContainerClass} flex flex-col shadow-xl min-h-0 overflow-hidden !max-h-[220px]`}>
                     <div className="flex-1 bg-[var(--theme-secondary)]/20 overflow-hidden flex items-center justify-center">
                      <img src={item.url} className="max-w-full max-h-full object-contain" />
                    </div>
                     {item.caption && (
                       <div className="bg-gradient-to-br from-[var(--theme-secondary)] to-[var(--theme-card)] p-2 flex items-center justify-center shrink-0">
                         <p className="text-[10px] font-black text-[var(--theme-readable-primary)] leading-tight text-center tracking-widest">
                           {item.caption}
                         </p>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             )}
           </div>

           <div className="pt-6 border-t border-[var(--theme-primary)] border-opacity-10 flex items-center justify-center">
              <p className="text-sm font-medium italic text-[var(--theme-readable-primary)] opacity-60">
                “ 每一个作品都是成长的足迹 ”
              </p>
           </div>
         </div>
         <div className="absolute bottom-4 right-8 text-xs text-[var(--theme-readable-primary)] opacity-40 z-10">
          {String(qualityPages.length + certPages.length + 3).padStart(2, '0')}
        </div>
      </div>
    )}

    {/* ---------------- HOBBIES ---------------- */}
    <div className={`a4-page ${style.pageClass}`}>
      <PageBackground />
      <WatermarkOverlay />
      <div className={style.headerClass} style={style.headerStyle}>
        <span className={style.titleClass}>兴趣与特长</span>
        <span className={style.subTitleClass}>Hobbies & Specialties</span>
      </div>
      <div className={style.contentPanelClass + " justify-center"}>
         {/* 第一部分：核心特长 (勋章感设计) */}
         <section className="space-y-6">
            <h3 className="text-xl font-bold text-[var(--theme-readable-primary)] flex items-center gap-2 border-b-2 border-[var(--theme-secondary)] pb-2">
              <Award className="fill-[var(--theme-readable-primary)]" size={24}/> 核心特长 (Specialties)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {(data.hobbies.specialties || []).slice(0, 3).map((spec, i) => (
                <div key={i} className="relative group">
                  <div className="absolute inset-0 bg-[var(--theme-primary)] rounded-xl opacity-5 group-hover:opacity-10 transition-opacity" />
                  <div className="relative border-2 border-[var(--theme-primary)] border-opacity-20 p-4 rounded-xl flex flex-col items-center text-center space-y-2 bg-[var(--theme-card)] shadow-sm transition-all hover:-translate-y-1 hover:border-opacity-100">
                    <div className="w-10 h-10 rounded-full bg-[var(--theme-secondary)] flex items-center justify-center text-[var(--theme-readable-primary)]">
                      <Star size={20} className="fill-current" />
                    </div>
                    <span className="font-bold text-[var(--theme-readable-primary)] text-sm">{spec}</span>
                  </div>
                </div>
              ))}
            </div>
         </section>

         <section className="flex flex-col space-y-4 mt-8 flex-1 min-h-0 overflow-hidden">
            <h3 className="text-xl font-bold text-[var(--theme-readable-primary)] flex items-center gap-2 border-b-2 border-[var(--theme-secondary)] pb-2">
              <Heart className="fill-[var(--theme-readable-primary)]" size={24}/> 兴趣爱好 (Interests)
            </h3>
             
             <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
               {/* 左侧：更大的图片展示 */}
               <div className="flex-[1.2] grid grid-cols-2 gap-3 h-full content-start overflow-hidden">
                 {data.hobbies.images.slice(0, 5).map((item, i) => {
                   const shapeClass = 
                     data.hobbies.imageShape === HobbyShape.Circle ? 'rounded-full' : 
                     data.hobbies.imageShape === HobbyShape.Diamond ? 'rotate-45 scale-75 rounded-xl' :
                     data.hobbies.imageShape === HobbyShape.Hexagon ? '[clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)]' : 
                     'rounded-2xl';

                   return (
                     <div key={i} className={`relative group ${i === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'} overflow-hidden`}>
                       <div className={`w-full h-full overflow-hidden border-[5px] border-[var(--theme-primary)] ${shapeClass} transition-all relative shadow-lg shadow-[var(--theme-shadow)]`}>
                         <img src={item.url} className={`w-full h-full object-cover ${data.hobbies.imageShape === HobbyShape.Diamond ? '-rotate-45 scale-150' : ''}`} style={{ minWidth: '100%', minHeight: '100%' }} />
                         {item.caption && (
                           <div className="absolute bottom-0 left-0 right-0 bg-[var(--theme-readable-primary)] p-1 z-20">
                             <p className="text-white text-[9px] font-black text-center truncate px-2 drop-shadow-md">{item.caption}</p>
                           </div>
                         )}
                       </div>
                     </div>
                   )
                 })}
               </div>

               {/* 右侧：详细描述卡片 */}
               <div className="flex-1 min-h-0">
                 <div className="bg-[var(--theme-card)] p-5 rounded-3xl border-2 border-[var(--theme-secondary)] shadow-sm h-full relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5">
                     <Quote size={60} className="text-[var(--theme-readable-primary)]" />
                   </div>
                   <div className="relative z-10 h-full flex flex-col">
                     <h4 className="text-lg font-bold text-[var(--theme-readable-primary)] mb-3 flex items-center gap-2 shrink-0">
                       我的另一面
                     </h4>
                     <p className="text-[var(--theme-readable-primary)]/80 leading-relaxed text-sm whitespace-pre-wrap flex-1 overflow-hidden">
                       {data.hobbies.content}
                     </p>
                   </div>
                 </div>
               </div>
             </div>
          </section>
          
          <div className="h-16 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] -mx-8 -mb-8 flex items-center px-8 rounded-b-3xl">
            <p className="text-base font-medium italic opacity-90" style={{ color: 'var(--theme-contrast-text)' }}>
              “ 保持热忱，去探索未知的精彩世界 ”
            </p>
          </div>
       </div>
       <div className="absolute bottom-4 right-8 text-xs text-[var(--theme-readable-primary)] opacity-40 z-10">{String(qualityPages.length + certPages.length + portfolioOffset + 3).padStart(2, '0')}</div>
    </div>

    {/* ---------------- PAGE: SOCIAL PRACTICE ---------------- */}
    {showSocialPractice && (
      <div className={`a4-page ${style.pageClass}`}>
        <PageBackground />
        <WatermarkOverlay />
        <StorybookDecoration />
        <div className={style.headerClass} style={style.headerStyle}>
          <span className={style.titleClass}>社会实践</span>
          <span className={style.subTitleClass}>Social Practice</span>
        </div>
        <div className={style.contentPanelClass + " justify-center"}>
          <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-hidden">
            {/* 文字描述 */}
            {data.socialPractice.content && (
              <div className="bg-[var(--theme-surface)] p-6 rounded-3xl border-2 border-[var(--theme-primary)] border-opacity-10 shadow-sm relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Quote size={60} className="text-[var(--theme-readable-primary)]" />
                </div>
                <div className="relative z-10">
                  <h4 className="text-lg font-bold text-[var(--theme-readable-primary)] mb-2 flex items-center gap-2">
                    实践感悟
                  </h4>
                  <p className="text-[var(--theme-readable-primary)]/80 leading-relaxed text-sm whitespace-pre-wrap">
                    {data.socialPractice.content}
                  </p>
                </div>
              </div>
            )}

            {/* 图片展示 */}
            {data.socialPractice.images.length > 0 && (
              <div className="grid grid-cols-2 gap-4 content-start min-h-0 overflow-hidden">
                {data.socialPractice.images.slice(0, 4).map((item, i) => (
                  <div key={i} className={`${style.imageContainerClass} flex flex-col shadow-xl min-h-0 overflow-hidden !max-h-[300px]`}>
                    <div className="flex-1 bg-[var(--theme-secondary)]/20 overflow-hidden flex items-center justify-center">
                      <img src={item.url} className="max-w-full max-h-full object-contain" />
                    </div>
                    {item.caption && (
                      <div className="bg-gradient-to-br from-[var(--theme-secondary)] to-[var(--theme-card)] p-2 flex items-center justify-center shrink-0">
                        <p className="text-[10px] font-black text-[var(--theme-readable-primary)] leading-tight text-center tracking-widest">
                          {item.caption}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-[var(--theme-primary)] border-opacity-10 flex items-center justify-center">
             <p className="text-sm font-medium italic text-[var(--theme-readable-primary)] opacity-60">
               “ 在实践中成长，在历练中成才 ”
             </p>
          </div>
        </div>
        <div className="absolute bottom-4 right-8 text-xs text-[var(--theme-readable-primary)] opacity-40 z-10">
          {String(qualityPages.length + certPages.length + portfolioOffset + 4).padStart(2, '0')}
        </div>
      </div>
    )}

    {/* ---------------- PAGE: PERSONAL ESSAY (Independent) ---------------- */}
    <div className={`a4-page ${style.pageClass}`}>
      <PageBackground />
      <WatermarkOverlay />
      <StorybookDecoration />
      <div className={style.headerClass} style={style.headerStyle}>
        <span className={style.titleClass}>自荐信</span>
        <span className={style.subTitleClass}>Personal Statement</span>
     </div>
     <div className={`${style.contentPanelClass} !mt-8 !mb-10 !p-0 overflow-hidden`}>
         <section className="flex-none flex flex-col min-h-0 h-full">
            <div className="relative bg-[var(--theme-card)] flex flex-col items-center h-full w-full"> 
              {data.coverLetterImage ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img src={data.coverLetterImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" />
                </div>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center" style={{ height: '912px' }}>
                  {/* 稿纸背景层 */}
                  <div className="absolute inset-0 pointer-events-none opacity-35">
                    <div className="h-full relative w-full">
                      {/* 横线 (Horizontal lines) */}
                      <div 
                        className="absolute inset-0" 
                        style={{ 
                          backgroundImage: `linear-gradient(to bottom, var(--theme-readable-primary) 1px, transparent 1px)`,
                          backgroundSize: '100% 38px',
                          height: '912px'
                        }}
                      />
                      {/* 竖线 (Vertical lines) */}
                      <div className="absolute inset-0 grid grid-cols-[repeat(18,1fr)]" style={{ height: '912px', width: '100%' }}>
                        {Array.from({ length: 18 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-full border-r border-[var(--theme-readable-primary)] ${i === 0 ? 'border-l' : ''}`}
                          />
                        ))}
                      </div>
                      {/* 底部封口线 (Bottom line) */}
                      <div className="absolute top-[912px] left-0 right-0 border-b border-[var(--theme-readable-primary)]" />
                    </div>
                  </div>

                  {/* 文字层 - 保持 100% 确保与背景对齐 */}
                  <div className="relative z-10 text-[24px] leading-[38px] text-black h-full overflow-hidden w-full" 
                      style={{ 
                        fontFamily: '"Ma Shan Zheng", cursive',
                        fontWeight: 400
                      }}>
                    <div className="grid grid-cols-[repeat(18,1fr)] h-[38px] mb-[38px] mt-[38px]">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className="h-[38px] flex items-center justify-center font-bold">
                          {i === 6 ? '自' : i === 8 ? '荐' : i === 10 ? '信' : ''}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col text-left text-black">
                      {data.coverLetter.split('\n').filter(p => p.trim() !== '').map((paragraph, pIdx) => (
                        <div key={pIdx} className="grid grid-cols-[repeat(18,1fr)] w-full">
                          {/* 段落首行缩进：1个格子 (原为2个，左移一格) */}
                          <div className="h-[38px]"></div>
                          {paragraph.split('').map((char, i) => (
                            <div key={i} className="h-[38px] flex items-center justify-center leading-none">
                              {char}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
           </div>
         </section>
      </div>
        <div className="absolute bottom-4 right-8 text-xs text-[var(--theme-readable-primary)] opacity-40 z-10">{String(qualityPages.length + certPages.length + portfolioOffset + socialPracticeOffset + 4).padStart(2, '0')}</div>
      </div>
    {/* ---------------- PAGE: RECOMMENDATION (Independent) ---------------- */}
    {data.recommendationLetterImage && (
      <div className={`a4-page ${style.pageClass}`}>
        <PageBackground />
        <WatermarkOverlay />
        <StorybookDecoration />
        <div className={style.headerClass} style={style.headerStyle}>
          <span className={style.titleClass}>推荐信</span>
          <span className={style.subTitleClass}>Recommendation Letter</span>
        </div>
        <div className={style.contentPanelClass}>
          <div className={`flex-1 ${style.imageContainerClass} bg-[var(--theme-card)] shadow-xl flex items-center justify-center overflow-hidden`}>
             <img src={data.recommendationLetterImage} className="max-w-full max-h-full object-contain p-4" />
          </div>
          <div className="mt-8 p-6 bg-[var(--theme-secondary)] rounded-2xl border-l-4 border-[var(--theme-primary)] italic text-[var(--theme-readable-primary)]/70">
            <p>“ 好的老师是孩子成长道路上的引路灯，这份推荐信承载着老师对孩子的期许与肯定。 ”</p>
          </div>
        </div>
        <div className="absolute bottom-4 right-8 text-xs text-[var(--theme-readable-primary)] opacity-40 z-10">{String(qualityPages.length + certPages.length + portfolioOffset + socialPracticeOffset + 5).padStart(2, '0')}</div>
      </div>
    )}

    {/* ---------------- BACK COVER ---------------- */}
    <div className={`a4-page ${style.pageClass} flex flex-col items-center overflow-hidden`}>
      <WatermarkOverlay />
      
      {layout === LayoutType.Modern ? (
        // Modern Back Cover
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-[var(--theme-primary)]">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <img src={data.cover.backgroundImage} className="w-full h-full object-cover grayscale" />
          </div>
          <div className="relative z-10 w-[80%] aspect-square border-8 border-white p-12 flex flex-col items-center justify-center text-white">
             <div className="mb-10">
                <RenderAvatar 
                  url={data.basicInfo.avatarUrl} 
                  frameType={data.cover.avatarFrame} 
                  shape={data.cover.avatarShape}
                  size="w-48 h-48"
                />
             </div>
             <h2 className="text-4xl font-black italic mb-6 text-center">"{data.closingMessage || '成长每一步，都值得被记录'}"</h2>
             <div className="h-2 w-24 bg-white mb-8"></div>
             <div className="text-center">
               <div className="text-5xl font-black tracking-tighter uppercase mb-2">{data.basicInfo.name}</div>
               <div className="text-xl font-bold opacity-60 tracking-[0.3em] uppercase">{data.basicInfo.school}</div>
             </div>
          </div>
        </div>
      ) : layout === LayoutType.Storybook ? (
        // Storybook Back Cover
        <div className="relative w-full h-full flex flex-col items-center justify-center p-12 bg-[var(--theme-secondary)]/10 overflow-hidden">
          <WatermarkOverlay />
          <StorybookDecoration />
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-primary)]/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--theme-primary)]/5 rounded-full -ml-48 -mb-48"></div>
          
          <div className="relative z-10 flex flex-col items-center w-full max-w-lg bg-white/40 backdrop-blur-md p-12 rounded-[5rem] border-4 border-dashed border-[var(--theme-primary)]/20 shadow-xl">
            <div className="mb-12 transform -rotate-3 bg-white p-4 rounded-3xl shadow-lg border-2 border-[var(--theme-primary)]/10">
               <RenderAvatar 
                 url={data.basicInfo.avatarUrl} 
                 frameType={data.cover.avatarFrame} 
                 shape={data.cover.avatarShape}
                 size="w-48 h-48"
               />
            </div>
            
            <div className="mb-12 text-center relative">
               <div className="absolute -top-6 -left-6 opacity-10">
                 <Quote size={40} className="text-[var(--theme-primary)]" />
               </div>
               <p className="text-2xl font-black text-[var(--theme-readable-primary)] italic leading-relaxed">
                 {data.closingMessage || '成长每一步，都值得被记录'}
               </p>
               <div className="absolute -bottom-6 -right-6 opacity-10 transform rotate-180">
                 <Quote size={40} className="text-[var(--theme-primary)]" />
               </div>
            </div>
            
            <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-[var(--theme-primary)] to-transparent opacity-30 mb-10"></div>
            
            <div className="text-center space-y-3">
               <h3 className="text-4xl font-black text-[var(--theme-readable-primary)] tracking-tighter">
                 {data.basicInfo.name}
               </h3>
               <div className="text-sm font-black text-[var(--theme-primary)] uppercase tracking-[0.2em] bg-[var(--theme-primary)]/10 px-4 py-1 rounded-full">
                 {data.basicInfo.school}
               </div>
            </div>
          </div>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black opacity-20 uppercase tracking-[1em] whitespace-nowrap">
             THE END • THANK YOU
          </div>
        </div>
      ) : (
        // Classic Back Cover (Original)
        <>
          <div className="absolute inset-0 overflow-hidden z-0">
            <img 
              src={data.cover.backgroundImage} 
              className="absolute inset-0 w-full h-full object-cover opacity-90" 
            />
            <div className="absolute inset-0 bg-black/20 z-10"></div>
          </div>
          
          <div className="relative z-20 h-full flex flex-col items-center justify-center p-20 text-center">
              <div className="p-12 bg-white/75 backdrop-blur-md rounded-[3rem] border-2 border-[var(--theme-primary)]/20 shadow-2xl max-w-lg w-full flex flex-col items-center">
                 <div className="mb-10">
                   <RenderAvatar 
                     url={data.basicInfo.avatarUrl} 
                     frameType={data.cover.avatarFrame} 
                     shape={data.cover.avatarShape}
                     size="w-40 h-40" 
                   />
                 </div>
                 
                 <div className="mb-8">
                   <Quote size={48} className="mx-auto text-[var(--theme-primary)] opacity-40 mb-6"/>
                   <p className="text-2xl font-bold leading-relaxed text-[var(--theme-readable-primary)] italic">
                     "{data.closingMessage || '成长每一步，都值得被记录'}"
                   </p>
                 </div>
                 
                 <div className="w-24 h-1.5 bg-[var(--theme-primary)]/30 mx-auto rounded-full mb-8" />
                 
                 <div className="space-y-2">
                   <div className="font-black text-3xl text-[var(--theme-readable-primary)] tracking-wider">{data.basicInfo.name}</div>
                   <div className="text-[var(--theme-readable-primary)]/60 font-bold tracking-widest uppercase text-xs">{data.basicInfo.school}</div>
                 </div>
              </div>
          </div>
        </>
      )}
      <div className="absolute bottom-4 right-8 text-xs text-white/60 z-30 font-bold tracking-widest">
        {String(qualityPages.length + certPages.length + portfolioOffset + socialPracticeOffset + (data.recommendationLetterImage ? 6 : 5)).padStart(2, '0')}
      </div>
    </div>

    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';

export default ResumePreview;
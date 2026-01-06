import React, { useState } from 'react';
import { ThemeType } from '../types';
import { Palette, ChevronDown, Sparkles, Heart, Moon, Sun, Wind } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: ThemeType;
  currentColor: string;
  onThemeChange: (theme: ThemeType, color: string) => void;
}

const themeCategories = [
  {
    name: '多巴胺系列',
    icon: Sparkles,
    color: '#ff4d4f',
    themes: [
      { id: ThemeType.DopaminePink, name: '多巴胺粉', color: '#ff4d4f' },
      { id: ThemeType.DopamineYellow, name: '多巴胺黄', color: '#fadb14' },
      { id: ThemeType.DopamineGreen, name: '多巴胺绿', color: '#52c41a' },
      { id: ThemeType.DopamineBlue, name: '多巴胺蓝', color: '#1890ff' },
      { id: ThemeType.DopaminePurple, name: '多巴胺紫', color: '#722ed1' },
      { id: ThemeType.DopamineOrange, name: '多巴胺橙', color: '#fa8c16' },
    ]
  },
  {
    name: '马卡龙系列',
    icon: Heart,
    color: '#ff85c0',
    themes: [
      { id: ThemeType.MacaronMint, name: '薄荷绿', color: '#b7eb8f' },
      { id: ThemeType.MacaronBlue, name: '天空蓝', color: '#bae7ff' },
      { id: ThemeType.MacaronPurple, name: '罗兰紫', color: '#efdbff' },
      { id: ThemeType.MacaronPeach, name: '蜜桃粉', color: '#ffd8bf' },
      { id: ThemeType.MacaronGreen, name: '奶油绿', color: '#d9f7be' },
      { id: ThemeType.MacaronCream, name: '奶油黄', color: '#fffbe6' },
    ]
  },
  {
    name: '中国风系列',
    icon: Wind,
    color: '#a8071a',
    themes: [
      { id: ThemeType.ChineseInk, name: '水墨黑', color: '#262626' },
      { id: ThemeType.ChineseBamboo, name: '竹叶绿', color: '#237804' },
      { id: ThemeType.ChineseBlue, name: '青花瓷', color: '#1d39c4' },
      { id: ThemeType.ChineseRed, name: '中国红', color: '#a8071a' },
      { id: ThemeType.ChineseGold, name: '琉璃金', color: '#874d00' },
      { id: ThemeType.ChineseJade, name: '翡翠绿', color: '#237804' },
    ]
  },
  {
    name: '大自然系列',
    icon: Sun,
    color: '#135200',
    themes: [
      { id: ThemeType.NatureForest, name: '深林绿', color: '#135200' },
      { id: ThemeType.NatureSunset, name: '落日红', color: '#d4380d' },
      { id: ThemeType.NatureLake, name: '碧湖蓝', color: '#096dd9' },
      { id: ThemeType.NatureOcean, name: '海洋蓝', color: '#003a8c' },
      { id: ThemeType.NatureDesert, name: '大漠黄', color: '#874d00' },
      { id: ThemeType.GreenGradient, name: '极光绿渐变', color: '#D9F217' },
    ]
  },
  {
    name: '赛博朋克 & 复古',
    icon: Moon,
    color: '#722ed1',
    themes: [
      { id: ThemeType.CyberNeon, name: '霓虹紫', color: '#eb2f96' },
      { id: ThemeType.CyberBlue, name: '电光蓝', color: '#0050b3' },
      { id: ThemeType.CyberElectric, name: '电光绿', color: '#73d13d' },
      { id: ThemeType.RetroSlate, name: '复古灰', color: '#262626' },
      { id: ThemeType.RetroDeepGreen, name: '复古深绿', color: '#135200' },
      { id: ThemeType.RetroWine, name: '波尔多红', color: '#5c0011' },
    ]
  },
  {
    name: '商务专业系列',
    icon: Palette,
    color: '#002766',
    themes: [
      { id: ThemeType.ProfessionalBlue, name: '专业蓝', color: '#002766' },
      { id: ThemeType.ProfessionalSlate, name: '高级灰', color: '#434343' },
    ]
  }
];

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, currentColor, onThemeChange }) => {
  const darkMode = true; // 强制开启黑夜模式
  const [activeCategory, setActiveCategory] = useState<string | null>(
    themeCategories.find(cat => cat.themes.some(t => t.id === currentTheme))?.name || '多巴胺系列'
  );

  return (
    <div className={`mb-8 rounded-[32px] border-[var(--theme-border)] border-2 p-8 shadow-2xl transition-all duration-500 group overflow-hidden relative ${darkMode ? 'bg-[#1e1e1e] shadow-black/40' : 'bg-white shadow-dark/5'}`}>
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 ${darkMode ? 'bg-accent/10' : 'bg-accent/5'}`}></div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-all duration-500 ${darkMode ? 'bg-accent text-dark shadow-accent/20' : 'bg-dark text-accent shadow-dark/20'}`}>
            <Palette size={22} strokeWidth={2.5} />
          </div>
          <div>
            <span className={`font-black text-lg tracking-tight block text-[var(--theme-label)]`}>简历主题 & 智能配色</span>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-label)] opacity-30`}>Theme Customization</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 relative z-10">
        {themeCategories.map((category) => {
          const isOpen = activeCategory === category.name;
          const CategoryIcon = category.icon;
          const hasActiveTheme = category.themes.some(t => t.id === currentTheme);

          return (
            <div 
              key={category.name} 
              className={`rounded-[24px] transition-all duration-500 overflow-hidden border ${isOpen ? (darkMode ? 'bg-black/20 border-white/5 shadow-inner' : 'bg-surface border-dark/5 shadow-inner') : (darkMode ? 'hover:bg-white/5 hover:border-white/10 border-transparent' : 'hover:bg-white hover:shadow-xl hover:border-dark/5 border-transparent')}`}
            >
              <button
                onClick={() => setActiveCategory(isOpen ? null : category.name)}
                className="w-full px-5 py-4 flex items-center justify-between group/btn"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${isOpen || hasActiveTheme ? (darkMode ? 'bg-accent text-dark rotate-6' : 'bg-dark text-accent rotate-6') : (darkMode ? 'bg-white/5 text-white/40' : 'bg-white text-dark/40')}`}
                    style={!(isOpen || hasActiveTheme) ? { color: category.color, backgroundColor: darkMode ? `${category.color}20` : `${category.color}10` } : {}}
                  >
                    <CategoryIcon size={18} strokeWidth={hasActiveTheme || isOpen ? 2.5 : 2} />
                  </div>
                  <span 
                    className={`text-sm font-black tracking-tight transition-colors ${isOpen || hasActiveTheme ? (darkMode ? 'text-white' : 'text-dark') : (darkMode ? 'text-white/60' : 'text-dark/60')}`}
                    style={!(isOpen || hasActiveTheme) ? { color: category.color } : {}}
                  >
                    {category.name}
                  </span>
                  {hasActiveTheme && !isOpen && (
                    <div className="w-2 h-2 rounded-full bg-accent shadow-lg shadow-accent/50 animate-pulse"></div>
                  )}
                </div>
                <div 
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm ${isOpen ? (darkMode ? 'bg-accent text-dark rotate-180' : 'bg-dark text-accent rotate-180') : (darkMode ? 'bg-white/5 text-white/20' : 'bg-white text-dark/20')}`}
                  style={!isOpen ? { color: category.color, backgroundColor: darkMode ? `${category.color}10` : `${category.color}05` } : {}}
                >
                  <ChevronDown size={16} />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-2 gap-3">
                    {category.themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => onThemeChange(theme.id, theme.color)}
                        className={`
                          relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-500 group/item
                          ${currentTheme === theme.id 
                            ? (darkMode ? 'border-accent/30 bg-white/10 shadow-xl shadow-black/20 ring-4 ring-accent/20' : 'border-dark/10 bg-white shadow-xl shadow-dark/5 ring-4 ring-accent/20') 
                            : (darkMode ? 'border-transparent bg-white/5 hover:bg-white/10 hover:border-white/10' : 'border-transparent bg-white/50 hover:bg-white hover:shadow-lg hover:border-dark/5')}
                        `}
                      >
                        <div 
                          className="w-5 h-5 rounded-xl shadow-lg border-2 border-white/20 flex-shrink-0 transition-transform group-hover/item:scale-110 duration-500" 
                          style={{ backgroundColor: theme.color }}
                        />
                        <span className={`text-[11px] font-black tracking-tight truncate ${currentTheme === theme.id ? (darkMode ? 'text-white' : 'text-dark') : (darkMode ? 'text-white/60' : 'text-dark/60')}`}>
                          {theme.name}
                        </span>
                        {currentTheme === theme.id && (
                          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full shadow-sm ${darkMode ? 'bg-accent' : 'bg-dark'}`}></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Custom Color Picker */}
        <div className={`pt-6 mt-4 border-t ${darkMode ? 'border-white/10' : 'border-dark/5'}`}>
          <div className={`flex items-center gap-5 rounded-[32px] p-6 border group/picker transition-all duration-500 ${darkMode ? 'bg-black/20 border-white/5 hover:bg-white/5' : 'bg-surface border-dark/5 hover:bg-white'}`}>
            <div className="relative">
              <input 
                type="color" 
                value={currentColor} 
                onChange={e => onThemeChange(currentTheme, e.target.value)}
                className={`w-14 h-14 rounded-2xl cursor-pointer p-1.5 border shadow-xl transition-transform group-hover/picker:scale-110 duration-500 ${darkMode ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-dark/5'}`}
              />
            </div>
            <div className="flex flex-col flex-1">
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-[var(--theme-label)] opacity-30`}>自定义主色 (Primary Color)</span>
              <div className="flex items-center justify-between">
                <span className={`text-base font-black uppercase font-mono tracking-tighter text-[var(--theme-label)]`}>{currentColor}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center opacity-0 group-hover/picker:opacity-100 transition-all duration-500 rotate-12 ${darkMode ? 'bg-accent text-dark' : 'bg-dark text-accent'}`}>
                  <Sparkles size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;

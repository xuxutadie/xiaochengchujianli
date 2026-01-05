import React from 'react';
import { Layout, LayoutGrid, BookOpen, Layers } from 'lucide-react';
import { LayoutType } from '../types';

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  darkMode: boolean;
}

const layouts = [
  { id: LayoutType.Classic, name: '经典画报', icon: Layout, desc: '传统且严谨的经典布局' },
  { id: LayoutType.Modern, name: '现代极简', icon: LayoutGrid, desc: '灵动且现代的网格流' },
  { id: LayoutType.Storybook, name: '童趣绘本', icon: BookOpen, desc: '活泼且生动的绘本质感' },
];

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ currentLayout, onLayoutChange, darkMode }) => {
  return (
    <div className={`mb-8 rounded-[32px] border-[var(--theme-border)] border-2 p-8 shadow-2xl transition-all duration-500 group overflow-hidden relative ${darkMode ? 'bg-[#1e1e1e] shadow-black/40' : 'bg-white shadow-dark/5'}`}>
      <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 ${darkMode ? 'bg-accent/10' : 'bg-accent/5'}`}></div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-all duration-500 ${darkMode ? 'bg-accent text-dark shadow-accent/20' : 'bg-dark text-accent shadow-dark/20'}`}>
            <Layers size={22} strokeWidth={2.5} />
          </div>
          <div>
            <span className={`font-black text-lg tracking-tight block text-[var(--theme-label)]`}>智能排版 & 布局切换</span>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-label)] opacity-30`}>Layout & Typography</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {layouts.map((layout) => {
          const isActive = currentLayout === layout.id;
          const Icon = layout.icon;
          
          return (
            <button
              key={layout.id}
              onClick={() => onLayoutChange(layout.id)}
              className={`group/item relative flex flex-col items-center p-6 rounded-[24px] border-2 transition-all duration-300 ${
                isActive 
                  ? 'bg-accent border-accent text-dark shadow-lg shadow-accent/20 scale-[1.02]' 
                  : `${darkMode ? 'bg-white/5 border-white/10 text-[var(--theme-label)] hover:border-white/20' : 'bg-surface border-black/5 text-dark hover:border-black/10'}`
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${
                isActive ? 'bg-white text-dark' : `${darkMode ? 'bg-white/10' : 'bg-white shadow-sm'}`
              }`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`font-bold text-sm mb-1 ${isActive ? 'text-dark' : 'text-[var(--theme-label)]'}`}>{layout.name}</span>
              <span className={`text-[10px] opacity-60 font-medium ${isActive ? 'text-dark' : 'text-[var(--theme-label)]'}`}>{layout.desc}</span>
              
              {isActive && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-white animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LayoutSelector;

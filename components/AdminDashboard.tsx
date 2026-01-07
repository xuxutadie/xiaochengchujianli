import React, { useState, useEffect } from 'react';
import { 
  X, Lock, Database, Plus, RefreshCcw, Trash2, CheckCircle, Circle, 
  LayoutDashboard, List, Search, Filter, ChevronLeft, ChevronRight, 
  Download, Wand2, AlertCircle, Copy
} from 'lucide-react';

interface CodeRecord {
  id: number;
  code: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  used: number;
  unused: number;
}

const AdminDashboard = ({ onClose, darkMode }: { onClose: () => void; darkMode: boolean }) => {
  const [adminKey, setAdminKey] = useState(localStorage.getItem('admin_key') || '');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'codes'>('dashboard');
  
  // Data States
  const [stats, setStats] = useState<Stats | null>(null);
  const [codes, setCodes] = useState<CodeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'used' | 'unused'>('all');
  
  // Action States
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateCount, setGenerateCount] = useState(50);
  const [generatePrefix, setGeneratePrefix] = useState('');

  const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const finalBackendUrl = backendUrl.startsWith('http') ? backendUrl : `https://${backendUrl}`;

  // Initial Auth Check & Dashboard Load
  useEffect(() => {
    if (adminKey && adminKey.length > 5) {
      fetchDashboardData();
    }
  }, []);

  // Fetch codes when params change
  useEffect(() => {
    if (isAuthorized && activeTab === 'codes') {
      fetchCodesList();
    }
  }, [page, search, statusFilter, activeTab]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${finalBackendUrl}/api/admin/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey })
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        setIsAuthorized(true);
        localStorage.setItem('admin_key', adminKey);
      } else {
        setError(data.message || '鉴权失败');
        setIsAuthorized(false);
      }
    } catch (err) {
      setError('无法连接到后端服务');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCodesList = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${finalBackendUrl}/api/admin/codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminKey,
          page,
          limit,
          search,
          status: statusFilter
        })
      });
      const data = await response.json();
      if (data.success) {
        setCodes(data.codes);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Fetch list error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (generateCount < 1 || generateCount > 500) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${finalBackendUrl}/api/admin/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, count: generateCount, prefix: generatePrefix })
      });
      const data = await response.json();
      if (data.success) {
        setShowGenerateModal(false);
        fetchDashboardData();
        if (activeTab === 'codes') fetchCodesList();
      }
    } catch (err) {
      setError('生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个验证码吗？')) return;
    try {
      const response = await fetch(`${finalBackendUrl}/api/admin/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, id })
      });
      if ((await response.json()).success) {
        fetchCodesList();
        fetchDashboardData(); // Update stats
      }
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleCleanupUsed = async () => {
    if (!confirm('确定要删除所有【已使用】的验证码吗？此操作不可恢复！')) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${finalBackendUrl}/api/admin/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, type: 'used' })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchCodesList();
        fetchDashboardData();
      }
    } catch (err) {
      alert('清理失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Code,Status,Created At,Used At\n"
      + codes.map(c => `${c.id},${c.code},${c.is_used ? 'Used' : 'Unused'},${c.created_at},${c.used_at || ''}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `codes_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    // Could add a toast here
  };

  // Login View
  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm no-print">
        <div className={`w-full max-w-md p-8 rounded-[32px] shadow-2xl ${darkMode ? 'bg-[#1c1c1e] text-white' : 'bg-white text-dark'}`}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Lock size={24} className="text-accent" />
              管理后台登录
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X size={20} /></button>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold opacity-40 uppercase mb-2">管理员密钥 (ADMIN_KEY)</label>
              <input 
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className={`w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none ${darkMode ? 'bg-white/5 border-white/10 focus:border-accent' : 'bg-black/5 border-transparent focus:border-accent'}`}
                placeholder="请输入密钥..."
                onKeyDown={(e) => e.key === 'Enter' && fetchDashboardData()}
              />
            </div>
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <button 
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="w-full py-4 bg-accent text-black font-black rounded-2xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-accent/20"
            >
              {isLoading ? '验证中...' : '进入管理后台'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 lg:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 no-print">
      <div className={`w-full h-full max-w-[1600px] flex rounded-[40px] overflow-hidden shadow-2xl ring-1 ring-white/10 ${darkMode ? 'bg-[#1c1c1e] text-white' : 'bg-[#f5f5f7] text-dark'}`}>
        
        {/* Sidebar */}
        <div className={`w-20 lg:w-72 flex-shrink-0 flex flex-col border-r ${darkMode ? 'bg-[#151516] border-white/5' : 'bg-white border-dark/5'}`}>
          <div className="p-6 lg:p-8 flex items-center justify-center lg:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-black flex items-center justify-center shadow-lg shadow-accent/20">
              <Database size={20} strokeWidth={2.5} />
            </div>
            <span className="hidden lg:block font-black text-xl tracking-tight">控制台</span>
          </div>

          <nav className="flex-1 px-4 space-y-2 py-4">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: '概览仪表盘' },
              { id: 'codes', icon: List, label: '验证码管理' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id 
                  ? (darkMode ? 'bg-white/10 text-white' : 'bg-dark/5 text-dark') 
                  : (darkMode ? 'text-white/40 hover:bg-white/5 hover:text-white' : 'text-dark/40 hover:bg-dark/5 hover:text-dark')}`}
              >
                <item.icon size={22} className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="hidden lg:block font-bold text-sm">{item.label}</span>
                {activeTab === item.id && <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(217,242,23,0.8)]"></div>}
              </button>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-white/5">
            <button onClick={onClose} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors">
              <X size={22} />
              <span className="hidden lg:block font-bold text-sm">退出登录</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-opacity-50">
          {/* Top Bar */}
          <div className={`h-20 px-8 flex items-center justify-between border-b ${darkMode ? 'bg-[#1c1c1e]/50 border-white/5' : 'bg-white/50 border-dark/5'} backdrop-blur-xl`}>
            <h2 className="text-xl font-black">{activeTab === 'dashboard' ? '概览仪表盘' : '验证码管理'}</h2>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { activeTab === 'codes' ? fetchCodesList() : fetchDashboardData() }} 
                className={`p-2.5 rounded-xl transition-all hover:rotate-180 ${isLoading ? 'animate-spin opacity-50' : ''} ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-dark/5 hover:bg-dark/10'}`}
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: '总验证码', value: stats.total, icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: '已使用', value: stats.used, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: '待使用', value: stats.unused, icon: Circle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                  ].map((s, i) => (
                    <div key={i} className={`p-8 rounded-[32px] border transition-all hover:scale-[1.02] ${darkMode ? 'bg-[#151516] border-white/5' : 'bg-white border-dark/5'}`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
                          <s.icon size={24} />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-black ${s.bg} ${s.color}`}>
                          {((s.value / stats.total) * 100 || 0).toFixed(0)}%
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase opacity-40 tracking-wider">{s.label}</p>
                        <p className="text-4xl font-black tracking-tight">{s.value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`p-8 rounded-[32px] border ${darkMode ? 'bg-gradient-to-br from-accent/20 to-transparent border-accent/20' : 'bg-gradient-to-br from-accent/10 to-transparent border-accent/10'}`}>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-black mb-2 text-accent">快速操作</h3>
                      <p className="opacity-60 text-sm max-w-md">生成新的验证码以分发给用户，或者管理现有的验证码库存。</p>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => { setActiveTab('codes'); setShowGenerateModal(true); }}
                        className="px-8 py-4 bg-accent text-black rounded-2xl font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"
                      >
                        <Wand2 size={20} />
                        生成验证码
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'codes' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="flex gap-2 flex-1 w-full md:w-auto">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border flex-1 md:max-w-xs transition-all focus-within:ring-2 ring-accent/50 ${darkMode ? 'bg-[#151516] border-white/10' : 'bg-white border-dark/5'}`}>
                      <Search size={18} className="opacity-40" />
                      <input 
                        type="text" 
                        placeholder="搜索验证码..." 
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="bg-transparent outline-none w-full text-sm font-bold placeholder:opacity-30"
                      />
                    </div>
                    <div className={`flex items-center gap-2 px-2 p-1.5 rounded-2xl border ${darkMode ? 'bg-[#151516] border-white/10' : 'bg-white border-dark/5'}`}>
                      {(['all', 'used', 'unused'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => { setStatusFilter(t); setPage(1); }}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${statusFilter === t ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'opacity-40 hover:opacity-100'}`}
                        >
                          {t === 'all' ? '全部' : t === 'used' ? '已用' : '未用'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <button onClick={handleExport} className={`px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-dark/5 hover:bg-dark/10'}`}>
                      <Download size={16} /> 导出 CSV
                    </button>
                    <button onClick={handleCleanupUsed} className={`px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all text-red-500 bg-red-500/10 hover:bg-red-500/20`}>
                      <Trash2 size={16} /> 清理已用
                    </button>
                    <button 
                      onClick={() => setShowGenerateModal(true)}
                      className="px-6 py-3 bg-accent text-black rounded-2xl font-black text-sm flex items-center gap-2 whitespace-nowrap hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"
                    >
                      <Plus size={18} /> 生成
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className={`rounded-[32px] border overflow-hidden ${darkMode ? 'bg-[#151516] border-white/5' : 'bg-white border-dark/5'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className={`text-[10px] uppercase font-black opacity-40 border-b ${darkMode ? 'bg-white/5 border-white/5' : 'bg-dark/5 border-dark/5'}`}>
                        <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Code</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Created</th>
                          <th className="px-6 py-4">Used At</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-sm font-bold ${darkMode ? 'divide-white/5' : 'divide-dark/5'}`}>
                        {codes.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center opacity-40">
                              暂无数据
                            </td>
                          </tr>
                        ) : (
                          codes.map((c) => (
                            <tr key={c.id} className={`group transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-dark/5'}`}>
                              <td className="px-6 py-4 opacity-40 font-mono">#{c.id}</td>
                              <td className="px-6 py-4 font-mono text-base flex items-center gap-3">
                                {c.code}
                                <button onClick={() => handleCopy(c.code)} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
                                  <Copy size={14} />
                                </button>
                              </td>
                              <td className="px-6 py-4">
                                {c.is_used ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] uppercase font-black">
                                    <CheckCircle size={12} /> Used
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] uppercase font-black">
                                    <Circle size={12} /> Unused
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 opacity-60 text-xs">
                                {new Date(c.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 opacity-40 text-xs font-mono">
                                {c.used_at ? new Date(c.used_at).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => handleDelete(c.id)}
                                  className="p-2 rounded-xl text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  <div className={`p-4 border-t flex items-center justify-between ${darkMode ? 'border-white/5' : 'border-dark/5'}`}>
                    <span className="text-xs font-bold opacity-40 px-2">
                      Showing {codes.length} of {total} results
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className={`p-2 rounded-xl border disabled:opacity-30 disabled:cursor-not-allowed ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-dark/10 hover:bg-dark/5'}`}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className="flex items-center px-4 font-black text-sm bg-accent text-black rounded-xl">
                        {page}
                      </div>
                      <button 
                        onClick={() => setPage(p => p + 1)}
                        disabled={codes.length < limit} // Simple check, better to use total pages
                        className={`p-2 rounded-xl border disabled:opacity-30 disabled:cursor-not-allowed ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-dark/10 hover:bg-dark/5'}`}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-sm p-8 rounded-[32px] shadow-2xl ${darkMode ? 'bg-[#1c1c1e] text-white' : 'bg-white text-dark'}`}>
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <Wand2 size={24} className="text-accent" />
              生成验证码
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold opacity-40 uppercase mb-2">数量 (1-500)</label>
                <input 
                  type="number"
                  min="1"
                  max="500"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none font-bold text-lg ${darkMode ? 'bg-white/5 border-white/10 focus:border-accent' : 'bg-black/5 border-transparent focus:border-accent'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold opacity-40 uppercase mb-2">前缀 (可选)</label>
                <input 
                  type="text"
                  placeholder="例如: VIP-"
                  value={generatePrefix}
                  onChange={(e) => setGeneratePrefix(e.target.value)}
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none font-bold ${darkMode ? 'bg-white/5 border-white/10 focus:border-accent' : 'bg-black/5 border-transparent focus:border-accent'}`}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowGenerateModal(false)}
                  className={`flex-1 py-4 font-black rounded-2xl transition-opacity hover:opacity-80 ${darkMode ? 'bg-white/10' : 'bg-dark/5'}`}
                >
                  取消
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-accent text-black font-black rounded-2xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-accent/20"
                >
                  {isLoading ? '生成中...' : '确认生成'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
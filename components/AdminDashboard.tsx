import React, { useState, useEffect } from 'react';
import { X, Lock, Database, Plus, RefreshCcw, Trash2, CheckCircle, Circle } from 'lucide-react';

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
  const [stats, setStats] = useState<Stats | null>(null);
  const [codes, setCodes] = useState<CodeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCodes, setNewCodes] = useState('');

  const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const finalBackendUrl = backendUrl.startsWith('http') ? backendUrl : `https://${backendUrl}`;

  const fetchData = async () => {
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
        setCodes(data.codes);
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

  const handleAddCodes = async () => {
    const codeList = newCodes.split(/[\n, ]+/).filter(c => c.trim().length > 0);
    if (codeList.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${finalBackendUrl}/api/admin/add-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, codes: codeList })
      });
      const data = await response.json();
      if (data.success) {
        setNewCodes('');
        fetchData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('添加失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey && adminKey.length > 5) {
      fetchData();
    }
  }, []);

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className={`w-full max-w-md p-8 rounded-[32px] ${darkMode ? 'bg-[#1c1c1e] text-white' : 'bg-white text-dark'}`}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Lock size={24} className="text-accent" />
              管理后台登录
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
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
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            <button 
              onClick={fetchData}
              disabled={isLoading}
              className="w-full py-4 bg-accent text-black font-black rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? '验证中...' : '进入管理后台'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`w-full max-w-4xl h-[80vh] flex flex-col rounded-[40px] overflow-hidden ${darkMode ? 'bg-[#1c1c1e] text-white' : 'bg-white text-dark'}`}>
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-accent/5">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3">
              <Database size={28} className="text-accent" />
              验证码管理中心
            </h2>
            <p className="text-xs opacity-50 font-bold mt-1">控制面板 v1.0 • 连接状态: 正常</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchData} className="p-3 hover:bg-black/5 rounded-xl transition-colors text-accent"><RefreshCcw size={20} /></button>
            <button onClick={onClose} className="p-3 hover:bg-black/5 rounded-xl transition-colors"><X size={24} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-6 mb-10">
            {[
              { label: '总验证码', value: stats?.total || 0, color: 'text-accent' },
              { label: '已使用', value: stats?.used || 0, color: 'text-emerald-500' },
              { label: '待使用', value: stats?.unused || 0, color: 'opacity-50' },
            ].map((s, i) => (
              <div key={i} className={`p-6 rounded-3xl border-2 ${darkMode ? 'bg-white/5 border-white/5' : 'bg-black/5 border-transparent'}`}>
                <p className="text-[10px] font-black uppercase opacity-40 mb-1">{s.label}</p>
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Add Codes */}
            <div>
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <Plus size={20} className="text-accent" />
                批量添加
              </h3>
              <div className="space-y-4">
                <textarea 
                  value={newCodes}
                  onChange={(e) => setNewCodes(e.target.value)}
                  placeholder="输入验证码，多个请换行或用逗号隔开..."
                  className={`w-full h-40 px-5 py-4 rounded-3xl border-2 transition-all outline-none resize-none ${darkMode ? 'bg-white/5 border-white/10 focus:border-accent' : 'bg-black/5 border-transparent focus:border-accent'}`}
                />
                <button 
                  onClick={handleAddCodes}
                  disabled={isLoading || !newCodes.trim()}
                  className="w-full py-4 bg-accent text-black font-black rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  确认导入
                </button>
              </div>
            </div>

            {/* Codes List */}
            <div>
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <Database size={20} className="text-accent" />
                最近记录
              </h3>
              <div className={`rounded-3xl border-2 overflow-hidden ${darkMode ? 'bg-white/5 border-white/5' : 'bg-black/5 border-transparent'}`}>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-accent/10 backdrop-blur-md">
                      <tr>
                        <th className="px-4 py-3 font-black text-[10px] uppercase opacity-40">验证码</th>
                        <th className="px-4 py-3 font-black text-[10px] uppercase opacity-40">状态</th>
                        <th className="px-4 py-3 font-black text-[10px] uppercase opacity-40">日期</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {codes.map((c) => (
                        <tr key={c.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-mono font-bold">{c.code}</td>
                          <td className="px-4 py-4">
                            {c.is_used ? (
                              <span className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase">
                                <CheckCircle size={12} /> 已用
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 opacity-40 text-[10px] font-black uppercase">
                                <Circle size={12} /> 未用
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-[10px] opacity-40 font-bold">
                            {new Date(c.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, TrendingUp, Award,
  CheckCircle2, Flame, Code2, 
  Terminal, Hash, Loader2, AlertCircle
} from 'lucide-react';

export default function AlgorithmTracker() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  // --- 自动读取数据 ---
  useEffect(() => {
    // 修改说明：
    // 原本使用了 import.meta.env.BASE_URL，但在某些环境会报错。
    // 直接使用 'data.json' 相对路径通常也能在本地和 GitHub Pages (同级目录) 正常工作。
    // 如果部署在 GitHub Pages 子路径下且遇到问题，确保 data.json 与 index.html 在同一层级。
    const dataUrl = 'data.json';
    
    console.log("Fetching data from:", dataUrl);

    fetch(dataUrl)
      .then(response => {
        if (!response.ok) throw new Error('无法读取数据文件 (data.json)');
        return response.json();
      })
      .then(jsonData => {
        setData(jsonData);
        if (jsonData.length > 0) {
          setSelectedDay(jsonData[jsonData.length - 1]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("加载失败:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    if (!data.length) return { totalProblems: 0, currentStreak: 0, maxStreak: 0 };

    let totalProblems = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    const validData = data.filter(d => d.count > 0);

    validData.forEach(day => {
      totalProblems += day.count;

      if (lastDate) {
        const diffTime = Math.abs(new Date(day.date).getTime() - new Date(lastDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      lastDate = day.date;
    });
    
    maxStreak = Math.max(maxStreak, tempStreak);
    currentStreak = tempStreak;

    return { totalProblems, currentStreak, maxStreak };
  }, [data]);

  const getContributionLevel = (count) => {
    if (count === 0) return 'bg-slate-800/50';
    if (count <= 1) return 'bg-emerald-900/40 border border-emerald-900';
    if (count <= 2) return 'bg-emerald-700/60 border border-emerald-700';
    if (count <= 4) return 'bg-emerald-500/80 border border-emerald-500';
    return 'bg-emerald-400 border border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-emerald-400 gap-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-slate-400 text-sm">正在读取刷题记录...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-red-400 gap-4">
        <AlertCircle className="w-12 h-12" />
        <h2 className="text-xl font-bold">数据加载失败</h2>
        <p className="text-slate-400 max-w-md text-center">
          请确保 python 脚本生成的 <code>data.json</code> 文件位于 <code>public</code> 文件夹中。
        </p>
        <p className="text-xs text-slate-600 bg-slate-900 p-2 rounded border border-slate-800">
          Error: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-400 to-cyan-500 p-2 rounded-lg">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
              AlgoTrace
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="hidden md:inline">持续刷题记录</span>
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
              <span className="text-xs font-bold text-white">Me</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={<Hash className="text-blue-400" />} 
            label="总刷题数" 
            value={stats.totalProblems} 
            sub="积跬步，至千里"
          />
          <StatCard 
            icon={<Flame className="text-orange-500" />} 
            label="当前连胜" 
            value={`${stats.currentStreak} 天`} 
            sub="保持火热手感！"
          />
          <StatCard 
            icon={<Award className="text-yellow-400" />} 
            label="最长连胜" 
            value={`${stats.maxStreak} 天`} 
            sub="继续挑战记录"
          />
          <StatCard 
            icon={<CheckCircle2 className="text-emerald-400" />} 
            label="完成情况" 
            value="100%" 
            sub="所有代码均已归档"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Visualizations */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Activity Heatmap */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  活跃度热力图
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Less</span>
                  <div className="w-3 h-3 bg-slate-800 rounded-sm"></div>
                  <div className="w-3 h-3 bg-emerald-900/40 rounded-sm"></div>
                  <div className="w-3 h-3 bg-emerald-700/60 rounded-sm"></div>
                  <div className="w-3 h-3 bg-emerald-500/80 rounded-sm"></div>
                  <div className="w-3 h-3 bg-emerald-400 rounded-sm"></div>
                  <span>More</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {data.map((day, idx) => (
                  <div 
                    key={idx}
                    onClick={() => day.count > 0 && setSelectedDay(day)}
                    className={`
                      w-10 h-10 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg hover:ring-2 ring-white/20
                      ${getContributionLevel(day.count)}
                      ${selectedDay?.date === day.date ? 'ring-2 ring-white scale-110 shadow-emerald-500/50 shadow-lg' : ''}
                    `}
                    title={`${day.date}: ${day.count} 题`}
                  >
                    <span className="text-[10px] text-white/80 font-medium">
                      {day.date.split('-')[2]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                刷题趋势
              </h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(str) => str.slice(5)} 
                      stroke="#64748b" 
                      fontSize={12}
                      tickMargin={10}
                    />
                    <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                      itemStyle={{ color: '#34d399' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#34d399" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#0f172a', stroke: '#34d399', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#34d399' }}
                      fill="url(#colorCount)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-full min-h-[500px]">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5 text-purple-400" />
                详细记录
              </h3>
              
              {selectedDay ? (
                <div className="animate-fadeIn">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                    <span className="text-slate-400 text-sm">{selectedDay.date}</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/20">
                      完成 {selectedDay.count} 题
                    </span>
                  </div>
                  
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedDay.problems.length > 0 ? selectedDay.problems.map((prob, i) => (
                      <div key={i} className="group p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all cursor-default">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-slate-200 group-hover:text-emerald-400 transition-colors">
                            {prob.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                            {prob.tag}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-10 text-slate-500 italic">
                        今天没有刷题记录
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500">
                  点击左侧热力图查看详情
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-100">{value}</div>
        <div className="text-xs text-slate-500 mt-1">{sub}</div>
      </div>
    </div>
  );
}
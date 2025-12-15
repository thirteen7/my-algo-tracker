import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Calendar, TrendingUp, Award,
  CheckCircle2, Flame, Code2, 
  Terminal, Hash, Loader2, AlertCircle, Sparkles
} from 'lucide-react';

// --- 默认模拟数据 (用于预览或降级) ---
const MOCK_DATA = [
  { date: '2025-11-13', count: 2, problems: [{ title: 'Two Sum', tag: 'Hash Table' }, { title: 'Palindrome Number', tag: 'Math' }] },
  { date: '2025-11-15', count: 1, problems: [{ title: 'Longest Substring', tag: 'String' }] },
  { date: '2025-11-17', count: 3, problems: [{ title: 'Container With Most Water', tag: 'Array' }, { title: '3Sum', tag: 'Array' }, { title: 'Longest Common Prefix', tag: 'String' }] },
  { date: '2025-11-18', count: 1, problems: [{ title: 'Valid Parentheses', tag: 'Stack' }] },
  { date: '2025-11-19', count: 4, problems: [{ title: 'Merge Two Lists', tag: 'List' }, { title: 'Generate Parentheses', tag: 'Backtrack' }, { title: 'Merge k Lists', tag: 'List' }, { title: 'Next Permutation', tag: 'Array' }] },
  { date: '2025-11-22', count: 2, problems: [{ title: 'Search Rotated Array', tag: 'Binary Search' }, { title: 'Find First and Last', tag: 'Binary Search' }] },
  { date: '2025-11-23', count: 0, problems: [] },
  { date: '2025-11-24', count: 3, problems: [{ title: 'Count and Say', tag: 'String' }, { title: 'Combination Sum', tag: 'Backtrack' }, { title: 'Trapping Rain Water', tag: 'Two Pointers' }] },
  { date: '2025-11-29', count: 5, problems: [{ title: 'Max Subarray', tag: 'DP' }, { title: 'Spiral Matrix', tag: 'Matrix' }, { title: 'Jump Game', tag: 'Greedy' }, { title: 'Merge Intervals', tag: 'Array' }, { title: 'Unique Paths', tag: 'DP' }] },
  { date: '2025-12-04', count: 3, problems: [{ title: 'Climbing Stairs', tag: 'DP' }, { title: 'Simplify Path', tag: 'Stack' }, { title: 'Edit Distance', tag: 'DP' }] },
  { date: '2025-12-15', count: 1, problems: [{ title: 'Maximal Rectangle', tag: 'Stack' }] },
];

export default function AlgorithmTracker() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  // --- 自动读取数据 ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('./data.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
        
        const lastActiveDay = [...jsonData].reverse().find(d => d.count > 0);
        if (lastActiveDay) {
          setSelectedDay(lastActiveDay);
        } else if (jsonData.length > 0) {
           setSelectedDay(jsonData[jsonData.length - 1]);
        }
        setLoading(false);
      } catch (err) {
        console.warn("无法读取 data.json，切换至模拟数据预览模式:", err);
        setData(MOCK_DATA);
        setUsingMock(true);
        const lastActiveDay = [...MOCK_DATA].reverse().find(d => d.count > 0);
        if (lastActiveDay) setSelectedDay(lastActiveDay);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 统计计算 ---
  const stats = useMemo(() => {
    if (!data.length) return { totalProblems: 0, currentStreak: 0, maxStreak: 0, activeDays: 0 };

    let totalProblems = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    let activeDays = 0;
    let lastDate = null;

    const activeData = data.filter(d => d.count > 0);

    activeData.forEach(day => {
      totalProblems += day.count;
      activeDays++;

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

    return { totalProblems, currentStreak, maxStreak, activeDays };
  }, [data]);

  // --- GitHub Calendar Data Logic ---
  const calendarGrid = useMemo(() => {
    if (data.length === 0) return [];

    // 1. 找到开始日期（为了对齐星期，我们需要找到第一个日期的周日）
    const firstDate = new Date(data[0].date);
    const dayOfWeek = firstDate.getDay(); // 0 is Sunday
    const startDate = new Date(firstDate);
    startDate.setDate(firstDate.getDate() - dayOfWeek);

    // 2. 找到结束日期 (最后一天)
    const lastDate = new Date(data[data.length - 1].date);
    
    // 3. 构建查找表
    const dataMap = new Map(data.map(d => [d.date, d]));

    const weeks = [];
    let currentWeek = [];
    let currentDate = new Date(startDate);

    // 循环直到覆盖最后一天，并且填满该周
    while (currentDate <= lastDate || currentWeek.length > 0) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dataMap.get(dateStr) || { date: dateStr, count: 0, problems: [] };
      
      currentWeek.push(dayData);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return weeks;
  }, [data]);

  const getContributionLevel = (count) => {
    if (count === 0) return 'bg-slate-800/40 border-slate-800';
    if (count <= 1) return 'bg-emerald-900/40 border-emerald-900/50';
    if (count <= 2) return 'bg-emerald-700/50 border-emerald-700/50';
    if (count <= 4) return 'bg-emerald-500/60 border-emerald-500/50';
    return 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.4)]';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-emerald-400 gap-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-slate-400 text-sm tracking-wider">LOADING DATA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-red-400 gap-6">
        <div className="bg-red-500/10 p-6 rounded-full ring-1 ring-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <AlertCircle className="w-12 h-12" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-200">数据加载异常</h2>
          <p className="text-slate-500 max-w-md">无法加载数据。请检查控制台错误信息。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-emerald-500/30 pb-20 overflow-x-hidden relative">
      
      {/* 背景装饰 */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-lg" />
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-2 rounded-lg border border-white/10 group-hover:border-emerald-500/30 transition-colors">
                <Code2 className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 via-emerald-400 to-cyan-400 tracking-tight">
              Algo<span className="font-light text-slate-400">Trace</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            {usingMock && (
              <span className="hidden md:flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                <AlertCircle size={12} />
                预览模式
              </span>
            )}
            <span className="hidden md:inline font-mono text-xs opacity-50">v1.1.0</span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center border border-white/10 shadow-lg ring-2 ring-transparent hover:ring-emerald-500/30 transition-all">
              <span className="text-xs font-bold text-white">Me</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-400 text-sm">坚持不懈，记录你的算法进化之路。</p>
          </div>
          <div className="text-right hidden md:block">
             <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Last Update</div>
             <div className="font-mono text-emerald-400">{data.length > 0 ? data[data.length-1].date : '-'}</div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<Hash className="text-blue-400" />} 
            label="总刷题数" 
            value={stats.totalProblems} 
            color="blue"
            sub="Problems Solved"
          />
          <StatCard 
            icon={<Flame className="text-orange-500" />} 
            label="当前连胜" 
            value={stats.currentStreak} 
            unit="天"
            color="orange"
            sub="Current Streak"
          />
          <StatCard 
            icon={<Award className="text-yellow-400" />} 
            label="最长连胜" 
            value={stats.maxStreak} 
            unit="天"
            color="yellow"
            sub="Best Record"
          />
          <StatCard 
            icon={<CheckCircle2 className="text-emerald-400" />} 
            label="活跃天数" 
            value={stats.activeDays} 
            unit="天"
            color="emerald"
            sub="Active Days"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Visualizations (8/12) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Trend Chart */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    刷题趋势
                  </h3>
                  <div className="bg-white/5 px-3 py-1 rounded-full text-xs text-slate-400 border border-white/5">
                    近 {data.length} 天
                  </div>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
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
                        stroke="#475569" 
                        fontSize={12}
                        tickMargin={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#475569" 
                        fontSize={12} 
                        allowDecimals={false} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                          backdropFilter: 'blur(8px)',
                          borderColor: 'rgba(255,255,255,0.1)', 
                          color: '#f8fafc',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                        }}
                        itemStyle={{ color: '#34d399' }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#34d399" 
                        strokeWidth={3}
                        fill="url(#colorCount)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* GitHub Style Heatmap */}
            <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  活跃度热力图
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                  <span>Less</span>
                  <div className="w-3 h-3 bg-slate-800/40 border border-slate-800 rounded-[2px]"></div>
                  <div className="w-3 h-3 bg-emerald-900/40 border border-emerald-900/50 rounded-[2px]"></div>
                  <div className="w-3 h-3 bg-emerald-500/60 border border-emerald-500/50 rounded-[2px]"></div>
                  <div className="w-3 h-3 bg-emerald-400 border border-emerald-300 rounded-[2px]"></div>
                  <span>More</span>
                </div>
              </div>
              
              {/* GitHub Grid Container */}
              <div className="relative w-full overflow-x-auto custom-scrollbar pb-4">
                <div className="flex gap-1 min-w-max">
                  
                  {/* Week Labels / Day Labels placeholder */}
                  <div className="flex flex-col gap-1 mr-2 pt-[18px]"> 
                    {/* pt to align with squares */}
                    <span className="text-[10px] text-slate-600 h-3 leading-3">Mon</span>
                    <span className="text-[10px] text-transparent h-3 leading-3">Tue</span>
                    <span className="text-[10px] text-slate-600 h-3 leading-3">Wed</span>
                    <span className="text-[10px] text-transparent h-3 leading-3">Thu</span>
                    <span className="text-[10px] text-slate-600 h-3 leading-3">Fri</span>
                  </div>

                  {/* Weeks Columns */}
                  {calendarGrid.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-1">
                      {week.map((day, dayIdx) => (
                         <div 
                          key={`${weekIdx}-${dayIdx}`}
                          onClick={() => day.count > 0 && setSelectedDay(day)}
                          className={`
                            w-3 h-3 rounded-[2px] cursor-pointer transition-all duration-200 border
                            ${getContributionLevel(day.count)}
                            ${selectedDay?.date === day.date ? 'ring-1 ring-white ring-offset-1 ring-offset-[#0f172a] z-10 scale-125' : 'hover:scale-125 hover:z-10'}
                            ${day.count === 0 ? 'hover:bg-slate-700 hover:border-slate-600' : ''}
                          `}
                          title={`${day.date}: ${day.count} 题`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Details (4/12) */}
          <div className="lg:col-span-4">
            {/* Selected Day Detail Panel */}
            <div className="sticky top-24 bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-auto min-h-[500px] shadow-2xl flex flex-col">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-6 text-slate-200">
                <Terminal className="w-5 h-5 text-purple-400" />
                详细记录
              </h3>
              
              {selectedDay ? (
                <div className="animate-fadeIn flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    <span className="text-slate-300 font-mono tracking-wider text-sm">{selectedDay.date}</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                      {selectedDay.count} Problems
                    </span>
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 -mr-2">
                    {selectedDay.problems.length > 0 ? selectedDay.problems.map((prob, i) => (
                      <div key={i} className="group p-4 rounded-xl bg-slate-800/40 hover:bg-slate-700/50 border border-white/5 hover:border-white/10 transition-all duration-300 cursor-default relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:to-emerald-500/5 transition-all duration-500" />
                        
                        <div className="flex justify-between items-start mb-2 relative z-10">
                          <span className="font-medium text-slate-300 group-hover:text-emerald-300 transition-colors line-clamp-2">
                            {prob.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 relative z-10">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-black/20 px-2 py-1 rounded border border-white/5 group-hover:border-white/10 transition-colors">
                            {prob.tag}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 italic space-y-4 opacity-50">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center">
                           <Sparkles className="w-8 h-8" />
                        </div>
                        <p>No activity recorded</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 opacity-60">
                   <div className="w-20 h-20 bg-slate-800/30 rounded-full flex items-center justify-center border border-dashed border-slate-700">
                     <Calendar className="w-8 h-8" />
                   </div>
                   <p className="text-sm">Select a day to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(52, 211, 153, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(52, 211, 153, 0.4);
        }
      `}</style>
    </div>
  );
}

function StatCard({ icon, label, value, unit, color, sub }) {
  const colorStyles = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 text-blue-500",
    orange: "from-orange-500/20 to-orange-600/5 border-orange-500/20 hover:border-orange-500/40 text-orange-500",
    yellow: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20 hover:border-yellow-500/40 text-yellow-500",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-500",
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colorStyles[color]} backdrop-blur-sm border p-5 rounded-2xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
        {React.cloneElement(icon, { size: 48 })}
      </div>
      
      <div className="flex flex-col h-full justify-between relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-[#0f172a]/50 rounded-lg border border-white/5 shadow-inner">
            {icon}
          </div>
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</span>
        </div>
        
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
          {unit && <span className="text-sm text-slate-500 font-medium">{unit}</span>}
        </div>
        
        <div className="mt-2 text-xs text-white/40 font-mono">
          {sub}
        </div>
      </div>
    </div>
  );
}
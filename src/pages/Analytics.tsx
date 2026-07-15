import React from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { GlassCard } from '../components/ui';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { 
  TrendingUp, 
  Hourglass, 
  Flame, 
  Sparkles, 
  HelpCircle,
  BarChart3,
  Calendar
} from 'lucide-react';

const topGesturesData = [
  { name: 'I Love You', count: 184 },
  { name: 'Hello', count: 142 },
  { name: 'Thank You', count: 110 },
  { name: 'A', count: 98 },
  { name: 'B', count: 85 },
  { name: 'Yes', count: 72 },
  { name: 'Please', count: 64 },
];

export const Analytics: React.FC = () => {
  const { usageLogs } = useAppStore();

  // Aggregate stats
  const totalMinutes = usageLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalGestures = usageLogs.reduce((acc, curr) => acc + curr.gesturesCount, 0);
  const avgConf = Math.round(usageLogs.reduce((acc, curr) => acc + curr.averageConfidence, 0) / usageLogs.length) || 88;

  // Custom styling for recharts tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/10 p-3 rounded-xl shadow-2xl text-[10px] font-mono text-white">
          <p className="font-bold text-white/50 mb-1">{label}</p>
          {payload.map((pld: any) => (
            <p key={pld.name} style={{ color: pld.color || '#00E5FF' }}>
              {pld.name.toUpperCase()}: <span className="font-extrabold">{pld.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col gap-6 min-h-0">
      
      {/* Top Header */}
      <GlassCard className="p-4 md:p-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold tracking-wide uppercase">Performance Analytics</h3>
          <p className="text-[10px] text-white/40 mt-0.5">Statistical metrics, accuracy rates, and training trends.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl text-xs text-white/60">
          <Calendar className="h-4 w-4" />
          <span>Last 7 Days</span>
        </div>
      </GlassCard>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <GlassCard className="p-5 flex items-center gap-4 hover:border-primary-purple/30">
          <div className="p-3 bg-primary-purple/10 border border-primary-purple/35 text-primary-purple rounded-2xl">
            <Hourglass className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-white/40 tracking-wider block">TOTAL TRAINING TIME</span>
            <span className="text-xl font-extrabold text-white">{totalMinutes} Mins</span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4 hover:border-secondary-cyan/30">
          <div className="p-3 bg-secondary-cyan/10 border border-secondary-cyan/35 text-secondary-cyan rounded-2xl">
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-white/40 tracking-wider block">TRANSLATED SIGNS</span>
            <span className="text-xl font-extrabold text-white">{totalGestures} Signs</span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4 hover:border-success-green/30">
          <div className="p-3 bg-success-green/10 border border-success-green/35 text-success-green rounded-2xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-white/40 tracking-wider block">AVERAGE ACCURACY</span>
            <span className="text-xl font-extrabold text-white">{avgConf}%</span>
          </div>
        </GlassCard>

      </div>

      {/* Charts Grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-0 overflow-y-auto pr-1">
        
        {/* Usage Time & Accuracy chart */}
        <GlassCard className="p-5 flex flex-col gap-4">
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase">Usage & Accuracy Trends</h4>
            <span className="text-[9px] text-white/40">Correlation between training duration and posture precision.</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C4DFF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="durationMinutes" name="Minutes Trained" stroke="#7C4DFF" fillOpacity={1} fill="url(#colorMinutes)" strokeWidth={2} />
                <Area type="monotone" dataKey="averageConfidence" name="Avg Confidence" stroke="#00E5FF" fillOpacity={1} fill="url(#colorAccuracy)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Top Gestures bar chart */}
        <GlassCard className="p-5 flex flex-col gap-4">
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase">Frequently Used Signs</h4>
            <span className="text-[9px] text-white/40">Distribution of top signs detected over training period.</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topGesturesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Times Detected" fill="#00E5FF" radius={[6, 6, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Cumulative performance logs table */}
        <GlassCard className="xl:col-span-2 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white tracking-wider uppercase">Historical Logs</h4>
              <span className="text-[9px] text-white/40">Itemized log of daily sign sessions.</span>
            </div>
            <BarChart3 className="h-4.5 w-4.5 text-white/40" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-normal border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/40 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-2.5 px-3">Session Date</th>
                  <th className="py-2.5 px-3">Duration (Minutes)</th>
                  <th className="py-2.5 px-3">Signs Processed</th>
                  <th className="py-2.5 px-3">Accuracy (Avg)</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {usageLogs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 text-white font-medium">{log.date}</td>
                    <td className="py-3 px-3 font-mono">{log.durationMinutes} mins</td>
                    <td className="py-3 px-3 font-mono">{log.gesturesCount} signs</td>
                    <td className="py-3 px-3 font-mono">{log.averageConfidence}%</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 bg-success-green/10 text-success-green text-[9px] font-bold rounded-lg border border-success-green/20">
                        COMPLETED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

      </div>

    </div>
  );
};

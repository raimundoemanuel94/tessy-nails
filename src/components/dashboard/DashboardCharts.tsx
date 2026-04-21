"use client";

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface RevenueData {
  date: string;
  Revenue: number;
}

interface ServiceData {
  name: string;
  value: number;
}

const COLORS = ['#4B2E2B', '#6D4C41', '#A1887F', '#B08A7A'];

export function RevenueChart({ data }: { data: RevenueData[] }) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Evolução Financeira</h3>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Histórico de faturamento bruto</p>
        </div>
        <div className="bg-success/10 text-success px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-success/20">
          +12.5% Crescimento
        </div>
      </div>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6D4C41" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6D4C41" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            dy={10}
          />
          <YAxis 
            hide 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '16px', 
              border: '1px solid #f1f5f9',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
              padding: '12px'
            }}
            itemStyle={{ color: '#4B2E2B', fontWeight: 900, fontSize: '12px' }}
            labelStyle={{ color: '#64748b', fontWeight: 700, fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}
          />
          <Area 
            type="monotone" 
            dataKey="Revenue" 
            stroke="#6D4C41" 
            strokeWidth={4}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ServicesDonut({ data }: { data: ServiceData[] }) {
  return (
    <div className="w-full space-y-6">
      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Popularidade</h3>
      <div className="flex flex-col items-center">
        <div style={{ width: '100%', height: 220 }} className="relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">100%</span>
          </div>
        </div>
        
        <div className="w-full mt-6 space-y-4">
          {data.map((item, idx) => (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">{item.value}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(75,46,43,0.3)]"
                  style={{ 
                    width: `${item.value}%`, 
                    backgroundColor: COLORS[idx % COLORS.length] 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

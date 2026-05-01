import React, { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { BarChart3, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

const data = [
  { name: 'Jan', revenue: 4000, leads: 2400 },
  { name: 'Feb', revenue: 3000, leads: 1398 },
  { name: 'Mar', revenue: 2000, leads: 9800 },
  { name: 'Apr', revenue: 2780, leads: 3908 },
  { name: 'May', revenue: 1890, leads: 4800 },
  { name: 'Jun', revenue: 2390, leads: 3800 },
  { name: 'Jul', revenue: 3490, leads: 4300 },
];

const pieData = [
  { name: 'Direct', value: 400 },
  { name: 'Referral', value: 300 },
  { name: 'Organic', value: 300 },
  { name: 'Social', value: 200 },
];
const COLORS = ['#005BB5', '#38BDF8', '#818CF8', '#34D399'];

export default function Analytics() {
  const [activeCategory, setActiveCategory] = useState("Overview");
  const categories = ["Overview", "CRM", "Projects", "Finance", "Assets", "Custom"];

  return (
    <PageTransition className="flex h-full overflow-hidden">
      <div className="w-64 border-r border-white/5 p-4 flex flex-col gap-1 bg-[#0B0C0E]">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4 px-2 uppercase tracking-wider">Reports</h2>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
              activeCategory === cat ? "bg-primary/10 text-primary font-medium border border-primary/20" : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-auto p-8 bg-[#0B0C0E]">
        <h1 className="text-2xl font-display font-bold text-white mb-6">{activeCategory} Dashboard</h1>
        
        {activeCategory === "Overview" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg p-5">
                <h3 className="font-medium text-white mb-6 text-sm flex items-center gap-2"><TrendingUp size={16}/> Revenue Growth</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#005BB5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#005BB5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                      <Tooltip contentStyle={{ backgroundColor: '#111317', borderColor: 'rgba(255,255,255,0.1)', color: '#E8EAED' }} itemStyle={{ color: '#E8EAED' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#005BB5" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg p-5">
                <h3 className="font-medium text-white mb-6 text-sm flex items-center gap-2"><BarChart3 size={16}/> Lead Volume</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#111317', borderColor: 'rgba(255,255,255,0.1)' }} />
                      <Bar dataKey="leads" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg p-5">
                 <h3 className="font-medium text-white mb-6 text-sm flex items-center gap-2"><PieChartIcon size={16}/> Lead Sources</h3>
                 <div className="h-48 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#111317', borderColor: 'rgba(255,255,255,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="flex flex-wrap justify-center gap-3 mt-2">
                   {pieData.map((d, i) => (
                     <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                       <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></span> {d.name}
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl h-[500px] flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-white/5">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">{activeCategory} charts coming soon</p>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

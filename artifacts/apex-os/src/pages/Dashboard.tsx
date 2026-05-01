import React from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { metrics, activities, deadlines } from "@/data/mockData";
import { TrendingUp, TrendingDown, Plus, Activity, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <PageTransition className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your business today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/50 hover:shadow-[0_0_0_1px_rgba(0,91,181,0.5)]">
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_12px_rgba(0,91,181,0.3)] hover:shadow-[0_0_15px_rgba(0,91,181,0.5)]">
            <Plus className="w-4 h-4 mr-2" /> New Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (
          <Card key={m.id} className="bg-[#111317]/80 backdrop-blur-xl border-white/5 hover:border-primary/30 hover:shadow-[0_0_0_1px_rgba(0,91,181,0.3)] transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              {m.isPositive ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{m.value}</div>
              <p className={`text-xs mt-1 ${m.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                {m.trend} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#111317]/80 backdrop-blur-xl border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deadlines.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-primary/30 transition-all cursor-pointer">
                    <div>
                      <div className="font-medium text-sm">{d.item || d.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">Due {new Date(d.date).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground">{d.assignee}</div>
                      <div className={`text-xs px-2 py-1 rounded-full border ${d.status === 'At Risk' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                        {d.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#111317]/80 backdrop-blur-xl border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-4 border-l border-white/10 space-y-6">
                {activities.map((a, i) => (
                  <div key={a.id} className="relative">
                    <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-[#111317]"></div>
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {a.user} • {new Date(a.time).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

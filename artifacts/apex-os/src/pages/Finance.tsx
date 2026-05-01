import React, { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { DollarSign, ArrowRight, CheckCircle2, XCircle, CreditCard, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { financeData } from "@/data/mockData";

export default function Finance() {
  const [activeView, setActiveView] = useState("AP");

  return (
    <PageTransition className="flex flex-col h-full overflow-hidden">
      <div className="flex-none p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-display font-bold text-white">Finance</h1>
          <div className="flex bg-[#111317] rounded-md p-1 border border-white/5">
            {["AP", "AR", "Spend"].map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                  activeView === view ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-white"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6 bg-[#0B0C0E]">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {activeView === "AP" && (
            <>
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-white">Approvals Queue</h2>
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-xs">Run Batch Payment</Button>
                </div>
                <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-white/5 border-b border-white/5">
                      <tr>
                        <th className="px-6 py-3 font-medium">Vendor</th>
                        <th className="px-6 py-3 font-medium">Amount</th>
                        <th className="px-6 py-3 font-medium">Due Date</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financeData.ap.map(item => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                            <Building size={14} className="text-muted-foreground"/> {item.vendor}
                          </td>
                          <td className="px-6 py-4 font-medium text-white">{item.amount}</td>
                          <td className="px-6 py-4 text-muted-foreground">{new Date(item.dueDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] px-2 py-1 rounded ${
                              item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              item.status === 'Pending' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {item.status === 'Pending' && (
                              <div className="flex justify-end gap-2">
                                <button className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded"><CheckCircle2 size={18}/></button>
                                <button className="p-1 text-red-400 hover:bg-red-400/10 rounded"><XCircle size={18}/></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg p-6">
                  <h3 className="font-medium text-white mb-4">Invoice Capture</h3>
                  <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center bg-white/5 flex flex-col items-center justify-center">
                    <div className="p-3 bg-primary/20 text-primary rounded-full mb-3">
                      <Mail size={24} />
                    </div>
                    <p className="text-sm text-white font-medium mb-1">Forward invoices to:</p>
                    <p className="text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded select-all">ap@acme.apexos.inbox</p>
                    <p className="text-xs text-muted-foreground mt-4">AI automatically extracts details and adds to Approvals</p>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeView === "Spend" && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-white">Corporate Cards</h2>
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_12px_rgba(0,91,181,0.3)]">
                  Issue New Card
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2].map(i => (
                  <div key={i} className="bg-gradient-to-br from-[#111317] to-[#0a0b0d] border border-white/10 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between items-start mb-8 relative">
                      <CreditCard className="text-white/80 w-8 h-8" />
                      <span className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider bg-white/10 text-white rounded">Virtual</span>
                    </div>
                    <div className="space-y-4 relative">
                      <div className="font-mono text-lg text-white tracking-widest">•••• •••• •••• {1234 + i}</div>
                      <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <span>{i === 1 ? 'Sarah Jenkins' : 'Mike Ross'}</span>
                        <span>04/28</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border border-dashed border-white/10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-white/5 hover:text-white transition-colors cursor-pointer group">
                  <div className="text-center">
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="text-sm font-medium">Issue Physical Card</span>
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-medium text-white mt-12 mb-4">Budget vs Actual</h2>
              <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg p-6 space-y-6">
                {financeData.spend.map(dept => {
                  const percent = (dept.actual / dept.budget) * 100;
                  return (
                    <div key={dept.id}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white font-medium">{dept.dept}</span>
                        <span className="text-muted-foreground">${(dept.actual/1000).toFixed(1)}k / ${(dept.budget/1000).toFixed(1)}k</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-orange-500' : 'bg-primary'}`} 
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeView === "AR" && (
            <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-white/5">
              <div className="text-center text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">AR view coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

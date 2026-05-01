import React, { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Globe, Settings, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { portalClients } from "@/data/mockData";

export default function Portal() {
  const [activeTab, setActiveTab] = useState("Management");
  const tabs = ["Management", "Preview"];

  return (
    <PageTransition className="flex flex-col h-full overflow-hidden">
      <div className="flex-none p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-display font-bold text-white">Client Portal</h1>
        </div>
        <div className="flex space-x-6 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab ? "text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(0,91,181,0.8)]" />
              )}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6 bg-[#0B0C0E]">
        {activeTab === "Management" ? (
          <div className="flex gap-6 h-full">
            <div className="flex-1">
              <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-3 font-medium">Client</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Portal Access</th>
                      <th className="px-6 py-3 font-medium">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portalClients.map(client => (
                      <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                        <td className="px-6 py-4 font-medium text-white">{client.name}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] px-2 py-1 rounded ${
                            client.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-white/5 text-muted-foreground border border-white/10'
                          }`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`w-8 h-4 rounded-full relative transition-colors ${client.portalEnabled ? 'bg-primary' : 'bg-white/10'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${client.portalEnabled ? 'left-4' : 'left-0.5'}`}></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{new Date(client.lastActivity).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="w-80 shrink-0 space-y-6">
              <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg p-6">
                <h3 className="font-medium text-white mb-4 flex items-center gap-2"><Settings size={16}/> Branding</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Custom Domain</label>
                    <input type="text" value="portal.acme.com" readOnly className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Brand Color</label>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded bg-primary border border-white/10"></div>
                      <input type="text" value="#005BB5" readOnly className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col relative border border-white/10">
            <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="mx-auto bg-white border border-gray-200 rounded px-4 py-1 text-xs text-gray-500 font-mono w-1/2 text-center flex items-center justify-center gap-2">
                <Globe size={12}/> portal.apexos.com/acme
              </div>
            </div>
            <div className="flex-1 p-8 bg-gray-50 text-gray-900 overflow-y-auto">
              {/* Simulated Client Interface - Light Theme */}
              <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-md"></div>
                    <h1 className="text-xl font-bold text-gray-900 font-display">Acme Portal</h1>
                  </div>
                  <div className="text-sm text-gray-500">Welcome back, Alice</div>
                </header>
                
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {["Pending Tasks (2)", "Unpaid Invoices (1)", "Recent Documents (4)"].map((kpi, i) => (
                    <div key={i} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-500 mb-2">{kpi.split(' ')[0]} {kpi.split(' ')[1]}</div>
                      <div className="text-3xl font-bold text-gray-900">{kpi.split('(')[1].replace(')', '')}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Action Required</h2>
                  <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <div className="font-medium text-gray-900">Review Q3 Report Draft</div>
                        <div className="text-sm text-gray-500 mt-1">Due Oct 15</div>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Review</Button>
                    </div>
                    <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <div className="font-medium text-gray-900">Invoice INV-2023-042</div>
                        <div className="text-sm text-gray-500 mt-1">$15,000.00 • Due Oct 20</div>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Pay Now</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

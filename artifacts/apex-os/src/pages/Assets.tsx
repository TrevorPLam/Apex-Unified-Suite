import React, { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Box, ScanLine, Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assetsData } from "@/data/mockData";

export default function Assets() {
  const [activeTab, setActiveTab] = useState("Inventory");
  const tabs = ["Inventory", "Check-Out", "Maintenance", "Depreciation"];

  return (
    <PageTransition className="flex flex-col h-full overflow-hidden">
      <div className="flex-none p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-display font-bold text-white">Assets</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/50">
              <ScanLine className="w-4 h-4 mr-2" /> Scan Barcode
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_12px_rgba(0,91,181,0.3)] hover:shadow-[0_0_15px_rgba(0,91,181,0.5)]">
              <Plus className="w-4 h-4 mr-2" /> New Asset
            </Button>
          </div>
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
        {activeTab === "Inventory" ? (
          <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-3 font-medium">Asset Name</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Location</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Serial #</th>
                  <th className="px-6 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {assetsData.map(asset => (
                  <tr key={asset.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-muted-foreground">
                        <Box size={14}/>
                      </div>
                      {asset.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{asset.category}</td>
                    <td className="px-6 py-4 text-muted-foreground">{asset.location}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-1 rounded ${
                        asset.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{asset.serial}</td>
                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-muted-foreground hover:text-white"><MoreHorizontal size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-white/5">
            <div className="text-center text-muted-foreground">
              <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">{activeTab} view coming soon</p>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

import React, { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Users, MoreHorizontal, Plus, Mail, Building, Tag, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { crmLeads, crmContacts } from "@/data/mockData";
import { AnimatePresence, motion } from "framer-motion";

export default function CRM() {
  const [activeTab, setActiveTab] = useState("Leads");
  const tabs = ["Leads", "Contacts", "Deals", "Email", "Engagements"];
  const [slideOutOpen, setSlideOutOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setSlideOutOpen(true);
  };

  return (
    <PageTransition className="flex flex-col h-full overflow-hidden">
      <div className="flex-none p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-display font-bold text-white">CRM</h1>
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_12px_rgba(0,91,181,0.3)] hover:shadow-[0_0_15px_rgba(0,91,181,0.5)]">
            <Plus className="w-4 h-4 mr-2" /> New {activeTab.slice(0, activeTab.endsWith('s') ? -1 : undefined)}
          </Button>
        </div>
        <div className="flex space-x-6 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSlideOutOpen(false); }}
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
      
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-auto p-6 bg-[#0B0C0E]">
          {activeTab === "Leads" && (
            <div className="flex gap-6 h-full overflow-x-auto pb-4 scrollbar-hide">
              {Object.entries(crmLeads).map(([key, items]) => (
                <div key={key} className="w-80 flex-shrink-0 bg-[#111317]/50 rounded-lg p-4 border border-white/5 flex flex-col h-full">
                  <h3 className="font-medium text-sm mb-4 flex items-center justify-between text-muted-foreground capitalize">
                    {key} <span className="bg-white/5 px-2 py-0.5 rounded text-xs">{items.length}</span>
                  </h3>
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-hide">
                    {items.map(lead => (
                      <div 
                        key={lead.id} 
                        onClick={() => handleItemClick(lead)}
                        className="bg-[#111317] border border-white/5 rounded-md p-4 hover:border-primary/50 hover:shadow-[0_0_0_1px_rgba(0,91,181,0.5)] transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm text-white">{lead.name}</div>
                          <button className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"><MoreHorizontal size={14}/></button>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                          <Building size={12} /> {lead.company}
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xs font-medium text-emerald-400">{lead.value}</span>
                          <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-muted-foreground">{lead.source}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Contacts" && (
            <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-white/5 flex gap-2">
                <Button variant="outline" className="bg-white/5 border-white/10 text-xs h-8">My Contacts</Button>
                <Button variant="outline" className="bg-white/5 border-white/10 text-xs h-8">Uncontacted</Button>
                <Button variant="outline" className="bg-white/5 border-white/10 text-xs h-8">Hot Leads</Button>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Company</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Last Contact</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {crmContacts.map(contact => (
                    <tr 
                      key={contact.id} 
                      onClick={() => handleItemClick(contact)}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white">{contact.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{contact.company}</td>
                      <td className="px-6 py-4 text-muted-foreground">{contact.email}</td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(contact.lastContact).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2 py-1 rounded ${
                          contact.status === 'Hot' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          contact.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-white/5 text-muted-foreground border border-white/10'
                        }`}>
                          {contact.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(!["Leads", "Contacts"].includes(activeTab)) && (
            <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-white/5">
              <div className="text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">{activeTab} view coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Slide-out Panel */}
        <AnimatePresence>
          {slideOutOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSlideOutOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute top-0 right-0 bottom-0 w-[440px] bg-[#111317]/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
              >
                <div className="p-6 border-b border-white/10 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">{selectedItem?.name}</h2>
                    <p className="text-muted-foreground text-sm mt-1">{selectedItem?.company}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSlideOutOpen(false)} className="hover:bg-white/10 rounded-full h-8 w-8">
                    &times;
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white uppercase tracking-wider">Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded-md border border-white/5">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Tag size={12}/> Value</div>
                        <div className="font-medium text-emerald-400">{selectedItem?.value || "$0"}</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-md border border-white/5">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Building size={12}/> Source</div>
                        <div className="font-medium text-white">{selectedItem?.source || "Direct"}</div>
                      </div>
                      {selectedItem?.email && (
                        <div className="bg-white/5 p-3 rounded-md border border-white/5 col-span-2">
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Mail size={12}/> Email</div>
                          <div className="font-medium text-white">{selectedItem.email}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white uppercase tracking-wider">Activity</h3>
                    <div className="border-l border-white/10 ml-2 space-y-4 pl-4 relative">
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-[#111317]"></div>
                        <div className="text-sm text-white font-medium">Viewed Proposal</div>
                        <div className="text-xs text-muted-foreground mt-0.5">2 hours ago</div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white/20 ring-4 ring-[#111317]"></div>
                        <div className="text-sm text-white font-medium">Email Sent</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Yesterday</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-white/10 bg-[#0B0C0E]">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_12px_rgba(0,91,181,0.3)]">
                    {activeTab === "Leads" ? "Convert to Contact" : "Send Email"}
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

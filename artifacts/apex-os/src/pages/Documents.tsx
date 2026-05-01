import React, { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { FileText, UploadCloud, Folder, Search, FileSignature, CheckCircle, File, Clock, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { documentsData } from "@/data/mockData";
import { AnimatePresence, motion } from "framer-motion";

export default function Documents() {
  const [activeTab, setActiveTab] = useState("Repository");
  const tabs = ["Repository", "E-Sign", "Workflows", "Inbox"];
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const openFile = (file: any) => {
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  return (
    <PageTransition className="flex flex-col h-full overflow-hidden">
      <div className="flex-none p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-display font-bold text-white">Documents</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
              <FileSignature className="w-4 h-4 mr-2" /> E-Sign
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_12px_rgba(0,91,181,0.3)] hover:shadow-[0_0_15px_rgba(0,91,181,0.5)]">
              <UploadCloud className="w-4 h-4 mr-2" /> Upload
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
      
      <div className="flex-1 flex overflow-hidden">
        {activeTab === "Repository" ? (
          <>
            <div className="w-64 border-r border-white/5 flex flex-col bg-[#0B0C0E]">
              <div className="p-4 border-b border-white/5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search files..." 
                    className="w-full bg-[#111317] border border-white/10 rounded-md py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Cabinets</h3>
                <div className="space-y-1">
                  {["Client Contracts", "Invoices", "HR Documents", "Internal Policies", "Project Assets"].map((folder, idx) => (
                    <button key={folder} className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors ${idx === 0 ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                      <Folder size={16} />
                      {folder}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-[#0B0C0E]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">Client Contracts</h2>
                <span className="text-sm text-muted-foreground">3 files</span>
              </div>
              <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Size</th>
                      <th className="px-6 py-3 font-medium">Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentsData.repository.map(doc => (
                      <tr 
                        key={doc.id} 
                        onClick={() => openFile(doc)}
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                          <div className={`p-2 rounded bg-white/5 ${doc.type === 'pdf' ? 'text-red-400' : 'text-blue-400'}`}>
                            <File size={16} />
                          </div>
                          {doc.name}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{doc.size}</td>
                        <td className="px-6 py-4 text-muted-foreground">{new Date(doc.modified).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === "E-Sign" ? (
          <div className="flex-1 p-6 bg-[#0B0C0E] overflow-y-auto">
             <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-3 font-medium">Document</th>
                      <th className="px-6 py-3 font-medium">Signers</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Date Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentsData.esign.map(req => (
                      <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                          <FileSignature size={14} className="text-primary"/> {req.doc}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{req.signers}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] px-2 py-1 rounded ${
                            req.status === 'Signed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            req.status === 'Viewed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-white/5 text-muted-foreground border border-white/10'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{new Date(req.sent).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        ) : (
          <div className="flex-1 p-6 bg-[#0B0C0E]">
            <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-white/5">
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">{activeTab} view coming soon</p>
              </div>
            </div>
          </div>
        )}

        {/* File Preview Modal */}
        <AnimatePresence>
          {previewOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-5xl h-[85vh] bg-[#111317] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0B0C0E]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-white/5 text-primary">
                      <File size={20} />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{selectedFile?.name}</h3>
                      <p className="text-xs text-muted-foreground">{selectedFile?.size} • Modified {selectedFile ? new Date(selectedFile.modified).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-white/5 border-white/10">
                      <Share2 className="w-4 h-4 mr-2" /> Share
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white/5 border-white/10">
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setPreviewOpen(false)} className="hover:bg-white/10">
                      &times;
                    </Button>
                  </div>
                </div>
                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 bg-black/50 p-8 overflow-y-auto flex items-start justify-center">
                    <div className="w-full max-w-3xl aspect-[1/1.4] bg-white rounded shadow-lg flex items-center justify-center relative overflow-hidden">
                      <div className="text-center text-gray-400">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20 text-gray-800" />
                        <p>Document Preview Rendering</p>
                      </div>
                      {/* Fake skeleton content for doc */}
                      <div className="absolute inset-8 space-y-4 opacity-10">
                        <div className="h-8 bg-black rounded w-1/3 mb-12"></div>
                        <div className="h-4 bg-black rounded w-full"></div>
                        <div className="h-4 bg-black rounded w-full"></div>
                        <div className="h-4 bg-black rounded w-5/6"></div>
                        <div className="h-4 bg-black rounded w-full mt-8"></div>
                        <div className="h-4 bg-black rounded w-4/5"></div>
                      </div>
                    </div>
                  </div>
                  <div className="w-80 border-l border-white/10 bg-[#0B0C0E] p-4 overflow-y-auto">
                    <h4 className="text-sm font-medium text-white uppercase tracking-wider mb-4">Version History</h4>
                    <div className="relative border-l border-white/10 ml-2 pl-4 space-y-6">
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-[#0B0C0E]"></div>
                        <div className="text-sm font-medium text-white">Current Version (v2.1)</div>
                        <div className="text-xs text-muted-foreground mt-1">Edited by Sarah J. • Today</div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white/20 ring-4 ring-[#0B0C0E]"></div>
                        <div className="text-sm font-medium text-white">Version 2.0</div>
                        <div className="text-xs text-muted-foreground mt-1">Approved by Mike R. • 3 days ago</div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white/20 ring-4 ring-[#0B0C0E]"></div>
                        <div className="text-sm font-medium text-white">Initial Draft</div>
                        <div className="text-xs text-muted-foreground mt-1">Created by System • 1 week ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

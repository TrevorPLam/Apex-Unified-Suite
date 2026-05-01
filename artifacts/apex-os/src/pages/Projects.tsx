import React, { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { FolderKanban, Plus, Clock, Calendar, CheckCircle2, Circle, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { projectsData } from "@/data/mockData";
import { AnimatePresence, motion } from "framer-motion";

export default function Projects() {
  const [activeTab, setActiveTab] = useState("Board");
  const tabs = ["My Week", "Board", "Projects", "Templates", "Scheduler"];
  const [slideOutOpen, setSlideOutOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const openProjectDetails = (project: any) => {
    setSelectedProject(project);
    setSlideOutOpen(true);
  };

  return (
    <PageTransition className="flex flex-col h-full overflow-hidden">
      <div className="flex-none p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-display font-bold text-white">Projects</h1>
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_12px_rgba(0,91,181,0.3)] hover:shadow-[0_0_15px_rgba(0,91,181,0.5)]">
            <Plus className="w-4 h-4 mr-2" /> New Project
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
          {activeTab === "My Week" && (
            <div className="flex gap-6 h-full">
              <div className="flex-1 grid grid-cols-3 gap-6">
                {["Focus", "This Week", "Later"].map((col, idx) => (
                  <div key={col} className="bg-[#111317]/50 rounded-lg p-4 border border-white/5 flex flex-col h-full">
                    <h3 className="font-medium text-sm mb-4 text-muted-foreground uppercase tracking-wider">{col}</h3>
                    <div className="space-y-3 flex-1">
                      {projectsData.tasks.filter((_, i) => i % 3 === idx).map(task => (
                        <div key={task.id} className="bg-[#111317] border border-white/5 rounded-md p-3 hover:border-primary/50 transition-all cursor-pointer group">
                          <div className="flex items-start gap-3">
                            <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                            <div>
                              <div className="text-sm font-medium text-white">{task.content}</div>
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                <span className="px-1.5 py-0.5 bg-white/5 rounded">{task.project}</span>
                                <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-64 bg-[#111317]/50 border border-white/5 rounded-lg p-4 shrink-0">
                <h3 className="font-medium text-sm mb-4 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={14}/> Calendar
                </h3>
                <div className="aspect-square bg-white/5 rounded-md border border-white/5 flex items-center justify-center text-muted-foreground text-xs">
                  Mini Calendar UI
                </div>
              </div>
            </div>
          )}

          {activeTab === "Projects" && (
            <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Client</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Progress</th>
                    <th className="px-6 py-3 font-medium">Due Date</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {projectsData.projects.map(project => (
                    <tr 
                      key={project.id} 
                      onClick={() => openProjectDetails(project)}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white">{project.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{project.client}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2 py-1 rounded ${
                          project.status === 'In Progress' ? 'bg-primary/10 text-primary border border-primary/20' :
                          project.status === 'Review' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          'bg-white/5 text-muted-foreground border border-white/10'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }}></div>
                          </div>
                          <span className="text-xs text-muted-foreground">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(project.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-muted-foreground hover:text-white"><MoreVertical size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(!["My Week", "Projects"].includes(activeTab)) && (
            <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-white/5">
              <div className="text-center text-muted-foreground">
                <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
                className="absolute top-0 right-0 bottom-0 w-[500px] bg-[#111317]/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
              >
                <div className="p-6 border-b border-white/10 flex justify-between items-start">
                  <div>
                    <div className="text-xs text-primary mb-1 font-medium">{selectedProject?.client}</div>
                    <h2 className="text-2xl font-display font-bold text-white">{selectedProject?.name}</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSlideOutOpen(false)} className="hover:bg-white/10 rounded-full h-8 w-8">
                    &times;
                  </Button>
                </div>
                <div className="flex border-b border-white/10 px-6 gap-6 text-sm">
                  {["Tasks", "Timeline", "Time & Budget", "Details"].map(t => (
                    <button key={t} className={`py-3 font-medium border-b-2 ${t === 'Tasks' ? 'border-primary text-white' : 'border-transparent text-muted-foreground'}`}>{t}</button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium text-white">Project Tasks</h3>
                      <Button variant="outline" size="sm" className="h-7 text-xs bg-white/5 border-white/10">Add Task</Button>
                    </div>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-white/5 border border-white/5">
                        <CheckCircle2 className={`w-5 h-5 mt-0.5 ${i === 1 ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <div className={`text-sm ${i === 1 ? 'text-muted-foreground line-through' : 'text-white'}`}>Task description placeholder {i}</div>
                          <div className="text-xs text-muted-foreground mt-1">Due in {i + 2} days • Assigned to AT</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

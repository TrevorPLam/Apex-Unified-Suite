import React from "react";
import { useLocation } from "wouter";
import { Bell, Search, User } from "lucide-react";
import { CommandPalette } from "../CommandPalette";

export const Header: React.FC = () => {
  const [location] = useLocation();
  const [cmdOpen, setCmdOpen] = React.useState(false);

  const pathParts = location.split("/").filter(Boolean);
  const moduleName = pathParts[0] ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1) : "Dashboard";

  return (
    <>
      <header className="h-14 border-b border-white/5 bg-[#0B0C0E]/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hover:text-white cursor-pointer transition-colors">ApexOS</span>
          <span>/</span>
          <span className="text-white font-medium">{moduleName}</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground text-sm hover:bg-white/10 hover:border-primary/50 hover:shadow-[0_0_0_1px_rgba(0,91,181,0.5)] transition-all"
          >
            <Search size={14} />
            <span>Search...</span>
            <kbd className="ml-2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          <button className="relative p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-[#0B0C0E]"></span>
          </button>

          <button className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-sm font-medium hover:bg-primary/30 transition-colors">
            JS
          </button>
        </div>
      </header>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  );
};

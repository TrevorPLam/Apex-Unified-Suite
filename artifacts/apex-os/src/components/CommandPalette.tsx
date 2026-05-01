import React, { useEffect } from "react";
import { Command } from "cmdk";
import { useLocation } from "wouter";
import { LayoutDashboard, Users, FolderKanban, FileText, DollarSign, Box, Globe, BarChart3, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";

const pages = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "crm", label: "CRM", icon: Users, path: "/crm" },
  { id: "projects", label: "Projects", icon: FolderKanban, path: "/projects" },
  { id: "documents", label: "Documents", icon: FileText, path: "/documents" },
  { id: "finance", label: "Finance", icon: DollarSign, path: "/finance" },
  { id: "assets", label: "Assets", icon: Box, path: "/assets" },
  { id: "portal", label: "Portal", icon: Globe, path: "/portal" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" }
];

export const CommandPalette: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void }> = ({ open, onOpenChange }) => {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden bg-[#111317] border-white/10 shadow-2xl max-w-lg" hideClose>
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <DialogDescription className="sr-only">Search for pages and actions</DialogDescription>
        <Command className="w-full">
          <div className="flex items-center border-b border-white/5 px-3" cmdk-input-wrapper="">
            <Command.Input 
              autoFocus 
              placeholder="Type a command or search..." 
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground text-white border-none focus:ring-0" 
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No results found.</Command.Empty>
            <Command.Group heading="Pages" className="text-xs text-muted-foreground font-medium px-2 py-1">
              {pages.map((page) => (
                <Command.Item
                  key={page.id}
                  value={page.label}
                  onSelect={() => runCommand(() => setLocation(page.path))}
                  className="flex items-center gap-2 px-2 py-2 text-sm text-white rounded-md cursor-pointer hover:bg-primary/20 hover:text-primary data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary transition-colors"
                >
                  <page.icon size={16} />
                  {page.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

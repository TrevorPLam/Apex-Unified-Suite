import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, FolderKanban, FileText, DollarSign, Box, Globe, BarChart3, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/crm", label: "CRM", icon: Users },
  { path: "/projects", label: "Projects", icon: FolderKanban },
  { path: "/documents", label: "Documents", icon: FileText },
  { path: "/finance", label: "Finance", icon: DollarSign },
  { path: "/assets", label: "Assets", icon: Box },
  { path: "/portal", label: "Portal", icon: Globe },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings }
];

export const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div 
      initial={false}
      animate={{ width: collapsed ? 60 : 220 }}
      className="flex flex-col h-screen border-r border-white/5 bg-[#0B0C0E] z-20 shrink-0 relative"
    >
      <div className="h-14 flex items-center justify-center border-b border-white/5 shrink-0 overflow-hidden">
        {collapsed ? (
          <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center text-primary font-bold">A</div>
        ) : (
          <div className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md shadow-[0_0_12px_rgba(0,91,181,0.5)]"></div>
            ApexOS
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-hide">
        {navItems.map((item) => {
          const isActive = location.startsWith(item.path);
          return (
            <Link key={item.path} href={item.path}>
              <div 
                className={`
                  flex items-center rounded-md cursor-pointer transition-all duration-200
                  ${collapsed ? 'justify-center h-10 px-0' : 'px-3 h-10 gap-3'}
                  ${isActive 
                    ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5 border-l-2 border-transparent hover:shadow-[0_0_0_1px_rgba(0,91,181,0.5)]'
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} className={isActive ? "text-primary" : ""} />
                {!collapsed && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-2 border-t border-white/5">
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="w-full h-10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 rounded-md transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.div>
  );
};

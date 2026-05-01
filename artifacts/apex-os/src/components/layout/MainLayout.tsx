import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-[#0B0C0E] text-[#E8EAED] overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <AnimatePresence mode="wait">
            <React.Fragment key={location}>
              {children}
            </React.Fragment>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

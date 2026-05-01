import React, { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Settings as SettingsIcon, Shield, Bell, Blocks, Activity, CreditCard, Key, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { settingsUsers } from "@/data/mockData";

export default function Settings() {
  const [activeCategory, setActiveCategory] = useState("Users & Permissions");
  const categories = [
    { id: "General", icon: SettingsIcon },
    { id: "Users & Permissions", icon: Shield },
    { id: "Email & Notifications", icon: Bell },
    { id: "Integrations", icon: Blocks },
    { id: "Audit Log", icon: Activity },
    { id: "Billing", icon: CreditCard },
    { id: "API & Webhooks", icon: Key }
  ];

  return (
    <PageTransition className="flex h-full overflow-hidden">
      <div className="w-64 border-r border-white/5 p-4 flex flex-col gap-1 bg-[#0B0C0E]">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4 px-2 uppercase tracking-wider">Settings</h2>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-md text-sm transition-colors ${
              activeCategory === cat.id ? "bg-primary/10 text-primary font-medium border border-primary/20" : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            <cat.icon size={16} />
            {cat.id}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-auto p-8 bg-[#0B0C0E]">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-display font-bold text-white">{activeCategory}</h1>
            {activeCategory === "Users & Permissions" && (
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_12px_rgba(0,91,181,0.3)] hover:shadow-[0_0_15px_rgba(0,91,181,0.5)]">
                <UserPlus className="w-4 h-4 mr-2" /> Invite User
              </Button>
            )}
          </div>

          {activeCategory === "Users & Permissions" ? (
            <div className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {settingsUsers.map(user => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
                          {user.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <select className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary">
                          <option>{user.role}</option>
                          <option>Admin</option>
                          <option>Manager</option>
                          <option>User</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${user.status === 'Active' ? 'bg-primary' : 'bg-white/10'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${user.status === 'Active' ? 'left-4' : 'left-0.5'}`}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeCategory === "Integrations" ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {["Stripe", "Salesforce", "QuickBooks", "Google Drive", "Slack", "DocuSign"].map((int, i) => (
                  <div key={int} className="bg-[#111317]/80 backdrop-blur-xl border border-white/5 rounded-lg p-5 flex flex-col hover:border-primary/50 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-white/10 transition-colors">
                        <Blocks size={20} />
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded ${i < 2 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-muted-foreground border border-white/10'}`}>
                        {i < 2 ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <h3 className="font-medium text-white mb-1">{int}</h3>
                    <p className="text-xs text-muted-foreground flex-1 mb-4">Connect {int} to sync data automatically.</p>
                    <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-xs">
                      {i < 2 ? 'Configure' : 'Connect'}
                    </Button>
                  </div>
                ))}
             </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-white/5">
              <div className="text-center text-muted-foreground">
                <SettingsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">{activeCategory} settings coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Map, Search, Users, Bell, Brain, FileText,
  Shield, Menu, X, ChevronRight, Zap, BotMessageSquare, Sparkles, BarChart2, Settings, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/map", label: "Mapa", icon: Map },
  { path: "/search", label: "Buscar Comercios", icon: Search },
  { path: "/clients", label: "Clientes", icon: Users },
  { path: "/ai-assistant", label: "Asistente IA", icon: Brain },
  { path: "/alerts", label: "Alertas", icon: Bell },
  { path: "/sales-agent", label: "Sales Agent AI", icon: BotMessageSquare },
  { path: "/chat", label: "Mensajería", icon: MessageSquare },
  { path: "/zone-report", label: "Reportes PDF", icon: BarChart2 },
  { path: "/settings", label: "Configuración", icon: Settings },
  { path: "/privacy", label: "Privacidad", icon: Shield },
];

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/40">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-[15px] text-white tracking-tight">Sales Force</h1>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-red-400 uppercase tracking-widest">GETNET</span>
                <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-900/30"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-white"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", isActive && "drop-shadow-sm")} />
                <span className="flex-1">{item.label}</span>
                {item.label === "Sales Agent AI" && !isActive && (
                  <span className="text-[9px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">IA</span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="rounded-xl bg-sidebar-accent/60 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-semibold text-white/80">Sales Force Getnet</span>
            </div>
            <p className="text-[10px] text-sidebar-foreground/40">v2.0 · IA Comercial Avanzada</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border px-4 lg:px-6 h-14 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Link to="/alerts" className="relative p-2 rounded-xl hover:bg-muted transition-colors group">
              <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
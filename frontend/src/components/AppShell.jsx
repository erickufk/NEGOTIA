import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../components/ui/dropdown-menu";
import { LayoutDashboard, Library, GraduationCap, History as HistoryIcon, User, LogOut, Languages, Menu, X, Brain, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const items = [
    { to: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard, tid: "nav-dashboard" },
    { to: "/scenarios", label: t.nav.scenarios, icon: Library, tid: "nav-scenarios" },
    { to: "/learn", label: t.nav.learn, icon: GraduationCap, tid: "nav-learn" },
    { to: "/history", label: t.nav.history, icon: HistoryIcon, tid: "nav-history" },
    { to: "/profile", label: t.nav.profile, icon: User, tid: "nav-profile" },
  ];

  const isActive = (to) => loc.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex flex-col text-[#1E293B]">
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/85 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2.5 group" data-testid="brand-link">
              <div className="w-9 h-9 rounded-xl neo-raised-sm flex items-center justify-center text-[#4F46E5] group-hover:scale-105 transition-transform">
                <Brain className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">{t.brand}</span>
              <span className="hidden sm:inline-flex chip chip-primary !py-0.5 !text-[10px]">AI SIMULATOR</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 p-1 rounded-full neo-inset ml-4">
              {items.map(i => (
                <Link key={i.to} to={i.to} data-testid={i.tid}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all ${
                    isActive(i.to)
                      ? "neo-raised-sm text-[#4F46E5] font-semibold"
                      : "text-slate-500 hover:text-[#1E293B]"
                  }`}>
                  <i.icon className="w-3.5 h-3.5" />{i.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="lang-switch"
                  className="h-9 px-3 rounded-full neo-raised-sm flex items-center gap-1 text-xs font-mono font-semibold text-[#1E293B] hover:text-[#4F46E5] transition-colors">
                  <Languages className="w-3.5 h-3.5" />
                  <span>{lang.toUpperCase()}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-black/10 text-[#1E293B]">
                <DropdownMenuItem data-testid="lang-en" onClick={() => setLang("en")}>English</DropdownMenuItem>
                <DropdownMenuItem data-testid="lang-ru" onClick={() => setLang("ru")}>Русский</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="user-menu"
                  className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full neo-raised-sm hover:shadow-md transition-all">
                  <span className="w-7 h-7 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] ring-1 ring-[#4F46E5]/30 font-mono font-bold flex items-center justify-center text-xs">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                  <span className="hidden sm:inline text-xs font-semibold text-[#1E293B]">{user?.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-black/10 text-[#1E293B]">
                <DropdownMenuItem data-testid="menu-profile" onClick={() => nav("/profile")}><User className="w-4 h-4 mr-2" />{t.nav.profile}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-signout" onClick={() => { logout(); nav("/"); }}>
                  <LogOut className="w-4 h-4 mr-2" />{t.nav.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button className="md:hidden w-9 h-9 rounded-full neo-raised-sm flex items-center justify-center text-[#1E293B]" onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle">
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden px-4 py-3 flex flex-col gap-1 bg-[#FAF9F6]">
            {items.map(i => (
              <Link key={i.to} to={i.to} onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-sm text-[#1E293B] hover:bg-black/5 flex items-center gap-2">
                <i.icon className="w-4 h-4" />{i.label}
              </Link>
            ))}
          </div>
        )}
      </header>
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8">{children}</main>
      <footer className="border-t border-black/5 py-6 text-center text-xs text-slate-500">
        © 2026 NEGOTIA · AI Negotiation Simulator
      </footer>
    </div>
  );
}

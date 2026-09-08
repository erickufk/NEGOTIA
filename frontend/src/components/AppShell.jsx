import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../components/ui/dropdown-menu";
import { LayoutDashboard, Library, History, User, LogOut, Languages, Menu, X } from "lucide-react";
import { useState } from "react";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const items = [
    { to: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard, tid: "nav-dashboard" },
    { to: "/scenarios", label: t.nav.scenarios, icon: Library, tid: "nav-scenarios" },
    { to: "/history", label: t.nav.history, icon: History, tid: "nav-history" },
    { to: "/profile", label: t.nav.profile, icon: User, tid: "nav-profile" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/5 bg-[#0B0F17]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2" data-testid="brand-link">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center font-black text-[#0B0F17]">N</div>
              <span className="font-display font-extrabold tracking-tight text-lg">{t.brand}</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {items.map(i => (
                <Link key={i.to} to={i.to} data-testid={i.tid}
                  className="px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition flex items-center gap-2">
                  <i.icon className="w-4 h-4" />{i.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="lang-switch" className="text-slate-400">
                  <Languages className="w-4 h-4 mr-1" /> {lang.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#131C2E] border-white/10 text-white">
                <DropdownMenuItem data-testid="lang-en" onClick={() => setLang("en")}>English</DropdownMenuItem>
                <DropdownMenuItem data-testid="lang-ru" onClick={() => setLang("ru")}>Русский</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="user-menu" className="text-white">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-[#0B0F17] font-bold flex items-center justify-center text-xs">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                  <span className="hidden sm:inline ml-2 text-sm">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#131C2E] border-white/10 text-white">
                <DropdownMenuItem data-testid="menu-profile" onClick={() => nav("/profile")}><User className="w-4 h-4 mr-2" />{t.nav.profile}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-signout" onClick={() => { logout(); nav("/"); }}>
                  <LogOut className="w-4 h-4 mr-2" />{t.nav.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button className="md:hidden text-white" onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle">
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-white/5 px-4 py-3 flex flex-col gap-1">
            {items.map(i => (
              <Link key={i.to} to={i.to} onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2">
                <i.icon className="w-4 h-4" />{i.label}
              </Link>
            ))}
          </div>
        )}
      </header>
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}

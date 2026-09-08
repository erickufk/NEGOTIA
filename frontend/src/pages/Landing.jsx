import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { ArrowRight, Zap, Target, Sparkles, Users, Brain, Trophy, Languages, MessageSquare, Mic, GitBranch, ShieldCheck } from "lucide-react";

export default function Landing() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const go = () => nav(user ? "/dashboard" : "/auth");

  const scenarios = [
    { title: "Salary Negotiation", cat: "Career", tag: "chip-amber" },
    { title: "Enterprise Discount", cat: "Sales", tag: "chip-sky" },
    { title: "Vendor Price Increase", cat: "Procurement", tag: "chip-emerald" },
    { title: "Team Resource Conflict", cat: "Management", tag: "chip-indigo" },
    { title: "Strategic Partnership", cat: "Partnership", tag: "chip-rose" },
    { title: "Service Failure Crisis", cat: "Conflict", tag: "chip-slate" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 sticky top-0 z-40 bg-[#0B0F17]/70 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="brand-link-landing">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center font-black text-[#0B0F17]">N</div>
            <span className="font-display font-extrabold text-lg">{t.brand}</span>
          </Link>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="landing-lang" className="text-slate-400">
                  <Languages className="w-4 h-4 mr-1" />{lang.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#131C2E] border-white/10 text-white">
                <DropdownMenuItem onClick={() => setLang("en")}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLang("ru")}>Русский</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {user ? (
              <Button className="btn-primary rounded-full px-5" onClick={() => nav("/dashboard")} data-testid="cta-dashboard">
                {t.nav.dashboard}
              </Button>
            ) : (
              <>
                <Link to="/auth" className="text-sm text-slate-300 hover:text-white" data-testid="cta-signin">{t.auth.signIn}</Link>
                <Button className="btn-primary rounded-full px-5" onClick={go} data-testid="cta-signup">{t.auth.signUp}</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden tactical-grid">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="fade-up">
            <span className="chip chip-sky mb-6">{t.landing.heroTag}</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-[1.05]">
              {t.landing.heroTitle} <br /><span className="gradient-text">{t.landing.heroTitleAccent}</span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 max-w-xl">{t.landing.heroSub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="btn-primary rounded-full px-6 h-12 text-base" onClick={go} data-testid="hero-start">
                {t.landing.startSim} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" className="rounded-full px-6 h-12 text-base border-white/15 bg-transparent text-white hover:bg-white/5" onClick={go} data-testid="hero-explore">
                {t.landing.explore}
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Harvard method</div>
              <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-sky-400" /> Claude Sonnet 5</div>
            </div>
          </div>
          {/* Mock negotiation preview */}
          <div className="relative fade-up">
            <div className="card-glow rounded-2xl p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">Live Simulation</div>
                  <div className="font-semibold">Vendor Price Increase</div>
                </div>
                <span className="chip chip-emerald pulse-dot">● Active</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300 text-xs font-bold">AV</div>
                  <div className="flex-1 bg-white/5 rounded-2xl rounded-tl-sm p-3 text-slate-300">"We need a 12% raise across the board. Non-negotiable."</div></div>
                <div className="flex gap-3 flex-row-reverse"><div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-300 text-xs font-bold">YOU</div>
                  <div className="flex-1 bg-sky-500/10 border border-sky-500/20 rounded-2xl rounded-tr-sm p-3 text-slate-200">"Help me understand what's driving that number for you."</div></div>
                <div className="flex items-center gap-2 text-xs text-slate-500 pl-11"><Sparkles className="w-3 h-3 text-amber-400" /> Open probing question detected · +8 Questioning</div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-3 text-xs">
                <div><div className="text-slate-500">Trust</div><div className="font-mono text-emerald-400">64</div></div>
                <div><div className="text-slate-500">Pressure</div><div className="font-mono text-amber-400">42</div></div>
                <div><div className="text-slate-500">Round</div><div className="font-mono text-sky-400">3 / 10</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-t border-white/5 py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-12">{t.landing.problemTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[t.landing.problem1, t.landing.problem2, t.landing.problem3].map((p, i) => (
              <div key={i} className="card-glow rounded-2xl p-6" data-testid={`problem-${i}`}>
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400 font-mono">{i+1}</div>
                <div className="font-semibold mb-2">{p.t}</div>
                <div className="text-sm text-slate-400">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-white/5 py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-12">{t.landing.howTitle}</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { ...t.landing.step1, icon: Target },
              { ...t.landing.step2, icon: Brain },
              { ...t.landing.step3, icon: Users },
              { ...t.landing.step4, icon: Trophy },
            ].map((s, i) => (
              <div key={i} className="card-glow rounded-2xl p-6 relative" data-testid={`step-${i}`}>
                <div className="text-xs font-mono text-sky-400 mb-3">STEP 0{i+1}</div>
                <s.icon className="w-6 h-6 text-sky-400 mb-3" />
                <div className="font-semibold mb-2">{s.t}</div>
                <div className="text-sm text-slate-400">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-white/5 py-20 tactical-grid">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-12">{t.landing.featuresTitle}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { i: MessageSquare, t: t.landing.f1, c: "sky" },
              { i: Users, t: t.landing.f2, c: "indigo" },
              { i: Mic, t: t.landing.f3, c: "amber" },
              { i: Target, t: t.landing.f4, c: "emerald" },
              { i: Brain, t: t.landing.f5, c: "rose" },
              { i: GitBranch, t: t.landing.f6, c: "sky" },
            ].map((f, i) => (
              <div key={i} className="card-glow rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg bg-${f.c}-500/10 border border-${f.c}-500/20 flex items-center justify-center text-${f.c}-400`}>
                  <f.i className="w-5 h-5" />
                </div>
                <div className="font-medium">{f.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCENARIOS */}
      <section className="border-t border-white/5 py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-12">{t.landing.scenariosTitle}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((s, i) => (
              <div key={i} className="card-glow rounded-2xl p-6 hover:-translate-y-0.5 transition">
                <span className={`chip ${s.tag} mb-4`}>{s.cat}</span>
                <div className="font-display font-semibold text-lg">{s.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METHODOLOGY */}
      <section className="border-t border-white/5 py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-12">{t.landing.methodTitle}</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[t.landing.method1, t.landing.method2, t.landing.method3, t.landing.method4].map((m, i) => (
              <div key={i} className="card-glow rounded-2xl p-5 text-center">
                <Zap className="w-5 h-5 text-amber-400 mx-auto mb-3" />
                <div className="text-sm font-medium">{m}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-white/5 py-24">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-display font-extrabold mb-8">{t.landing.ctaTitle}</h2>
          <Button className="btn-primary rounded-full px-8 h-14 text-base" onClick={go} data-testid="cta-final">
            {t.landing.ctaBtn} <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        © 2026 NEGOTIA · AI Negotiation Simulator
      </footer>
    </div>
  );
}

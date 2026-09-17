import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../lib/api";
import { Plus, TrendingUp, Sparkles, Trophy, Flame, ArrowRight, Target, Activity, Radar as RadarIcon } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { t, lang } = useI18n();
  const L = t.labels;
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [rec, setRec] = useState(null);

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
    api.listNeg().then(list => setRecent(list.slice(0, 5))).catch(() => {});
    api.recommended(lang).then(setRec).catch(() => {});
  }, [lang]);

  const kpi = [
    { label: t.dashboard.total, value: stats?.total ?? 0, icon: Activity, suffix: "" },
    { label: t.dashboard.avg, value: stats?.avg_score ?? 0, icon: Target, suffix: " / 100" },
    { label: t.dashboard.best, value: stats?.best_score ?? 0, icon: Trophy, suffix: " / 100" },
    { label: t.dashboard.streak, value: stats?.streak ?? 0, icon: Flame, suffix: "" },
  ];
  const radarData = stats?.skills ? Object.entries(stats.skills).map(([k, v]) => ({ skill: L.skills[k] || k, value: v })) : [];

  return (
    <AppShell>
      {/* Greeting + Action */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-[#4F46E5] mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] pulse-dot !p-0 before:content-none" />
            <span>{t.dashboard.welcome.toUpperCase()}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight" data-testid="dashboard-welcome">
            {t.dashboard.welcome}, {user?.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            {t.dashboard.subline || "Continue your ongoing simulations or pick a fresh scenario tuned to your weakest skill."}
          </p>
        </div>
        <button onClick={() => nav("/simulate")} data-testid="new-sim-btn"
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />{t.dashboard.newSim}
        </button>
      </section>

      {/* Hero recommended */}
      {rec?.scenarios?.[0] && (
        <section className="neo-raised p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#4F46E5]/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neo-inset text-xs font-mono font-semibold text-[#4F46E5]">
                <Sparkles className="w-3 h-3" />
                <span>{t.dashboard.recommended.toUpperCase()} · AI DIAGNOSTIC</span>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-display font-bold">{rec.scenarios[0].title}</h2>
                <p className="text-sm md:text-base text-slate-500 mt-2 leading-relaxed">{rec.scenarios[0].description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="chip chip-slate">{L.categories[rec.scenarios[0].category] || rec.scenarios[0].category}</span>
                <span className="chip chip-slate">{L.difficulty[rec.scenarios[0].difficulty] || rec.scenarios[0].difficulty}</span>
                <span className="chip chip-primary flex items-center gap-1">
                  {t.dashboard.weakestNote} <span className="font-bold">{L.skills[rec.weakest_skill] || rec.weakest_skill}</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
              <button onClick={() => nav(`/simulate?scenario=${rec.scenarios[0].slug}`)} data-testid="start-recommended"
                className="btn-primary px-6 py-3 text-sm flex items-center justify-center gap-2">
                <span>{t.dashboard.startRec}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* KPI Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpi.map((k, i) => (
          <div key={i} className="neo-raised p-5 neo-raised-hover" data-testid={`kpi-${k.label}`}>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">{k.label}</span>
              <k.icon className="w-4 h-4 text-[#4F46E5]" />
            </div>
            <div className="mt-3 font-mono font-bold text-2xl md:text-3xl text-[#1E293B]">
              {k.value}{k.suffix && <span className="text-sm font-normal text-slate-400">{k.suffix}</span>}
            </div>
          </div>
        ))}
      </section>

      {/* Two-col main */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-display font-bold text-lg">{t.dashboard.recent}</h2>
            </div>
            <button onClick={() => nav("/history")} data-testid="view-all-history"
              className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center gap-1">
              <span>{t.dashboard.viewAll}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="neo-raised p-10 text-center">
              <div className="text-slate-500 mb-4">{t.dashboard.empty}</div>
              <button onClick={() => nav("/simulate")} data-testid="empty-start-btn" className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />{t.dashboard.newSim}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map(r => (
                <div key={r.id} onClick={() => nav(r.status === "completed" ? `/debrief/${r.id}` : `/negotiation/${r.id}`)}
                  data-testid={`recent-${r.id}`}
                  className={`neo-raised p-5 neo-raised-hover cursor-pointer ${r.status === "active" ? "border-l-4 border-l-[#4F46E5]" : ""}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        {r.status === "active" ? (
                          <span className="chip chip-emerald pulse-dot">{t.dashboard.inProgress}</span>
                        ) : null}
                        <span className="chip chip-slate !text-[10px]">{(L.modes[r.mode] || r.mode || "").toUpperCase()}</span>
                        <span className="chip chip-slate !text-[10px]">{((L.frameworks[r.training_framework] && L.frameworks[r.training_framework].name) || r.framework_name || "Combined").toUpperCase()}</span>
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-display font-semibold text-base">{r.scenario_title}</h3>
                      {r.outcome && <div className="text-xs text-slate-500">{L.outcome[r.outcome] || r.outcome}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-lg font-mono font-bold ${r.score >= 70 ? "text-emerald-600" : r.score >= 50 ? "text-[#1E293B]" : "text-rose-600"}`}>
                        {r.score ?? "—"}<span className="text-xs font-normal text-slate-400"> / 100</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Radar */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <RadarIcon className="w-5 h-5 text-[#4F46E5]" />
            <h2 className="font-display font-bold text-lg">{t.dashboard.skills}</h2>
          </div>
          <div className="neo-raised p-6">
            <div className="neo-inset rounded-2xl p-4">
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(15,23,42,0.12)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: "#64748B", fontSize: 10 }} />
                    <Radar dataKey="value" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-slate-500 py-16 text-center">
                  {t.dashboard.emptySkills || "Complete a simulation to see your skills."}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

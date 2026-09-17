import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../lib/api";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { Play, ShieldCheck, AlertTriangle, User as UserIcon, Sparkles, Radar as RadarIcon, ArrowRight, Cpu } from "lucide-react";

const skillColor = v => v >= 70 ? "bg-emerald-500" : v >= 50 ? "bg-[#4F46E5]" : "bg-amber-500";

export default function Profile() {
  const { t, lang } = useI18n();
  const L = t.labels;
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [rec, setRec] = useState(null);
  const [fwStats, setFwStats] = useState(null);
  const [aiModel, setAiModel] = useState(() => localStorage.getItem("negotia_ai_model") || "claude");

  const changeAiModel = (m) => { setAiModel(m); localStorage.setItem("negotia_ai_model", m); };

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
    api.recommended(lang).then(setRec).catch(() => {});
    api.frameworkStats().then(setFwStats).catch(() => {});
  }, [lang]);

  const skills = stats?.skills || {};
  const skillArr = Object.entries(skills);
  const sorted = [...skillArr].sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 3);
  const weaknesses = sorted.slice(-3).reverse();
  const radarData = skillArr.map(([k, v]) => ({ skill: L.skills[k] || k, value: v }));

  return (
    <AppShell>
      {/* Header */}
      <section className="mb-8 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl neo-raised-sm bg-gradient-to-br from-[#4F46E5]/10 to-[#7C3AED]/10 text-[#4F46E5] flex items-center justify-center font-bold text-2xl">
          {user?.name?.[0]?.toUpperCase() || <UserIcon className="w-6 h-6" />}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-mono">{t.profile.title.toUpperCase()}</div>
          <h1 className="text-2xl md:text-3xl font-display font-bold" data-testid="profile-name">{user?.name}</h1>
          <div className="text-sm text-slate-500">{user?.email}</div>
        </div>
      </section>

      {/* KPI */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { l: t.dashboard.total, v: stats?.total ?? 0, suffix: "" },
          { l: t.dashboard.avg, v: stats?.avg_score ?? 0, suffix: " / 100" },
          { l: t.dashboard.best, v: stats?.best_score ?? 0, suffix: " / 100" },
          { l: t.profile.successRate, v: (stats?.success_rate ?? 0) + "%", suffix: "" },
        ].map((k, i) => (
          <div key={i} className="neo-raised p-5 neo-raised-hover">
            <div className="text-[11px] uppercase text-slate-500 tracking-wider mb-2">{k.l}</div>
            <div className="font-mono font-bold text-2xl md:text-3xl">{k.v}{k.suffix && <span className="text-sm text-slate-400 font-normal">{k.suffix}</span>}</div>
          </div>
        ))}
      </section>

      {/* Radar + Strengths/Weaknesses */}
      <section className="grid lg:grid-cols-2 gap-5 mb-6">
        <div className="neo-raised p-6">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><RadarIcon className="w-4 h-4 text-[#4F46E5]" />{t.dashboard.skills}</h2>
          <div className="neo-inset p-3 rounded-2xl">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(15,23,42,0.12)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "#64748B", fontSize: 10 }} />
                  <Radar dataKey="value" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-slate-500 py-16 text-center">{t.profile.emptyProfile}</div>
            )}
          </div>
        </div>
        <div className="grid grid-rows-2 gap-5">
          <div className="neo-raised p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-emerald-700">{t.profile.strengths}</h3>
            </div>
            <div className="space-y-2">
              {strengths.map(([k, v]) => (
                <div key={k}>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="text-[#1E293B]">{L.skills[k] || k}</span><span className="font-mono font-bold text-emerald-600">{v}</span></div>
                  <div className="h-1.5 rounded-full neo-inset overflow-hidden p-0.5"><div className={`h-full rounded-full ${skillColor(v)}`} style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="neo-raised p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-amber-700">{t.profile.weaknesses}</h3>
            </div>
            <div className="space-y-2">
              {weaknesses.map(([k, v]) => (
                <div key={k}>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="text-[#1E293B]">{L.skills[k] || k}</span><span className="font-mono font-bold text-amber-600">{v}</span></div>
                  <div className="h-1.5 rounded-full neo-inset overflow-hidden p-0.5"><div className={`h-full rounded-full ${skillColor(v)}`} style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Framework Performance */}
      {fwStats?.stats && (
        <section className="neo-raised p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">{t.profile.frameworkPerf}</h2>
            {fwStats.weakest && fwStats.weakest !== "combined" && (
              <span className="chip chip-amber">{t.profile.growthArea}: {fwStats.weakest.toUpperCase()}</span>
            )}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {["harvard", "spin", "batna"].map(fw => {
              const s = fwStats.stats[fw] || { count: 0, avg: 0, best: 0 };
              const highlight = fwStats.weakest === fw;
              return (
                <div key={fw} className={`p-4 rounded-xl neo-raised-sm ${highlight ? "ring-2 ring-amber-400" : ""}`} data-testid={`fw-stat-${fw}`}>
                  <div className="text-[10px] uppercase text-slate-500 font-mono tracking-wider mb-2">{fw}</div>
                  <div className={`font-mono font-bold text-2xl ${highlight ? "text-amber-700" : "text-[#4F46E5]"}`}>{s.avg}<span className="text-sm text-slate-400 font-normal"> / 100</span></div>
                  <div className="text-[11px] text-slate-500 mt-1">{t.profile.best} {s.best} · {s.count} {t.profile.sims}</div>
                  <div className="mt-2 h-1 rounded-full neo-inset overflow-hidden p-0.5">
                    <div className={`h-full rounded-full ${highlight ? "bg-amber-500" : "bg-[#4F46E5]"}`} style={{ width: `${s.avg}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* AI Preferences */}
      <section className="neo-raised p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-lg flex items-center gap-2"><Cpu className="w-4 h-4 text-[#4F46E5]" />{t.aiModel.prefTitle}</h2>
            <div className="text-xs text-slate-500 mt-1">{t.aiModel.prefSub}</div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {["claude", "gpt"].map(m => (
            <button key={m} onClick={() => changeAiModel(m)} data-testid={`profile-ai-${m}`}
              className={`p-4 rounded-xl text-left transition-all ${aiModel === m ? "neo-inset ring-2 ring-[#4F46E5]" : "neo-raised-sm neo-raised-hover"}`}>
              <div className="text-xs uppercase font-mono tracking-wider text-slate-500 mb-1">{t.aiModel.label}</div>
              <div className="text-sm font-semibold text-[#1E293B]">{t.aiModel[m]}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Recommended */}
      {rec?.scenarios?.length > 0 && (
        <section className="neo-raised p-6">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#4F46E5]" />{t.profile.recommended}</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {rec.scenarios.map(s => (
              <div key={s.slug} className="p-4 rounded-xl neo-inset">
                <span className="chip chip-primary mb-2">{L.categories[s.category] || s.category}</span>
                <div className="font-semibold text-sm mb-3 mt-2">{s.title}</div>
                <button onClick={() => nav(`/simulate?scenario=${s.slug}`)} data-testid={`profile-rec-${s.slug}`}
                  className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5">
                  <Play className="w-3 h-3" />{t.scenarios.start}<ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

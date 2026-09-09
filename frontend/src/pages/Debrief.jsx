import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { Trophy, TrendingUp, AlertCircle, Lightbulb, RotateCcw, LayoutDashboard, Target, CheckCircle2 } from "lucide-react";

const outcomeChip = {
  Excellent: "chip-emerald", Successful: "chip-emerald",
  Compromise: "chip-primary", "Weak outcome": "chip-amber",
  Failed: "chip-rose", "Walk Away": "chip-slate",
};

const skillColor = v => v >= 70 ? "bg-emerald-500" : v >= 50 ? "bg-[#4F46E5]" : "bg-amber-500";

export default function Debrief() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useI18n();
  const [neg, setNeg] = useState(null);

  useEffect(() => { api.getNeg(id).then(setNeg); }, [id]);
  if (!neg) return <AppShell><div className="text-slate-500 py-20 text-center">{t.common.loading}</div></AppShell>;
  if (neg.status !== "completed") return <AppShell><div className="text-slate-500 py-20 text-center">Not completed yet.</div></AppShell>;

  const skills = neg.skill_scores || {};
  const radarData = Object.entries(skills).map(([k, v]) => ({ skill: k, value: v }));
  const fb = neg.feedback || {};

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero */}
        <section className="neo-raised p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#4F46E5]/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-[#4F46E5] mb-2">
                <Trophy className="w-3 h-3" />
                <span>DEBRIEF</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-display font-bold tracking-tight" data-testid="debrief-title">{t.debrief.title}</h1>
              <div className="mt-3">
                <span className={`chip ${outcomeChip[neg.outcome] || "chip-slate"} !text-xs !px-4 !py-1`} data-testid="debrief-outcome">
                  <CheckCircle2 className="w-3 h-3" />{neg.outcome}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-500 font-mono tracking-wider">{t.debrief.overall}</div>
              <div className="font-mono font-black text-5xl md:text-6xl gradient-text" data-testid="debrief-score">
                {neg.score}<span className="text-2xl text-slate-400">/100</span>
              </div>
            </div>
          </div>
        </section>

        {/* Skills + Agreement */}
        <section className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 neo-raised p-6">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#4F46E5]" />{t.debrief.skills}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="neo-inset rounded-2xl p-3">
                {radarData.length > 0 && (
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(15,23,42,0.12)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: "#64748B", fontSize: 9 }} />
                      <Radar dataKey="value" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="space-y-2">
                {Object.entries(skills).map(([k, v]) => (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{k}</span>
                      <span className="font-mono font-bold">{v}<span className="text-slate-400"> / 100</span></span>
                    </div>
                    <div className="h-2 rounded-full neo-inset overflow-hidden p-0.5"><div className={`h-full rounded-full ${skillColor(v)}`} style={{ width: `${v}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="neo-raised p-6">
            <div className="text-[10px] uppercase text-slate-500 font-mono tracking-wider mb-2">{t.debrief.agreement}</div>
            <div className="text-sm text-[#1E293B] leading-relaxed mb-4">{fb.final_agreement || "Negotiation concluded."}</div>
            <div className="neo-inset p-3 rounded-xl">
              <div className="text-[10px] uppercase text-slate-500 font-mono tracking-wider mb-1">Framework</div>
              <div className="font-display font-semibold text-sm">{(neg.framework_name || "Combined")}</div>
            </div>
          </div>
        </section>

        {/* Did well + Improve */}
        <section className="grid md:grid-cols-2 gap-5">
          <div className="neo-raised p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-emerald-700">{t.debrief.didWell}</h3>
            </div>
            <ul className="space-y-2 text-sm text-[#1E293B]">
              {(fb.did_well || []).map((s, i) => (
                <li key={i} className="flex gap-2"><span className="text-emerald-600 mt-0.5">✓</span><span>{s}</span></li>
              ))}
            </ul>
          </div>
          <div className="neo-raised p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-amber-700">{t.debrief.improve}</h3>
            </div>
            <ul className="space-y-2 text-sm text-[#1E293B]">
              {(fb.improve || []).map((s, i) => (
                <li key={i} className="flex gap-2"><span className="text-amber-600 mt-0.5">→</span><span>{s}</span></li>
              ))}
            </ul>
          </div>
        </section>

        {/* Framework breakdown */}
        {neg.framework_scores && (
          <section className="neo-raised p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg flex items-center gap-2"><Target className="w-4 h-4 text-[#4F46E5]" />Разбор по методологиям</h3>
              <span className="chip chip-primary">{(neg.framework_name || "Combined").toUpperCase()}</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {["harvard", "spin", "batna"].map(fw => (
                <div key={fw} className="neo-inset p-4 rounded-xl">
                  <div className="text-[10px] uppercase text-slate-500 font-mono tracking-wider mb-2">{fw}</div>
                  {Object.entries(neg.framework_scores[fw] || {}).map(([k, v]) => (
                    <div key={k} className="mb-2">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-600">{k}</span>
                        <span className="font-mono font-semibold">{v}</span>
                      </div>
                      <div className="h-1 rounded-full bg-black/5 overflow-hidden">
                        <div className={`h-full rounded-full ${skillColor(v)}`} style={{ width: `${v}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Critical moment */}
        <section className="neo-raised p-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-[#4F46E5]" />
            <h3 className="font-display font-bold text-sm uppercase tracking-wider">{t.debrief.critical}</h3>
          </div>
          <div className="text-sm text-[#1E293B] mb-4 leading-relaxed">{fb.critical_moment}</div>
          <div className="neo-inset p-4 rounded-xl border-l-2 border-[#4F46E5]">
            <div className="text-[10px] uppercase text-slate-500 font-mono tracking-wider mb-1">{t.debrief.better}</div>
            <div className="text-sm text-[#1E293B] italic">"{fb.better_alternative}"</div>
          </div>
        </section>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button data-testid="debrief-again" onClick={() => nav(`/simulate?scenario=${neg.scenario_slug}`)}
            className="btn-primary px-6 py-3 text-sm flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" />{t.debrief.tryAgain}
          </button>
          <button data-testid="debrief-home" onClick={() => nav("/dashboard")}
            className="neo-raised-sm px-6 py-3 rounded-full text-sm font-semibold text-[#1E293B] hover:shadow-md flex items-center justify-center gap-2 transition-all">
            <LayoutDashboard className="w-4 h-4" />{t.debrief.backHome}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

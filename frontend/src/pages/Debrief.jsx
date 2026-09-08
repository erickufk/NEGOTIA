import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { Trophy, TrendingUp, AlertCircle, Lightbulb, RotateCcw, LayoutDashboard } from "lucide-react";

const outcomeColor = {
  Excellent: "chip-emerald", Successful: "chip-emerald",
  Compromise: "chip-sky", "Weak outcome": "chip-amber",
  Failed: "chip-rose", "Walk Away": "chip-slate",
};

export default function Debrief() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useI18n();
  const [neg, setNeg] = useState(null);

  useEffect(() => { api.getNeg(id).then(setNeg); }, [id]);
  if (!neg) return <AppShell><div className="text-slate-400 py-20 text-center">{t.common.loading}</div></AppShell>;
  if (neg.status !== "completed") return <AppShell><div className="text-slate-400 py-20 text-center">Not completed yet.</div></AppShell>;

  const skills = neg.skill_scores || {};
  const radarData = Object.entries(skills).map(([k, v]) => ({ skill: k, value: v }));
  const fb = neg.feedback || {};

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold mb-3">{t.debrief.title}</h1>
          <div className="flex items-center justify-center gap-4">
            <div>
              <div className="text-xs uppercase text-slate-500">{t.debrief.overall}</div>
              <div className="font-mono font-black text-6xl gradient-text" data-testid="debrief-score">{neg.score}<span className="text-3xl text-slate-500">/100</span></div>
            </div>
            <div className="border-l border-white/10 pl-4">
              <div className="text-xs uppercase text-slate-500 mb-1">{t.debrief.outcome}</div>
              <span className={`chip ${outcomeColor[neg.outcome] || "chip-slate"} text-sm px-4 py-1`} data-testid="debrief-outcome">{neg.outcome}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 card-glow rounded-2xl p-6">
            <h2 className="font-display font-bold text-xl mb-4">{t.debrief.skills}</h2>
            {radarData.length > 0 && (
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                  <Radar dataKey="value" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="card-glow rounded-2xl p-6">
            <div className="text-xs uppercase text-slate-500 mb-2">{t.debrief.agreement}</div>
            <div className="text-slate-200 text-sm mb-6">{fb.final_agreement || "Negotiation concluded."}</div>
            <div className="space-y-2">
              {Object.entries(skills).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{k}</span>
                    <span className="font-mono text-sky-400">{v}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500" style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card-glow rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-emerald-400" /><h3 className="font-display font-bold">{t.debrief.didWell}</h3></div>
            <ul className="space-y-2 text-sm text-slate-300">
              {(fb.did_well || []).map((s, i) => <li key={i} className="flex gap-2"><span className="text-emerald-400">✓</span><span>{s}</span></li>)}
            </ul>
          </div>
          <div className="card-glow rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4"><AlertCircle className="w-4 h-4 text-amber-400" /><h3 className="font-display font-bold">{t.debrief.improve}</h3></div>
            <ul className="space-y-2 text-sm text-slate-300">
              {(fb.improve || []).map((s, i) => <li key={i} className="flex gap-2"><span className="text-amber-400">→</span><span>{s}</span></li>)}
            </ul>
          </div>
        </div>

        <div className="card-glow rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-3"><Lightbulb className="w-4 h-4 text-sky-400" /><h3 className="font-display font-bold">{t.debrief.critical}</h3></div>
          <div className="text-slate-300 text-sm mb-4">{fb.critical_moment}</div>
          <div className="p-4 rounded-lg bg-sky-500/5 border border-sky-500/10">
            <div className="text-xs uppercase text-slate-500 mb-1">{t.debrief.better}</div>
            <div className="text-slate-200 text-sm italic">"{fb.better_alternative}"</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button data-testid="debrief-again" onClick={() => nav(`/simulate?scenario=${neg.scenario_slug}`)} className="btn-primary rounded-full px-6">
            <RotateCcw className="w-4 h-4 mr-2" />{t.debrief.tryAgain}
          </Button>
          <Button data-testid="debrief-home" onClick={() => nav("/dashboard")} variant="outline" className="rounded-full border-white/10 bg-transparent text-slate-200 hover:bg-white/5 px-6">
            <LayoutDashboard className="w-4 h-4 mr-2" />{t.debrief.backHome}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

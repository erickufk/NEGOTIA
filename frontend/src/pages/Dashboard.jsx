import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Plus, Trophy, Target, Flame, ArrowRight, Sparkles } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [rec, setRec] = useState(null);

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
    api.listNeg().then(list => setRecent(list.slice(0, 5))).catch(() => {});
    api.recommended().then(setRec).catch(() => {});
  }, []);

  const kpi = [
    { label: t.dashboard.total, value: stats?.total ?? 0, icon: Target, c: "sky" },
    { label: t.dashboard.avg, value: stats?.avg_score ?? 0, icon: Sparkles, c: "amber" },
    { label: t.dashboard.best, value: stats?.best_score ?? 0, icon: Trophy, c: "emerald" },
    { label: t.dashboard.streak, value: stats?.streak ?? 0, icon: Flame, c: "rose" },
  ];
  const radarData = stats?.skills ? Object.entries(stats.skills).map(([k, v]) => ({ skill: k, value: v })) : [];

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="text-sm text-slate-500 uppercase tracking-wider">{t.dashboard.welcome}</div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold" data-testid="dashboard-welcome">{user?.name}</h1>
        </div>
        <Button className="btn-primary rounded-full px-6 h-12" onClick={() => nav("/simulate")} data-testid="new-sim-btn">
          <Plus className="w-4 h-4 mr-2" />{t.dashboard.newSim}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpi.map((k, i) => (
          <div key={i} className="card-glow rounded-xl p-5" data-testid={`kpi-${k.label}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-slate-500">{k.label}</span>
              <k.icon className={`w-4 h-4 text-${k.c}-400`} />
            </div>
            <div className={`font-mono font-bold text-3xl text-${k.c}-400`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-glow rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl">{t.dashboard.recent}</h2>
            <Button variant="ghost" size="sm" onClick={() => nav("/history")} data-testid="view-all-history" className="text-slate-400">
              {t.dashboard.viewAll} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-500 mb-4">{t.dashboard.empty}</div>
              <Button className="btn-primary rounded-full" onClick={() => nav("/simulate")} data-testid="empty-start-btn">
                {t.dashboard.newSim}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recent.map(r => (
                <div key={r.id} onClick={() => nav(`/history/${r.id}`)} data-testid={`recent-${r.id}`}
                  className="py-3 flex items-center justify-between cursor-pointer hover:bg-white/5 -mx-2 px-2 rounded-lg transition">
                  <div>
                    <div className="font-medium">{r.scenario_title}</div>
                    <div className="text-xs text-slate-500 font-mono">{r.mode.toUpperCase()} · {new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xl text-sky-400">{r.score ?? "—"}</div>
                    <div className="text-xs text-slate-500">{r.outcome || r.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-glow rounded-2xl p-6">
          <h2 className="font-display font-bold text-xl mb-4">{t.dashboard.skills}</h2>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "#94A3B8", fontSize: 10 }} />
                <Radar dataKey="value" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-slate-500 py-8 text-center">Complete a simulation to see your skills.</div>
          )}
        </div>
      </div>

      {rec?.scenarios?.[0] && (
        <div className="mt-8 card-glow rounded-2xl p-6 border-sky-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <span className="chip chip-sky mb-2">{t.dashboard.recommended}</span>
              <div className="font-display font-semibold text-lg">{rec.scenarios[0].title}</div>
              <div className="text-sm text-slate-400">{t.dashboard.weakestNote} <span className="text-amber-400 font-mono">{rec.weakest_skill}</span></div>
            </div>
            <Button className="btn-primary rounded-full px-5" onClick={() => nav(`/simulate?scenario=${rec.scenarios[0].slug}`)} data-testid="start-recommended">
              {t.dashboard.startRec} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

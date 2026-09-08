import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { Play } from "lucide-react";

export default function Profile() {
  const { t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [rec, setRec] = useState(null);

  useEffect(() => {
    api.stats().then(setStats);
    api.recommended().then(setRec);
  }, []);

  const skills = stats?.skills || {};
  const skillArr = Object.entries(skills);
  const sorted = [...skillArr].sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 3);
  const weaknesses = sorted.slice(-3).reverse();
  const radarData = skillArr.map(([k, v]) => ({ skill: k, value: v }));

  return (
    <AppShell>
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-slate-500">{t.profile.title}</div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold">{user?.name}</h1>
        <div className="text-sm text-slate-400">{user?.email}</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { l: t.dashboard.total, v: stats?.total ?? 0 },
          { l: t.dashboard.avg, v: stats?.avg_score ?? 0 },
          { l: t.dashboard.best, v: stats?.best_score ?? 0 },
          { l: "Success rate", v: (stats?.success_rate ?? 0) + "%" },
        ].map((k, i) => (
          <div key={i} className="card-glow rounded-xl p-5">
            <div className="text-xs uppercase text-slate-500 mb-2">{k.l}</div>
            <div className="font-mono font-bold text-3xl text-sky-400">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card-glow rounded-2xl p-6">
          <h2 className="font-display font-bold text-xl mb-4">{t.dashboard.skills}</h2>
          {radarData.length > 0 && (
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "#94A3B8", fontSize: 10 }} />
                <Radar dataKey="value" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="grid grid-rows-2 gap-6">
          <div className="card-glow rounded-2xl p-6">
            <h3 className="font-display font-bold mb-3">{t.profile.strengths}</h3>
            <div className="space-y-2">
              {strengths.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{k}</span>
                  <span className="font-mono text-emerald-400 font-bold">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card-glow rounded-2xl p-6">
            <h3 className="font-display font-bold mb-3">{t.profile.weaknesses}</h3>
            <div className="space-y-2">
              {weaknesses.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{k}</span>
                  <span className="font-mono text-amber-400 font-bold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {rec?.scenarios?.length > 0 && (
        <div className="card-glow rounded-2xl p-6">
          <h2 className="font-display font-bold text-xl mb-4">{t.profile.recommended}</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {rec.scenarios.map(s => (
              <div key={s.slug} className="p-4 rounded-xl bg-white/5">
                <span className="chip chip-indigo mb-2">{s.category}</span>
                <div className="font-semibold text-sm mb-3">{s.title}</div>
                <Button size="sm" className="btn-primary rounded-full w-full" onClick={() => nav(`/simulate?scenario=${s.slug}`)} data-testid={`profile-rec-${s.slug}`}>
                  <Play className="w-3 h-3 mr-1" />{t.scenarios.start}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

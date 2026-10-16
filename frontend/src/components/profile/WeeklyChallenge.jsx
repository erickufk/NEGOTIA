import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { api } from "../../lib/api";

export const WeeklyChallengeCard = ({ t, lang, className = "" }) => {
  const [wk, setWk] = useState(null);
  useEffect(() => { api.weeklyChallenge().then(setWk).catch(() => {}); }, []);
  if (!wk) return null;
  const pct = Math.round((wk.progress / wk.target) * 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(wk.ends_at) - new Date()) / 86400000));
  const text = (t.game.challenges[wk.id] || wk.id).replace("{n}", wk.target);
  return (
    <section className={`neo-raised p-5 relative overflow-hidden ${className}`} data-testid="weekly-challenge-card">
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[#7C3AED]/10 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 shrink-0 rounded-xl neo-inset flex items-center justify-center text-[#4F46E5]">
            {wk.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <CalendarCheck className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-mono">{t.game.weekly} · {daysLeft} {t.game.daysLeft}</div>
            <div className="font-semibold text-sm text-[#1E293B]" data-testid="weekly-challenge-text">{text}</div>
          </div>
        </div>
        <div className="md:w-72 shrink-0">
          <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
            <span data-testid="weekly-challenge-progress">{wk.progress} / {wk.target}</span>
            <span className={wk.completed ? "text-emerald-600 font-bold" : "text-[#4F46E5] font-bold"} data-testid="weekly-challenge-bonus">
              {wk.completed ? t.game.challengeDone : `+${wk.bonus_xp} XP`}
            </span>
          </div>
          <div className="h-2 rounded-full neo-inset overflow-hidden p-0.5">
            <div className={`h-full rounded-full transition-[width] duration-700 ${wk.completed ? "bg-emerald-500" : "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
};

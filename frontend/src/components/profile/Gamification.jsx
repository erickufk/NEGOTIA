import { Award } from "lucide-react";

const THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000];
const BADGES = [
  ["first_step", "🎯"], ["first_win", "🏆"], ["on_a_roll", "🔥"], ["sharp_mind", "⚡"], ["tough_crowd", "🥊"],
  ["methodologist", "🎓"], ["practitioner", "📚"], ["veteran", "🌟"], ["versatile", "🎭"], ["master", "💎"],
];

export const levelFromXp = (xp) => {
  const idx = THRESHOLDS.filter(th => xp >= th).length - 1;
  return { level: idx + 1, next: THRESHOLDS[idx + 1] ?? null };
};

export const LevelBar = ({ game, t }) => {
  const xp = game?.xp ?? 0;
  const { level, next } = levelFromXp(xp);
  const base = THRESHOLDS[level - 1];
  const pct = next ? Math.round(((xp - base) / (next - base)) * 100) : 100;
  return (
    <section className="neo-raised p-5 mb-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6" data-testid="gamification-bar">
      <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#4F46E5] text-white text-xs font-semibold px-3 py-1.5 w-fit" data-testid="level-badge">
        <Award className="w-3.5 h-3.5" />{t.game.level} {level} · {t.game.levels[level - 1]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="h-2.5 rounded-full neo-inset overflow-hidden p-0.5">
          <div className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] transition-[width] duration-700" style={{ width: `${pct}%` }} data-testid="xp-bar-fill" />
        </div>
        <div className="text-[11px] font-mono text-slate-500 mt-1.5" data-testid="xp-text">
          {next ? `${xp} / ${next} XP` : `${xp} XP · ${t.game.maxLevel}`}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-[#1E293B]" data-testid="streak-counter" title={t.game.streak}>
        <span className="text-lg">🔥</span><span className="font-mono">{game?.streak ?? 0}</span><span className="text-slate-500 font-normal">{t.game.days}</span>
      </div>
    </section>
  );
};

export const BadgesGrid = ({ game, t }) => {
  const earned = new Set(game?.badges || []);
  return (
    <section className="neo-raised p-6 mt-6" data-testid="achievements-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-lg">{t.game.achievements}</h2>
        <span className="chip chip-primary" data-testid="achievements-count">{earned.size} / {BADGES.length} {t.game.earned}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {BADGES.map(([id, icon]) => {
          const on = earned.has(id);
          return (
            <div key={id} data-testid={`badge-${id}`} data-earned={on}
              className={`p-4 rounded-xl transition-transform duration-200 hover:-translate-y-0.5 ${on ? "neo-raised-sm ring-1 ring-[#4F46E5]/30" : "neo-inset"}`}>
              <div className={`text-3xl mb-2 ${on ? "" : "grayscale opacity-40"}`}>{icon}</div>
              <div className={`text-sm font-semibold ${on ? "text-[#1E293B]" : "text-slate-400"}`}>{t.game.badges[id].n}</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-snug">{t.game.badges[id].d}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

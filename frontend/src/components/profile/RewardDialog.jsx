import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { BADGE_ICONS, levelFromXp } from "./Gamification";

export const RewardDialog = ({ reward, t }) => {
  const [open, setOpen] = useState(Boolean(reward));
  if (!reward) return null;
  const total = reward.xp_total ?? 0;
  const lvlNow = levelFromXp(total).level;
  const leveledUp = lvlNow > levelFromXp(total - reward.xp_gained).level;
  const badges = reward.new_badges || [];
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-[#F8F7F4] border-0 rounded-3xl text-center" data-testid="reward-dialog">
        <div className="text-5xl mb-1 reward-pop">🎉</div>
        <DialogTitle className="font-display text-2xl">{t.game.rewardTitle}</DialogTitle>
        <DialogDescription className="text-slate-500 text-sm">{t.game.rewardSub}</DialogDescription>
        <div className="neo-inset rounded-2xl py-4 my-2">
          <div className="font-mono font-bold text-4xl text-[#4F46E5]" data-testid="reward-xp">+{reward.xp_gained} XP</div>
          {reward.challenge && <div className="text-xs text-emerald-600 font-semibold mt-1" data-testid="reward-challenge">{t.game.challengeBonus}</div>}
          {leveledUp && (
            <div className="mt-2 inline-flex rounded-full bg-[#4F46E5] text-white text-xs font-semibold px-3 py-1" data-testid="reward-levelup">
              {t.game.levelUp}: {t.game.level} {lvlNow} · {t.game.levels[lvlNow - 1]}
            </div>
          )}
        </div>
        {badges.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-mono mb-2">{t.game.newBadges}</div>
            <div className="grid grid-cols-2 gap-2">
              {badges.map((b, i) => (
                <div key={b} className="neo-raised-sm rounded-xl p-3 reward-pop" style={{ animationDelay: `${150 + i * 120}ms` }} data-testid={`reward-badge-${b}`}>
                  <div className="text-3xl">{BADGE_ICONS[b]}</div>
                  <div className="text-sm font-semibold mt-1">{t.game.badges[b]?.n}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => setOpen(false)} className="btn-primary w-full py-2.5 text-sm mt-2" data-testid="reward-close-btn">{t.game.awesome}</button>
      </DialogContent>
    </Dialog>
  );
};

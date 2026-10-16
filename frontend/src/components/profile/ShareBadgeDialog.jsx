import { useEffect, useState } from "react";
import { Download, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { api } from "../../lib/api";
import { renderBadgeCard } from "../../lib/badgeCard";
import { BADGE_ICONS, levelFromXp } from "./Gamification";

const NETWORKS = [
  ["telegram", "Telegram", (u, txt) => `https://t.me/share/url?url=${u}&text=${txt}`],
  ["vk", "VK", (u, txt) => `https://vk.com/share.php?url=${u}&title=${txt}`],
  ["linkedin", "LinkedIn", (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
  ["x", "X", (u, txt) => `https://twitter.com/intent/tweet?url=${u}&text=${txt}`],
];

export const ShareBadgeDialog = ({ badgeId, game, userName, t, lang, onClose }) => {
  const [blob, setBlob] = useState(null);
  const [preview, setPreview] = useState(null);
  const [link, setLink] = useState(null);
  const b = t.game.badges[badgeId];
  const lvl = levelFromXp(game?.xp ?? 0).level;
  const text = t.share.text.replace("{badge}", b.n);

  useEffect(() => {
    let url;
    (async () => {
      const png = await renderBadgeCard({
        icon: BADGE_ICONS[badgeId], badgeName: b.n, badgeDesc: b.d, userName: userName || "",
        levelLabel: `${t.game.level} ${lvl} · ${t.game.levels[lvl - 1]}`, unlockedLabel: t.share.unlocked, tagline: t.share.tagline,
      });
      url = URL.createObjectURL(png);
      setBlob(png); setPreview(url);
      const fd = new FormData();
      fd.append("badge_id", badgeId); fd.append("badge_name", b.n); fd.append("lang", lang);
      fd.append("image", png, `negotia-${badgeId}.png`);
      api.shareBadge(fd).then(r => setLink(r.url)).catch(() => toast.error(t.share.failed));
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [badgeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const download = () => {
    const a = document.createElement("a");
    a.href = preview; a.download = `negotia-${badgeId}.png`; a.click();
  };
  const copy = async () => { await navigator.clipboard.writeText(link); toast.success(t.share.copied); };
  const file = blob && new File([blob], `negotia-${badgeId}.png`, { type: "image/png" });
  const canNative = file && navigator.canShare?.({ files: [file] });
  const nativeShare = () => navigator.share({ files: [file], title: "NEGOTIA", text: `${text} ${link || ""}` }).catch(() => {});

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl grid-cols-1 [&>*]:min-w-0 bg-[#F8F7F4] border-0 rounded-3xl" data-testid="share-badge-dialog">
        <DialogTitle className="font-display text-xl">{t.share.title}</DialogTitle>
        <DialogDescription className="text-sm text-slate-500">{t.share.sub}</DialogDescription>
        <div className="neo-inset rounded-2xl p-2 aspect-[1200/630] flex items-center justify-center">
          {preview ? <img src={preview} alt={b.n} className="w-full rounded-xl" data-testid="share-card-preview" />
            : <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={download} disabled={!preview} className="btn-primary py-2.5 text-sm flex items-center justify-center gap-2" data-testid="share-download-btn">
            <Download className="w-4 h-4" />{t.share.download}
          </button>
          {canNative ? (
            <button onClick={nativeShare} className="neo-raised-sm neo-raised-hover rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2" data-testid="share-native-btn">
              <Share2 className="w-4 h-4" />{t.share.native}
            </button>
          ) : (
            <button onClick={copy} disabled={!link} className="neo-raised-sm neo-raised-hover rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50" data-testid="share-copy-btn">
              <Link2 className="w-4 h-4" />{t.share.copy}
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {NETWORKS.map(([id, label, mk]) => (
            <a key={id} href={link ? mk(encodeURIComponent(link), encodeURIComponent(text)) : undefined} target="_blank" rel="noopener noreferrer"
              aria-disabled={!link} data-testid={`share-${id}-btn`}
              className={`neo-raised-sm rounded-xl py-2 text-xs font-semibold text-center transition-transform duration-200 hover:-translate-y-0.5 ${link ? "" : "pointer-events-none opacity-50"}`}>
              {label}
            </a>
          ))}
        </div>
        {canNative && link && (
          <button onClick={copy} className="text-xs text-[#4F46E5] font-semibold hover:underline" data-testid="share-copy-btn">{t.share.copy}</button>
        )}
      </DialogContent>
    </Dialog>
  );
};

const W = 1200, H = 630;

const wrap = (ctx, text, maxW) => {
  const words = text.split(" "), lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
};

export async function renderBadgeCard({ icon, badgeName, badgeDesc, userName, levelLabel, unlockedLabel, tagline }) {
  if (document.fonts?.ready) await document.fonts.ready;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#F4F3EF"; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(1000, 80, 20, 1000, 80, 520);
  g.addColorStop(0, "rgba(124,58,237,0.22)"); g.addColorStop(1, "rgba(124,58,237,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  ctx.shadowColor = "rgba(15,23,42,0.10)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#FFFFFF"; roundRect(ctx, 60, 60, W - 120, H - 120, 36); ctx.fill();
  ctx.shadowColor = "transparent";

  // icon medallion
  const cx = 280, cy = H / 2;
  const mg = ctx.createLinearGradient(cx - 140, cy - 140, cx + 140, cy + 140);
  mg.addColorStop(0, "#4F46E5"); mg.addColorStop(1, "#7C3AED");
  ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(cx, cy, 140, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.beginPath(); ctx.arc(cx, cy, 118, 0, Math.PI * 2); ctx.fill();
  ctx.font = "130px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(icon, cx, cy + 8);

  const x = 480;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#4F46E5"; ctx.font = "700 24px 'JetBrains Mono', monospace";
  ctx.fillText(unlockedLabel.toUpperCase(), x, 205);
  ctx.fillStyle = "#1E293B"; ctx.font = "800 64px 'Plus Jakarta Sans', 'Inter', sans-serif";
  wrap(ctx, badgeName, 640).slice(0, 2).forEach((l, i) => ctx.fillText(l, x, 280 + i * 72));
  const nameLines = wrap(ctx, badgeName, 640).slice(0, 2).length;
  ctx.fillStyle = "#64748B"; ctx.font = "500 28px 'Plus Jakarta Sans', 'Inter', sans-serif";
  wrap(ctx, badgeDesc, 640).slice(0, 2).forEach((l, i) => ctx.fillText(l, x, 280 + nameLines * 72 + i * 38));

  // footer: user + level pill + brand
  const fy = 470;
  ctx.fillStyle = "#1E293B"; ctx.font = "700 28px 'Plus Jakarta Sans', 'Inter', sans-serif";
  let un = userName;
  while (un.length > 1 && ctx.measureText(un).width > 560) un = un.slice(0, -1);
  ctx.fillText(un === userName ? un : `${un.trimEnd()}…`, x, fy);
  ctx.font = "600 20px 'Plus Jakarta Sans', 'Inter', sans-serif";
  const pw = ctx.measureText(levelLabel).width + 32;
  ctx.fillStyle = "#4F46E5"; roundRect(ctx, x, fy + 18, pw, 38, 19); ctx.fill();
  ctx.fillStyle = "#FFFFFF"; ctx.fillText(levelLabel, x + 16, fy + 44);

  ctx.textAlign = "right";
  ctx.fillStyle = "#1E293B"; ctx.font = "800 34px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("NEGOTIA", W - 110, 140);
  ctx.fillStyle = "#94A3B8"; ctx.font = "500 18px 'Plus Jakarta Sans', 'Inter', sans-serif";
  ctx.fillText(tagline, W - 110, 170);

  return new Promise(res => c.toBlob(res, "image/png"));
}

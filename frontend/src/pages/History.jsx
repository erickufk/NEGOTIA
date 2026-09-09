import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import { ArrowRight, MessagesSquare } from "lucide-react";

const outcomeChip = {
  Excellent: "chip-emerald", Successful: "chip-emerald",
  Compromise: "chip-primary", "Weak outcome": "chip-amber",
  Failed: "chip-rose", "Walk Away": "chip-slate",
};

export default function History() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [list, setList] = useState([]);

  useEffect(() => { api.listNeg().then(setList).catch(() => {}); }, []);

  return (
    <AppShell>
      <h1 className="text-2xl md:text-3xl font-display font-bold mb-6 tracking-tight">{t.history.title}</h1>
      {list.length === 0 ? (
        <div className="neo-raised p-12 text-center">
          <MessagesSquare className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <div className="text-slate-500 mb-4">{t.history.empty}</div>
          <button onClick={() => nav("/simulate")} data-testid="history-empty-cta" className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
            {t.dashboard.newSim}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((n, i) => (
            <div key={n.id} onClick={() => nav(n.status === "completed" ? `/debrief/${n.id}` : `/negotiation/${n.id}`)}
              data-testid={`history-item-${i}`}
              className={`neo-raised p-5 neo-raised-hover cursor-pointer ${n.status === "active" ? "border-l-4 border-l-[#4F46E5]" : ""}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs mb-1">
                    {n.status === "active" && <span className="chip chip-emerald pulse-dot">{t.dashboard.inProgress}</span>}
                    {n.outcome && <span className={`chip ${outcomeChip[n.outcome] || "chip-slate"}`}>{n.outcome}</span>}
                    <span className="chip chip-slate !text-[10px]">{n.mode?.toUpperCase()}</span>
                    <span className="chip chip-slate !text-[10px]">{(n.framework_name || "Combined").toUpperCase()}</span>
                    <span className="chip chip-slate !text-[10px]">{n.participants.length}p</span>
                  </div>
                  <div className="font-display font-semibold text-base truncate">{n.scenario_title}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className={`font-mono font-bold text-2xl ${n.score >= 70 ? "text-emerald-600" : n.score >= 50 ? "text-[#4F46E5]" : "text-rose-600"}`}>
                      {n.score ?? "—"}
                    </div>
                    <div className="text-[10px] uppercase text-slate-500 tracking-wider">/ 100</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

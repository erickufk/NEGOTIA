import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { ArrowRight, MessagesSquare } from "lucide-react";

export default function History() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [list, setList] = useState([]);

  useEffect(() => { api.listNeg().then(setList); }, []);

  return (
    <AppShell>
      <h1 className="text-3xl sm:text-4xl font-display font-extrabold mb-8">{t.history.title}</h1>
      {list.length === 0 ? (
        <div className="card-glow rounded-2xl p-12 text-center">
          <MessagesSquare className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <div className="text-slate-400 mb-4">{t.history.empty}</div>
          <Button className="btn-primary rounded-full" onClick={() => nav("/simulate")} data-testid="history-empty-cta">
            {t.dashboard.newSim}
          </Button>
        </div>
      ) : (
        <div className="card-glow rounded-2xl overflow-hidden">
          {list.map((n, i) => (
            <div key={n.id} onClick={() => nav(n.status === "completed" ? `/debrief/${n.id}` : `/negotiation/${n.id}`)}
              data-testid={`history-item-${i}`}
              className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer transition border-b border-white/5 last:border-0">
              <div>
                <div className="font-semibold">{n.scenario_title}</div>
                <div className="text-xs text-slate-500 font-mono mt-1">
                  {n.mode.toUpperCase()} · {n.participants.length}p · {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="font-mono font-bold text-2xl text-sky-400">{n.score ?? "—"}</div>
                  <div className="text-[10px] uppercase text-slate-500">{n.outcome || n.status}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

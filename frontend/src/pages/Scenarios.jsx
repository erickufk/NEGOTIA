import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Users, Clock, Play } from "lucide-react";

const diffColor = { Easy: "chip-emerald", Medium: "chip-amber", Hard: "chip-rose" };

export default function Scenarios() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [cat, setCat] = useState("all");
  const [diff, setDiff] = useState("all");

  useEffect(() => { api.scenarios().then(setScenarios).catch(() => {}); }, []);

  const cats = Array.from(new Set(scenarios.map(s => s.category)));
  const filtered = scenarios.filter(s =>
    (cat === "all" || s.category === cat) && (diff === "all" || s.difficulty === diff)
  );

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold">{t.scenarios.title}</h1>
        <div className="flex gap-3">
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger data-testid="filter-category" className="w-40 bg-white/5 border-white/10 text-white"><SelectValue placeholder={t.scenarios.category} /></SelectTrigger>
            <SelectContent className="bg-[#131C2E] border-white/10 text-white">
              <SelectItem value="all">{t.scenarios.all}</SelectItem>
              {cats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={diff} onValueChange={setDiff}>
            <SelectTrigger data-testid="filter-difficulty" className="w-40 bg-white/5 border-white/10 text-white"><SelectValue placeholder={t.scenarios.difficulty} /></SelectTrigger>
            <SelectContent className="bg-[#131C2E] border-white/10 text-white">
              <SelectItem value="all">{t.scenarios.all}</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(s => (
          <div key={s.slug} className="card-glow rounded-2xl p-6 flex flex-col" data-testid={`scenario-${s.slug}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="chip chip-indigo">{s.category}</span>
              <span className={`chip ${diffColor[s.difficulty] || "chip-slate"}`}>{s.difficulty}</span>
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">{s.title}</h3>
            <p className="text-sm text-slate-400 flex-1 mb-4">{s.description}</p>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-mono mb-4">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{s.max_participants}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration} {t.scenarios.min}</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-4">
              {(s.skills || []).slice(0, 3).map(sk => <span key={sk} className="chip chip-slate text-[10px]">{sk}</span>)}
            </div>
            <Button className="btn-primary rounded-full w-full" onClick={() => nav(`/simulate?scenario=${s.slug}`)} data-testid={`start-${s.slug}`}>
              <Play className="w-3 h-3 mr-2" />{t.scenarios.start}
            </Button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

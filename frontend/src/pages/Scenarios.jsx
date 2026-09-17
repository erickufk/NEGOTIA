import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import { Users, Clock, ArrowRight, Filter, Library, Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const diffChip = { Easy: "chip-emerald", Medium: "chip-amber", Hard: "chip-rose" };

export default function Scenarios() {
  const { t, lang } = useI18n();
  const L = t.labels;
  const nav = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [cat, setCat] = useState("all");
  const [diff, setDiff] = useState("all");

  const refresh = () => api.scenarios(lang).then(setScenarios).catch(() => {});
  useEffect(() => { refresh(); }, [lang]);

  const cats = ["all", ...Array.from(new Set(scenarios.map(s => s.category)))];
  const diffs = ["all", "Easy", "Medium", "Hard"];
  const filtered = scenarios.filter(s =>
    (cat === "all" || s.category === cat) && (diff === "all" || s.difficulty === diff)
  );
  const customs = filtered.filter(s => s.custom);
  const stock = filtered.filter(s => !s.custom);

  const remove = async (slug) => {
    if (!window.confirm(t.custom.confirmDelete)) return;
    try {
      await api.deleteCustomScenario(slug);
      toast.success(t.custom.deleted);
      refresh();
    } catch { toast.error(t.custom.deleteFailed); }
  };

  const FilterPill = ({ active, onClick, children, tid }) => (
    <button data-testid={tid} onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
        active ? "neo-inset text-[#4F46E5] font-semibold" : "neo-raised-sm text-slate-500 hover:text-[#1E293B]"
      }`}>
      {children}
    </button>
  );

  const Card = ({ s, isCustom = false }) => (
    <article className={`neo-raised p-5 flex flex-col neo-raised-hover ${isCustom ? "ring-1 ring-[#4F46E5]/30" : ""}`} data-testid={`scenario-${s.slug}`}>
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {isCustom && <span className="chip chip-primary flex items-center gap-1"><Sparkles className="w-3 h-3" />{t.custom.yourBadge}</span>}
        <span className="chip chip-slate">{L.categories[s.category] || s.category}</span>
        <span className={`chip ${diffChip[s.difficulty] || "chip-slate"}`}>{L.difficulty[s.difficulty] || s.difficulty}</span>
        <span className="chip chip-slate flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration}{t.scenarios.min}</span>
        <span className="chip chip-slate flex items-center gap-1"><Users className="w-3 h-3" />{s.max_participants}</span>
      </div>
      <h3 className="font-display font-semibold text-base mb-2">{s.title}</h3>
      <p className="text-sm text-slate-500 flex-1 mb-4 leading-relaxed">{s.description}</p>
      <div className="flex flex-wrap gap-1 mb-4">
        {(s.skills || []).slice(0, 3).map(sk => (
          <span key={sk} className="text-[10px] font-mono px-2 py-0.5 rounded-full neo-raised-sm text-slate-500">{L.skills[sk] || sk}</span>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => nav(`/simulate?scenario=${s.slug}`)} data-testid={`start-${s.slug}`}
          className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
          <span>{t.scenarios.start}</span><ArrowRight className="w-4 h-4" />
        </button>
        {isCustom && (
          <button onClick={() => remove(s.slug)} data-testid={`delete-${s.slug}`}
            title={t.custom.delete}
            className="neo-raised-sm w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </article>
  );

  return (
    <AppShell>
      <section className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-[#4F46E5] mb-1">
            <Library className="w-3 h-3" />
            <span>{t.scenarios.title.toUpperCase()}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">{t.scenarios.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.scenarios.subline}</p>
        </div>
        <button onClick={() => nav("/scenarios/new")} data-testid="btn-create-scenario"
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />{t.custom.createBtn}
        </button>
      </section>

      <section className="neo-inset p-4 mb-8">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Filter className="w-3 h-3" />{t.scenarios.filters}
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 w-24">{t.scenarios.category}:</span>
            {cats.map(c => <FilterPill key={c} active={cat === c} onClick={() => setCat(c)} tid={`filter-cat-${c}`}>{c === "all" ? t.scenarios.all : (L.categories[c] || c)}</FilterPill>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 w-24">{t.scenarios.difficulty}:</span>
            {diffs.map(d => <FilterPill key={d} active={diff === d} onClick={() => setDiff(d)} tid={`filter-diff-${d}`}>{d === "all" ? t.scenarios.all : (L.difficulty[d] || d)}</FilterPill>)}
          </div>
        </div>
      </section>

      {customs.length > 0 && (
        <>
          <h2 className="text-sm font-mono font-bold tracking-wider text-slate-500 uppercase mb-3">{t.custom.mySection}</h2>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {customs.map(s => <Card key={s.slug} s={s} isCustom />)}
          </section>
        </>
      )}

      {stock.length > 0 && customs.length > 0 && (
        <h2 className="text-sm font-mono font-bold tracking-wider text-slate-500 uppercase mb-3">{t.custom.builtInSection}</h2>
      )}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stock.map(s => <Card key={s.slug} s={s} />)}
      </section>
    </AppShell>
  );
}

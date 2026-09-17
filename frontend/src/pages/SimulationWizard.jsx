import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import { Textarea } from "../components/ui/textarea";
import { MessageSquare, Mic, Grid3x3, ArrowRight, ArrowLeft, Users, Play, Sparkles, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const modes = [
  { id: "chat", icon: MessageSquare, key: "chat" },
  { id: "voice", icon: Mic, key: "voice" },
  { id: "challenge", icon: Grid3x3, key: "challenge" },
];

export default function SimulationWizard() {
  const { t, lang } = useI18n();
  const L = t.labels;
  const nav = useNavigate();
  const [params] = useSearchParams();
  const preSlug = params.get("scenario");

  const [step, setStep] = useState(preSlug ? 2 : 1);
  const [scenarios, setScenarios] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [framework, setFramework] = useState("combined");
  const [slug, setSlug] = useState(preSlug || "");
  const [scenario, setScenario] = useState(null);
  const [mode, setMode] = useState("chat");
  const [participantsCount, setParticipantsCount] = useState(1);
  const [prep, setPrep] = useState({ batna: "", priorities: "", theirs: "", offer: "", ideal: "", minimum: "" });
  const [creating, setCreating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    api.scenarios(lang).then(setScenarios).catch(() => {});
    api.frameworks().then(setFrameworks).catch(() => {});
  }, [lang]);
  useEffect(() => {
    if (slug) api.scenario(slug, lang).then(s => { setScenario(s); setParticipantsCount(s.max_participants); });
  }, [slug, lang]);

  const start = async () => {
    setCreating(true);
    try {
      const neg = await api.createNeg({ scenario_slug: slug, mode, participants_count: participantsCount, preparation: prep, training_framework: framework, language: lang });
      nav(`/negotiation/${neg.id}`);
    } catch (e) {
      toast.error("Failed to create negotiation");
    } finally { setCreating(false); }
  };

  const autofillPrep = async () => {
    setAnalyzing(true);
    try {
      const data = await api.analyzePrep({ scenario_slug: slug, training_framework: framework, language: lang });
      setPrep(p => ({ ...p, ...data }));
      toast.success(t.wizard.autofillDone);
    } catch { toast.error("Autofill failed"); }
    finally { setAnalyzing(false); }
  };

  const stepLabels = [t.wizard.s1, t.wizard.framework, t.wizard.s2, t.wizard.s3, t.wizard.s4, t.wizard.s5, t.wizard.s6];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {/* Step Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-[#4F46E5] mb-1">
            <Sparkles className="w-3 h-3" />
            <span>{t.wizard.step} {step} {t.wizard.of} {stepLabels.length}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">{stepLabels[step - 1]}</h1>
        </div>

        {/* Progress pills */}
        <div className="neo-inset p-1.5 mb-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {stepLabels.map((s, i) => (
            <div key={i} className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${
              i + 1 === step ? "neo-raised-sm text-[#4F46E5] font-semibold" : i + 1 < step ? "text-emerald-600" : "text-slate-400"
            }`}>
              <span className="font-mono">0{i + 1}</span>
              <span className="hidden sm:inline">{s}</span>
              {i + 1 < step && <Check className="w-3 h-3" />}
              {i < stepLabels.length - 1 && <ChevronRight className="w-3 h-3 ml-1 text-slate-300" />}
            </div>
          ))}
        </div>

        <div className="neo-raised p-6">
          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {scenarios.map(s => (
                <button key={s.slug} data-testid={`w-scenario-${s.slug}`} onClick={() => setSlug(s.slug)}
                  className={`text-left p-4 rounded-xl transition-all ${
                    slug === s.slug ? "neo-inset ring-2 ring-[#4F46E5]" : "neo-raised-sm neo-raised-hover"
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="chip chip-primary">{L.categories[s.category] || s.category}</span>
                    <span className="chip chip-slate">{L.difficulty[s.difficulty] || s.difficulty}</span>
                  </div>
                  <div className="font-semibold text-sm mb-1">{s.title}</div>
                  <div className="text-xs text-slate-500 line-clamp-2">{s.description}</div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {frameworks.map(f => {
                const FL = (L.frameworks && L.frameworks[f.id]) || {};
                const fName = FL.name || f.name, fTag = FL.tagline || f.tagline, fChips = FL.chips || f.chips;
                return (
                <button key={f.id} data-testid={`w-framework-${f.id}`} onClick={() => setFramework(f.id)}
                  className={`text-left p-5 rounded-xl transition-all ${
                    framework === f.id ? "neo-inset ring-2 ring-[#4F46E5]" : "neo-raised-sm neo-raised-hover"
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-display font-semibold text-base">{fName}</div>
                    {f.id === "combined" && <span className="chip chip-emerald">{t.wizard.recommended}</span>}
                  </div>
                  <div className="text-sm text-slate-500 mb-3">{fTag}</div>
                  <div className="flex flex-wrap gap-1">
                    {fChips.map(c => <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded-full neo-raised-sm text-slate-500">{c}</span>)}
                  </div>
                </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="grid sm:grid-cols-3 gap-3">
              {modes.map(m => (
                <button key={m.id} data-testid={`w-mode-${m.id}`} onClick={() => setMode(m.id)}
                  className={`text-left p-6 rounded-xl transition-all ${
                    mode === m.id ? "neo-inset ring-2 ring-[#4F46E5]" : "neo-raised-sm neo-raised-hover"
                  }`}>
                  <m.icon className="w-6 h-6 text-[#4F46E5] mb-3" />
                  <div className="font-semibold mb-1">{t.wizard[m.key]}</div>
                  <div className="text-xs text-slate-500">{t.wizard[m.key + "Desc"]}</div>
                </button>
              ))}
            </div>
          )}

          {step === 4 && scenario && (
            <div className="space-y-4">
              <div className="text-sm text-slate-500">{t.wizard.chooseOpponents}</div>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].filter(n => n <= scenario.max_participants).map(n => (
                  <button key={n} data-testid={`w-parts-${n}`} onClick={() => setParticipantsCount(n)}
                    className={`p-4 rounded-xl transition-all ${
                      participantsCount === n ? "neo-inset ring-2 ring-[#4F46E5]" : "neo-raised-sm neo-raised-hover"
                    }`}>
                    <Users className="w-5 h-5 text-[#4F46E5] mb-2" />
                    <div className="font-mono font-bold text-xl">{n}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{t.scenarios.participants}</div>
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {scenario.participants.slice(0, participantsCount).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl neo-inset">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center text-xs font-bold">
                      {p.name.split(" ").map(x => x[0]).join("")}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && scenario && (
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-mono mb-1 tracking-wider">{t.wizard.situation}</div>
                <div className="text-[#1E293B] p-4 rounded-xl neo-inset">{scenario.context}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-mono mb-1 tracking-wider">{t.wizard.primary}</div>
                <div className="text-[#1E293B] font-medium p-4 rounded-xl neo-inset">{scenario.objective}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-mono mb-1 tracking-wider">{t.wizard.success}</div>
                <ul className="space-y-1.5 p-4 rounded-xl neo-inset">
                  {scenario.success_conditions.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[#1E293B]"><Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" /><span>{c}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <div className="flex justify-end mb-3">
                <button data-testid="autofill-prep" onClick={autofillPrep} disabled={analyzing || !slug}
                  className="neo-raised-sm px-4 py-2 rounded-full text-xs font-semibold text-[#4F46E5] hover:shadow-md transition-all inline-flex items-center gap-1.5 disabled:opacity-50">
                  <Sparkles className="w-3.5 h-3.5" />{analyzing ? t.wizard.writing : t.wizard.autofill}
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { k: "batna", label: t.wizard.batna, ph: t.wizard.batnaPh },
                  { k: "priorities", label: t.wizard.priorities, ph: t.wizard.prioritiesPh },
                  { k: "theirs", label: t.wizard.theirs, ph: "" },
                  { k: "offer", label: t.wizard.offer, ph: "" },
                  { k: "ideal", label: t.wizard.ideal, ph: "" },
                  { k: "minimum", label: t.wizard.minimum, ph: "" },
                ].map(f => (
                  <div key={f.k}>
                    <label className="text-[10px] uppercase text-slate-500 font-mono mb-1 tracking-wider block">{f.label}</label>
                    <Textarea data-testid={`w-prep-${f.k}`} placeholder={f.ph} rows={2}
                      value={prep[f.k]} onChange={e => setPrep({ ...prep, [f.k]: e.target.value })}
                      className="neo-inset border-0 text-sm text-[#1E293B] resize-none focus:ring-2 focus:ring-[#4F46E5]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 7 && scenario && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { l: t.wizard.scenario, v: scenario.title },
                  { l: t.wizard.frameworkLabel, v: (L.frameworks && L.frameworks[framework] && L.frameworks[framework].name) || framework },
                  { l: t.wizard.mode, v: t.wizard[mode] || mode },
                  { l: t.scenarios.participants, v: participantsCount },
                ].map((row, i) => (
                  <div key={i} className="p-4 rounded-xl neo-inset">
                    <div className="text-[10px] uppercase text-slate-500 font-mono tracking-wider mb-1">{row.l}</div>
                    <div className="font-semibold capitalize">{row.v}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-[#4F46E5]/5 border border-[#4F46E5]/10 text-sm">
                <div className="font-semibold text-[#4F46E5] mb-1 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />{t.wizard.primaryGoal}</div>
                <div className="text-[#1E293B]">{scenario.objective}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} data-testid="wizard-back"
            className="btn-ghost px-5 py-2 text-sm flex items-center gap-1 text-slate-500 disabled:opacity-40">
            <ArrowLeft className="w-4 h-4" />{t.wizard.back}
          </button>
          {step < 7 ? (
            <button className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
              disabled={step === 1 && !slug} onClick={() => setStep(step + 1)} data-testid="wizard-next">
              {t.wizard.next}<ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
              disabled={creating} onClick={start} data-testid="wizard-start">
              <Play className="w-4 h-4" />{creating ? "..." : t.wizard.start}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

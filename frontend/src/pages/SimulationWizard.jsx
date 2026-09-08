import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { MessageSquare, Mic, Grid3x3, ArrowRight, ArrowLeft, Check, Users, Play } from "lucide-react";
import { toast } from "sonner";

const modes = [
  { id: "chat", icon: MessageSquare, key: "chat" },
  { id: "voice", icon: Mic, key: "voice" },
  { id: "challenge", icon: Grid3x3, key: "challenge" },
];

export default function SimulationWizard() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const preSlug = params.get("scenario");

  const [step, setStep] = useState(preSlug ? 2 : 1);
  const [scenarios, setScenarios] = useState([]);
  const [slug, setSlug] = useState(preSlug || "");
  const [scenario, setScenario] = useState(null);
  const [mode, setMode] = useState("chat");
  const [participantsCount, setParticipantsCount] = useState(1);
  const [prep, setPrep] = useState({ batna: "", priorities: "", theirs: "", offer: "", ideal: "", minimum: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => { api.scenarios().then(setScenarios); }, []);
  useEffect(() => {
    if (slug) api.scenario(slug).then(s => { setScenario(s); setParticipantsCount(s.max_participants); });
  }, [slug]);

  const start = async () => {
    setCreating(true);
    try {
      const neg = await api.createNeg({ scenario_slug: slug, mode, participants_count: participantsCount, preparation: prep });
      nav(`/negotiation/${neg.id}`);
    } catch (e) {
      toast.error("Failed to create negotiation");
    } finally { setCreating(false); }
  };

  const steps = [t.wizard.s1, t.wizard.s2, t.wizard.s3, t.wizard.s4, t.wizard.s5, t.wizard.s6];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="text-xs font-mono text-sky-400 mb-2">{t.wizard.step} {step} {t.wizard.of} 6</div>
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i+1 <= step ? "bg-sky-400" : "bg-white/10"}`} />
            ))}
          </div>
          <div className="mt-3 font-display font-bold text-2xl">{steps[step-1]}</div>
        </div>

        <div className="card-glow rounded-2xl p-6">
          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {scenarios.map(s => (
                <button key={s.slug} data-testid={`w-scenario-${s.slug}`}
                  onClick={() => setSlug(s.slug)}
                  className={`text-left p-4 rounded-xl border transition ${slug===s.slug?"border-sky-400 bg-sky-500/5":"border-white/10 hover:border-white/20"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="chip chip-indigo">{s.category}</span>
                    <span className="chip chip-slate">{s.difficulty}</span>
                  </div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2">{s.description}</div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid sm:grid-cols-3 gap-3">
              {modes.map(m => (
                <button key={m.id} data-testid={`w-mode-${m.id}`} onClick={() => setMode(m.id)}
                  className={`p-6 rounded-xl border transition text-left ${mode===m.id?"border-sky-400 bg-sky-500/5":"border-white/10 hover:border-white/20"}`}>
                  <m.icon className="w-6 h-6 text-sky-400 mb-3" />
                  <div className="font-semibold mb-1">{t.wizard[m.key]}</div>
                  <div className="text-xs text-slate-400">{t.wizard[m.key + "Desc"]}</div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && scenario && (
            <div className="space-y-4">
              <div className="text-sm text-slate-400 mb-3">Choose how many opponents you'll face.</div>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].filter(n => n <= scenario.max_participants).map(n => (
                  <button key={n} data-testid={`w-parts-${n}`} onClick={() => setParticipantsCount(n)}
                    className={`p-4 rounded-xl border transition ${participantsCount===n?"border-sky-400 bg-sky-500/5":"border-white/10"}`}>
                    <Users className="w-5 h-5 text-sky-400 mb-2" />
                    <div className="font-mono font-bold text-xl">{n}</div>
                    <div className="text-xs text-slate-500">{t.scenarios.participants}</div>
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {scenario.participants.slice(0, participantsCount).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-indigo-500 flex items-center justify-center text-xs font-bold">
                      {p.name.split(" ").map(x=>x[0]).join("")}
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

          {step === 4 && scenario && (
            <div className="space-y-4 text-sm">
              <div><div className="text-xs uppercase text-slate-500 mb-1">{t.wizard.situation}</div>
                <div className="text-slate-300">{scenario.context}</div></div>
              <div><div className="text-xs uppercase text-slate-500 mb-1">{t.wizard.primary}</div>
                <div className="text-slate-100 font-medium">{scenario.objective}</div></div>
              <div><div className="text-xs uppercase text-slate-500 mb-1">Success</div>
                <ul className="list-disc list-inside text-slate-300">
                  {scenario.success_conditions.map((c,i) => <li key={i}>{c}</li>)}
                </ul></div>
            </div>
          )}

          {step === 5 && (
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
                  <label className="text-xs uppercase text-slate-500 mb-1 block">{f.label}</label>
                  <Textarea data-testid={`w-prep-${f.k}`} placeholder={f.ph} rows={2}
                    value={prep[f.k]} onChange={e => setPrep({...prep, [f.k]: e.target.value})}
                    className="bg-white/5 border-white/10 text-sm" />
                </div>
              ))}
            </div>
          )}

          {step === 6 && scenario && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><div className="text-xs uppercase text-slate-500">Scenario</div><div className="font-semibold">{scenario.title}</div></div>
                <div><div className="text-xs uppercase text-slate-500">{t.wizard.mode}</div><div className="font-semibold capitalize">{mode}</div></div>
                <div><div className="text-xs uppercase text-slate-500">{t.scenarios.participants}</div><div className="font-semibold font-mono">{participantsCount}</div></div>
                <div><div className="text-xs uppercase text-slate-500">Prep</div><div className="font-semibold text-emerald-400 flex items-center gap-1"><Check className="w-4 h-4" />Done</div></div>
              </div>
              <div className="p-4 rounded-lg bg-sky-500/5 border border-sky-500/10 text-sm text-slate-300">
                <div className="font-semibold text-sky-400 mb-1">Primary Goal</div>
                {scenario.objective}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={() => setStep(Math.max(1, step-1))} disabled={step === 1} data-testid="wizard-back" className="text-slate-400">
            <ArrowLeft className="w-4 h-4 mr-1" />{t.wizard.back}
          </Button>
          {step < 6 ? (
            <Button className="btn-primary rounded-full px-6" disabled={step === 1 && !slug} onClick={() => setStep(step+1)} data-testid="wizard-next">
              {t.wizard.next}<ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="btn-primary rounded-full px-6" disabled={creating} onClick={start} data-testid="wizard-start">
              <Play className="w-4 h-4 mr-2" />{creating ? "..." : t.wizard.start}
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

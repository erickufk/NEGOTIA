import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Save, ArrowLeft, Sparkles, User, Target, Zap } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Career", "Sales", "Procurement", "Management", "Partnership", "Conflict"];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];

export default function CustomScenarioBuilder() {
  const { t, lang } = useI18n();
  const L = t.labels;
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);

  const [f, setF] = useState({
    title_en: "", title_ru: "",
    description_en: "", description_ru: "",
    category: "Sales", difficulty: "Medium", duration: 12,
    objective_en: "", objective_ru: "",
    context_en: "", context_ru: "",
    success_en: "", success_ru: "",
    op_name_en: "", op_name_ru: "",
    op_role_en: "", op_role_ru: "",
    op_gender: "female",
    op_description: "", op_goals: "", op_interests: "",
    op_hidden_interests: "", op_constraints: "", op_batna: "", op_personality: "",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const canSave = f.title_en.trim() && f.description_en.trim() && f.objective_en.trim()
    && f.context_en.trim() && f.op_name_en.trim() && f.op_role_en.trim();

  const submit = async () => {
    if (!canSave) { toast.error(t.custom.fillRequired); return; }
    setSaving(true);
    try {
      const payload = {
        title_en: f.title_en.trim(), title_ru: f.title_ru.trim(),
        description_en: f.description_en.trim(), description_ru: f.description_ru.trim(),
        category: f.category, difficulty: f.difficulty, duration: parseInt(f.duration) || 12,
        objective_en: f.objective_en.trim(), objective_ru: f.objective_ru.trim(),
        context_en: f.context_en.trim(), context_ru: f.context_ru.trim(),
        success_en: f.success_en.split("\n").map(s => s.trim()).filter(Boolean),
        success_ru: f.success_ru.split("\n").map(s => s.trim()).filter(Boolean),
        skills: [],
        opponent: {
          name_en: f.op_name_en.trim(), name_ru: f.op_name_ru.trim(),
          role_en: f.op_role_en.trim(), role_ru: f.op_role_ru.trim(),
          gender: f.op_gender,
          description: f.op_description.trim(), goals: f.op_goals.trim(),
          interests: f.op_interests.trim(), hidden_interests: f.op_hidden_interests.trim(),
          constraints: f.op_constraints.trim(), batna: f.op_batna.trim(),
          personality: f.op_personality.trim(), priorities: [],
        },
      };
      const sc = await api.createCustomScenario(payload);
      toast.success(t.custom.saved);
      nav(`/simulate?scenario=${sc.slug}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || t.custom.saveFailed);
    } finally { setSaving(false); }
  };

  const iCls = "neo-inset border-0 h-11 text-sm text-[#1E293B] focus:ring-2 focus:ring-[#4F46E5]";
  const tCls = "neo-inset border-0 text-sm text-[#1E293B] resize-none focus:ring-2 focus:ring-[#4F46E5] min-h-[100px]";
  const lbl = "text-[10px] uppercase text-slate-500 font-mono tracking-wider mb-1 block";

  const Bi = ({ k, label, rows = 0, required = false, ph = { ru: "", en: "" } }) => (
    <div className="grid sm:grid-cols-2 gap-3">
      <div>
        <Label className={lbl}>{label} · RU {required && lang === "ru" && <span className="text-rose-500">*</span>}</Label>
        {rows > 0 ? (
          <Textarea rows={rows} data-testid={`cs-${k}-ru`} value={f[`${k}_ru`]} placeholder={ph.ru}
            onChange={e => set(`${k}_ru`, e.target.value)} className={tCls} />
        ) : (
          <Input data-testid={`cs-${k}-ru`} value={f[`${k}_ru`]} placeholder={ph.ru}
            onChange={e => set(`${k}_ru`, e.target.value)} className={iCls} />
        )}
      </div>
      <div>
        <Label className={lbl}>{label} · EN {required && <span className="text-rose-500">*</span>}</Label>
        {rows > 0 ? (
          <Textarea rows={rows} data-testid={`cs-${k}-en`} value={f[`${k}_en`]} placeholder={ph.en}
            onChange={e => set(`${k}_en`, e.target.value)} className={tCls} />
        ) : (
          <Input data-testid={`cs-${k}-en`} value={f[`${k}_en`]} placeholder={ph.en}
            onChange={e => set(`${k}_en`, e.target.value)} className={iCls} />
        )}
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <button onClick={() => nav("/scenarios")} data-testid="cs-back"
          className="text-xs text-slate-500 hover:text-[#4F46E5] mb-4 flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />{t.custom.backList}
        </button>
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-[#4F46E5] mb-1">
            <Sparkles className="w-3 h-3" /><span>{t.custom.badge}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">{t.custom.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.custom.subline}</p>
        </div>

        {/* Section 1: Basic Info */}
        <section className="neo-raised p-6 mb-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="font-display font-bold text-base">{t.custom.basicInfo}</h2>
          </div>
          <Bi k="title" label={t.custom.titleField} required
            ph={{ ru: t.custom.titlePh.ru, en: t.custom.titlePh.en }} />
          <Bi k="description" label={t.custom.descField} rows={3} required
            ph={{ ru: t.custom.descPh.ru, en: t.custom.descPh.en }} />
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label className={lbl}>{t.custom.categoryField}</Label>
              <select data-testid="cs-category" value={f.category} onChange={e => set("category", e.target.value)}
                className={`${iCls} w-full px-3`}>
                {CATEGORIES.map(c => <option key={c} value={c}>{L.categories[c] || c}</option>)}
              </select>
            </div>
            <div>
              <Label className={lbl}>{t.custom.difficultyField}</Label>
              <select data-testid="cs-difficulty" value={f.difficulty} onChange={e => set("difficulty", e.target.value)}
                className={`${iCls} w-full px-3`}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{L.difficulty[d] || d}</option>)}
              </select>
            </div>
            <div>
              <Label className={lbl}>{t.custom.durationField}</Label>
              <Input data-testid="cs-duration" type="number" min={3} max={60}
                value={f.duration} onChange={e => set("duration", e.target.value)} className={iCls} />
            </div>
          </div>
        </section>

        {/* Section 2: Scenario Details */}
        <section className="neo-raised p-6 mb-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="font-display font-bold text-base">{t.custom.details}</h2>
          </div>
          <Bi k="objective" label={t.custom.objectiveField} rows={3} required
            ph={{ ru: t.custom.objectivePh.ru, en: t.custom.objectivePh.en }} />
          <Bi k="context" label={t.custom.contextField} rows={5} required
            ph={{ ru: t.custom.contextPh.ru, en: t.custom.contextPh.en }} />
          <Bi k="success" label={t.custom.successField} rows={3}
            ph={{ ru: t.custom.successPh.ru, en: t.custom.successPh.en }} />
          <p className="text-[11px] text-slate-500 -mt-2">{t.custom.successHint}</p>
        </section>

        {/* Section 3: Opponent */}
        <section className="neo-raised p-6 mb-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="font-display font-bold text-base">{t.custom.opponent}</h2>
          </div>
          <Bi k="op_name" label={t.custom.opName} required
            ph={{ ru: "Елена Ростова", en: "Elena Rostova" }} />
          <Bi k="op_role" label={t.custom.opRole} required
            ph={{ ru: "Директор по закупкам", en: "VP Procurement" }} />
          <div>
            <Label className={lbl}>{t.custom.opGender}</Label>
            <div className="flex gap-2">
              {["female", "male"].map(g => (
                <button type="button" key={g} data-testid={`cs-gender-${g}`} onClick={() => set("op_gender", g)}
                  className={`px-5 py-2 rounded-full text-xs font-medium transition-all ${
                    f.op_gender === g ? "neo-inset text-[#4F46E5] font-semibold" : "neo-raised-sm text-slate-500"
                  }`}>{t.custom.gender[g]}</button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className={lbl}>{t.custom.opDescription}</Label>
              <Textarea rows={3} data-testid="cs-op-description" value={f.op_description}
                onChange={e => set("op_description", e.target.value)} placeholder={t.custom.opDescriptionPh} className={tCls} />
            </div>
            <div>
              <Label className={lbl}>{t.custom.opPersonality}</Label>
              <Textarea rows={3} data-testid="cs-op-personality" value={f.op_personality}
                onChange={e => set("op_personality", e.target.value)} placeholder={t.custom.opPersonalityPh} className={tCls} />
            </div>
            <div>
              <Label className={lbl}>{t.custom.opGoals}</Label>
              <Textarea rows={3} data-testid="cs-op-goals" value={f.op_goals}
                onChange={e => set("op_goals", e.target.value)} placeholder={t.custom.opGoalsPh} className={tCls} />
            </div>
            <div>
              <Label className={lbl}>{t.custom.opInterests}</Label>
              <Textarea rows={3} data-testid="cs-op-interests" value={f.op_interests}
                onChange={e => set("op_interests", e.target.value)} placeholder={t.custom.opInterestsPh} className={tCls} />
            </div>
            <div>
              <Label className={lbl}>{t.custom.opHidden} <span className="text-slate-400">({t.custom.opHiddenHint})</span></Label>
              <Textarea rows={3} data-testid="cs-op-hidden" value={f.op_hidden_interests}
                onChange={e => set("op_hidden_interests", e.target.value)} placeholder={t.custom.opHiddenPh} className={tCls} />
            </div>
            <div>
              <Label className={lbl}>{t.custom.opConstraints}</Label>
              <Textarea rows={3} data-testid="cs-op-constraints" value={f.op_constraints}
                onChange={e => set("op_constraints", e.target.value)} placeholder={t.custom.opConstraintsPh} className={tCls} />
            </div>
            <div className="sm:col-span-2">
              <Label className={lbl}>{t.custom.opBatna}</Label>
              <Textarea rows={2} data-testid="cs-op-batna" value={f.op_batna}
                onChange={e => set("op_batna", e.target.value)} placeholder={t.custom.opBatnaPh} className={tCls} />
            </div>
          </div>
        </section>

        <div className="flex justify-between items-center">
          <div className="text-xs text-slate-500">{t.custom.ruHint}</div>
          <button onClick={submit} disabled={saving || !canSave} data-testid="cs-save"
            className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "..." : t.custom.saveStart}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

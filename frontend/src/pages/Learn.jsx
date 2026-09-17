import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { LEARN } from "../i18n/learnContent";
import { GraduationCap, Search, Scale, Sparkles, Check, Lightbulb, Target } from "lucide-react";

const ICONS = { harvard: GraduationCap, spin: Search, batna: Scale };

export default function Learn() {
  const { lang } = useI18n();
  const data = LEARN[lang] || LEARN.en;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto" data-testid="learn-page">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-[#4F46E5] mb-1">
            <Sparkles className="w-3 h-3" /><span>NEGOTIA · {data.title.toUpperCase()}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">{data.title}</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">{data.subtitle}</p>
        </div>

        <div className="space-y-6">
          {data.frameworks.map(f => {
            const Icon = ICONS[f.id] || GraduationCap;
            return (
              <section key={f.id} data-testid={`learn-${f.id}`} className="neo-raised p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl neo-raised-sm flex items-center justify-center text-[#4F46E5] shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg leading-tight">{f.name}</h2>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">{f.tag}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#4F46E5]/5 border border-[#4F46E5]/10 text-sm text-[#1E293B] mb-5">
                  <div className="text-[10px] uppercase text-[#4F46E5] font-mono tracking-wider mb-1 font-semibold">{data.sections.essence}</div>
                  {f.essence}
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <div className="text-[10px] uppercase text-slate-500 font-mono tracking-wider mb-2 flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-[#4F46E5]" />{data.sections.concepts}
                    </div>
                    <ul className="space-y-2">
                      {f.concepts.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#1E293B]">
                          <span className="font-mono text-xs text-[#4F46E5] mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-500 font-mono tracking-wider mb-2 flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600" />{data.sections.rules}
                    </div>
                    <ul className="space-y-2">
                      {f.rules.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" /><span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-2 p-3 rounded-xl neo-inset text-sm text-[#1E293B]">
                  <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span><span className="font-semibold">{data.sections.tip}: </span>{f.tip}</span>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

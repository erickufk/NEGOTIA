import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { ArrowRight, Play, Check, Sparkles, Users, Target, Award, Languages, MessageSquare, Mic, Grid3x3, ChevronRight, Zap } from "lucide-react";

export default function Landing() {
  const { lang, setLang } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const go = () => nav(user ? "/dashboard" : "/auth");

  const isRu = lang === "ru";
  const T = {
    heroTitle: isRu ? ["Не просто изучайте переговоры.", "Практикуйтесь."] : ["Don't just study negotiations.", "Practice them."],
    heroSub: isRu ? "Реалистичные переговоры с AI-персонажами. Выбирайте стратегию, ведите диалог, принимайте решения под давлением и получайте персональный разбор." : "Realistic negotiations with AI characters. Choose strategy, lead the dialogue, decide under pressure — and get a personal debrief.",
    ctaPrimary: isRu ? "Начать симуляцию" : "Start Simulation",
    ctaSecondary: isRu ? "Смотреть сценарии" : "Explore Scenarios",
    section1: isRu ? "Переговорным навыкам не научиться только по учебнику." : "Negotiation skills can't be learned from a textbook.",
    section1Sub: isRu ? "Реальные сделки давят. Мы даём вам безопасное поле для тренировки под этим давлением — снова и снова, пока рефлексы не станут вашими." : "Real deals put pressure on you. We give you a safe field to train under that pressure — again and again, until the reflexes become yours.",
    stepsTitle: isRu ? "Четыре шага до успешной реальной переговорной ситуации" : "Four steps to a real negotiation win",
    steps: isRu ? [
      { t: "Выберите сценарий", d: "12 реальных бизнес-ситуаций." },
      { t: "Определите стратегию", d: "BATNA, приоритеты, цели." },
      { t: "Ведите переговоры", d: "Чат, голос или тактический выбор." },
      { t: "Получите разбор", d: "Оценка, радар навыков, ключевые моменты." },
    ] : [
      { t: "Choose a scenario", d: "12 real business situations." },
      { t: "Set strategy", d: "BATNA, priorities, goals." },
      { t: "Negotiate", d: "Chat, voice, or tactical choice." },
      { t: "Get a debrief", d: "Score, skill radar, critical moments." },
    ],
    videoTitle: isRu ? "Какое решение меняет ход переговоров" : "The decisions that change a negotiation",
    videoSub: isRu ? "Каждая реплика — данные. Каждый ход — метрика. Каждое решение — обучение." : "Every line is data. Every move is a metric. Every decision is learning.",
    diffTitle: isRu ? "Это не просто AI-чат. Это симуляция." : "This isn't just an AI chat. It's a simulation.",
    diffLeft: isRu ? "Обычный AI-чат" : "Regular AI chat",
    diffRight: "NEGOTIA Симулятор",
    diffLeftList: isRu ? ["Отвечает на всё, что вы напишете", "Не имеет своих целей", "Соглашается со всеми доводами", "Не даёт обратной связи"] : ["Answers anything you write", "Has no goals", "Agrees with anything", "Gives no feedback"],
    diffRightList: isRu ? ["AI-персонажи со скрытыми интересами и BATNA", "Реагируют на давление, доверие и уступки", "Отслеживают ваши навыки в реальном времени", "Детальный разбор после каждой сессии"] : ["AI characters with hidden interests and BATNA", "React to pressure, trust, concessions", "Track your skills in real-time", "Detailed debrief after every session"],
    fwTitle: isRu ? "Выберите, чему хотите научиться" : "Choose what you want to master",
    frameworks: [
      { n: "Harvard Negotiation", d: isRu ? "Интересы, опции, критерии" : "Interests, options, criteria", c: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { n: "SPIN технология", d: isRu ? "Ситуация, Проблема, Импликация" : "Situation, Problem, Implication", c: "bg-sky-50 text-sky-700 border-sky-200" },
      { n: "BATNA", d: isRu ? "Альтернативы и рычаги" : "Alternatives and leverage", c: "bg-amber-50 text-amber-700 border-amber-200" },
      { n: "Combined Method", d: isRu ? "Все три подхода вместе" : "All three combined", c: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    ],
    modesTitle: isRu ? "Выберите свой способ переговоров" : "Choose how you negotiate",
    modes: isRu ? [
      { n: "Текстовый режим", d: "Свободный чат — лучший старт для отработки формулировок.", i: MessageSquare },
      { n: "Голосовой режим", d: "Говорите вслух — тренируйте тон, паузы, дикцию.", i: Mic },
      { n: "Choice-based режим", d: "Тактические варианты — учитесь видеть правильный ход.", i: Grid3x3 },
    ] : [
      { n: "Text mode", d: "Free chat — best for practicing wording.", i: MessageSquare },
      { n: "Voice mode", d: "Speak aloud — train tone, pauses, delivery.", i: Mic },
      { n: "Choice-based mode", d: "Tactical options — learn to spot the right move.", i: Grid3x3 },
    ],
    debriefTitle: isRu ? "Вы умеете не только выигрывать, но разобрали ли переговоры" : "You don't just win — you understand why you won",
    debriefSub: isRu ? "После каждой сессии — оценка, разбор навыков, ключевые моменты и лучшая альтернатива." : "After every session — score, skill breakdown, critical moments, and a better alternative.",
    tryTitle: isRu ? "Попробуйте сейчас. Научитесь строго." : "Try it now. Learn seriously.",
    scenariosTitle: isRu ? "Реалистичные сценарии для любого контекста" : "Realistic scenarios for any context",
    scenarioList: isRu ? [
      "Повышение зарплаты", "Продажа корпоративного контракта", "Спор о ресурсах",
      "Кризис клиента", "Партнёрство", "Внутренний конфликт",
    ] : [
      "Salary raise", "Enterprise sale", "Resource dispute",
      "Client crisis", "Partnership", "Internal conflict",
    ],
    finalCta: isRu ? "Следующие переговоры могут стать вашей тренировкой" : "Your next negotiation can be your training ground",
  };

  const modes = T.modes;
  const scenarios = T.scenarioList;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1E293B]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/85 backdrop-blur-xl border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="brand-link-landing">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center font-black text-white text-sm">N</div>
            <span className="font-display font-bold text-lg tracking-tight">NEGOTIA</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-neutral-600">
            <a href="#frameworks" className="hover:text-black">{isRu ? "Методики" : "Frameworks"}</a>
            <a href="#modes" className="hover:text-black">{isRu ? "Режимы" : "Modes"}</a>
            <a href="#scenarios" className="hover:text-black">{isRu ? "Сценарии" : "Scenarios"}</a>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="landing-lang" className="text-neutral-600 hover:text-black">
                  <Languages className="w-4 h-4 mr-1" />{lang.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLang("en")}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLang("ru")}>Русский</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {user ? (
              <Button onClick={() => nav("/dashboard")} data-testid="cta-dashboard" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-full px-5">
                {isRu ? "Панель" : "Dashboard"}
              </Button>
            ) : (
              <>
                <Link to="/auth" className="text-sm text-neutral-600 hover:text-black" data-testid="cta-signin">{isRu ? "Войти" : "Sign in"}</Link>
                <Button onClick={go} data-testid="cta-signup" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-full px-5">
                  {isRu ? "Начать" : "Get started"}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 chip bg-white border-black/10 text-neutral-700 mb-6">
          <Sparkles className="w-3 h-3" /> AI Negotiation Simulator
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-[1.05] tracking-tight max-w-3xl mx-auto">
          {T.heroTitle[0]} <span className="text-[#4F46E5]">{T.heroTitle[1]}</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-neutral-600 max-w-xl mx-auto">{T.heroSub}</p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button onClick={go} data-testid="hero-start" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-full px-6 h-12">
            {T.ctaPrimary}<ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button onClick={go} data-testid="hero-explore" variant="outline" className="rounded-full px-6 h-12 border-black/15 bg-white hover:bg-neutral-50 text-black">
            {T.ctaSecondary}
          </Button>
        </div>
        {/* Preview card */}
        <div className="mt-12 mx-auto max-w-4xl bg-white rounded-2xl border border-black/10 shadow-xl shadow-black/5 p-4 sm:p-6 text-left">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-4 border-b border-black/5 pb-3">
            <div className="flex items-center gap-2 font-mono">
              <span className="chip bg-emerald-50 text-emerald-700 border-emerald-200 !text-[10px]">● Активная</span>
              <span>Vendor Price Increase</span>
            </div>
            <span className="font-mono">Раунд 3 / 10</span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0">AV</div>
              <div className="flex-1 bg-neutral-50 rounded-2xl rounded-tl-sm p-3 text-neutral-800">Нам нужно повышение на 12%. Это не обсуждается.</div></div>
            <div className="flex gap-3 flex-row-reverse"><div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold shrink-0">Вы</div>
              <div className="flex-1 bg-sky-50 border border-sky-100 rounded-2xl rounded-tr-sm p-3 text-neutral-900">Помогите понять — что стоит за этой цифрой? Материалы или логистика?</div></div>
            <div className="pl-11 flex items-center gap-2 text-xs text-emerald-700"><Sparkles className="w-3 h-3" />Открытый вопрос · +8 Questioning</div>
          </div>
          <div className="mt-5 pt-4 border-t border-black/5 grid grid-cols-4 gap-3 text-xs">
            {[["Trust", "64", "text-emerald-600"], ["Pressure", "42", "text-amber-600"], ["Score", "78", "text-sky-600"], ["Framework", "Harvard", "text-indigo-600"]].map(([l, v, c]) => (
              <div key={l}><div className="text-neutral-500">{l}</div><div className={`font-mono font-semibold ${c}`}>{v}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: NOT FROM TEXTBOOK */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight max-w-md">{T.section1}</h2>
          <p className="mt-4 text-neutral-600">{T.section1Sub}</p>
          <div className="mt-6 space-y-3">
            {(isRu ? ["Тренировка под давлением", "Скрытые интересы AI-оппонентов", "Мгновенная обратная связь"] : ["Practice under pressure", "AI hidden interests", "Instant feedback"]).map(x => (
              <div key={x} className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-600" /><span className="text-sm">{x}</span></div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="rounded-2xl overflow-hidden bg-neutral-900 aspect-[4/3] flex items-center justify-center text-white/40">
            <Play className="w-16 h-16 opacity-40" />
          </div>
          <div className="absolute -bottom-4 -left-4 bg-white rounded-xl border border-black/10 shadow-lg p-3 text-xs max-w-[220px]">
            <div className="font-mono text-emerald-600 mb-1">● LIVE</div>
            <div className="text-neutral-700">Выявление интересов оппонента через открытые вопросы</div>
          </div>
        </div>
      </section>

      {/* 4 STEPS */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center max-w-2xl mx-auto leading-tight">{T.stepsTitle}</h2>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {T.steps.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-black/8 p-6" data-testid={`step-${i}`}>
              <div className="text-xs font-mono text-neutral-400 mb-4">STEP 0{i+1}</div>
              <div className="font-display font-semibold text-lg mb-2">{s.t}</div>
              <div className="text-sm text-neutral-600">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* VIDEO SECTION */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center max-w-2xl mx-auto">{T.videoTitle}</h2>
        <p className="text-center text-neutral-600 mt-3 max-w-xl mx-auto">{T.videoSub}</p>
        <div className="mt-10 rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800 aspect-video flex items-center justify-center border border-black/10">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 cursor-pointer hover:bg-white/20 transition">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      </section>

      {/* DIFFERENCE */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center">{T.diffTitle}</h2>
        <div className="mt-10 grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-black/8 p-6">
            <div className="text-xs uppercase font-mono text-neutral-400 mb-4">{T.diffLeft}</div>
            <ul className="space-y-2 text-sm text-neutral-600">
              {T.diffLeftList.map((x, i) => <li key={i} className="flex gap-2"><span className="text-rose-500">✕</span>{x}</li>)}
            </ul>
          </div>
          <div className="bg-[#1A1A1A] text-white rounded-2xl p-6 shadow-xl shadow-black/10">
            <div className="text-xs uppercase font-mono text-white/50 mb-4">{T.diffRight}</div>
            <ul className="space-y-2 text-sm text-white/90">
              {T.diffRightList.map((x, i) => <li key={i} className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{x}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* FRAMEWORKS */}
      <section id="frameworks" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center">{T.fwTitle}</h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {T.frameworks.map((f, i) => (
            <div key={i} className={`rounded-2xl border p-6 ${f.c}`}>
              <Award className="w-6 h-6 mb-4 opacity-70" />
              <div className="font-display font-semibold text-lg mb-1">{f.n}</div>
              <div className="text-sm opacity-80">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MODES */}
      <section id="modes" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center">{T.modesTitle}</h2>
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          {modes.map((m, i) => (
            <div key={i} className="bg-white rounded-2xl border border-black/8 p-6">
              <m.i className="w-6 h-6 text-[#4F46E5] mb-4" />
              <div className="font-display font-semibold text-lg mb-2">{m.n}</div>
              <div className="text-sm text-neutral-600">{m.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DEBRIEF PREVIEW */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight">{T.debriefTitle}</h2>
          <p className="mt-4 text-neutral-600">{T.debriefSub}</p>
          <Button onClick={go} className="mt-6 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-full px-6 h-12">
            {T.ctaPrimary}<ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div className="bg-white rounded-2xl border border-black/10 shadow-xl shadow-black/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-neutral-500 font-mono">DEBRIEF</div>
              <div className="font-display font-bold text-lg">Vendor Price Increase</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-neutral-500">Overall</div>
              <div className="font-mono font-black text-3xl text-[#4F46E5]">84</div>
            </div>
          </div>
          <div className="space-y-2">
            {[["Questioning", 91], ["Active Listening", 84], ["BATNA", 78], ["Concessions", 68]].map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-xs mb-1"><span className="text-neutral-700">{k}</span><span className="font-mono text-neutral-500">{v}</span></div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden"><div className="h-full bg-[#4F46E5]" style={{ width: `${v}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCENARIOS */}
      <section id="scenarios" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center">{T.scenariosTitle}</h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-black/8 p-6 hover:border-black/20 transition cursor-pointer" onClick={go}>
              <div className="flex items-center justify-between mb-3">
                <span className="chip bg-neutral-100 text-neutral-700 border-neutral-200">{isRu ? "Сценарий" : "Scenario"}</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="font-display font-semibold text-lg mb-1">{s}</div>
              <div className="text-xs text-neutral-500 font-mono">Harvard · SPIN · BATNA</div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="bg-white rounded-3xl border border-black/8 p-12 max-w-3xl mx-auto">
          <Zap className="w-8 h-8 text-[#4F46E5] mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold leading-tight max-w-xl mx-auto">{T.finalCta}</h2>
          <Button onClick={go} data-testid="cta-final" className="mt-8 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-full px-8 h-14 text-base">
            {T.ctaPrimary}<ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-black/5 py-8 text-center text-xs text-neutral-500">
        © 2026 NEGOTIA · AI Negotiation Simulator
      </footer>
    </div>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../auth/AuthProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Languages } from "lucide-react";

const IMG = {
  executive: "https://customer-assets-v7afamib.emergentagent.net/job_b1184cb2-06b5-448b-8b62-d908172fda40/artifacts/42tlayq6_image.png",
  boardroom: "https://customer-assets-v7afamib.emergentagent.net/job_b1184cb2-06b5-448b-8b62-d908172fda40/artifacts/2v4l1j4x_image.png",
  debrief: "https://customer-assets-v7afamib.emergentagent.net/job_b1184cb2-06b5-448b-8b62-d908172fda40/artifacts/nye6dg94_image.png",
};

const Icon = ({ name, className = "", fill = false }) => (
  <span className={`material-symbols-outlined ${className}`} style={fill ? { fontVariationSettings: '"FILL" 1' } : undefined}>{name}</span>
);

const eyebrow = "text-[11px] leading-[14px] tracking-[0.04em] font-semibold text-[#4f46e5]";
const h2cls = "text-[28px] leading-[36px] md:text-[40px] md:leading-[48px] font-bold tracking-tight text-[#1e293b] mt-1";

export default function Landing() {
  const { lang, setLang } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const go = () => nav(user ? "/dashboard" : "/auth");
  const isRu = lang === "ru";
  const t = (ru, en) => (isRu ? ru : en);

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#1e293b] antialiased" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* ============ NAV ============ */}
      <header className="border-b border-[#e5e3dc]/70 bg-[#faf9f6]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 md:px-10 py-3 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-[22px] font-bold tracking-tight text-[#1e293b] flex items-center gap-2" data-testid="brand-link-landing">
              <span className="w-7 h-7 rounded-lg bg-[#6366f1] flex items-center justify-center text-white shadow-sm">
                <Icon name="analytics" className="!text-sm" fill />
              </span>
              NEGOTIA
            </Link>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] tracking-[0.04em] bg-[#f1f0ea] text-[#475569] border border-[#e5e3dc]/60 font-semibold">
              AI SIMULATOR
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-[#64748b] hover:text-[#1e293b] transition-colors font-medium text-[13px]">{t("Как это работает", "How it works")}</a>
            <a href="#scenarios" className="text-[#64748b] hover:text-[#1e293b] transition-colors font-medium text-[13px]">{t("Сценарии", "Scenarios")}</a>
            <a href="#frameworks" className="text-[#4f46e5] border-b-2 border-[#4f46e5] pb-0.5 font-semibold text-[13px]">{t("Методологии", "Frameworks")}</a>
            <a href="#modes" className="text-[#64748b] hover:text-[#1e293b] transition-colors font-medium text-[13px]">{t("Возможности", "Features")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="landing-lang" className="px-2.5 py-1.5 text-[13px] font-semibold text-[#64748b] hover:text-[#1e293b] transition-colors flex items-center gap-1">
                  <Languages className="w-4 h-4" />{lang.toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLang("en")}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLang("ru")}>Русский</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {user ? (
              <button onClick={() => nav("/dashboard")} data-testid="cta-dashboard" className="h-10 px-4 rounded-full bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[13px] font-semibold transition-colors flex items-center gap-1.5 active:scale-[0.98] shadow-sm">
                {t("Панель", "Dashboard")}<Icon name="arrow_forward" className="!text-sm" />
              </button>
            ) : (
              <>
                <button onClick={go} data-testid="cta-signin" className="px-3 py-1.5 text-[13px] font-semibold text-[#64748b] hover:text-[#1e293b] transition-colors">{t("Войти", "Sign in")}</button>
                <button onClick={go} data-testid="cta-signup" className="h-10 px-4 rounded-full bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[13px] font-semibold transition-colors flex items-center gap-1.5 active:scale-[0.98] shadow-sm">
                  {t("Начать симуляцию", "Start Simulation")}<Icon name="arrow_forward" className="!text-sm" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="w-full overflow-hidden">
        {/* ============ 1. HERO ============ */}
        <section className="relative pt-12 pb-16 px-4 md:px-10 max-w-7xl mx-auto" id="simulation-hero">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#e5e3dc]/80 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-[#0d9488] animate-pulse"></span>
              <span className="text-[11px] tracking-[0.06em] text-[#64748b] font-semibold">{t("AI-СИМУЛЯТОР ПЕРЕГОВОРОВ", "AI NEGOTIATION SIMULATOR")}</span>
            </div>
            <h1 className="text-[30px] leading-[38px] md:text-[40px] md:leading-[48px] font-bold text-[#1e293b] max-w-3xl tracking-tight mb-4">
              {t("Не просто изучайте переговоры. ", "Don't just study negotiations. ")}<span className="text-[#6366f1]">{t("Практикуйтесь.", "Practice them.")}</span>
            </h1>
            <p className="text-[16px] leading-[26px] text-[#64748b] max-w-2xl mb-8">
              {t("Реалистичные переговоры с AI-персонажами. Выбирайте стратегию, ведите диалог, принимайте решения под давлением и получайте персональный разбор каждого раунда.",
                "Realistic negotiations with AI characters. Choose strategy, lead the dialogue, decide under pressure — and get a personal debrief of every round.")}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-8">
              <button onClick={go} data-testid="hero-start" className="w-full sm:w-auto h-11 px-6 rounded-full bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[13px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
                {t("Начать первую симуляцию", "Start your first simulation")}<Icon name="bolt" />
              </button>
              <a href="#scenarios" data-testid="hero-explore" className="w-full sm:w-auto h-11 px-6 rounded-full bg-white hover:bg-[#f5f4ef] text-[#1e293b] border border-[#94a3b8]/50 text-[13px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm">
                {t("Посмотреть сценарии", "Explore scenarios")}<Icon name="explore" className="text-[#64748b]" />
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#64748b]">
              {[["verified", "Harvard Method"], ["chat_bubble", t("SPIN-вопросы", "SPIN questions")], ["tune", t("BATNA и давление", "BATNA & pressure")], ["inventory_2", t("12+ реальных кейсов", "12+ real cases")]].map(([ic, label], i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-md bg-white border border-[#e5e3dc]/70 flex items-center gap-1.5 shadow-sm font-semibold">
                    <Icon name={ic} className="!text-xs text-[#4f46e5]" />{label}
                  </span>
                  {i < 3 && <span className="text-[#e5e3dc]">•</span>}
                </div>
              ))}
            </div>
          </div>

          {/* HERO MOCKUP */}
          <div className="mt-12 max-w-5xl mx-auto rounded-2xl border border-[#e5e3dc] bg-white shadow-sm overflow-hidden" id="simulation-stage">
            <div className="bg-[#f5f4ef] px-4 py-3 border-b border-[#e5e3dc]/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]/40"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]/40"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]/40"></span>
                </div>
                <span className="font-mono text-[13px] text-[#1e293b] font-medium flex items-center gap-2">
                  <Icon name="record_voice_over" className="!text-sm text-[#4f46e5]" />
                  {t("СИМУЛЯЦИЯ: Повышение стоимости контракта", "SIMULATION: Contract price increase")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-[#ccfbf1] text-[#134e4a] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488]"></span>{t("В процессе", "In progress")}
                </span>
                <span className="font-mono text-[13px] text-[#64748b]">{t("Раунд 3 из 10", "Round 3 of 10")}</span>
              </div>
            </div>
            {/* metrics ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#e5e3dc]/40 bg-[#faf9f6] text-[13px] divide-x divide-[#e5e3dc]/40">
              {[[t("УРОВЕНЬ ДАВЛЕНИЯ", "PRESSURE"), <span key="p" className="px-2 py-0.5 rounded bg-[#fee2e2] text-[#991b1b] text-[11px] font-semibold">{t("Высокий", "High")}</span>],
                [t("ИНДЕКС ДОВЕРИЯ", "TRUST INDEX"), <span key="t" className="font-mono font-semibold text-[#4f46e5]">68%</span>],
                [t("ТЕМП РЕЧИ", "SPEECH TEMPO"), <span key="s" className="text-[#1e293b] font-mono font-medium">{t("132 сл/мин", "132 wpm")}</span>],
                [t("ВРЕМЯ СЕССИИ", "SESSION TIME"), <span key="tm" className="font-mono font-bold text-[#1e293b]">08:42</span>]].map(([l, v], i) => (
                <div key={i} className="p-3 flex items-center justify-between">
                  <span className="text-[#64748b] text-[11px]">{l}</span>{v}
                </div>
              ))}
            </div>
            {/* transcript */}
            <div className="p-4 md:p-8 space-y-4 bg-[#f7f6f2]">
              <div className="flex items-start gap-3 max-w-2xl">
                <div className="w-9 h-9 rounded-xl bg-[#ebe9e1] border border-[#e5e3dc]/70 flex-shrink-0 flex items-center justify-center font-bold text-[#1e293b] text-sm">{t("МВ", "MV")}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold text-[#1e293b]">{t("Мария Васильева", "Maria Vasilieva")}</span>
                    <span className="px-2 py-0.5 rounded bg-[#e5e3dc] text-[#57534e] text-[11px]">{t("Директор по закупкам (Vendor)", "Procurement Director (Vendor)")}</span>
                  </div>
                  <div className="relative bg-white border border-[#e5e3dc]/70 rounded-xl p-3.5 shadow-sm border-l-4 border-l-amber-500">
                    <p className="text-[14px] leading-relaxed text-[#1e293b]">{t("«Мы пересмотрели условия договора в связи с обновлением серверной архитектуры. Минимальное повышение базовой ставки, которое мы готовы предметно рассмотреть, — ", "\"We've revised the contract terms due to a server architecture upgrade. The minimum base-rate increase we're willing to seriously consider is ")}<strong className="font-semibold">15%</strong>{t("».", ".\"")}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start justify-end gap-3 max-w-2xl ml-auto">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-[#e0e7ff] text-[#1e1b4b] text-[11px] font-medium">{t("Harvard • Зондирование", "Harvard • Probing")}</span>
                    <span className="text-[13px] font-semibold text-[#1e293b]">{t("Вы (Lead Negotiator)", "You (Lead Negotiator)")}</span>
                  </div>
                  <div className="bg-[#f5f4ef] border border-[#6366f1]/30 rounded-xl p-3.5 shadow-sm text-left">
                    <p className="text-[14px] leading-relaxed text-[#1e293b]">{t("«Что именно привело к такому увеличению при текущем гарантированном объеме поставок? Мы рассчитывали на сохранение условий при продлении.»", "\"What exactly drove this increase given our current guaranteed volume? We expected the terms to hold on renewal.\"")}</p>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#6366f1] text-white flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-sm">{t("ВЫ", "YOU")}</div>
              </div>
              <div className="flex items-start gap-3 max-w-2xl">
                <div className="w-9 h-9 rounded-xl bg-[#ebe9e1] border border-[#e5e3dc]/70 flex-shrink-0 flex items-center justify-center font-bold text-[#1e293b] text-sm">{t("МВ", "MV")}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold text-[#1e293b]">{t("Мария Васильева", "Maria Vasilieva")}</span>
                    <span className="text-[#64748b] text-[11px]">{t("только что", "just now")}</span>
                  </div>
                  <div className="relative bg-white border border-[#e5e3dc]/70 rounded-xl p-3.5 shadow-sm border-l-4 border-l-[#6366f1]">
                    <p className="text-[14px] leading-relaxed text-[#1e293b]">{t("«Основная причина — рост стоимости трансграничной логистики и круглосуточной техподдержки Tier-3. Однако при условии ", "\"The main reason is rising cross-border logistics and 24/7 Tier-3 support. However, if you ")}<span className="bg-[#e0e7ff]/70 px-1 rounded font-medium">{t("фиксации объёма сразу на 2 года", "lock volume for 2 years")}</span>{t(" мы открыты к пересмотру ставки.»", " we're open to revisiting the rate.\"")}</p>
                  </div>
                </div>
              </div>
              {/* tactical clue */}
              <div className="p-3 rounded-xl bg-[#f5f4ef] border border-[#4f46e5]/20 flex items-center justify-between gap-3 text-[13px] text-[#4f46e5]">
                <div className="flex items-center gap-2.5">
                  <Icon name="lightbulb" className="!text-base text-[#4f46e5]" fill />
                  <span className="font-medium text-[13px] text-[#1e293b]">{t("Выявлен скрытый интерес: срок контракта важнее базовой ставки (", "Hidden interest found: contract term matters more than base rate (")}<strong className="text-[#4f46e5] font-semibold">{t("+8 к силе позиции", "+8 to position strength")}</strong>)</span>
                </div>
                <span className="text-[11px] bg-[#4f46e5] text-white px-2.5 py-0.5 rounded font-mono">SPIN PASS</span>
              </div>
              {/* goal bar */}
              <div className="bg-white p-3.5 rounded-xl border border-[#e5e3dc]/60 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748b]">{t("Ваша цель: ", "Your goal: ")}<strong className="text-[#1e293b] font-semibold">≤ 7%</strong></span>
                  <span className="text-[#4f46e5] font-semibold">{t("Консенсус сейчас: ~10%", "Consensus now: ~10%")}</span>
                  <span className="text-[#64748b]">{t("Оппонент: ", "Counterpart: ")}<strong className="text-[#1e293b] font-semibold">15%</strong></span>
                </div>
                <div className="w-full bg-[#f0eee7] h-2.5 rounded-full overflow-hidden relative">
                  <div className="absolute left-0 top-0 bottom-0 bg-[#14b8a6] w-[45%] rounded-full"></div>
                  <div className="absolute left-[45%] top-0 bottom-0 bg-[#6366f1] w-[15%]"></div>
                </div>
              </div>
              {/* input bar */}
              <div className="p-2 bg-white rounded-xl border border-[#e5e3dc] shadow-sm flex items-center gap-2">
                <button onClick={go} className="h-9 px-3 rounded-lg border border-[#e5e3dc]/60 hover:bg-[#f0eee7] flex items-center gap-1.5 text-[#64748b] text-[11px] font-semibold transition-colors">
                  <Icon name="mic" className="!text-base" />{t("Голос", "Voice")}
                </button>
                <input readOnly className="flex-1 bg-transparent border-0 text-[#1e293b] text-[13px] focus:ring-0 cursor-default truncate outline-none" value={t("«Если мы фиксируем 24 месяца, готовы ли вы зафиксировать повышение на уровне 6.5% с отсрочкой первого платежа?»", "\"If we lock 24 months, will you fix the increase at 6.5% with a deferred first payment?\"")} />
                <button onClick={go} className="h-9 px-4 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[13px] font-semibold flex items-center gap-1 transition-colors shadow-sm">
                  {t("Отправить", "Send")}<Icon name="send" className="!text-sm" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 2. PROBLEM ============ */}
        <section className="py-12 bg-white border-y border-[#e5e3dc]/60">
          <div className="max-w-7xl mx-auto px-4 md:px-10">
            <div className="max-w-3xl mb-8">
              <span className={eyebrow}>{t("РЕАЛЬНОСТЬ РЫНКА", "MARKET REALITY")}</span>
              <h2 className={h2cls}>{t("Переговоры нельзя научиться вести только по учебнику.", "You can't learn to negotiate from a textbook alone.")}</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-between gap-4">
                {[["01", t("Теория ≠ практика", "Theory ≠ practice"), t("Чтение бестселлеров не перепрограммирует ваши физиологические реакции и стресс, когда реальный оппонент начинает открыто давить или блокировать диалог.", "Reading bestsellers won't reprogram your physiological reactions and stress when a real counterpart starts pushing openly or blocking the dialogue.")],
                  ["02", t("Ошибки стоят дорого", "Mistakes are costly"), t("Реальные коммерческие сделки, раунды финансирования и разговоры о бюджете с Советом директоров — неподходящее место для рискованных экспериментов.", "Real commercial deals, funding rounds, and budget talks with the Board are no place for risky experiments.")],
                  ["03", t("Обратная связь субъективна", "Feedback is subjective"), t("Коллеги и контрагенты редко скажут правду о ваших скрытых уступках, слабой аргументации или преждевременно раскрытой точке выхода (BATNA).", "Colleagues and counterparts rarely tell the truth about your hidden concessions, weak arguments, or a prematurely revealed BATNA.")]].map(([n, ti, d]) => (
                  <div key={n} className="p-6 rounded-xl border border-[#e5e3dc]/70 bg-[#f7f6f2] hover:border-[#94a3b8] transition-colors shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-[#ebe9e1] flex items-center justify-center font-mono text-[#1e293b] font-bold mb-4">{n}</div>
                    <h3 className="text-[18px] font-semibold text-[#1e293b] mb-2">{ti}</h3>
                    <p className="text-[14px] text-[#64748b] leading-relaxed">{d}</p>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-[#e5e3dc] shadow-sm bg-[#ebe9e1] min-h-[380px] lg:min-h-full flex flex-col justify-end group">
                <img alt={t("Руководитель готовится к переговорам", "Executive preparing for negotiation")} className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]" src={IMG.executive} data-testid="landing-img-executive" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/30 to-transparent"></div>
                <div className="relative z-10 p-4 self-start">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#e5e3dc]/50 text-[#1e293b] text-[11px] font-semibold shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]"></span>{t("Реальный сценарий", "Real scenario")}
                  </span>
                </div>
                <div className="relative z-10 p-6 text-white mt-auto">
                  <div className="inline-flex items-center gap-2 mb-2 text-[#c7d2fe] text-[11px] font-medium tracking-wide">
                    <Icon name="analytics" className="!text-xs" />{t("Кейс #04 • Executive Track", "Case #04 • Executive Track")}
                  </div>
                  <h4 className="text-[18px] font-semibold text-white mb-2 leading-snug">{t("Подготовка к Совету директоров", "Preparing for the Board")}</h4>
                  <p className="text-[13px] text-stone-200 leading-relaxed">{t("«В реальных переговорах нет паузы, чтобы подумать 10 минут. Вы либо отточили аргументы заранее, либо соглашаетесь на чужие условия.»", "\"Real negotiations have no 10-minute pause to think. Either you sharpened your arguments in advance, or you accept someone else's terms.\"")}</p>
                  <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-stone-300">
                    <span>{t("Уровень ставок: ", "Stakes: ")}<strong className="text-white">Enterprise</strong></span>
                    <span className="font-mono">BATNA Required</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#f5f4ef] border border-[#e5e3dc]/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#6366f1] text-white flex items-center justify-center flex-shrink-0 shadow-sm"><Icon name="shield" className="!text-sm" /></span>
                <span className="text-[14px] text-[#1e293b] font-medium">{t("NEGOTIA создаёт безопасное пространство для неограниченной практики с объективным алгоритмическим аудитом каждого раунда.", "NEGOTIA creates a safe space for unlimited practice with an objective algorithmic audit of every round.")}</span>
              </div>
              <span className="text-[11px] text-[#4f46e5] font-semibold uppercase tracking-wider whitespace-nowrap">Zero-Risk Environment</span>
            </div>
          </div>
        </section>

        {/* ============ 3. HOW IT WORKS ============ */}
        <section className="py-16 max-w-7xl mx-auto px-4 md:px-10" id="how-it-works">
          <div className="max-w-3xl mb-12">
            <span className={eyebrow}>{t("АРХИТЕКТУРА ТРЕНИРОВКИ", "TRAINING ARCHITECTURE")}</span>
            <h2 className={h2cls}>{t("Четыре шага до следующей реальной переговорной ситуации", "Four steps to your next real negotiation")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[["01", "folder_open", t("Выберите", "Choose"), t("Сценарий из структурированного каталога деловых ситуаций: закупки, пересмотр оклада, удержание ключевого клиента или кризисный аудит.", "A scenario from a structured catalog of business situations: procurement, salary review, key-client retention, or crisis audit."), t("12+ базовых контекстов", "12+ base contexts")],
              ["02", "assignment", t("Подготовьтесь", "Prepare"), t("Зафиксируйте целевой результат, порог выхода из сделки, переговорный коридор (ZOPA) и наилучшую альтернативу (BATNA).", "Fix your target outcome, walk-away threshold, negotiation range (ZOPA), and best alternative (BATNA)."), t("Интерактивный бриф", "Interactive brief")],
              ["03", "forum", t("Переговорите", "Negotiate"), t("Ведите встречу голосом или текстом против автономной AI-модели, реагирующей на давление, эмоции и структуру ваших аргументов.", "Run the meeting by voice or text against an autonomous AI model that reacts to pressure, emotion, and the structure of your arguments."), "Live Cognitive Flow"],
              ["04", "insights", t("Разберите", "Debrief"), t("Получите объективный скоркарт компетенций, радар переговорного профиля и детальный аудит ключевых поворотных фраз встречи.", "Get an objective competency scorecard, a negotiation-profile radar, and a detailed audit of the key turning-point lines."), t("Метрики Гарварда и SPIN", "Harvard & SPIN metrics")]].map(([n, ic, ti, d, foot]) => (
              <div key={n} className="p-4 rounded-xl border border-[#e5e3dc]/70 bg-white flex flex-col justify-between h-full shadow-sm hover:border-[#94a3b8] transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[18px] font-bold text-[#4f46e5]">{n}</span>
                    <Icon name={ic} className="text-[#64748b]" />
                  </div>
                  <h3 className="text-[18px] font-semibold text-[#1e293b] mb-2">{ti}</h3>
                  <p className="text-[13px] text-[#64748b] leading-relaxed">{d}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#e5e3dc]/40 text-[11px] text-[#64748b]">{foot}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ 4. MULTI-PARTY ============ */}
        <section className="py-12 bg-[#f5f4ef] border-y border-[#e5e3dc]/60">
          <div className="max-w-7xl mx-auto px-4 md:px-10">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <span className={eyebrow}>{t("СЛОЖНЫЕ КОНФИГУРАЦИИ", "COMPLEX CONFIGURATIONS")}</span>
              <h2 className={h2cls}>{t("Каждое решение меняет ход переговоров", "Every decision changes the negotiation")}</h2>
              <p className="text-[16px] leading-[26px] text-[#64748b] mt-2">{t("Реальные переговоры редко бывают один на один. Встречайтесь с несколькими AI-участниками со взаимоисключающими интересами.", "Real negotiations are rarely one-on-one. Face multiple AI participants with mutually exclusive interests.")}</p>
            </div>
            <div className="bg-white border border-[#e5e3dc] rounded-2xl shadow-sm max-w-5xl mx-auto overflow-hidden">
              <div className="relative w-full h-56 sm:h-72 overflow-hidden border-b border-[#e5e3dc]/60">
                <img alt={t("Переговоры в зале заседаний", "Boardroom negotiation")} className="w-full h-full object-cover object-center" src={IMG.boardroom} data-testid="landing-img-boardroom" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/85 via-stone-900/30 to-transparent"></div>
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#e5e3dc]/50 text-[#1e293b] text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse"></span>{t("Высокие ставки • Многосторонний раунд", "High stakes • Multi-party round")}
                  </span>
                  <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-stone-900/60 backdrop-blur-md text-white font-mono text-xs">Simulation Room #3B</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="groups" className="!text-base text-[#c7d2fe]" />
                    <span className="text-[18px] text-white font-semibold">{t("Комитет по закупке корпоративного ПО", "Enterprise software procurement committee")}</span>
                  </div>
                  <p className="text-[13px] text-stone-200 max-w-2xl">{t("Три противоположных взгляда на бюджет, SLA и условия перехода. Конфликт интересов между стейкхолдерами.", "Three opposing views on budget, SLA, and migration terms. A conflict of interest between stakeholders.")}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[["CFO " + t("(Финансы)", "(Finance)"), <span key="1" className="px-2 py-0.5 rounded bg-[#fee2e2] text-[#991b1b] text-[11px] font-medium">{t("Жесткая позиция", "Hard stance")}</span>, t("«Я не готов увеличивать общий годовой IT-бюджет ни на рубль.»", "\"I won't increase the annual IT budget by a single dollar.\""), t("Скрытый интерес: квартальный бонус за кост-оптимизацию", "Hidden interest: quarterly cost-optimization bonus")],
                    ["CTO " + t("(Технологии)", "(Technology)"), <span key="2" className="px-2 py-0.5 rounded bg-[#f1f0ea] text-[#475569] text-[11px] font-medium">{t("Умеренный риск", "Moderate risk")}</span>, t("«Смена текущего стека и поставщика остановит спринты минимум на 3 месяца.»", "\"Switching the current stack and vendor will halt sprints for at least 3 months.\""), t("Скрытый интерес: стабильность SLA и непрерывность релизов", "Hidden interest: SLA stability and release continuity")],
                    [t("Поставщик", "Vendor"), <span key="3" className="px-2 py-0.5 rounded bg-[#ebe9e1] text-[#4f46e5] text-[11px] font-medium">{t("Торг открыт", "Open to deal")}</span>, t("«Мы готовы дать гибкую ставку, если подпишемся на 24 месяца.»", "\"We can offer a flexible rate if we sign for 24 months.\""), t("Скрытый интерес: прогноз выручки (ARR) для раунда инвестиций", "Hidden interest: ARR forecast for the funding round")]].map(([title, badge, quote, interest], i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#faf9f6] border border-[#e5e3dc]/60 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] text-[#1e293b] font-semibold">{title}</span>{badge}
                      </div>
                      <p className="font-mono text-[13px] text-[#57534e] italic mb-2">{quote}</p>
                      <div className="text-[11px] text-[#64748b]">{interest}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-[#f5f4ef] rounded-lg border border-[#e5e3dc]/60 flex flex-wrap items-center justify-between gap-4 text-[13px]">
                  <div className="flex items-center gap-2">
                    <Icon name="speed" className="text-[#64748b]" /><span className="text-[#64748b] font-medium">{t("Индекс напряженности стола:", "Table tension index:")}</span>
                    <span className="font-mono font-bold text-[#1e293b]">{t("62/100 (Умеренный)", "62/100 (Moderate)")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="handshake" className="text-[#0d9488]" /><span className="text-[#64748b] font-medium">{t("Баланс коалиции:", "Coalition balance:")}</span>
                    <span className="font-mono font-semibold text-[#0d9488]">{t("Вы + CTO против CFO", "You + CTO vs CFO")}</span>
                  </div>
                  <span className="text-[11px] text-[#4f46e5] font-semibold">{t("Потенциал сделки: 84%", "Deal potential: 84%")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 5. DIFFERENTIATION ============ */}
        <section className="py-16 max-w-7xl mx-auto px-4 md:px-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className={eyebrow}>{t("ТЕХНОЛОГИЧЕСКИЙ РАЗРЫВ", "THE TECHNOLOGY GAP")}</span>
            <h2 className={h2cls}>{t("Это не просто AI-чат. Это симуляция.", "This isn't just an AI chat. It's a simulation.")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-xl border border-[#e5e3dc]/70 bg-white shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-[#e5e3dc]/40 mb-4">
                <Icon name="chat" className="text-[#64748b]" /><h3 className="text-[18px] font-semibold text-[#64748b]">{t("Обычный AI-чат", "Regular AI chat")}</h3>
              </div>
              <ul className="space-y-3 text-[14px] text-[#64748b]">
                {[t("Пассивно соглашается или моментально сдаёт позиции по первому требованию", "Passively agrees or instantly caves at the first demand"),
                  t("Нет скрытых мотивов, эмоций, внутренних сомнений и личной мотивации", "No hidden motives, emotions, inner doubts, or personal motivation"),
                  t("Уступки делаются мгновенно без встречных условий и фиксации цены", "Makes concessions instantly with no counter-conditions or price locks"),
                  t("Размытый абстрактный фидбек без методологических метрик и скоринга", "Vague, abstract feedback with no methodological metrics or scoring")].map((x, i) => (
                  <li key={i} className="flex items-start gap-2.5"><Icon name="close" className="!text-base text-[#dc2626] mt-0.5" /><span>{x}</span></li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-xl border-2 border-[#6366f1]/40 bg-[#f5f4ef] shadow-sm relative">
              <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-[#6366f1] text-white text-[11px] font-semibold shadow-sm">ENGINE CORE</span>
              <div className="flex items-center gap-2 pb-3 border-b border-[#4f46e5]/20 mb-4">
                <Icon name="psychology" className="text-[#4f46e5]" /><h3 className="text-[18px] font-semibold text-[#1e293b]">NEGOTIA Engine</h3>
              </div>
              <ul className="space-y-3 text-[14px] text-[#1e293b]">
                {[[t("Активное тактическое сопротивление:", "Active tactical resistance:"), t(" аргументирует, защищает интересы и тестирует ваши границы", " argues, defends interests, and tests your limits")],
                  [t("Динамическая модель стресса и доверия:", "Dynamic stress & trust model:"), t(" персонаж закрывается при давлении и открывается при взаимной выгоде", " the character closes under pressure and opens on mutual gain")],
                  [t("Скрытые мотивы и BATNA:", "Hidden motives & BATNA:"), t(" персонаж преследует внутренние цели компании и знает свою точку срыва", " the character pursues internal company goals and knows its walk-away point")],
                  [t("Строгий пост-анализ:", "Rigorous post-analysis:"), t(" аудит по Гарвардской модели принципиальных переговоров и фреймворку SPIN", " an audit against the Harvard principled-negotiation model and the SPIN framework")]].map(([b, x], i) => (
                  <li key={i} className="flex items-start gap-2.5"><Icon name="check_circle" className="!text-base text-[#0d9488] mt-0.5" /><span><strong>{b}</strong>{x}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ============ 6. FRAMEWORKS ============ */}
        <section className="py-12 bg-white border-y border-[#e5e3dc]/60" id="frameworks">
          <div className="max-w-7xl mx-auto px-4 md:px-10">
            <div className="max-w-3xl mb-8">
              <span className={eyebrow}>{t("БАЗОВЫЕ МЕТОДОЛОГИИ", "CORE FRAMEWORKS")}</span>
              <h2 className={h2cls}>{t("Выберите, чему хотите научиться", "Choose what you want to master")}</h2>
              <p className="text-[16px] leading-[26px] text-[#64748b] mt-2">{t("Тренируйте переговоры через проверенные мировые подходы — прямо во время реальной симуляции.", "Train negotiations through proven global approaches — right inside a real simulation.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[["school", t("ГАРВАРДСКАЯ МОДЕЛЬ", "HARVARD MODEL"), "Harvard Principled", t("Поиск взаимной выгоды, отделение людей от проблемы и фокус на истинных интересах сторон вместо жестких позиций.", "Seek mutual gain, separate people from the problem, and focus on true interests instead of rigid positions."), [t("Интересы", "Interests"), t("Варианты", "Options"), t("Критерии", "Criteria")], false],
                ["help", t("СПИН-ЗОНДИРОВАНИЕ", "SPIN PROBING"), "SPIN Technique", t("Последовательные ситуационные, проблемные, извлекающие и направляющие вопросы для выявления скрытых болей.", "Sequential situation, problem, implication, and need-payoff questions to surface hidden pains."), [t("Ситуация", "Situation"), t("Проблема", "Problem"), t("Последствия", "Implication")], false],
                ["balance", t("ТОЧКА ВЫХОДА", "WALK-AWAY POINT"), "BATNA Control", t("Оценка наилучшей альтернативы обсуждаемому соглашению, определение точки срыва и удержание баланса сил.", "Assess the best alternative to a negotiated agreement, define the walk-away point, and hold the balance of power."), [t("Альтернатива", "Alternative"), t("Сила", "Power"), t("Граница", "Boundary")], false],
                ["hub", t("ГИБРИДНЫЙ РЕЖИМ", "HYBRID MODE"), "Combined Strategic", t("Комплексный стресс-тест: гарвардский подход к взаимной ценности, глубинное зондирование SPIN и защита BATNA.", "A full stress test: the Harvard value approach, deep SPIN probing, and BATNA defense."), ["All-in-One Framework"], true]].map(([ic, cap, title, desc, tags, rec], i) => (
                <div key={i} className={`p-4 rounded-xl flex flex-col justify-between shadow-sm relative ${rec ? "border-2 border-[#6366f1]/40 bg-[#f5f4ef]" : "border border-[#e5e3dc]/70 bg-[#f7f6f2]"}`}>
                  {rec && <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-[#6366f1] text-white text-[11px] font-semibold shadow-sm">{t("Рекомендуемый", "Recommended")}</span>}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon name={ic} className="!text-base text-[#4f46e5]" /><span className="text-[11px] text-[#4f46e5] font-semibold">{cap}</span>
                    </div>
                    <h3 className="text-[18px] font-semibold text-[#1e293b] mb-2">{title}</h3>
                    <p className="text-[13px] text-[#64748b] mb-4 leading-relaxed">{desc}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#e5e3dc]/40">
                    {tags.map((tg, j) => (
                      <span key={j} className={rec ? "px-2.5 py-0.5 rounded bg-[#e0e7ff] text-[#1e1b4b] font-medium text-[11px]" : "px-2 py-0.5 rounded bg-[#f0eee7] text-[#57534e] text-[11px]"}>{tg}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ 7. MODES ============ */}
        <section className="py-16 max-w-7xl mx-auto px-4 md:px-10" id="modes">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className={eyebrow}>{t("ФОРМАТЫ ВЗАИМОДЕЙСТВИЯ", "INTERACTION FORMATS")}</span>
            <h2 className={h2cls}>{t("Выберите свой способ переговоров", "Choose how you negotiate")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-[#e5e3dc]/70 bg-white flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#ebe9e1] flex items-center justify-center text-[#4f46e5] mb-4"><Icon name="chat_bubble" /></div>
                <h3 className="text-[18px] font-semibold text-[#1e293b] mb-2">{t("Текстовый чат", "Text chat")}</h3>
                <p className="text-[14px] text-[#64748b] mb-4 leading-relaxed">{t("Вдумчивый диалог в реальном времени. Взвешивайте каждую формулировку, используйте заметки и тестируйте аргументы в спокойном темпе.", "A thoughtful real-time dialogue. Weigh every phrase, use notes, and test arguments at a calm pace.")}</p>
              </div>
              <div className="p-3 bg-[#faf9f6] rounded-lg border border-[#e5e3dc]/50 text-[11px] text-[#64748b]">{t("Идеально для: структурного анализа и первых шагов", "Ideal for: structured analysis and first steps")}</div>
            </div>
            <div className="p-6 rounded-xl border border-[#e5e3dc]/70 bg-white flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#ebe9e1] flex items-center justify-center text-[#4f46e5] mb-4"><Icon name="mic" /></div>
                <h3 className="text-[18px] font-semibold text-[#1e293b] mb-2">{t("Голосовой режим", "Voice mode")}</h3>
                <p className="text-[14px] text-[#64748b] mb-4 leading-relaxed">{t("Говорите в микрофон, тренируйте интонацию, уверенность, темп речи и способность парировать возражения без пауз.", "Speak into the mic and train your intonation, confidence, tempo, and ability to parry objections without pauses.")}</p>
                <div className="flex items-center justify-center gap-1.5 h-10 bg-[#f5f4ef] rounded-lg p-2 mb-4 border border-[#e5e3dc]/40">
                  {[0, 1, 2, 3, 4, 5, 6].map((b) => <span key={b} className="wave-bar w-1 bg-[#6366f1] rounded-full"></span>)}
                </div>
              </div>
              <div className="p-3 bg-[#faf9f6] rounded-lg border border-[#e5e3dc]/50 text-[11px] text-[#64748b]">{t("Идеально для: подготовки к зумам и живым встречам", "Ideal for: prepping for video calls and live meetings")}</div>
            </div>
            <div className="p-6 rounded-xl border border-[#e5e3dc]/70 bg-white flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#ebe9e1] flex items-center justify-center text-[#4f46e5] mb-4"><Icon name="alt_route" /></div>
                <h3 className="text-[18px] font-semibold text-[#1e293b] mb-2">{t("Challenge (Выбор ходов)", "Challenge (move choices)")}</h3>
                <p className="text-[14px] text-[#64748b] mb-4 leading-relaxed">{t("Выбирайте из 3–4 тактических вариантов ответа под тикающий таймер и сразу отслеживайте сдвиг переговорного баланса.", "Pick from 3–4 tactical responses under a ticking timer and instantly track the shift in negotiation balance.")}</p>
              </div>
              <div className="p-3 bg-[#faf9f6] rounded-lg border border-[#e5e3dc]/50 text-[11px] text-[#64748b]">{t("Идеально для: быстрой прокачки насмотренности", "Ideal for: quickly building pattern recognition")}</div>
            </div>
          </div>
        </section>

        {/* ============ 8. SCORECARD & DEBRIEF ============ */}
        <section className="py-16 bg-[#f5f4ef] border-y border-[#e5e3dc]/60">
          <div className="max-w-7xl mx-auto px-4 md:px-10">
            <div className="max-w-3xl mb-12">
              <span className={eyebrow}>{t("ПОСТ-АНАЛИТИКА СЕССИИ", "SESSION POST-ANALYTICS")}</span>
              <h2 className={h2cls}>{t("Вы узнаете не только, выиграли ли переговоры", "You learn more than whether you won")}</h2>
              <p className="text-[16px] leading-[26px] text-[#64748b] mt-2">{t("NEGOTIA анализирует, как именно вы вели диалог, где отдали инициативу и какие рычаги упустили.", "NEGOTIA analyzes exactly how you led the dialogue, where you gave up initiative, and which levers you missed.")}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
              <div className="lg:col-span-5 bg-white rounded-xl border border-[#e5e3dc]/70 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#e5e3dc]/40 mb-4">
                  <div>
                    <span className="text-[11px] text-[#64748b] uppercase">{t("ИТОГОВЫЙ БАЛЛ", "FINAL SCORE")}</span>
                    <div className="text-[32px] leading-[36px] font-bold text-[#4f46e5]">84<span className="text-[22px] text-[#64748b]">/100</span></div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#ccfbf1] text-[#134e4a] text-[13px] font-semibold">{t("Сделка закрыта", "Deal closed")}</span>
                </div>
                <div className="space-y-4">
                  {[[t("Качество вопросов", "Question quality"), 91, "#14b8a6"], [t("Активное слушание", "Active listening"), 84, "#6366f1"], [t("Стратегическая линия", "Strategic line"), 82, "#6366f1"], [t("Защита BATNA", "BATNA defense"), 88, "#14b8a6"], [t("Плотность аргументации", "Argument density"), 76, "#f59e0b"], [t("Контроль уступок", "Concession control"), 68, "#f59e0b"]].map(([k, v, c], i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[11px] mb-1"><span className="text-[#64748b]">{k}</span><span className="font-mono font-bold text-[#1e293b]">{v}%</span></div>
                      <div className="w-full bg-[#f0eee7] h-1.5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${v}%`, background: c }}></div></div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-3 border-t border-[#e5e3dc]/40 text-[13px] text-[#64748b]">{t("Условия: +6.8% базовой ставки при 2-летней фиксации (целевой диапазон достигнут).", "Terms: +6.8% base rate on a 2-year lock (target range achieved).")}</div>
              </div>
              <div className="lg:col-span-7 bg-white rounded-xl border border-[#e5e3dc]/70 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#e5e3dc]/40">
                  <span className="text-[18px] font-semibold text-[#1e293b]">{t("AI Debrief: Разбор диалога", "AI Debrief: dialogue breakdown")}</span>
                  <span className="font-mono text-[11px] text-[#64748b]">{t("Раунд 5 / Ключевой момент", "Round 5 / Key moment")}</span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#faf9f6] border border-[#e5e3dc]/50">
                  <div className="flex items-center gap-2 mb-1 text-[#0d9488] text-[13px] font-semibold"><Icon name="thumb_up" className="!text-sm" />{t("Что получилось хорошо", "What went well")}</div>
                  <p className="text-[13px] text-[#64748b]">{t("Вы успешно выявили реальный интерес оппонента (срок контракта) и сохранили конструктивный, спокойный тон диалога даже при попытке агрессивного торга.", "You successfully surfaced the counterpart's real interest (contract term) and kept a constructive, calm tone even under aggressive bargaining.")}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#faf9f6] border border-[#e5e3dc]/50">
                  <div className="flex items-center gap-2 mb-1 text-amber-600 text-[13px] font-semibold"><Icon name="warning" className="!text-sm" />{t("Что можно улучшить", "What could improve")}</div>
                  <p className="text-[13px] text-[#64748b]">{t("Вы сделали первичную уступку по цене до того, как запросили встречные условия по гарантиям SLA и схеме платежей.", "You made the first price concession before requesting counter-conditions on SLA guarantees and payment scheme.")}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#f5f4ef] border border-[#4f46e5]/20">
                  <div className="flex items-center gap-2 mb-1 text-[#4f46e5] text-[13px] font-semibold"><Icon name="near_me" className="!text-sm" />{t("Критический поворотный момент (Раунд 5)", "Critical turning point (Round 5)")}</div>
                  <p className="text-[13px] text-[#1e293b] mb-2">{t("В раунде 5 оппонент упомянул срок проекта — это была главная точка обмена ценностями, которую вы использовали лишь частично.", "In round 5 the counterpart mentioned the project term — the main value-exchange point you only partly used.")}</p>
                  <div className="p-2.5 rounded bg-white border border-[#e5e3dc]/60">
                    <span className="text-[11px] text-[#64748b] block mb-1">{t("Рекомендуемая альтернативная реплика:", "Recommended alternative line:")}</span>
                    <p className="font-mono text-[13px] text-[#1e293b] italic">{t("«Если мы увеличим срок контракта до 2 лет, какую встречную скидку на первый год обслуживания вы готовы зафиксировать?»", "\"If we extend the contract to 2 years, what counter-discount on the first service year will you commit to?\"")}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* editorial block */}
            <div className="mt-8 max-w-6xl mx-auto rounded-2xl overflow-hidden border border-[#e5e3dc]/70 bg-white shadow-sm flex flex-col md:flex-row items-stretch">
              <div className="md:w-1/2 relative min-h-[260px] md:min-h-[320px]">
                <img alt={t("Честный разбор переговоров", "Honest negotiation debrief")} className="absolute inset-0 w-full h-full object-cover object-center" src={IMG.debrief} data-testid="landing-img-debrief" />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-stone-900/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white md:hidden">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">1-on-1 Debrief</span>
                </div>
              </div>
              <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center bg-white">
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#e0e7ff] text-[#1e1b4b] text-[11px] font-semibold">{t("БЕЗ КОРПОРАТИВНОЙ ФАЛЬШИ", "NO CORPORATE FLUFF")}</span>
                </div>
                <h3 className="text-[22px] font-semibold text-[#1e293b] mb-2">{t("Разбор, который действительно меняет переговорный паттерн", "A debrief that actually changes your negotiation pattern")}</h3>
                <p className="text-[14px] text-[#64748b] mb-4 leading-relaxed">{t("В реальной жизни партнеры редко объяснят, почему сделка сорвалась. NEGOTIA беспристрастно подсвечивает каждый шаг: неоправданные скидки, упущенные рычаги влияния и моменты потери контроля над инициативой.", "In real life, partners rarely explain why a deal fell through. NEGOTIA impartially highlights every step: unjustified discounts, missed leverage, and moments you lost the initiative.")}</p>
                <div className="flex items-center gap-4 pt-3 border-t border-[#e5e3dc]/40 text-[11px] text-[#64748b]">
                  <span className="flex items-center gap-1"><Icon name="check_circle" className="!text-base text-[#4f46e5]" />{t("Объективные метрики", "Objective metrics")}</span>
                  <span className="flex items-center gap-1"><Icon name="psychology" className="!text-base text-[#4f46e5]" />{t("Когнитивные инсайты", "Cognitive insights")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 9. REPLAY + SCENARIOS ============ */}
        <section className="py-16 max-w-7xl mx-auto px-4 md:px-10" id="scenarios">
          <div className="mb-12 p-6 rounded-xl border border-[#e5e3dc]/70 bg-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="max-w-xl">
              <span className="text-[11px] text-[#4f46e5] uppercase font-semibold tracking-[0.04em]">REPLAY &amp; ITERATE</span>
              <h3 className="text-[28px] leading-[36px] font-bold text-[#1e293b] mt-1">{t("Попробуйте ещё раз. Но уже по-другому.", "Try again. But do it differently.")}</h3>
              <p className="text-[14px] text-[#64748b] mt-2 leading-relaxed">{t("Перезапустите сценарий с того же переломного раунда, проверьте другую переговорную тактику и сравните результаты в реальном времени.", "Restart the scenario from the same pivotal round, test a different tactic, and compare results in real time.")}</p>
            </div>
            <div className="flex items-center gap-3 bg-[#f5f4ef] p-3 rounded-xl border border-[#e5e3dc]/50">
              {[[t("Попытка 1", "Attempt 1"), 71, "#64748b"], [t("Попытка 2", "Attempt 2"), 84, "#4f46e5"], [t("Попытка 3", "Attempt 3"), 91, "#0d9488"]].map(([l, v, c], i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="text-center px-3">
                    <span className="text-[11px] text-[#64748b] block">{l}</span>
                    <span className="font-mono text-[18px] font-bold" style={{ color: c }}>{v}</span>
                  </div>
                  {i < 2 && <Icon name="arrow_forward" className="text-[#94a3b8]" />}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className={eyebrow}>{t("БИБЛИОТЕКА КЕЙСОВ", "CASE LIBRARY")}</span>
              <h2 className={h2cls}>{t("Реалистичные сценарии для любого контекста", "Realistic scenarios for any context")}</h2>
            </div>
            <button onClick={go} className="text-[13px] font-semibold text-[#4f46e5] hover:underline flex items-center gap-1">
              {t("Посмотреть все 12+ сценариев", "See all 12+ scenarios")}<Icon name="arrow_forward" className="!text-sm" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[[t("Карьера", "Career"), t("Средняя сложность", "Medium difficulty"), "#64748b", t("Повышение зарплаты", "Salary raise"), t("Защита своих результатов перед консервативным руководителем при строгих лимитах фонда оплаты труда.", "Defend your results before a conservative manager under strict payroll limits."), t("Оппонент: CPO", "Counterpart: CPO"), "8-12 " + t("мин", "min")],
              [t("Закупки", "Procurement"), t("Средняя сложность", "Medium difficulty"), "#64748b", t("Повышение цены поставщиком", "Vendor price increase"), t("Поставщик требует индексацию на 15%. Найдите встречные условия и удержите экономику контракта.", "The vendor demands a 15% increase. Find counter-conditions and protect the contract economics."), t("Оппонент: Head of Sales", "Counterpart: Head of Sales"), "10-15 " + t("мин", "min")],
              [t("Продажи", "Sales"), t("Высокая сложность", "High difficulty"), "#d97706", t("Скидка для ключевого клиента", "Key-client discount"), t("Enterprise-заказчик шантажирует уходом к конкуренту, требуя 30% скидки в конце финансового года.", "An enterprise client threatens to leave for a competitor, demanding a 30% discount at fiscal year-end."), t("Оппонент: Procurement VP", "Counterpart: Procurement VP"), "12-18 " + t("мин", "min")],
              [t("Управление", "Management"), t("Средняя сложность", "Medium difficulty"), "#64748b", t("Конфликт ресурсов в команде", "Team resource conflict"), t("Два лида претендуют на одного старшего инженера для параллельных критических релизов.", "Two leads claim the same senior engineer for parallel critical releases."), t("Оппонент: Team Lead", "Counterpart: Team Lead"), "10 " + t("мин", "min")],
              [t("Партнерство", "Partnership"), t("Высокая сложность", "High difficulty"), "#d97706", t("Стратегическое партнерство", "Strategic partnership"), t("Совместное предприятие (JV): согласование долей владения, интеллектуальной собственности и прав вето.", "A joint venture (JV): aligning ownership shares, IP, and veto rights."), t("Оппонент: Managing Director", "Counterpart: Managing Director"), "20 " + t("мин", "min")],
              [t("Кризис", "Crisis"), t("Экспертная сложность", "Expert difficulty"), "#dc2626", t("Спасение сорванного контракта", "Rescuing a broken contract"), t("Критический сбой в инфраструктуре привёл к убыткам клиента. Предотвратите судебный иск и расторжение.", "A critical infrastructure failure caused client losses. Prevent a lawsuit and termination."), t("Оппонент: Chief Legal Officer", "Counterpart: Chief Legal Officer"), "15-25 " + t("мин", "min")]].map(([cat, diff, dc, title, desc, opp, time], i) => (
              <div key={i} onClick={go} className="p-4 rounded-xl border border-[#e5e3dc]/70 bg-white hover:border-[#6366f1] transition-all hover:shadow-sm flex flex-col justify-between cursor-pointer" data-testid={`scenario-card-${i}`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded bg-[#f0eee7] text-[#57534e] text-[11px] font-medium">{cat}</span>
                    <span className="text-[11px] font-semibold" style={{ color: dc }}>{diff}</span>
                  </div>
                  <h3 className="text-[18px] font-semibold text-[#1e293b] mb-2">{title}</h3>
                  <p className="text-[13px] text-[#64748b] leading-relaxed">{desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#e5e3dc]/40 flex items-center justify-between text-[11px] text-[#64748b]">
                  <span>{opp}</span><span className="text-[#4f46e5] font-medium">{time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ 10. PROFILE PREVIEW ============ */}
        <section className="py-12 bg-white border-y border-[#e5e3dc]/60">
          <div className="max-w-7xl mx-auto px-4 md:px-10">
            <div className="p-6 rounded-xl bg-[#f5f4ef] border border-[#e5e3dc]/60 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="max-w-xl">
                <span className="text-[11px] text-[#4f46e5] uppercase font-semibold tracking-[0.04em]">{t("ПЕРСОНАЛЬНЫЙ ПРОФИЛЬ НАВЫКОВ", "PERSONAL SKILL PROFILE")}</span>
                <h3 className="text-[28px] leading-[36px] font-bold text-[#1e293b] mt-1">{t("Ваш стиль переговоров становится виден со временем", "Your negotiation style becomes visible over time")}</h3>
                <p className="text-[14px] text-[#64748b] mt-2 leading-relaxed">{t("Система отслеживает динамику уступок, скорость реакции на психологическое давление и типичные ошибки в десятках сессий.", "The system tracks concession dynamics, reaction speed under psychological pressure, and typical mistakes across dozens of sessions.")}</p>
                <div className="flex items-center gap-6 mt-4">
                  {[[t("СИМУЛЯЦИЙ", "SIMULATIONS"), "12", "#1e293b"], [t("СРЕДНИЙ БАЛЛ", "AVG SCORE"), "78", "#4f46e5"], [t("ЛУЧШИЙ РЕЗУЛЬТАТ", "BEST SCORE"), "94", "#0d9488"]].map(([l, v, c], i) => (
                    <div key={i} className="flex items-center gap-6">
                      <div>
                        <span className="text-[11px] text-[#64748b] block">{l}</span>
                        <span className="font-mono text-[22px] font-bold" style={{ color: c }}>{v}</span>
                      </div>
                      {i < 2 && <div className="w-px h-8 bg-[#e5e3dc]/60"></div>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full lg:w-96 p-4 bg-white rounded-xl border border-[#e5e3dc]/70 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-[#4f46e5]">
                  <Icon name="recommend" className="!text-sm" fill /><span className="text-[11px] font-semibold">{t("РЕКОМЕНДОВАННЫЙ ФОКУС", "RECOMMENDED FOCUS")}</span>
                </div>
                <h4 className="text-[18px] font-semibold text-[#1e293b] mb-1">{t("Работа с психологическим давлением", "Handling psychological pressure")}</h4>
                <p className="text-[13px] text-[#64748b] mb-3">{t("В последних 3 раундах вы отдавали до 60% коридора при прямом эмоциональном нажиме оппонента.", "In the last 3 rounds you gave up to 60% of the range under the counterpart's direct emotional pressure.")}</p>
                <div className="p-2.5 bg-[#f5f4ef] rounded border border-[#e5e3dc]/50 text-[13px] text-[#1e293b] font-medium mb-3">{t("Рекомендуемый кейс: «Жёсткие переговоры с монополистом»", "Recommended case: \"Hard negotiation with a monopolist\"")}</div>
                <button onClick={go} className="w-full h-9 rounded bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm">
                  {t("Запустить тренировку", "Start training")}<Icon name="play_arrow" className="!text-xs" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 11. FINAL CTA ============ */}
        <section className="py-16 max-w-7xl mx-auto px-4 md:px-10 text-center">
          <div className="max-w-4xl mx-auto bg-white border border-[#e5e3dc]/80 rounded-2xl p-8 md:p-16 shadow-sm">
            <span className="text-[11px] text-[#4f46e5] uppercase font-semibold tracking-[0.04em]">{t("ГОТОВЫ К ПРАКТИКЕ?", "READY TO PRACTICE?")}</span>
            <h2 className="text-[28px] leading-[36px] md:text-[40px] md:leading-[48px] font-bold text-[#1e293b] tracking-tight mt-2 mb-4">{t("Следующие переговоры могут стать вашей тренировкой", "Your next negotiation can be your training ground")}</h2>
            <p className="text-[16px] leading-[26px] text-[#64748b] max-w-2xl mx-auto mb-8">{t("Проверьте свои навыки и стратегию в безопасной симуляции до того, как выйти на реальную встречу с ключевым клиентом или инвестором.", "Test your skills and strategy in a safe simulation before you step into a real meeting with a key client or investor.")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={go} data-testid="cta-final" className="w-full sm:w-auto h-11 px-8 rounded-full bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
                {t("Начать первую симуляцию", "Start your first simulation")}<Icon name="arrow_forward" className="!text-sm" />
              </button>
              <a href="#scenarios" className="w-full sm:w-auto h-11 px-8 rounded-full bg-white hover:bg-[#f0eee7] text-[#1e293b] border border-[#94a3b8]/50 text-[13px] font-semibold transition-colors flex items-center justify-center shadow-sm">
                {t("Посмотреть сценарии", "Explore scenarios")}
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-[#e5e3dc]/70 bg-white">
        <div className="w-full py-8 px-4 md:px-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
            <span className="text-[22px] font-bold text-[#1e293b] flex items-center gap-2">NEGOTIA</span>
            <p className="text-[13px] text-[#64748b] max-w-md">{t("© 2026 NEGOTIA Inc. Все права защищены. Платформа симуляции когнитивных и стратегических переговоров.", "© 2026 NEGOTIA Inc. All rights reserved. A cognitive and strategic negotiation simulation platform.")}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            {[t("Конфиденциальность", "Privacy"), t("Условия использования", "Terms of use"), t("Методология", "Methodology"), t("Безопасность данных", "Data security"), t("Служба поддержки", "Support")].map((l, i) => (
              <a key={i} href="#frameworks" className="text-[#64748b] hover:text-[#1e293b] transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

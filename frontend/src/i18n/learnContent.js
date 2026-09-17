// Static bilingual learning content — no LLM, zero token cost.
export const LEARN = {
  ru: {
    title: "Учебные материалы",
    subtitle: "Базовые концепции методологий, которые вы отрабатываете в симуляциях.",
    sections: { essence: "Суть", concepts: "Ключевые концепции", rules: "Как оценивается", tip: "Совет" },
    frameworks: [
      {
        id: "harvard", name: "Гарвардская модель", tag: "Принципиальные переговоры",
        essence: "Ищите решение, выгодное обеим сторонам: отделяйте людей от проблемы и договаривайтесь об интересах, а не о позициях.",
        concepts: [
          "Отделяйте людей от проблемы — эмоции отдельно, суть отдельно.",
          "Фокус на интересах (зачем), а не на позициях (что требуют).",
          "Генерируйте варианты взаимной выгоды, расширяя «пирог».",
          "Опирайтесь на объективные критерии: рынок, стандарты, прецеденты.",
        ],
        rules: [
          "Люди vs Проблема — сохраняли ли вы конструктивный тон под давлением.",
          "Интересы vs Позиции — выявляли ли реальные интересы оппонента.",
          "Варианты взаимной выгоды — предлагали ли обмены и творческие опции.",
          "Объективные критерии — обосновывали ли требования данными.",
        ],
        tip: "Прежде чем спорить о цифре, спросите «почему это важно для вас?».",
      },
      {
        id: "spin", name: "SPIN", tag: "Выявление потребностей",
        essence: "Ведите оппонента вопросами: от фактов к боли, от боли к её последствиям и к ценности решения.",
        concepts: [
          "Situation (Ситуация) — факты о текущем положении.",
          "Problem (Проблема) — трудности, боли и недовольства.",
          "Implication (Последствия) — во что обходится проблема, если её не решать.",
          "Need-Payoff (Выгода) — ценность и отдача от решения.",
        ],
        rules: [
          "Ситуационные вопросы — минимум, только чтобы понять контекст.",
          "Проблемные вопросы — находили ли вы реальную боль.",
          "Вопросы о последствиях — усиливали ли срочность и цену бездействия.",
          "Вопросы о выгоде — переводили ли решение в ценность для оппонента.",
        ],
        tip: "Глубина вопросов важнее их количества: один сильный вопрос о последствиях ценнее пяти ситуационных.",
      },
      {
        id: "batna", name: "BATNA", tag: "Сила альтернатив",
        essence: "Ваша переговорная сила = качество вашей лучшей альтернативы. Знайте свою точку выхода и не отдавайте уступки без обмена.",
        concepts: [
          "BATNA — лучшая альтернатива соглашению, ваш «план Б».",
          "Резервная точка — граница, хуже которой сделка невыгодна.",
          "Рычаг — чем сильнее ваша альтернатива, тем увереннее позиция.",
          "Управление уступками — уступайте только в обмен на встречную ценность.",
        ],
        rules: [
          "Ясность BATNA — понимали ли вы свою альтернативу.",
          "Рычаг — использовали ли альтернативу для усиления позиции.",
          "Дисциплина резервной точки — не заходили ли за свою границу.",
          "Управление уступками — обменивали ли уступки, а не раздавали.",
        ],
        tip: "Никогда не делайте одностороннюю уступку — всегда просите что-то взамен.",
      },
    ],
  },
  en: {
    title: "Learning Materials",
    subtitle: "Core concepts of the methodologies you practice in the simulations.",
    sections: { essence: "Essence", concepts: "Key concepts", rules: "How it's scored", tip: "Tip" },
    frameworks: [
      {
        id: "harvard", name: "Harvard Method", tag: "Principled negotiation",
        essence: "Find a solution good for both sides: separate the people from the problem and bargain over interests, not positions.",
        concepts: [
          "Separate people from the problem — keep emotions apart from substance.",
          "Focus on interests (why) rather than positions (what they demand).",
          "Invent options for mutual gain to expand the pie.",
          "Rely on objective criteria: market rates, standards, precedents.",
        ],
        rules: [
          "People vs Problem — did you keep a constructive tone under pressure.",
          "Interests vs Positions — did you uncover the counterpart's real interests.",
          "Options for Mutual Gain — did you propose trades and creative options.",
          "Objective Criteria — did you justify demands with data.",
        ],
        tip: "Before arguing over a number, ask 'why does that matter to you?'.",
      },
      {
        id: "spin", name: "SPIN", tag: "Uncovering needs",
        essence: "Lead the counterpart with questions: from facts to pain, from pain to its implications, and to the value of a solution.",
        concepts: [
          "Situation — facts about the current state.",
          "Problem — difficulties, pains and dissatisfactions.",
          "Implication — what the problem costs if left unsolved.",
          "Need-Payoff — the value and return of solving it.",
        ],
        rules: [
          "Situation questions — keep minimal, just enough for context.",
          "Problem questions — did you find the real pain.",
          "Implication questions — did you raise urgency and cost of inaction.",
          "Need-Payoff questions — did you translate the solution into value.",
        ],
        tip: "Depth beats volume: one strong implication question is worth five situation ones.",
      },
      {
        id: "batna", name: "BATNA", tag: "Power of alternatives",
        essence: "Your negotiating power = the quality of your best alternative. Know your walk-away point and never concede without a trade.",
        concepts: [
          "BATNA — your Best Alternative To a Negotiated Agreement, your plan B.",
          "Reservation point — the line beyond which a deal isn't worth it.",
          "Leverage — the stronger your alternative, the firmer your stance.",
          "Concession management — concede only for reciprocal value.",
        ],
        rules: [
          "BATNA Clarity — did you understand your alternative.",
          "Leverage — did you use the alternative to strengthen your position.",
          "Reservation Discipline — did you avoid crossing your own line.",
          "Concession Management — did you trade concessions instead of giving them away.",
        ],
        tip: "Never make a one-sided concession — always ask for something in return.",
      },
    ],
  },
};

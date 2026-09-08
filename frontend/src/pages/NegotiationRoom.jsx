import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Send, Mic, MicOff, Handshake, DoorOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NegotiationRoom() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useI18n();
  const [neg, setNeg] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [choices, setChoices] = useState(null);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef(null);
  const recogRef = useRef(null);

  useEffect(() => {
    api.getNeg(id).then(n => {
      setNeg(n);
      api.scenario(n.scenario_slug).then(setScenario);
    });
  }, [id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [neg?.messages?.length]);

  const send = async (text) => {
    if (!text.trim() || sending) return;
    setSending(true); setInput(""); setChoices(null);
    try {
      const res = await api.sendMsg(id, text);
      setNeg(prev => ({ ...prev, messages: [...prev.messages, res.user_message, ...res.ai_replies], state: res.state }));
      if (res.choices) setChoices(res.choices);
      // TTS in voice mode
      if (neg?.mode === "voice" && "speechSynthesis" in window && res.ai_replies[0]) {
        const utter = new SpeechSynthesisUtterance(res.ai_replies[0].content);
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {
      toast.error("Something went wrong. Try again.");
    } finally { setSending(false); }
  };

  const toggleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition not supported in this browser"); return; }
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const recog = new SR();
    recog.lang = "en-US"; recog.interimResults = false;
    recog.onresult = (e) => { const text = e.results[0][0].transcript; setInput(prev => prev ? `${prev} ${text}` : text); };
    recog.onend = () => setListening(false);
    recog.start(); recogRef.current = recog; setListening(true);
  };

  const finish = async (action) => {
    setSending(true);
    try {
      const finalNeg = await api.endNeg(id, action);
      nav(`/debrief/${finalNeg.id}`);
    } finally { setSending(false); }
  };

  if (!neg || !scenario) return <AppShell><div className="text-slate-400 py-20 text-center">{t.common.loading}</div></AppShell>;

  const parts = scenario.participants.slice(0, neg.participants.length);

  return (
    <AppShell>
      <div className="grid lg:grid-cols-[280px_1fr] gap-6 h-[calc(100vh-140px)]">
        {/* LEFT PANEL */}
        <aside className="space-y-4 overflow-y-auto no-scrollbar">
          <div className="card-glow rounded-xl p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Participants</div>
            <div className="space-y-2">
              {parts.map(p => {
                const trust = neg.state.trust?.[p.name] ?? 50;
                const pressure = neg.state.pressure?.[p.name] ?? 30;
                return (
                  <div key={p.name} className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold">
                        {p.name.split(" ").map(x=>x[0]).join("")}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{p.role}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div><div className="text-slate-500">Trust</div><div className="font-mono text-emerald-400">{trust}</div></div>
                      <div><div className="text-slate-500">Pressure</div><div className="font-mono text-amber-400">{pressure}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card-glow rounded-xl p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">{t.room.goal}</div>
            <div className="text-sm text-slate-200">{scenario.objective}</div>
            <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
              <div><div className="text-slate-500">{t.room.currentDeal}</div><div className="font-mono text-sky-400">{neg.state.round}</div></div>
              <div><div className="text-slate-500">Mode</div><div className="font-mono uppercase">{neg.mode}</div></div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button data-testid="btn-make-deal" onClick={() => finish("make_deal")} disabled={sending}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 rounded-lg">
              <Handshake className="w-4 h-4 mr-2" />{t.room.makeDeal}
            </Button>
            <Button data-testid="btn-walk-away" onClick={() => finish("walk_away")} disabled={sending} variant="outline"
              className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5">
              <DoorOpen className="w-4 h-4 mr-2" />{t.room.walkAway}
            </Button>
          </div>
        </aside>

        {/* CONVERSATION */}
        <div className="flex flex-col card-glow rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-mono">NEGOTIATION</div>
              <div className="font-display font-semibold">{neg.scenario_title}</div>
            </div>
            <span className="chip chip-emerald pulse-dot">● Active</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {neg.messages.length === 0 && (
              <div className="text-center text-slate-500 py-12 text-sm">Make your opening move.</div>
            )}
            {neg.messages.map(m => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex gap-3 ${isUser?"flex-row-reverse":""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isUser?"bg-sky-500/20 text-sky-300":"bg-rose-500/20 text-rose-300"}`}>
                    {isUser?"YOU":(m.participant?.split(" ").map(x=>x[0]).join("") || "AI")}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl p-3 text-sm ${
                    isUser?"bg-sky-500/10 border border-sky-500/20 rounded-tr-sm":"bg-white/5 rounded-tl-sm"}`}>
                    {!isUser && m.participant && <div className="text-[10px] text-slate-500 mb-1 font-mono">{m.participant}</div>}
                    <div className="text-slate-100 whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="flex gap-3 items-center text-slate-500 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" /> {t.room.thinking}
              </div>
            )}
          </div>
          {/* INPUT */}
          <div className="border-t border-white/5 p-4">
            {neg.mode === "challenge" && choices ? (
              <div className="space-y-2">
                <div className="text-xs uppercase text-slate-500 mb-2">{t.room.pickChoice}</div>
                {choices.map((c, i) => (
                  <button key={i} data-testid={`choice-${i}`} onClick={() => send(c.text)}
                    className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{c.text}</span>
                      <span className={`chip ${c.quality==='strong'?'chip-emerald':c.quality==='acceptable'?'chip-sky':c.quality==='weak'?'chip-amber':'chip-rose'} shrink-0 ml-3`}>
                        {t.room.quality[c.quality] || c.quality}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                <Textarea data-testid="msg-input" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder={t.room.typeReply} rows={2}
                  className="bg-white/5 border-white/10 resize-none flex-1" />
                <div className="flex flex-col gap-2">
                  {neg.mode !== "challenge" && (
                    <Button data-testid="btn-mic" onClick={toggleMic} variant="outline"
                      className={`border-white/10 bg-transparent ${listening?"text-rose-400":"text-slate-300"} hover:bg-white/5 h-10 w-10 p-0`}>
                      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button data-testid="btn-send" onClick={() => send(input)} disabled={sending || !input.trim()}
                    className="btn-primary rounded-lg h-10 w-10 p-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

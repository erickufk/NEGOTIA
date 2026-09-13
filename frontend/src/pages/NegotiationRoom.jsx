import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useI18n } from "../i18n/I18nProvider";
import { api, API } from "../lib/api";
import { Textarea } from "../components/ui/textarea";
import { Send, Mic, MicOff, Handshake, DoorOpen, Loader2, Lightbulb, Target, TrendingUp, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

function TypingCaret() {
  return <span className="typing-caret" />;
}

export default function NegotiationRoom() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, lang } = useI18n();
  const [neg, setNeg] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [choices, setChoices] = useState(null);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [coaching, setCoaching] = useState(false);
  const [hint, setHint] = useState(null);
  const [streamingMap, setStreamingMap] = useState({}); // id -> partial text while streaming
  const [voiceOn, setVoiceOn] = useState(true);
  const scrollRef = useRef(null);
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const genderRef = useRef({});
  const L = t.labels;

  useEffect(() => {
    api.getNeg(id).then(n => {
      setNeg(n);
      api.scenario(n.scenario_slug, lang).then(s => {
        setScenario(s);
        genderRef.current = Object.fromEntries((s.participants || []).map(p => [p.name, p.gender || "female"]));
      });
      if (n.mode === "voice") setVoiceOn(true);
    });
  }, [id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [neg?.messages?.length, streamingMap]);

  useEffect(() => () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    try { if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") mediaRecRef.current.stop(); } catch {}
  }, []);

  const playTts = async (text, gender = null) => {
    if (!voiceOn) return;
    try {
      const audioUrl = await api.tts(text, lang, gender);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      const a = new Audio(audioUrl);
      audioRef.current = a;
      a.play().catch(() => {});
    } catch { /* silent */ }
  };

  const send = async (text) => {
    if (!text.trim() || sending) return;
    setSending(true); setInput(""); setChoices(null);

    try {
      const token = localStorage.getItem("negotia_token");
      const resp = await fetch(`${API}/negotiations/${id}/message-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ content: text }),
      });
      if (!resp.ok || !resp.body) throw new Error("stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let userAdded = false;
      const partial = {}; // msgId -> accumulated text
      const participantMap = {}; // msgId -> participant name
      let latestFullResponse = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let lines = buf.split("\n\n");
        buf = lines.pop() || "";
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          let evt;
          try { evt = JSON.parse(payload); } catch { continue; }
          if (evt.type === "user") {
            setNeg(p => p ? { ...p, messages: [...p.messages, evt.message] } : p);
            userAdded = true;
          } else if (evt.type === "ai_start") {
            partial[evt.message.id] = "";
            participantMap[evt.message.id] = evt.message.participant;
            setStreamingMap(m => ({ ...m, [evt.message.id]: "" }));
            setNeg(p => p ? { ...p, messages: [...p.messages, { ...evt.message, content: "" }] } : p);
          } else if (evt.type === "ai_chunk") {
            partial[evt.id] = (partial[evt.id] || "") + evt.chunk;
            setStreamingMap(m => ({ ...m, [evt.id]: partial[evt.id] }));
          } else if (evt.type === "ai_end") {
            const finalText = partial[evt.id];
            setNeg(p => p ? {
              ...p,
              messages: p.messages.map(mm => mm.id === evt.id ? { ...mm, content: finalText } : mm),
            } : p);
            setStreamingMap(m => { const c = { ...m }; delete c[evt.id]; return c; });
            if (voiceOn) playTts(finalText, genderRef.current[participantMap[evt.id]] || null);
          } else if (evt.type === "done") {
            latestFullResponse = evt;
            setNeg(p => p ? { ...p, state: evt.state } : p);
            if (evt.choices) setChoices(evt.choices);
          } else if (evt.type === "error") {
            toast.error(evt.message || "AI error");
          }
        }
      }
      if (coaching) {
        try { const h = await api.coachHint(id); setHint(h.hint); } catch {}
      }
    } catch (e) {
      toast.error("Something went wrong. Try again.");
    } finally { setSending(false); }
  };

  const toggleMic = async () => {
    if (listening) {
      mediaRecRef.current?.stop();
      setListening(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error(t.room.emptyRecording ? "Микрофон не поддерживается" : "Mic not supported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeCandidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
      const mimeType = mimeCandidates.find(m => MediaRecorder.isTypeSupported?.(m)) || "";
      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(tr => tr.stop());
        const blobType = rec.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        if (blob.size < 800) { toast.error(t.room.emptyRecording); return; }
        setTranscribing(true);
        try {
          const text = await api.transcribe(blob, lang);
          if (text && text.trim()) {
            if (neg.mode === "voice") { send(text.trim()); }
            else { setInput(prev => prev ? `${prev} ${text}` : text); }
          } else {
            toast.error(t.room.emptyRecording);
          }
        } catch {
          toast.error("Не удалось распознать речь");
        } finally { setTranscribing(false); }
      };
      rec.start();
      mediaRecRef.current = rec;
      setListening(true);
    } catch {
      toast.error("Нет доступа к микрофону");
    }
  };

  const finish = async (action) => {
    setSending(true);
    try {
      const finalNeg = await api.endNeg(id, action);
      nav(`/debrief/${finalNeg.id}`);
    } finally { setSending(false); }
  };

  if (!neg || !scenario) return <AppShell><div className="text-slate-500 py-20 text-center">{t.common.loading}</div></AppShell>;

  const parts = scenario.participants.slice(0, neg.participants.length);

  const trustColor = v => v >= 70 ? "text-emerald-600" : v >= 40 ? "text-[#4F46E5]" : "text-rose-600";
  const pressureColor = v => v >= 70 ? "text-rose-600" : v >= 40 ? "text-amber-600" : "text-emerald-600";

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-5">
        {/* LEFT: Participants + Actions */}
        <aside className="space-y-4">
          <div className="neo-raised p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-mono mb-3">{t.room.opponents}</div>
            <div className="space-y-3">
              {parts.map(p => {
                const trust = neg.state.trust?.[p.name] ?? 50;
                const pressure = neg.state.pressure?.[p.name] ?? 30;
                return (
                  <div key={p.name} className="p-3 rounded-xl neo-inset">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center text-[10px] font-bold">
                        {p.name.split(" ").map(x => x[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{p.role}</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between text-[10px] mb-0.5"><span className="text-slate-500">{t.room.trust}</span><span className={`font-mono font-semibold ${trustColor(trust)}`}>{trust}</span></div>
                        <div className="h-1.5 rounded-full neo-inset-deep overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${trust}%` }} /></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] mb-0.5"><span className="text-slate-500">{t.room.pressure}</span><span className={`font-mono font-semibold ${pressureColor(pressure)}`}>{pressure}</span></div>
                        <div className="h-1.5 rounded-full neo-inset-deep overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${pressure}%` }} /></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="neo-raised p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-mono mb-2 flex items-center gap-1.5"><Target className="w-3 h-3" />{t.room.goal}</div>
            <div className="text-xs text-[#1E293B] leading-relaxed">{scenario.objective}</div>
            <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-2 gap-2 text-[10px]">
              <div><div className="text-slate-500">{t.room.currentDeal}</div><div className="font-mono font-bold text-[#4F46E5] text-sm">{neg.state.round}</div></div>
              <div><div className="text-slate-500">{t.room.mode}</div><div className="font-mono font-bold uppercase text-sm">{neg.mode}</div></div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button data-testid="btn-make-deal" onClick={() => finish("make_deal")} disabled={sending}
              className="neo-raised-sm px-4 py-2.5 rounded-full text-xs font-semibold text-emerald-700 hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <Handshake className="w-4 h-4" />{t.room.makeDeal}
            </button>
            <button data-testid="btn-walk-away" onClick={() => finish("walk_away")} disabled={sending}
              className="neo-raised-sm px-4 py-2.5 rounded-full text-xs font-semibold text-slate-500 hover:text-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <DoorOpen className="w-4 h-4" />{t.room.walkAway}
            </button>
          </div>
        </aside>

        {/* CENTER: Conversation */}
        <div className="flex flex-col neo-raised overflow-hidden h-[calc(100vh-180px)] min-h-[520px]">
          <div className="px-6 py-4 flex items-center justify-between border-b border-black/5">
            <div>
              <div className="text-[10px] text-slate-500 font-mono tracking-wider">{t.room.negotiation} · {(neg.framework_name || "Combined").toUpperCase()}</div>
              <div className="font-display font-semibold text-base">{neg.scenario_title}</div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer neo-raised-sm px-3 py-1.5 rounded-full" data-testid="coach-toggle">
                <input type="checkbox" checked={coaching} onChange={e => setCoaching(e.target.checked)} className="accent-[#4F46E5]" />
                <Lightbulb className="w-3 h-3" />{t.room.coaching}
              </label>
              <button onClick={() => { setVoiceOn(v => !v); if (audioRef.current) audioRef.current.pause(); }}
                data-testid="btn-voice-toggle"
                className={`neo-raised-sm w-8 h-8 rounded-full flex items-center justify-center ${voiceOn ? "text-[#4F46E5]" : "text-slate-400"}`}>
                {voiceOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {coaching && hint && (
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-800 flex items-start gap-2" data-testid="coach-hint">
              <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />{hint}
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {neg.messages.length === 0 && (
              <div className="text-center text-slate-400 py-16 text-sm">{t.room.firstMove}</div>
            )}
            {neg.messages.map(m => {
              const isUser = m.role === "user";
              const streamingText = streamingMap[m.id];
              const isStreaming = streamingText !== undefined;
              const content = isStreaming ? streamingText : m.content;
              return (
                <div key={m.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isUser ? "neo-inset text-[#4F46E5]" : "neo-raised-sm text-[#7C3AED] bg-gradient-to-br from-[#4F46E5]/10 to-[#7C3AED]/10"}`}>
                    {isUser ? t.room.you : (m.participant?.split(" ").map(x => x[0]).join("") || "AI")}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                    isUser ? "neo-raised-sm border-l-2 border-[#4F46E5] text-[#1E293B]" : "neo-inset text-[#1E293B]"
                  }`}>
                    {!isUser && m.participant && <div className="text-[10px] text-slate-500 mb-1 font-mono">{m.participant}</div>}
                    <div className="whitespace-pre-wrap">
                      {content}
                      {isStreaming && <TypingCaret />}
                    </div>
                  </div>
                </div>
              );
            })}
            {sending && Object.keys(streamingMap).length === 0 && (
              <div className="flex gap-2 items-center text-slate-500 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />{t.room.thinking}
              </div>
            )}
          </div>

          {/* INPUT */}
          <div className="border-t border-black/5 p-4">
            {neg.mode === "challenge" && choices ? (
              <div className="space-y-2">
                <div className="text-xs uppercase text-slate-500 font-mono mb-2 tracking-wider">{t.room.pickChoice}</div>
                {choices.map((c, i) => (
                  <button key={i} data-testid={`choice-${i}`} onClick={() => send(c.text)}
                    className="w-full text-left p-3 rounded-xl neo-raised-sm neo-raised-hover transition-all">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-[#1E293B]">{c.text}</span>
                      <span className={`chip shrink-0 ${
                        c.quality === "strong" ? "chip-emerald" : c.quality === "acceptable" ? "chip-primary" : c.quality === "weak" ? "chip-amber" : "chip-rose"
                      }`}>
                        {t.room.quality[c.quality] || c.quality}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Textarea data-testid="msg-input" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                    placeholder={transcribing ? t.room.transcribing : t.room.typeReply} rows={2}
                    className="neo-inset border-0 text-sm text-[#1E293B] resize-none focus:ring-2 focus:ring-[#4F46E5]" />
                </div>
                <div className="flex flex-col gap-2">
                  {neg.mode !== "challenge" && (
                    <button data-testid="btn-mic" onClick={toggleMic}
                      className={`w-11 h-11 rounded-xl neo-raised-sm flex items-center justify-center transition-all ${
                        listening ? "text-rose-600 ring-2 ring-rose-500 animate-pulse" : transcribing ? "text-amber-600" : "text-slate-500 hover:text-[#4F46E5]"
                      }`}>
                      {transcribing ? <Loader2 className="w-4 h-4 animate-spin" /> : listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                  <button data-testid="btn-send" onClick={() => send(input)} disabled={sending || !input.trim()}
                    className="btn-primary w-11 h-11 rounded-xl flex items-center justify-center disabled:opacity-50">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Preparation + Live insights */}
        <aside className="space-y-4 hidden lg:block">
          <div className="neo-raised p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-mono mb-3 flex items-center gap-1.5"><TrendingUp className="w-3 h-3" />{t.room.preparation}</div>
            {["batna", "priorities", "ideal", "minimum"].filter(k => neg.preparation?.[k]).map(k => (
              <div key={k} className="mb-3">
                <div className="text-[10px] uppercase text-slate-500 font-mono tracking-wider mb-1">{t.wizard[k]}</div>
                <div className="text-xs text-[#1E293B] p-2.5 rounded-lg neo-inset">{neg.preparation[k]}</div>
              </div>
            ))}
            {!Object.values(neg.preparation || {}).some(v => v) && (
              <div className="text-xs text-slate-500">{t.room.prepEmpty}</div>
            )}
          </div>

          <div className="neo-raised p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-mono mb-3">{t.room.liveSignals}</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(neg.state.signals || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => (
                <div key={k} className="p-2 rounded-lg neo-inset">
                  <div className="text-[10px] text-slate-500 truncate">{L.signals[k] || k}</div>
                  <div className={`font-mono font-bold text-sm ${v > 0 ? "text-[#4F46E5]" : "text-slate-400"}`}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

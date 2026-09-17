import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Brain, ArrowLeft, Sparkles } from "lucide-react";
import { api } from "../lib/api";

export default function Auth() {
  const { t } = useI18n();
  const { login, register, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("signin"); // signin | signup | forgot
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [magicLink, setMagicLink] = useState(null);
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "signin") await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      toast.success(mode === "signin" ? "Welcome back!" : "Account created!");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication failed");
    }
  };

  const sendMagicLink = async (e) => {
    e.preventDefault();
    if (!form.email) return;
    setSending(true);
    setMagicLink(null);
    try {
      const data = await api.forgotPassword(form.email);
      if (data.magic_link) {
        setMagicLink(data.magic_link);
        toast.success(t.auth.linkSent);
      } else {
        // silent: user not found — still show generic success
        toast.success(t.auth.linkSent);
      }
    } catch { toast.error("Failed"); }
    finally { setSending(false); }
  };

  const inputCls = "neo-inset border-0 h-11 text-sm text-[#1E293B] focus:ring-2 focus:ring-[#4F46E5]";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#FAF9F6]">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 mb-8 justify-center" data-testid="auth-brand">
          <div className="w-10 h-10 rounded-xl neo-raised-sm flex items-center justify-center text-[#4F46E5]">
            <Brain className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">NEGOTIA</span>
        </Link>
        <div className="neo-raised p-8">
          {mode === "forgot" ? (
            <>
              <button onClick={() => { setMode("signin"); setMagicLink(null); }} data-testid="back-signin"
                className="text-xs text-slate-500 hover:text-[#4F46E5] mb-4 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />{t.auth.backToSignIn}
              </button>
              <h1 className="text-2xl font-display font-bold mb-1 tracking-tight">{t.auth.forgotTitle}</h1>
              <p className="text-sm text-slate-500 mb-6">{t.auth.forgotSub}</p>
              <form onSubmit={sendMagicLink} className="space-y-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500 font-mono tracking-wider mb-1 block">{t.auth.email}</Label>
                  <Input data-testid="forgot-email" required type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
                </div>
                <Button type="submit" disabled={sending} className="btn-primary w-full h-11" data-testid="send-magic-link">
                  <Sparkles className="w-4 h-4 mr-1.5" />{sending ? "..." : t.auth.sendLink}
                </Button>
              </form>
              {magicLink && (
                <div className="mt-5 p-4 neo-inset rounded-xl space-y-2">
                  <div className="text-[11px] text-slate-500">{t.auth.demoInline}</div>
                  <a href={magicLink} data-testid="magic-link-open"
                    className="btn-primary block text-center py-2 text-sm rounded-xl">
                    {t.auth.openLink}
                  </a>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="text-2xl font-display font-bold mb-1 tracking-tight">{t.auth.welcome}</h1>
              <p className="text-sm text-slate-500 mb-6">{t.auth.subtitle}</p>

              <div className="flex gap-1 mb-6 neo-inset p-1 rounded-full">
                <button data-testid="tab-signin" onClick={() => setMode("signin")}
                  className={`flex-1 py-2 text-sm rounded-full transition-all ${mode === "signin" ? "neo-raised-sm text-[#4F46E5] font-semibold" : "text-slate-500"}`}>
                  {t.auth.signIn}
                </button>
                <button data-testid="tab-signup" onClick={() => setMode("signup")}
                  className={`flex-1 py-2 text-sm rounded-full transition-all ${mode === "signup" ? "neo-raised-sm text-[#4F46E5] font-semibold" : "text-slate-500"}`}>
                  {t.auth.signUp}
                </button>
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <Label className="text-xs uppercase text-slate-500 font-mono tracking-wider mb-1 block">{t.auth.name}</Label>
                    <Input data-testid="input-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
                  </div>
                )}
                <div>
                  <Label className="text-xs uppercase text-slate-500 font-mono tracking-wider mb-1 block">{t.auth.email}</Label>
                  <Input data-testid="input-email" required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs uppercase text-slate-500 font-mono tracking-wider">{t.auth.password}</Label>
                    {mode === "signin" && (
                      <button type="button" onClick={() => setMode("forgot")} data-testid="link-forgot"
                        className="text-[11px] text-[#4F46E5] hover:underline font-medium">{t.auth.forgot}</button>
                    )}
                  </div>
                  <Input data-testid="input-password" required type="password" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputCls} />
                </div>
                <Button type="submit" disabled={loading} className="btn-primary w-full h-11" data-testid="submit-auth">
                  {loading ? "..." : (mode === "signin" ? t.auth.signIn : t.auth.signUp)}
                </Button>
              </form>

              <div className="mt-6 p-3 neo-inset rounded-xl text-xs text-slate-500 text-center">
                {t.auth.demoNote}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

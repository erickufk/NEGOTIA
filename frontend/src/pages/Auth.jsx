import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

export default function Auth() {
  const { t } = useI18n();
  const { login, register, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ email: "", password: "", name: "" });

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 tactical-grid">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center" data-testid="auth-brand">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center font-black text-[#0B0F17]">N</div>
          <span className="font-display font-extrabold text-xl">NEGOTIA</span>
        </Link>
        <div className="card-glow rounded-2xl p-8">
          <h1 className="text-2xl font-display font-bold mb-1">{t.auth.welcome}</h1>
          <p className="text-sm text-slate-400 mb-6">{t.auth.subtitle}</p>

          <div className="flex gap-2 mb-6 bg-white/5 rounded-lg p-1">
            <button data-testid="tab-signin" onClick={() => setMode("signin")}
              className={`flex-1 py-2 text-sm rounded-md transition ${mode==="signin"?"bg-white/10 text-white":"text-slate-400"}`}>
              {t.auth.signIn}
            </button>
            <button data-testid="tab-signup" onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm rounded-md transition ${mode==="signup"?"bg-white/10 text-white":"text-slate-400"}`}>
              {t.auth.signUp}
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label>{t.auth.name}</Label>
                <Input data-testid="input-name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-white/5 border-white/10" />
              </div>
            )}
            <div>
              <Label>{t.auth.email}</Label>
              <Input data-testid="input-email" required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-white/5 border-white/10" />
            </div>
            <div>
              <Label>{t.auth.password}</Label>
              <Input data-testid="input-password" required type="password" minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="bg-white/5 border-white/10" />
            </div>
            <Button type="submit" disabled={loading} className="btn-primary w-full h-11 rounded-lg" data-testid="submit-auth">
              {loading ? "..." : (mode === "signin" ? t.auth.signIn : t.auth.signUp)}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-sky-500/5 border border-sky-500/10 rounded-lg text-xs text-slate-400 text-center">
            {t.auth.demoNote}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Brain } from "lucide-react";
import { api } from "../lib/api";

export default function ResetPassword() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { setSession } = useAuth();
  const token = params.get("token") || "";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw !== pw2) { toast.error(t.reset.mismatch); return; }
    if (pw.length < 6) { toast.error(t.reset.tooShort); return; }
    setLoading(true);
    try {
      const data = await api.resetPassword(token, pw);
      setSession(data.token, data.user);
      toast.success(t.reset.success);
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || t.reset.failed);
    } finally { setLoading(false); }
  };

  const inputCls = "neo-inset border-0 h-11 text-sm text-[#1E293B] focus:ring-2 focus:ring-[#4F46E5]";

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAF9F6]">
        <div className="neo-raised p-8 max-w-md w-full text-center">
          <div className="text-sm text-slate-600 mb-3">{t.reset.badLink}</div>
          <Link to="/auth" className="btn-primary inline-block px-5 py-2 text-sm">{t.auth.signIn}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAF9F6]">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl neo-raised-sm flex items-center justify-center text-[#4F46E5]">
            <Brain className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">NEGOTIA</span>
        </Link>
        <div className="neo-raised p-8">
          <h1 className="text-2xl font-display font-bold mb-1 tracking-tight">{t.reset.title}</h1>
          <p className="text-sm text-slate-500 mb-6">{t.reset.subtitle}</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-xs uppercase text-slate-500 font-mono tracking-wider mb-1 block">{t.reset.newPassword}</Label>
              <Input data-testid="reset-pw" required type="password" minLength={6} value={pw} onChange={e => setPw(e.target.value)} className={inputCls} />
            </div>
            <div>
              <Label className="text-xs uppercase text-slate-500 font-mono tracking-wider mb-1 block">{t.reset.confirm}</Label>
              <Input data-testid="reset-pw2" required type="password" minLength={6} value={pw2} onChange={e => setPw2(e.target.value)} className={inputCls} />
            </div>
            <Button type="submit" disabled={loading} className="btn-primary w-full h-11" data-testid="reset-submit">
              {loading ? "..." : t.reset.submit}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

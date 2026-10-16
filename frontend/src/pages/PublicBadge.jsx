import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { API } from "../lib/api";
import { useI18n } from "../i18n/I18nProvider";

export default function PublicBadge() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useI18n();
  const [d, setD] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => { axios.get(`${API}/public/badge/${id}`).then(r => setD(r.data)).catch(() => setErr(true)); }, [id]);

  return (
    <div className="min-h-screen bg-[#F4F3EF] flex items-center justify-center px-4 py-12" data-testid="public-badge-page">
      <div className="w-full max-w-3xl">
        <button onClick={() => nav("/")} className="font-display font-extrabold text-xl text-[#1E293B] mb-6" data-testid="public-badge-logo">NEGOTIA</button>
        {err ? (
          <div className="neo-raised p-10 text-center text-slate-500" data-testid="public-badge-not-found">{t.share.notFound}</div>
        ) : !d ? (
          <div className="neo-raised aspect-[1200/630] animate-pulse" />
        ) : (
          <div className="neo-raised p-4 md:p-6 space-y-6 reward-pop">
            <img src={d.image_url} alt={d.badge_name} className="w-full rounded-2xl" data-testid="public-badge-image" />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
              <div>
                <h1 className="font-display font-bold text-2xl md:text-3xl text-[#1E293B]" data-testid="public-badge-title">
                  {t.share.publicTitle.replace("{name}", d.name).replace("{badge}", d.badge_name)}
                </h1>
                <p className="text-sm text-slate-500 mt-1">{t.share.publicSub}</p>
              </div>
              <button onClick={() => nav("/auth")} className="btn-primary px-6 py-3 text-sm flex items-center gap-2 shrink-0" data-testid="public-badge-cta">
                {t.share.cta}<ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

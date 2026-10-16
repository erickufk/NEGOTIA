import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";

const MAX = 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

export const AvatarUploader = ({ name, t }) => {
  const [url, setUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const load = () => api.avatarBlob().then(b => setUrl(URL.createObjectURL(b))).catch(() => setUrl(null));
  useEffect(() => { load(); }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const onPick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!TYPES.includes(f.type)) return toast.error(t.avatar.badType);
    if (f.size > MAX) return toast.error(t.avatar.tooBig);
    setBusy(true);
    try { await api.uploadAvatar(f); await load(); toast.success(t.avatar.updated); }
    catch { toast.error(t.avatar.failed); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try { await api.deleteAvatar(); setUrl(null); toast.success(t.avatar.removed); }
    finally { setBusy(false); }
  };

  return (
    <div className="relative group shrink-0" data-testid="avatar-uploader">
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} data-testid="avatar-change-btn" title={t.avatar.change}
        className="w-16 h-16 rounded-2xl neo-raised-sm overflow-hidden bg-gradient-to-br from-[#4F46E5]/10 to-[#7C3AED]/10 text-[#4F46E5] flex items-center justify-center font-bold text-2xl relative">
        {url ? <img src={url} alt={name} className="w-full h-full object-cover" data-testid="avatar-image" />
          : (name?.[0]?.toUpperCase() || <UserIcon className="w-6 h-6" />)}
        <span className="absolute inset-0 bg-[#1E293B]/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
        </span>
      </button>
      {url && !busy && (
        <button type="button" onClick={remove} data-testid="avatar-remove-btn" title={t.avatar.remove}
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow text-rose-500 flex items-center justify-center hover:scale-110 transition-transform duration-200">
          <Trash2 className="w-3 h-3" />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPick} data-testid="avatar-file-input" />
    </div>
  );
};

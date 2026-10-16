"""Scenario localization helpers."""
from typing import List



from scenarios_seed import GENDERS, ROLE_RU, SCENARIO_RU, NAME_RU, SCENARIO_RU_CTX


def _scrub_scenario(sc: dict, hide_hidden: bool = True, lang: str = "en") -> dict:
    """Remove hidden AI information before sending to client; localize for RU."""
    out = {k: v for k, v in sc.items() if k != "_id"}
    is_custom = bool(out.get("custom"))
    p_trans = {}
    if lang == "ru":
        if is_custom:
            tr = (out.get("translations") or {}).get("ru", {}) or {}
            for k in ("title", "description", "objective", "context"):
                if tr.get(k):
                    out[k] = tr[k]
            if tr.get("success_conditions"):
                out["success_conditions"] = tr["success_conditions"]
            for i, pt in enumerate(tr.get("participants") or []):
                p_trans[i] = pt
        else:
            ru = SCENARIO_RU.get(out.get("slug"), {})
            if ru:
                out["title"] = ru.get("title", out.get("title"))
                out["description"] = ru.get("description", out.get("description"))
                out["objective"] = ru.get("objective", out.get("objective"))
            ctx = SCENARIO_RU_CTX.get(out.get("slug"), {})
            if ctx.get("context"):
                out["context"] = ctx["context"]
            if ctx.get("success_conditions"):
                out["success_conditions"] = ctx["success_conditions"]
    safe_parts = []
    for i, p in enumerate(out.get("participants", [])):
        if hide_hidden:
            sp = {k: v for k, v in p.items() if k not in ("hidden_interests", "reservation_point", "batna")}
        else:
            sp = dict(p)
        sp["gender"] = p.get("gender") or GENDERS.get(p.get("name"), "female")
        if lang == "ru":
            if is_custom:
                pt = p_trans.get(i, {})
                sp["role"] = pt.get("role") or p.get("role")
                sp["name"] = pt.get("name") or p.get("name")
            else:
                sp["role"] = ROLE_RU.get(p.get("role"), p.get("role"))
                sp["name"] = NAME_RU.get(p.get("name"), p.get("name"))
        safe_parts.append(sp)
    out["participants"] = safe_parts
    return out


def _resolve_parts(scenario: dict, doc: dict) -> List[dict]:
    """Map a negotiation's stored participants back to full scenario participants,
    overriding name/role with the stored (possibly localized) display values."""
    disp_name, disp_role, src_names = {}, {}, set()
    for pp in doc.get("participants", []):
        src = pp.get("src_name", pp["name"])
        src_names.add(src)
        disp_name[src] = pp["name"]
        disp_role[src] = pp["role"]
    merged = []
    for p in scenario["participants"]:
        if p["name"] in src_names:
            merged.append({**p, "name": disp_name.get(p["name"], p["name"]), "role": disp_role.get(p["name"], p["role"])})
    return merged


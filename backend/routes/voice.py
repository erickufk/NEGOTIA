"""Voice routes: STT + TTS."""

import io
import re

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import Response

from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech
from core import (VOICE_BY_GENDER, EMERGENT_LLM_KEY, logger, get_current_user)
from models import (TtsIn)

api = APIRouter(prefix="/api")

# ---------- Voice: STT + TTS ----------
_stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
_tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)


def _clean_for_tts(text: str) -> str:
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"[*_#>~|`]", "", text)
    return re.sub(r"\s+", " ", text).strip()[:4000]


@api.post("/voice/transcribe")
async def transcribe(file: UploadFile = File(...), language: str = Form("en"), user=Depends(get_current_user)):
    try:
        data = await file.read()
        if not data:
            raise HTTPException(400, "Empty file")
        buf = io.BytesIO(data)
        # give the file a name so the SDK can infer type
        name = file.filename or "audio.webm"
        buf.name = name
        try:
            resp = await _stt.transcribe(file=buf, model="whisper-1", response_format="json", language=language[:2] if language else None)
        except TypeError:
            buf.seek(0)
            resp = await _stt.transcribe(file=buf, model="whisper-1", response_format="json")
        text = getattr(resp, "text", None) or (resp.get("text") if isinstance(resp, dict) else str(resp))
        return {"text": text or ""}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("transcribe failed")
        raise HTTPException(500, f"Transcription failed: {e}")


@api.post("/voice/tts")
async def tts_endpoint(body: TtsIn, user=Depends(get_current_user)):
    try:
        clean = _clean_for_tts(body.text)
        if not clean:
            raise HTTPException(400, "Empty text")
        voice = body.voice or VOICE_BY_GENDER.get((body.gender or "").lower(), "nova")
        audio_bytes = await _tts.generate_speech(text=clean, model="tts-1", voice=voice, response_format="mp3")
        return Response(content=audio_bytes, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=3600"})
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("tts failed")
        raise HTTPException(500, f"TTS failed: {e}")



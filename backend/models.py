"""Request models."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=100)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    created_at: str


class MessageIn(BaseModel):
    content: str


class CreateNegotiationIn(BaseModel):
    scenario_slug: str
    mode: str = "chat"  # chat | voice | challenge
    participants_count: Optional[int] = None
    preparation: Optional[Dict[str, Any]] = None
    training_framework: str = "combined"  # harvard | spin | batna | combined
    language: str = "en"
    ai_model: str = "claude"  # claude | gpt


class AnalyzePrepIn(BaseModel):
    scenario_slug: str
    training_framework: str = "combined"
    language: str = "en"
    ai_model: str = "claude"


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    password: str = Field(min_length=6)


class MagicLoginIn(BaseModel):
    token: str


class CustomOpponent(BaseModel):
    name_en: str = Field(min_length=1, max_length=80)
    name_ru: str = Field(default="", max_length=80)
    role_en: str = Field(min_length=1, max_length=120)
    role_ru: str = Field(default="", max_length=120)
    gender: str = "female"  # male | female
    description: str = Field(default="", max_length=600)
    goals: str = Field(default="", max_length=400)
    interests: str = Field(default="", max_length=400)
    hidden_interests: str = Field(default="", max_length=400)
    constraints: str = Field(default="", max_length=400)
    batna: str = Field(default="", max_length=300)
    personality: str = Field(default="", max_length=300)
    priorities: List[str] = []


class CustomScenarioIn(BaseModel):
    title_en: str = Field(min_length=2, max_length=120)
    title_ru: str = Field(default="", max_length=120)
    description_en: str = Field(min_length=2, max_length=400)
    description_ru: str = Field(default="", max_length=400)
    category: str = Field(min_length=1, max_length=40)
    difficulty: str = "Medium"
    duration: int = 12
    objective_en: str = Field(min_length=2, max_length=400)
    objective_ru: str = Field(default="", max_length=400)
    context_en: str = Field(min_length=2, max_length=1200)
    context_ru: str = Field(default="", max_length=1200)
    success_en: List[str] = []
    success_ru: List[str] = []
    skills: List[str] = []
    opponent: CustomOpponent


class EndNegotiationIn(BaseModel):
    action: str = "end"  # end | walk_away | make_deal


class CoachIn(BaseModel):
    negotiation_id: str


class TtsIn(BaseModel):
    text: str
    language: str = "en"
    voice: Optional[str] = None
    gender: Optional[str] = None


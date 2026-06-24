"""
LeadCatch — missed-call text-back for the trades.

Flow:
  1. Twilio posts to /voice/missed when a call to your business goes unanswered.
  2. LeadCatch asks Claude to write the first text-back in the owner's voice and
     SMSes it to the caller.
  3. The caller replies; Twilio posts to /sms/incoming. LeadCatch keeps the
     conversation going with Claude until the job is qualified and an inspection
     is booked, then it hands a clean summary to the owner.

This is an MVP: conversation state lives in memory (swap for Redis/DB in prod).
Built to call Claude via the official Anthropic SDK (Opus 4.8).
"""
from __future__ import annotations

import os
from typing import Literal

import anthropic
from pydantic import BaseModel
from fastapi import FastAPI, Form, Response
from twilio.rest import Client as TwilioClient

# --- Config -----------------------------------------------------------------

BUSINESS = {
    "name": "R&B Roofing & Remodeling",
    "city": "Louisville, KY",
    "trade": "roofing",
    "slots": ["Tomorrow 9:00 AM", "Thursday 2:00 PM"],  # pull from your calendar in prod
}

# Default to Opus 4.8. For lowest SMS latency you can switch to "claude-haiku-4-5"
# (your call — we don't downgrade for you).
MODEL = os.environ.get("LEADCATCH_MODEL", "claude-opus-4-8")

claude = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
twilio = TwilioClient(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])
FROM_NUMBER = os.environ["TWILIO_FROM_NUMBER"]
OWNER_NUMBER = os.environ.get("OWNER_NUMBER")  # where qualified-lead summaries go

SYSTEM_PROMPT = f"""You are the text-back assistant for {BUSINESS['name']} ({BUSINESS['city']}).
A customer just called and we missed it. Text them back immediately, warmly, in the owner's voice.
Goal: qualify the job in 2-3 short questions, then book a free inspection.
Capture: (1) repair vs full replacement, (2) insurance claim or out-of-pocket, (3) a time for the inspection.
Available inspection times: {', '.join(BUSINESS['slots'])}.
Keep each text under 2 sentences. One question at a time. Never sound robotic.
When you have the job type and a confirmed time, set status to "booked" and confirm warmly."""

# In-memory conversation store: { phone_number: [ {role, content}, ... ] }
CONVERSATIONS: dict[str, list[dict]] = {}


class AgentTurn(BaseModel):
    """Structured output Claude returns every turn."""
    sms: str  # the text message to send the customer
    status: Literal["qualifying", "booked", "needs_human"]
    job_type: str | None = None         # "repair" | "full replacement" | None
    insurance_claim: bool | None = None
    booked_time: str | None = None


# --- Core: one Claude turn ---------------------------------------------------

def next_turn(history: list[dict]) -> AgentTurn:
    """Send the conversation to Claude and get the next structured action."""
    response = claude.messages.parse(
        model=MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=history,
        output_format=AgentTurn,
    )
    return response.parsed_output


def send_sms(to: str, body: str) -> None:
    twilio.messages.create(to=to, from_=FROM_NUMBER, body=body)


def notify_owner(caller: str, turn: AgentTurn) -> None:
    if not OWNER_NUMBER:
        return
    summary = (
        f"✅ New booked job via LeadCatch\n"
        f"Caller: {caller}\n"
        f"Job: {turn.job_type or 'n/a'}\n"
        f"Insurance: {'yes' if turn.insurance_claim else 'no'}\n"
        f"Inspection: {turn.booked_time or 'n/a'}"
    )
    send_sms(OWNER_NUMBER, summary)


# --- Webhooks ----------------------------------------------------------------

app = FastAPI(title="LeadCatch")


@app.post("/voice/missed")
async def missed_call(From: str = Form(...)):
    """Twilio hits this when a call to the business goes unanswered."""
    history = [{"role": "user", "content": "[A customer just called and we missed it.]"}]
    turn = next_turn(history)
    history.append({"role": "assistant", "content": turn.sms})
    CONVERSATIONS[From] = history
    send_sms(From, turn.sms)
    return Response(status_code=204)


@app.post("/sms/incoming")
async def incoming_sms(From: str = Form(...), Body: str = Form(...)):
    """Twilio hits this when the customer texts back."""
    history = CONVERSATIONS.get(From) or [
        {"role": "user", "content": "[A customer just called and we missed it.]"}
    ]
    history.append({"role": "user", "content": Body})

    turn = next_turn(history)
    history.append({"role": "assistant", "content": turn.sms})
    CONVERSATIONS[From] = history

    send_sms(From, turn.sms)
    if turn.status == "booked":
        notify_owner(From, turn)

    return Response(status_code=204)


@app.get("/health")
async def health():
    return {"ok": True, "model": MODEL, "business": BUSINESS["name"]}


# --- Offline demo (no Twilio, no webhook) ------------------------------------
# Run `python app.py` to chat with the agent in your terminal (needs only
# ANTHROPIC_API_KEY). This is the same brain the webhooks use.
if __name__ == "__main__":
    print(f"LeadCatch demo · {BUSINESS['name']} · model={MODEL}")
    print("(Pretend you just missed a call. Type as the customer; Ctrl-C to quit.)\n")
    convo = [{"role": "user", "content": "[A customer just called and we missed it.]"}]
    turn = next_turn(convo)
    convo.append({"role": "assistant", "content": turn.sms})
    print(f"R&B: {turn.sms}\n")
    while turn.status == "qualifying":
        reply = input("you: ").strip()
        convo.append({"role": "user", "content": reply})
        turn = next_turn(convo)
        convo.append({"role": "assistant", "content": turn.sms})
        print(f"R&B: {turn.sms}\n")
    print(f"[status: {turn.status} · job={turn.job_type} · "
          f"insurance={turn.insurance_claim} · time={turn.booked_time}]")

# LeadCatch

Missed-call text-back for the trades. When a call goes unanswered, Claude texts the
caller back in the owner's voice, qualifies the job, and books a free inspection —
before the competitor calls back. This is Allerion's wedge product: undeniable ROI,
the easiest sales demo on earth (fire it on the prospect's own number), and it fills
the ~47%-of-leads-are-non-phone gap the big platforms ignore.

## See it right now (no setup)

Open **`preview.html`** in any browser. Press *Simulate a missed call*, then reply as
the customer. It runs entirely in the browser — same system prompt as the real
backend, no API key needed.

## Run the real agent

```bash
pip install -r requirements.txt
cp .env.example .env   # fill in ANTHROPIC_API_KEY (+ Twilio for live SMS)
```

**Terminal demo** (only needs `ANTHROPIC_API_KEY`) — chat with the real Claude brain:

```bash
python app.py
```

**Live SMS webhook** (needs Twilio):

```bash
uvicorn app:app --reload --port 8000
```

Then in the Twilio console:
- Point your business number's **"a call comes in → no answer"** webhook to
  `POST https://your-host/voice/missed`
- Point **Messaging → incoming** to `POST https://your-host/sms/incoming`

(Use `ngrok http 8000` to expose localhost while testing.)

## How it works

- `app.py` — FastAPI webhooks + the Claude turn engine. Each turn calls
  `claude.messages.parse(...)` with a Pydantic `AgentTurn` schema, so Claude returns
  the exact SMS to send **and** structured status (`qualifying` / `booked` /
  `needs_human`) plus the captured job type, insurance flag, and booked time.
- Model defaults to **`claude-opus-4-8`**; set `LEADCATCH_MODEL=claude-haiku-4-5`
  for lowest SMS latency.
- Conversation state is in-memory for the MVP — swap `CONVERSATIONS` for Redis or a
  DB before production.

## Productize → service ladder

- **Diagnose ($1,500):** "where are your leads leaking?" audit → the LeadCatch spec.
- **Install ($3K–$8K):** connect the real number, train the qualifying script on
  their pricing/voice, wire booking into their calendar/CRM.
- **Optimize ($500–$2.5K/mo):** tune the script, expand channels (web form, Angi,
  Facebook), and report jobs recovered each month.

## Compliance note

SMS requires **A2P 10DLC registration** and **TCPA opt-in** handling before you send
at volume. Build the opt-in capture into the install.

# Knowledge base schema

`config/knowledge.json` is the only thing the assistant knows about you. `api/chat.js` turns it into the system prompt on every request. Start from `config/knowledge.example.json`; see `examples/vicente.json` for a real, deep one.

All fields are optional except `persona.name`, but the more you fill, the fewer "I don't know" answers you get. Any extra top-level key you add (e.g. `"awards"`, `"publications"`, `"personal"`) is rendered automatically under its own heading, so you can extend the schema freely. Keys starting with `_` are never shown to visitors as data.

| Field | Type | What it is for |
|---|---|---|
| `_instructions` | string | Notes to the model ("only answer from this data", focus areas, things to avoid). Injected as OWNER NOTES. |
| `persona.name` | string | Your full name. The assistant uses the first word as your first name. |
| `persona.role` | string | One-line positioning ("Product Designer, fintech and accessibility"). |
| `persona.tone` | string | How answers should sound. See "Writing a good persona" below. |
| `persona.core_message` | string | The one idea every answer should reinforce. Your differentiator. |
| `persona.language` | string | Language rule. Default: reply in the visitor's language. |
| `persona.fallback` | object `{en, es, ...}` | What to say when the answer is not in the data. The model rephrases it and points to your contact page. |
| `bio` | string | 1 to 3 paragraphs, first or third person. The richest source for "tell me about yourself". |
| `background` | string[] | Short facts that do not fit elsewhere (origins, pivots, motivations). |
| `timeline` | array | Chronology. Strings or `{period, event}` objects. Prevents the model from guessing dates. |
| `languages` | object | `fluent: []`, `understands: ""`. |
| `skills` | object | Any shape: flat lists, categories, nested objects. Rendered as an indented tree. |
| `experience` | array | `{company, role, dates, description}`. Put outcomes in `description`. |
| `education` | array | `{institution, degree, status}`. |
| `projects` | array | `{name, type, role, description, case_study_url, ...}`. Extra keys (stats, methods, findings) are rendered too. |
| `contact` | object | Public channels only: `website`, `contact_page`, `linkedin`. The fallback and contact sentences point to `contact_page`, then `website`, then `linkedin`. |
| `page_urls` | object | Canonical URLs of your site sections. The model includes the relevant one in answers. |
| `availability` | object | `status` (short) and `detail` (start dates, location, work authorization, roles you want). Recruiters ask this first. |
| `faq` | array | `{q, a}` pairs. The model prefers these answers when the question matches. Best place for tricky questions (salary, visa, gaps). |
| `personal_facts` | object | Light human details (hobbies, fun facts). Optional. |

## Writing a good persona and `_instructions`

**Anti-hallucination**
- State the rule explicitly in `_instructions`: "Only answer from this data. Never invent dates, employers, numbers or opinions." The template already enforces this, repeating it in your own words strengthens it.
- Fill `timeline` and `availability`. Most hallucinations are dates and availability.
- Write numbers exactly as you want them repeated ("120 hours", "4.0 GPA"). Vague data produces vague or invented answers.
- Put sensitive answers in `faq` (salary, visa, why you left a job). A pre-written answer beats an improvised one.
- Make `persona.fallback` warm and useful; a good fallback removes the model's temptation to guess.

**Tone**
- Describe behaviour, not adjectives: "2 to 4 sentences. No filler like 'Great question!'. Do not apologise." works better than "be professional".
- Decide first vs third person and say it.
- Give `core_message` a single, concrete differentiator. It colours every answer.

**Privacy**
- Everything in this file can be repeated to any visitor, and the file itself is served statically if it sits in a public folder. Do not include phone numbers, private emails, home addresses, client pricing, or anything under NDA.

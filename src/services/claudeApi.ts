// src/services/claudeApi.ts
// Central service for all Anthropic API calls

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function callClaude(
  prompt: string,
  systemPrompt = 'You are a helpful phone assistant. Be concise and warm.',
  history: Message[] = [],
  apiKey = ''
): Promise<string> {
  const messages: Message[] = [
    ...history,
    { role: 'user', content: prompt },
  ];

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.map((b: any) => b.text || '').join('') || '';
}

// ── Specialized callers ────────────────────────────────────────────────────────

export async function generateWish(
  name: string,
  type: 'birthday' | 'anniversary',
  relation: string,
  tone: string,
  apiKey: string
) {
  return callClaude(
    `Generate a ${tone} ${type} wish for ${name}${relation ? ` (my ${relation})` : ''}.
Also write a short phone call script (3–4 sentences) I can use when calling them.

Format EXACTLY like this:
WISH: <the wish message>
CALL_SCRIPT: <what to say on the phone call>`,
    'You are a warm, heartfelt assistant who writes personal, genuine wishes — never generic.',
    [],
    apiKey
  );
}

export async function generateMeetingNotes(transcript: string, apiKey: string) {
  return callClaude(
    `Meeting transcript:\n"${transcript}"\n\nCreate structured meeting notes with these sections:
## Summary
## Key Discussion Points
## Action Items
## Decisions Made
## Next Steps`,
    'You are a professional meeting notes assistant. Extract key information clearly and concisely. Use bullet points inside sections.',
    [],
    apiKey
  );
}

export async function askAboutMeeting(
  question: string,
  transcript: string,
  apiKey: string
) {
  return callClaude(
    `Meeting transcript:\n"${transcript}"\n\nQuestion: ${question}`,
    'Answer questions about the meeting transcript accurately and concisely. If the answer is not in the transcript, say so.',
    [],
    apiKey
  );
}

export async function chatWithAssistant(
  message: string,
  history: Message[],
  meetingContext: string,
  apiKey: string
) {
  const system = `You are a helpful, friendly personal phone assistant.
${meetingContext ? `The user has recent meeting notes: ${meetingContext}` : ''}
Keep responses concise but complete. You can help with reminders, drafting messages, meeting insights, conversation tips, and general questions.`;

  return callClaude(message, system, history, apiKey);
}

// Supabase Edge Function (Deno) — genera coppie domanda/risposta da un testo
// usando Groq (free tier, OpenAI-compatible). La chiave API resta lato server.
//
// Deploy:
//   supabase functions deploy generate-flashcards --no-verify-jwt
//   supabase secrets set GROQ_API_KEY=la_tua_chiave
//
// La chiave gratuita si ottiene su https://console.groq.com/keys

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const MAX_CHARS = 24000;

type GeneratedCard = { question: string; answer: string };

function buildPrompt(text: string, count: number): string {
  return [
    `Sei un tutor di medicina. Dal seguente testo genera ${count} flashcard di studio.`,
    'Regole:',
    '- Lingua italiana.',
    '- Ogni flashcard ha una domanda chiara e autoconsistente e una risposta completa ma sintetica.',
    '- Copri i concetti piu importanti, evita domande banali o ridondanti.',
    '- Non inventare informazioni non presenti nel testo.',
    '- Rispondi SOLO con un oggetto JSON in questa forma esatta:',
    '  { "cards": [ { "question": "...", "answer": "..." } ] }',
    '',
    'TESTO:',
    text.slice(0, MAX_CHARS)
  ].join('\n');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) {
    return json({ error: 'GROQ_API_KEY non configurata sulla Edge Function.' }, 500);
  }

  let text = '';
  let count = 12;
  try {
    const payload = await req.json();
    text = typeof payload.text === 'string' ? payload.text.trim() : '';
    if (Number.isFinite(payload.count)) {
      count = Math.max(1, Math.min(30, Math.floor(payload.count)));
    }
  } catch {
    return json({ error: 'Body JSON non valido.' }, 400);
  }

  if (text.length < 40) {
    return json({ error: 'Testo troppo corto per generare domande.' }, 400);
  }

  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Rispondi sempre e solo con JSON valido, senza testo aggiuntivo.'
          },
          { role: 'user', content: buildPrompt(text, count) }
        ]
      })
    });
  } catch (e) {
    return json({ error: `Chiamata a Groq fallita: ${String(e)}` }, 502);
  }

  if (!groqRes.ok) {
    const detail = await groqRes.text();
    return json({ error: `Groq ha risposto ${groqRes.status}: ${detail}` }, 502);
  }

  const data = await groqRes.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? '';

  let cards: GeneratedCard[] = [];
  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed?.cards;
    if (Array.isArray(list)) {
      cards = list
        .filter((c) => c && typeof c.question === 'string' && typeof c.answer === 'string')
        .map((c) => ({ question: c.question.trim(), answer: c.answer.trim() }))
        .filter((c) => c.question.length > 0 && c.answer.length > 0);
    }
  } catch {
    return json({ error: 'Risposta di Groq non in formato JSON valido.' }, 502);
  }

  return json({ cards });
});

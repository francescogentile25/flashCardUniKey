# Setup OinkMed — database, generazione da PDF, PWA

## 1. Migrazione database (obbligatoria)

> **Da fare prima di usare la versione con materie, quiz e progressi.**
> Senza queste colonne il salvataggio delle card fallisce (400) e la pagina
> Progressi risponde 404 sulla tabella `review_log`.

Apri Supabase → SQL Editor e **riesegui tutto `schema.sql`**: è idempotente
(`add column if not exists`, `create table if not exists`), quindi non tocca i
dati esistenti. In alternativa, il minimo indispensabile:

```sql
alter table public.flashcards
  add column if not exists subject text not null default 'Generale',
  add column if not exists source_file text,
  add column if not exists source_excerpt text,
  add column if not exists ease_factor real not null default 2.5,
  add column if not exists interval_days real not null default 0,
  add column if not exists repetitions integer not null default 0;
```

più il blocco `create table public.review_log (...)` con le sue policy RLS,
che trovi in `schema.sql`.

Le card che hai già finiscono tutte nella materia `Generale`: puoi
riassegnarle dall'archivio (`/new` → Modifica) o in blocco:

```sql
update public.flashcards set subject = 'Semeiotica' where question ilike '%soffio%';
```

### Cosa cambia dopo la migrazione

| Colonna | A cosa serve |
|---|---|
| `subject` | Materia: filtra deck, quiz e statistiche |
| `source_file`, `source_excerpt` | Da quale PDF e da quale paragrafo nasce la card |
| `ease_factor`, `interval_days`, `repetitions` | Stato SM-2 della ripetizione spaziata |
| tabella `review_log` | Uno storico per swipe: streak, grafico, bestie nere |

## 2. Chiave Groq (gratuita, funziona in EU)

Il free tier dell'API Gemini e disabilitato in EU (`limit: 0`), quindi si usa Groq.

1. Vai su https://console.groq.com/keys (login).
2. "Create API Key" → copia la chiave. Nessuna carta richiesta.
   Free tier `llama-3.3-70b-versatile`: ampio, adatto all'uso personale.

## 3. Deploy della Edge Function

Via Dashboard (consigliata): Supabase → progetto → Edge Functions →
crea/aggiorna `generate-flashcards`, incolla il codice di
`supabase/functions/generate-flashcards/index.ts`, **Verify JWT: OFF**,
aggiungi il secret `GROQ_API_KEY`, poi Deploy.

Via CLI (alternativa):

```bash
npx supabase login
npx supabase link --project-ref ooudsqwknnkoebjpkiss
npx supabase secrets set GROQ_API_KEY=LA_TUA_CHIAVE
npx supabase functions deploy generate-flashcards --no-verify-jwt
```

## 4. Uso

- **Deck** (`/`): swipe a sinistra "la so", a destra "non la so". Un timbro da
  cartella clinica conferma l'esito. Filtra per materia dai chip in alto.
  L'icona dell'altoparlante legge domanda e risposta ad alta voce.
- **Quiz** (`/quiz`): quattro risposte, una giusta. I distrattori sono risposte
  di altre card della stessa materia, quindi non serve chiamare l'LLM. Gli esiti
  entrano nello stesso storico degli swipe.
- **Progressi** (`/stats`): giorni di fila, grafico degli ultimi 30 giorni,
  precisione per materia e le domande che sbagli più spesso.
- **Genera da PDF** (`/import`): il testo viene estratto **nel browser** (nessun
  upload del file), spezzato in blocchi da ~20k caratteri e mandato alla Edge
  Function un blocco per volta. La materia è proposta dal nome del file; ogni
  card conserva il paragrafo da cui è nata.
- **Gestisci** (`/new`): ricerca su domande, risposte e nomi dei PDF, filtro per
  materia, modifica ed eliminazione.

### Ripetizione spaziata (SM-2)

Ogni card ha un `ease_factor` (quanto ti risulta facile) e un `interval_days`.
Se la sai, l'intervallo cresce: 1 giorno → 6 giorni → `intervallo × ease`.
Se la sbagli, torna dopo 10 minuti, le ripetizioni si azzerano e l'ease cala.
`interval_days` è frazionario proprio per questo.

### Offline

L'app è installabile (PWA). Il deck resta consultabile senza rete e i ripassi
fatti offline finiscono in una coda su `localStorage`: appena la rete torna
vengono rigiocati in ordine. Un avviso in home mostra quanti sono in attesa.

Per installarla su iPhone: Safari → Condividi → "Aggiungi alla schermata Home".

### Note

- PDF scansionati come immagine non hanno testo estraibile (servirebbe OCR).
- La chiave Groq non è mai esposta al browser: la chiama solo la Edge Function.
- Le policy RLS sono aperte a `anon`: chiunque conosca l'URL può leggere e
  modificare il deck. Per chiudere servirebbe Supabase Auth con `user_id`.

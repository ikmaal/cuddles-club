# Study agent (Pip)

Deploy from the repo root with the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy study-agent
```

Also run `supabase/academics_extracted_text.sql` if your Academics tables already exist.

Pip chats through `supabase.functions.invoke('study-agent')` using the signed-in couple account. The Anthropic key never ships in the web app.

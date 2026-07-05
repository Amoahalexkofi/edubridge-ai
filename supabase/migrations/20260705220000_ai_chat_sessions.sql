-- AI Tutor chat history, persisted per student account.
-- Previously chats lived only in localStorage and were wiped on sign-out
-- (shared-computer privacy cleanup in StudentNav), so students lost all history.

create table if not exists public.ai_chat_sessions (
  id text primary key, -- client-generated id (kept from the existing session shape)
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'General',
  type text not null default 'general' check (type in ('general', 'exam')),
  exam_context jsonb,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_chat_sessions_user_idx
  on public.ai_chat_sessions (user_id, updated_at desc);

alter table public.ai_chat_sessions enable row level security;

drop policy if exists "Users manage own AI chats" on public.ai_chat_sessions;
create policy "Users manage own AI chats"
  on public.ai_chat_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

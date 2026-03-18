-- Cue MVP Schema
-- Run this in Supabase SQL Editor: Dashboard > SQL Editor > New query

-- Intentions table
create table intentions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  when_trigger text not null,
  then_action text not null,
  why_rationale text not null,
  status text default 'active' check (status in ('active', 'installed', 'archived')),
  created_at timestamptz default now(),
  installed_at timestamptz
);

-- Daily check-in events
create table events (
  id uuid default gen_random_uuid() primary key,
  intention_id uuid references intentions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date default current_date not null,
  result text not null check (result in ('fired', 'missed', 'not_encountered')),
  created_at timestamptz default now(),
  unique(intention_id, date)
);

-- Enable RLS
alter table intentions enable row level security;
alter table events enable row level security;

-- Users can only see/modify their own intentions
create policy "Users can read own intentions"
  on intentions for select using (auth.uid() = user_id);

create policy "Users can insert own intentions"
  on intentions for insert with check (auth.uid() = user_id);

create policy "Users can update own intentions"
  on intentions for update using (auth.uid() = user_id);

-- Users can only see/modify their own events
create policy "Users can read own events"
  on events for select using (auth.uid() = user_id);

create policy "Users can insert own events"
  on events for insert with check (auth.uid() = user_id);

-- User stats for streak tracking
create table user_stats (
  user_id uuid references auth.users(id) on delete cascade primary key,
  current_streak int default 0,
  longest_streak int default 0,
  last_checkin_date date,
  streak_freeze_available boolean default true,
  streak_freeze_used_date date,
  total_fired int default 0,
  total_missed int default 0,
  total_not_encountered int default 0,
  created_at timestamptz default now()
);

alter table user_stats enable row level security;

create policy "Users can read own stats"
  on user_stats for select using (auth.uid() = user_id);

create policy "Users can insert own stats"
  on user_stats for insert with check (auth.uid() = user_id);

create policy "Users can update own stats"
  on user_stats for update using (auth.uid() = user_id);

-- Weekly AI insights
create table insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  intention_id uuid references intentions(id) on delete cascade not null,
  content text not null,
  week_start date not null,
  created_at timestamptz default now()
);

alter table insights enable row level security;

create policy "Users can read own insights"
  on insights for select using (auth.uid() = user_id);

create policy "Service can insert insights"
  on insights for insert with check (true);

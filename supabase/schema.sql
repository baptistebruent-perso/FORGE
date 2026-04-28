-- Programmes (séances types)
create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  day_of_week int, -- 0=Lundi à 6=Dimanche, null si flexible
  order_index int default 0,
  notes text,
  created_at timestamptz default now()
);

-- Exercices d'une séance (template)
create table exercises_template (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts on delete cascade,
  name text not null,
  order_index int default 0,
  target_sets int default 3,
  target_reps_min int default 8,
  target_reps_max int default 12,
  target_rest_seconds int default 90,
  rest_after_exercise_seconds int default 120,
  notes text
);

-- Séances effectuées
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  workout_id uuid references workouts,
  started_at timestamptz default now(),
  ended_at timestamptz,
  notes text,
  mood int -- 1 à 5
);

-- Séries loggées
create table session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions on delete cascade,
  exercise_template_id uuid references exercises_template,
  exercise_name text not null,
  set_number int not null,
  reps int,
  weight numeric(6,2),
  rpe int, -- effort perçu 1-10 (optionnel)
  completed boolean default true,
  created_at timestamptz default now()
);

-- Mensurations & poids corps
create table body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  measured_at date not null default current_date,
  weight_kg numeric(5,2),
  body_fat_pct numeric(4,2),
  chest_cm numeric(5,2),
  waist_cm numeric(5,2),
  hips_cm numeric(5,2),
  arm_cm numeric(5,2),
  thigh_cm numeric(5,2),
  calf_cm numeric(5,2),
  notes text
);

-- Photos progression
create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  taken_at date not null default current_date,
  storage_path text not null,
  view_type text, -- 'front' | 'side' | 'back'
  notes text
);

-- PRs
create table personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  exercise_name text not null,
  type text not null, -- '1rm_estimated' | 'max_weight' | 'max_reps' | 'max_volume_session'
  value numeric(8,2) not null,
  reps int,
  achieved_at timestamptz default now(),
  session_id uuid references sessions
);

-- Objectifs
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  type text not null, -- 'pr' | 'bodyweight' | 'measurement' | 'frequency' | 'custom'
  target_value numeric,
  current_value numeric,
  unit text,
  deadline date,
  exercise_name text,
  status text default 'active', -- 'active' | 'achieved' | 'archived'
  created_at timestamptz default now()
);

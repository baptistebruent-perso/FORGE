-- Enable RLS on all tables
alter table workouts enable row level security;
alter table exercises_template enable row level security;
alter table sessions enable row level security;
alter table session_sets enable row level security;
alter table body_metrics enable row level security;
alter table progress_photos enable row level security;
alter table personal_records enable row level security;
alter table goals enable row level security;

-- workouts: owner only
create policy "workouts_owner" on workouts
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- exercises_template: accessible via workout ownership
create policy "exercises_template_owner" on exercises_template
  for all
  using (workout_id in (select id from workouts where user_id = auth.uid()))
  with check (workout_id in (select id from workouts where user_id = auth.uid()));

-- sessions: owner only
create policy "sessions_owner" on sessions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- session_sets: accessible via session ownership
create policy "session_sets_owner" on session_sets
  for all
  using (session_id in (select id from sessions where user_id = auth.uid()))
  with check (session_id in (select id from sessions where user_id = auth.uid()));

-- body_metrics: owner only
create policy "body_metrics_owner" on body_metrics
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- progress_photos: owner only
create policy "progress_photos_owner" on progress_photos
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- personal_records: owner only
create policy "personal_records_owner" on personal_records
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- goals: owner only
create policy "goals_owner" on goals
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage bucket policy (run separately in Supabase dashboard)
-- Bucket name: progress-photos (private)
-- Policy: authenticated users can only access their own folder (userId prefix)

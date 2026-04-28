-- Push / Pull / Legs seed program
-- Replace YOUR_USER_ID with your actual user UUID from the Supabase auth.users table
-- Run this AFTER applying schema.sql and RLS policies, and after signing up once

-- Push day (Lundi)
insert into workouts (id, user_id, name, day_of_week, order_index) values
  ('10000000-0000-0000-0000-000000000001', 'YOUR_USER_ID', 'Push', 0, 0),
  ('10000000-0000-0000-0000-000000000002', 'YOUR_USER_ID', 'Pull', 2, 1),
  ('10000000-0000-0000-0000-000000000003', 'YOUR_USER_ID', 'Legs', 4, 2);

-- Push exercises
insert into exercises_template (workout_id, name, order_index, target_sets, target_reps_min, target_reps_max, target_rest_seconds, rest_after_exercise_seconds) values
  ('10000000-0000-0000-0000-000000000001', 'Développé couché', 0, 4, 6, 10, 120, 150),
  ('10000000-0000-0000-0000-000000000001', 'Développé incliné haltères', 1, 3, 8, 12, 90, 120),
  ('10000000-0000-0000-0000-000000000001', 'Écarté câbles', 2, 3, 10, 15, 60, 90),
  ('10000000-0000-0000-0000-000000000001', 'Développé militaire', 3, 4, 6, 10, 120, 150),
  ('10000000-0000-0000-0000-000000000001', 'Élévations latérales', 4, 3, 12, 15, 60, 90),
  ('10000000-0000-0000-0000-000000000001', 'Dips triceps', 5, 3, 10, 15, 90, 120);

-- Pull exercises
insert into exercises_template (workout_id, name, order_index, target_sets, target_reps_min, target_reps_max, target_rest_seconds, rest_after_exercise_seconds) values
  ('10000000-0000-0000-0000-000000000002', 'Tractions lestées', 0, 4, 5, 8, 120, 150),
  ('10000000-0000-0000-0000-000000000002', 'Rowing barre', 1, 4, 6, 10, 120, 150),
  ('10000000-0000-0000-0000-000000000002', 'Tirage poulie haute', 2, 3, 10, 12, 90, 120),
  ('10000000-0000-0000-0000-000000000002', 'Curl barre', 3, 3, 8, 12, 90, 90),
  ('10000000-0000-0000-0000-000000000002', 'Curl haltères', 4, 3, 10, 15, 60, 90),
  ('10000000-0000-0000-0000-000000000002', 'Face pull', 5, 3, 12, 15, 60, 90);

-- Legs exercises
insert into exercises_template (workout_id, name, order_index, target_sets, target_reps_min, target_reps_max, target_rest_seconds, rest_after_exercise_seconds) values
  ('10000000-0000-0000-0000-000000000003', 'Squat', 0, 4, 5, 8, 150, 180),
  ('10000000-0000-0000-0000-000000000003', 'Presse à cuisses', 1, 3, 10, 15, 120, 150),
  ('10000000-0000-0000-0000-000000000003', 'Fentes haltères', 2, 3, 10, 12, 90, 120),
  ('10000000-0000-0000-0000-000000000003', 'Leg curl', 3, 3, 10, 15, 90, 120),
  ('10000000-0000-0000-0000-000000000003', 'Mollets debout', 4, 4, 12, 20, 60, 90),
  ('10000000-0000-0000-0000-000000000003', 'Soulevé de terre roumain', 5, 3, 8, 10, 120, 150);

-- Remove gamification tables completely

-- First drop tables with foreign key dependencies
DROP TABLE IF EXISTS professional_badge_awards CASCADE;
DROP TABLE IF EXISTS professional_goal_progress CASCADE;
DROP TABLE IF EXISTS professional_achievements_log CASCADE;

-- Then drop the main tables
DROP TABLE IF EXISTS professional_stats CASCADE;
DROP TABLE IF EXISTS professional_badges CASCADE;
DROP TABLE IF EXISTS professional_goals CASCADE;
DROP TABLE IF EXISTS professional_levels CASCADE;
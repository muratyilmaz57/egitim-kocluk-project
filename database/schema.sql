CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role ENUM('admin', 'coach', 'student') NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  phone VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  password_changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  refresh_token_hash VARCHAR(255) NULL,
  refresh_token_expires_at DATETIME NULL,
  password_reset_token_hash VARCHAR(255) NULL,
  password_reset_expires_at DATETIME NULL,
  mfa_enabled TINYINT(1) NOT NULL DEFAULT 0,
  mfa_secret TEXT NULL,
  mfa_temp_secret TEXT NULL,
  avatar_url VARCHAR(255) NULL,
  status ENUM('active', 'passive', 'blocked') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role_status (role, status),
  INDEX idx_users_refresh_expires (refresh_token_expires_at),
  INDEX idx_users_password_reset_expires (password_reset_expires_at),
  INDEX idx_users_password_changed_at (password_changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE students (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL UNIQUE,
  coach_id BIGINT UNSIGNED NOT NULL,
  student_code VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  grade_level VARCHAR(30) NOT NULL,
  school_name VARCHAR(150) NULL,
  birth_date DATE NULL,
  target_exam VARCHAR(50) NULL,
  parent_name VARCHAR(150) NULL,
  parent_phone VARCHAR(20) NULL,
  parent_email VARCHAR(191) NULL,
  photo_url VARCHAR(255) NULL,
  enrollment_date DATE NOT NULL,
  status ENUM('active', 'paused', 'graduated') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_students_coach
    FOREIGN KEY (coach_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_students_coach_status (coach_id, status),
  INDEX idx_students_grade_status (grade_level, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  last_used_at DATETIME NULL,
  user_agent VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_user_sessions_user_revoked (user_id, revoked_at),
  INDEX idx_user_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_user_id BIGINT UNSIGNED NULL,
  subject_user_id BIGINT UNSIGNED NULL,
  student_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NULL,
  description VARCHAR(255) NOT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_actor_user
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_audit_logs_subject_user
    FOREIGN KEY (subject_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_audit_logs_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE SET NULL,
  INDEX idx_audit_logs_actor_created (actor_user_id, created_at),
  INDEX idx_audit_logs_subject_created (subject_user_id, created_at),
  INDEX idx_audit_logs_student_created (student_id, created_at),
  INDEX idx_audit_logs_action_created (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lessons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  coach_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  color VARCHAR(20) NULL,
  icon VARCHAR(50) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lessons_coach
    FOREIGN KEY (coach_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_lessons_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE topics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id BIGINT UNSIGNED NOT NULL,
  parent_topic_id BIGINT UNSIGNED NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  grade_level VARCHAR(30) NULL,
  difficulty_level TINYINT UNSIGNED NULL,
  estimated_minutes INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_topics_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_topics_parent
    FOREIGN KEY (parent_topic_id) REFERENCES topics(id)
    ON DELETE SET NULL,
  INDEX idx_topics_lesson_active (lesson_id, is_active),
  INDEX idx_topics_grade (grade_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE study_plans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  coach_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  plan_type ENUM('daily', 'weekly') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('draft', 'active', 'completed', 'archived') NOT NULL DEFAULT 'draft',
  total_target_minutes INT NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_study_plans_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_study_plans_coach
    FOREIGN KEY (coach_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_study_plans_student_dates (student_id, start_date, end_date),
  INDEX idx_study_plans_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tasks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  study_plan_id BIGINT UNSIGNED NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  coach_id BIGINT UNSIGNED NOT NULL,
  lesson_id BIGINT UNSIGNED NULL,
  topic_id BIGINT UNSIGNED NULL,
  title VARCHAR(150) NOT NULL,
  task_type ENUM('study', 'question', 'video', 'exam', 'reading') NOT NULL,
  description TEXT NULL,
  target_question_count INT NOT NULL DEFAULT 0,
  target_minutes INT NOT NULL DEFAULT 0,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  status ENUM('pending', 'in_progress', 'completed', 'missed') NOT NULL DEFAULT 'pending',
  progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  due_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_study_plan
    FOREIGN KEY (study_plan_id) REFERENCES study_plans(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_tasks_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_tasks_coach
    FOREIGN KEY (coach_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_tasks_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_tasks_topic
    FOREIGN KEY (topic_id) REFERENCES topics(id)
    ON DELETE SET NULL,
  INDEX idx_tasks_student_status_due (student_id, status, due_at),
  INDEX idx_tasks_plan (study_plan_id),
  INDEX idx_tasks_lesson_topic (lesson_id, topic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exam_results (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  coach_id BIGINT UNSIGNED NOT NULL,
  exam_name VARCHAR(150) NOT NULL,
  exam_type ENUM('LGS', 'TYT', 'AYT', 'school', 'mock') NOT NULL,
  exam_date DATE NOT NULL,
  duration_minutes INT NULL,
  correct_count INT NOT NULL DEFAULT 0,
  wrong_count INT NOT NULL DEFAULT 0,
  blank_count INT NOT NULL DEFAULT 0,
  total_net DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  score DECIMAL(7,2) NULL,
  rank_in_group INT NULL,
  lesson_breakdown JSON NULL,
  incorrect_topics JSON NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_exam_results_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_exam_results_coach
    FOREIGN KEY (coach_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_exam_results_student_date (student_id, exam_date),
  INDEX idx_exam_results_type_date (exam_type, exam_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pomodoro_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  task_id BIGINT UNSIGNED NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME NULL,
  duration_minutes INT NOT NULL DEFAULT 0,
  break_minutes INT NOT NULL DEFAULT 0,
  session_type ENUM('focus', 'break') NOT NULL DEFAULT 'focus',
  device_type VARCHAR(30) NULL,
  notes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pomodoro_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_pomodoro_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE SET NULL,
  INDEX idx_pomodoro_student_started (student_id, started_at),
  INDEX idx_pomodoro_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sender_user_id BIGINT UNSIGNED NOT NULL,
  receiver_user_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NULL,
  message_type ENUM('text', 'file', 'system') NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  attachment_url VARCHAR(255) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver
    FOREIGN KEY (receiver_user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_messages_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE SET NULL,
  INDEX idx_messages_receiver_read (receiver_user_id, is_read, created_at),
  INDEX idx_messages_student_created (student_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  coach_id BIGINT UNSIGNED NOT NULL,
  note_type ENUM('weekly_report', 'motivation', 'coach_comment', 'meeting', 'reminder') NOT NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  visibility ENUM('private', 'student_visible', 'parent_visible') NOT NULL DEFAULT 'private',
  rating TINYINT UNSIGNED NULL,
  scheduled_for DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notes_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_notes_coach
    FOREIGN KEY (coach_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_notes_student_type_created (student_id, note_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_targets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  note_id BIGINT UNSIGNED NOT NULL,
  target_type ENUM('student', 'parent', 'grade', 'everyone') NOT NULL,
  student_id BIGINT UNSIGNED NULL,
  grade_level VARCHAR(30) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_note_targets_note_type (note_id, target_type),
  INDEX idx_note_targets_student_type (student_id, target_type),
  INDEX idx_note_targets_grade_type (grade_level, target_type)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE resources (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  coach_id BIGINT UNSIGNED NOT NULL,
  lesson_id BIGINT UNSIGNED NULL,
  topic_id BIGINT UNSIGNED NULL,
  resource_type ENUM('pdf', 'video', 'note', 'link', 'book') NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  url VARCHAR(255) NULL,
  file_path VARCHAR(255) NULL,
  thumbnail_url VARCHAR(255) NULL,
  target_grade_level VARCHAR(30) NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_resources_coach
    FOREIGN KEY (coach_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_resources_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_resources_topic
    FOREIGN KEY (topic_id) REFERENCES topics(id)
    ON DELETE SET NULL,
  INDEX idx_resources_lookup (lesson_id, topic_id, resource_type),
  INDEX idx_resources_grade_featured (target_grade_level, is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  recipient_user_id BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  student_id BIGINT UNSIGNED NULL,
  type ENUM('task', 'exam', 'message', 'note', 'plan', 'pomodoro', 'resource') NOT NULL,
  title VARCHAR(160) NOT NULL,
  body VARCHAR(255) NULL,
  href VARCHAR(255) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_recipient
    FOREIGN KEY (recipient_user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_notifications_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_notifications_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE SET NULL,
  INDEX idx_notifications_recipient_read_created (recipient_user_id, is_read, created_at),
  INDEX idx_notifications_student_created (student_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_preferences (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('task', 'exam', 'message', 'note', 'plan', 'pomodoro', 'resource') NOT NULL,
  in_app_enabled TINYINT(1) NOT NULL DEFAULT 1,
  email_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_preferences_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  UNIQUE KEY uniq_notification_preferences_user_type (user_id, type),
  INDEX idx_notification_preferences_user_in_app (user_id, in_app_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

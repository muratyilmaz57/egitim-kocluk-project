CREATE TABLE `note_targets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `note_id` BIGINT UNSIGNED NOT NULL,
  `target_type` ENUM('student', 'parent', 'grade', 'everyone') NOT NULL,
  `student_id` BIGINT UNSIGNED NULL,
  `grade_level` VARCHAR(30) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_note_targets_note_type`(`note_id`, `target_type`),
  INDEX `idx_note_targets_student_type`(`student_id`, `target_type`),
  INDEX `idx_note_targets_grade_type`(`grade_level`, `target_type`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

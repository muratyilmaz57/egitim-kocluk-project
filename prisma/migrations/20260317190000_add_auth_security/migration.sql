ALTER TABLE `users`
  ADD COLUMN `password_changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `mfa_enabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `mfa_secret` TEXT NULL,
  ADD COLUMN `mfa_temp_secret` TEXT NULL;

CREATE INDEX `users_password_changed_at_idx` ON `users`(`password_changed_at`);

ALTER TABLE `users`
  ADD COLUMN `password_reset_token_hash` VARCHAR(255) NULL,
  ADD COLUMN `password_reset_expires_at` DATETIME(3) NULL;

CREATE INDEX `users_password_reset_expires_at_idx` ON `users`(`password_reset_expires_at`);

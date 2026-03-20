ALTER TABLE `users`
    ADD COLUMN `refresh_token_hash` VARCHAR(255) NULL,
    ADD COLUMN `refresh_token_expires_at` DATETIME(3) NULL;

CREATE INDEX `users_refresh_token_expires_at_idx`
    ON `users`(`refresh_token_expires_at`);

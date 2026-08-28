ALTER TABLE `tasks`
  ADD COLUMN `resource_url` VARCHAR(500) NULL,
  ADD COLUMN `resource_file_path` VARCHAR(500) NULL,
  ADD COLUMN `resource_file_name` VARCHAR(255) NULL;

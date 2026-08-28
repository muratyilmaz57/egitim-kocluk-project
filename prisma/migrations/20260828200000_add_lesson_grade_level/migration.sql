ALTER TABLE `lessons` ADD COLUMN `grade_level` VARCHAR(30) NULL AFTER `code`;

UPDATE `lessons` AS `lesson`
SET `lesson`.`grade_level` = (
  SELECT MIN(`topic`.`grade_level`)
  FROM `topics` AS `topic`
  WHERE `topic`.`lesson_id` = `lesson`.`id`
    AND `topic`.`grade_level` IS NOT NULL
);

CREATE INDEX `lessons_grade_level_idx` ON `lessons`(`grade_level`);

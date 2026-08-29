ALTER TABLE `notes`
  DROP FOREIGN KEY `notes_student_id_fkey`;

ALTER TABLE `notes`
  MODIFY `student_id` BIGINT UNSIGNED NULL;

ALTER TABLE `notes`
  ADD CONSTRAINT `notes_student_id_fkey`
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

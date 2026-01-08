CREATE TABLE IF NOT EXISTS `Reminders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `guildId` BIGINT NOT NULL,
  `channelId` BIGINT NOT NULL,
  `userId` BIGINT NOT NULL,
  `receiveUserName` VARCHAR(255) NOT NULL,
  `message` VARCHAR(255) NOT NULL,
  `remindAt` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `deletedAt` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_user_reminder` (`guildId`, `userId`, `deletedAt`),
  INDEX `idx_remind_at` (`remindAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- migration.sql (MySQL compatible)
CREATE TABLE `sessions` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `shop` VARCHAR(255) NOT NULL,
  `state` VARCHAR(255) NOT NULL,
  `isOnline` TINYINT(1) NOT NULL DEFAULT 0,
  `scope` TEXT,
  `expires` DATETIME(3),
  `accessToken` VARCHAR(1024) NOT NULL,
  `userId` BIGINT,
  `firstName` VARCHAR(255),
  `lastName` VARCHAR(255),
  `email` VARCHAR(255),
  `accountOwner` TINYINT(1) NOT NULL DEFAULT 0,
  `locale` VARCHAR(50),
  `collaborator` TINYINT(1) DEFAULT 0,
  `emailVerified` TINYINT(1) DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

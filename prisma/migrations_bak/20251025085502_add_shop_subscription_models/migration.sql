-- CreateTable
CREATE TABLE `Shop` (
    `id` TEXT NOT NULL PRIMARY KEY,
    `domain` TEXT NOT NULL,
    `accessToken` TEXT NOT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE `Subscription` (
    `id` TEXT NOT NULL PRIMARY KEY,
    `shopId` TEXT NOT NULL,
    `plan` TEXT NOT NULL,
    `price` REAL NOT NULL,
    `status` TEXT NOT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL,
    CONSTRAINT `Subscription_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX `Shop_domain_key` ON `Shop`(`domain`);

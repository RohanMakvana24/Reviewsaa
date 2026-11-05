-- CreateTable
CREATE TABLE `GoogleBusinessConnection` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `authorizedUserId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'DISCONNECTED',
    `subjectHash` CHAR(64) NULL,
    `encryptedRefreshToken` TEXT NULL,
    `encryptedAccessToken` TEXT NULL,
    `accessExpiresAt` DATETIME(3) NULL,
    `encryptedRevocationToken` TEXT NULL,
    `revision` INTEGER NOT NULL DEFAULT 1,
    `errorCode` VARCHAR(80) NULL,
    `retryAt` DATETIME(3) NULL,
    `connectedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GoogleBusinessConnection_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoogleBusinessAttempt` (
    `stateHash` CHAR(64) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `revision` INTEGER NOT NULL,
    `encryptedVerifier` TEXT NOT NULL,
    `nonce` VARCHAR(64) NOT NULL,
    `browserHash` CHAR(64) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `GoogleBusinessAttempt_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`stateHash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoogleLocationCandidate` (
    `id` VARCHAR(191) NOT NULL,
    `connectionId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `revision` INTEGER NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `locationName` VARCHAR(191) NOT NULL,
    `title` VARCHAR(512) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `GoogleLocationCandidate_expiresAt_idx`(`expiresAt`),
    UNIQUE INDEX `GoogleLocationCandidate_connectionId_accountName_locationNam_key`(`connectionId`, `accountName`, `locationName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoogleBusinessLocation` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `connectionId` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `locationName` VARCHAR(191) NOT NULL,
    `title` VARCHAR(512) NOT NULL,
    `verification` VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    `syncStatus` VARCHAR(20) NOT NULL DEFAULT 'IDLE',
    `errorCode` VARCHAR(80) NULL,
    `lastSyncAt` DATETIME(3) NULL,
    `lastFullSyncAt` DATETIME(3) NULL,
    `lastSyncRequestedAt` DATETIME(3) NULL,
    `syncLeaseUntil` DATETIME(3) NULL,
    `syncLeaseOwner` VARCHAR(64) NULL,
    `cacheExpiresAt` DATETIME(3) NOT NULL,
    `googleTotalReviewCount` INTEGER NULL,
    `googleAverageRating` DOUBLE NULL,
    `truncated` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `GoogleBusinessLocation_organizationId_key`(`organizationId`),
    UNIQUE INDEX `GoogleBusinessLocation_connectionId_key`(`connectionId`),
    INDEX `GoogleBusinessLocation_cacheExpiresAt_idx`(`cacheExpiresAt`),
    UNIQUE INDEX `GoogleBusinessLocation_id_organizationId_key`(`id`, `organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoogleReviewCache` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `googleReviewId` VARCHAR(191) NOT NULL,
    `content` JSON NOT NULL,
    `googleUpdatedAt` DATETIME(3) NOT NULL,
    `cachedAt` DATETIME(3) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `seenRunId` VARCHAR(64) NOT NULL,

    INDEX `GoogleReviewCache_organizationId_expiresAt_idx`(`organizationId`, `expiresAt`),
    UNIQUE INDEX `GoogleReviewCache_locationId_googleReviewId_key`(`locationId`, `googleReviewId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GoogleBusinessConnection` ADD CONSTRAINT `GoogleBusinessConnection_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoogleBusinessConnection` ADD CONSTRAINT `GoogleBusinessConnection_authorizedUserId_fkey` FOREIGN KEY (`authorizedUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoogleLocationCandidate` ADD CONSTRAINT `GoogleLocationCandidate_connectionId_fkey` FOREIGN KEY (`connectionId`) REFERENCES `GoogleBusinessConnection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoogleBusinessLocation` ADD CONSTRAINT `GoogleBusinessLocation_connectionId_fkey` FOREIGN KEY (`connectionId`) REFERENCES `GoogleBusinessConnection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoogleReviewCache` ADD CONSTRAINT `GoogleReviewCache_locationId_organizationId_fkey` FOREIGN KEY (`locationId`, `organizationId`) REFERENCES `GoogleBusinessLocation`(`id`, `organizationId`) ON DELETE CASCADE ON UPDATE CASCADE;


-- CreateTable
CREATE TABLE `TrialGrant` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `googleSubjectHash` CHAR(64) NOT NULL,
    `emailHash` CHAR(64) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `allowance` INTEGER NOT NULL,
    `used` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TrialGrant_organizationId_key`(`organizationId`),
    UNIQUE INDEX `TrialGrant_googleSubjectHash_key`(`googleSubjectHash`),
    UNIQUE INDEX `TrialGrant_emailHash_key`(`emailHash`),
    INDEX `TrialGrant_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrialUsageReservation` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `actorUserId` VARCHAR(191) NOT NULL,
    `idempotencyKey` VARCHAR(80) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TrialUsageReservation_organizationId_idempotencyKey_key`(`organizationId`, `idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BusinessOnboarding` (
    `organizationId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(100) NULL,
    `city` VARCHAR(100) NULL,
    `phone` VARCHAR(30) NULL,
    `businessSavedAt` DATETIME(3) NULL,
    `greeting` VARCHAR(160) NULL,
    `accentColor` VARCHAR(7) NULL,
    `qrSavedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`organizationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactInquiry` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(320) NOT NULL,
    `business` VARCHAR(100) NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ContactInquiry_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BusinessOnboarding` ADD CONSTRAINT `BusinessOnboarding_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- Existing workspaces retain their original creation date; deployment/relogin
-- must never restart their trial. Unique identity/email claims allow one trial.
INSERT IGNORE INTO `TrialGrant`
 (`id`, `organizationId`, `googleSubjectHash`, `emailHash`, `startedAt`, `expiresAt`, `allowance`, `used`, `createdAt`)
 SELECT UUID(), o.id, SHA2(u.googleSubject,256), SHA2(LOWER(TRIM(u.email)),256), o.createdAt, DATE_ADD(o.createdAt, INTERVAL 14 DAY), 20, 0, CURRENT_TIMESTAMP(3)
 FROM `Organization` o
 JOIN `Membership` m ON m.organizationId=o.id
 JOIN `User` u ON u.id=m.userId
 ORDER BY o.createdAt ASC, o.id ASC, u.id ASC;

-- =============================================================================
-- Garage Inventory Management System — MySQL Schema
-- =============================================================================
-- Run this against your MySQL database before deploying the backend.
-- If you set spring.jpa.hibernate.ddl-auto=update, Hibernate will create
-- the tables automatically and you can skip this file.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS garage_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE garage_db;

-- =============================================================================
-- USERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)     NOT NULL UNIQUE,
    email       VARCHAR(100)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,
    full_name   VARCHAR(100)    NOT NULL,
    role        VARCHAR(20)     NOT NULL DEFAULT 'ROLE_STOREKEEPER',
    enabled     BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (role),
    INDEX idx_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PARTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS parts (
    id                BIGINT          AUTO_INCREMENT PRIMARY KEY,
    part_number       VARCHAR(100)    NOT NULL UNIQUE,
    our_part_number   VARCHAR(100)    DEFAULT NULL,
    name              VARCHAR(200)    NOT NULL,
    model             VARCHAR(100)    DEFAULT NULL,
    manufacturer      VARCHAR(100)    DEFAULT NULL,
    location          VARCHAR(50)     DEFAULT NULL,
    warehouse         VARCHAR(50)     DEFAULT NULL,
    unit              VARCHAR(20)     NOT NULL DEFAULT 'pcs',
    current_quantity  INT             NOT NULL DEFAULT 0,
    minimum_quantity  INT             NOT NULL DEFAULT 0,
    created_at        DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_parts_manufacturer (manufacturer),
    INDEX idx_parts_model (model),
    INDEX idx_parts_low_stock (current_quantity, minimum_quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- STOCK TRANSACTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS stock_transactions (
    id           BIGINT          AUTO_INCREMENT PRIMARY KEY,
    part_id      BIGINT          NOT NULL,
    type         VARCHAR(10)     NOT NULL COMMENT 'IN or OUT',
    quantity     INT             NOT NULL,
    note         VARCHAR(500)    DEFAULT NULL,
    source_type  VARCHAR(20)     DEFAULT NULL COMMENT 'JOB_CARD or MANUAL',
    source_id    VARCHAR(100)    DEFAULT NULL,
    created_by   BIGINT          NOT NULL,
    created_at   DATETIME        DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_stock_part (part_id),
    INDEX idx_stock_type (type),
    INDEX idx_stock_created_at (created_at),
    INDEX idx_stock_source (source_type, source_id),
    CONSTRAINT fk_stock_part FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- JOB CARDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS job_cards (
    id                   BIGINT          AUTO_INCREMENT PRIMARY KEY,
    job_number           VARCHAR(50)     NOT NULL UNIQUE,
    customer_name        VARCHAR(100)    NOT NULL,
    customer_phone       VARCHAR(30)     DEFAULT NULL,
    vehicle_registration VARCHAR(30)     DEFAULT NULL,
    vehicle_model        VARCHAR(100)    DEFAULT NULL,
    requested_work       TEXT            DEFAULT NULL,
    technical_report     TEXT            DEFAULT NULL,
    work_completed       TEXT            DEFAULT NULL,
    status               VARCHAR(20)     NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN, IN_PROGRESS, COMPLETED, CANCELLED',
    created_by           BIGINT          NOT NULL,
    created_at           DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_job_status (status),
    INDEX idx_job_created_at (created_at),
    INDEX idx_job_customer (customer_name),
    CONSTRAINT fk_job_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- JOB CARD PARTS (parts used on a job)
-- =============================================================================
CREATE TABLE IF NOT EXISTS job_card_parts (
    id          BIGINT      AUTO_INCREMENT PRIMARY KEY,
    job_card_id BIGINT      NOT NULL,
    part_id     BIGINT      NOT NULL,
    quantity    INT         NOT NULL,
    created_at  DATETIME    DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_jcp_job (job_card_id),
    INDEX idx_jcp_part (part_id),
    CONSTRAINT fk_jcp_job FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    CONSTRAINT fk_jcp_part FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

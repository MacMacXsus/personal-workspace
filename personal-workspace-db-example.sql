-- MySQL script to create the personal-workspace-db database
-- Works with Aiven MySQL service

CREATE DATABASE IF NOT EXISTS `personal-workspace-db`;

USE `personal-workspace-db`;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    google_sub VARCHAR(255) NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NULL,
    avatar_url VARCHAR(512) NULL,
    email_verified_at TIMESTAMP NULL DEFAULT NULL,
    email_verification_token_hash CHAR(64) NULL,
    email_verification_code_hash CHAR(64) NULL,
    email_verification_expires_at DATETIME NULL DEFAULT NULL,
    email_verification_sent_at TIMESTAMP NULL DEFAULT NULL,
    password_reset_token_hash CHAR(64) NULL,
    password_reset_code_hash CHAR(64) NULL,
    password_reset_expires_at DATETIME NULL DEFAULT NULL,
    password_reset_sent_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_users_google_sub (google_sub),
    UNIQUE KEY uniq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    session_token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_sessions_token_hash (session_token_hash),
    KEY idx_sessions_user_id (user_id),
    KEY idx_sessions_expires_at (expires_at),
    CONSTRAINT fk_sessions_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

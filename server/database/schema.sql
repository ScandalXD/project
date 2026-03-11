CREATE DATABASE IF NOT EXISTS cocktailapp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cocktailapp;
/*
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS public_cocktails;
DROP TABLE IF EXISTS user_cocktails;
DROP TABLE IF EXISTS catalog_cocktails;
DROP TABLE IF EXISTS users;
*/
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  nickname VARCHAR(50) NOT NULL UNIQUE,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE catalog_cocktails (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('Alkoholowy', 'Bezalkoholowy') NOT NULL,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  image VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_cocktails (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  category ENUM('Alkoholowy', 'Bezalkoholowy') NOT NULL,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  image VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_cocktails_owner
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE public_cocktails (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  author_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  category ENUM('Alkoholowy', 'Bezalkoholowy') NOT NULL,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  image VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_public_cocktails_author
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE favorites (
  user_id BIGINT NOT NULL,
  cocktail_id VARCHAR(50) NOT NULL,
  cocktail_type ENUM('catalog', 'public') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, cocktail_id, cocktail_type),
  CONSTRAINT fk_favorites_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
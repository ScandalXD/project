CREATE DATABASE IF NOT EXISTS cocktailapp
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE cocktailapp;


CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL UNIQUE,
  role ENUM('user', 'admin', 'superadmin') NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
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
  publication_status ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
  moderation_reason TEXT NULL,
  submitted_at DATETIME NULL,
  moderated_at DATETIME NULL,
  moderated_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_cocktails_owner
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_cocktails_moderated_by
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE public_cocktails (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  source_cocktail_id BIGINT NOT NULL UNIQUE,
  author_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  category ENUM('Alkoholowy', 'Bezalkoholowy') NOT NULL,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  image VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_public_cocktails_source
    FOREIGN KEY (source_cocktail_id) REFERENCES user_cocktails(id) ON DELETE CASCADE,
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

CREATE TABLE cocktail_likes (
  user_id BIGINT NOT NULL,
  cocktail_id VARCHAR(100) NOT NULL,
  cocktail_type ENUM('catalog', 'public') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, cocktail_id, cocktail_type),
  CONSTRAINT fk_cocktail_likes_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cocktail_comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  cocktail_id VARCHAR(100) NOT NULL,
  cocktail_type ENUM('catalog', 'public') NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cocktail_comments_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cocktail_comments_parent
    FOREIGN KEY (parent_comment_id) REFERENCES cocktail_comments(id) ON DELETE CASCADE
);

CREATE TABLE comment_likes (
  user_id BIGINT NOT NULL,
  comment_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, comment_id),

  CONSTRAINT fk_comment_likes_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_likes_comment
    FOREIGN KEY (comment_id) REFERENCES cocktail_comments(id) ON DELETE CASCADE
);

CREATE TABLE comment_mentions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  comment_id BIGINT NOT NULL,
  mentioned_user_id BIGINT NOT NULL,
  mentioned_by_user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_comment_mentions_comment
    FOREIGN KEY (comment_id) REFERENCES cocktail_comments(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_mentions_mentioned_user
    FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_mentions_actor_user
    FOREIGN KEY (mentioned_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_comment_mentioned_user (comment_id, mentioned_user_id)
);

CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type ENUM('mention', 'cocktail_like', 'cocktail_comment', 'comment_like', 'comment_reply', 'report_public_cocktail_removed',
            'report_comment_deleted', 'report_rejected', 'cocktail_approved', 'cocktail_rejected',
            'role_changed', 'public_cocktail_deleted', 'admin_comment_deleted',
            'friend_request_received', 'friend_request_accepted') NOT NULL,
  admin_reason TEXT NULL,
  actor_user_id BIGINT NULL,
  recipe_id VARCHAR(100) NULL,
  recipe_type ENUM('catalog', 'public', 'user') NULL,
  comment_id BIGINT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_actor_user
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_notifications_comment
    FOREIGN KEY (comment_id) REFERENCES cocktail_comments(id) ON DELETE CASCADE
);

CREATE TABLE friendships (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  requester_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'blocked') NOT NULL DEFAULT 'pending',
  blocked_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_friendships_requester
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friendships_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friendships_blocked_by
    FOREIGN KEY (blocked_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_friendships_not_self
    CHECK (requester_id <> receiver_id),
  UNIQUE KEY uq_friendships_direction (requester_id, receiver_id),
  INDEX idx_friendships_requester_status (requester_id, status),
  INDEX idx_friendships_receiver_status (receiver_id, status),
  INDEX idx_friendships_blocked_by (blocked_by)
);

CREATE TABLE reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reporter_user_id BIGINT NOT NULL,
  target_type ENUM('public_cocktail', 'comment') NOT NULL,
  target_id BIGINT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  admin_reason TEXT NULL,
  details TEXT NULL,
  status ENUM('open', 'reviewed') NOT NULL DEFAULT 'open',
  reviewed_by BIGINT NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_reporter
    FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

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
            'friend_request_received', 'friend_request_accepted',
            'new_message', 'cocktail_shared', 'admin_warning', 'chat_muted',
            'chat_banned') NOT NULL,
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
  status_before_block ENUM('pending', 'accepted', 'rejected') NULL,
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

CREATE TABLE user_chat_status (
  user_id BIGINT PRIMARY KEY,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at DATETIME NULL,
  muted_until DATETIME NULL,
  is_chat_banned BOOLEAN NOT NULL DEFAULT FALSE,
  chat_banned_until DATETIME NULL,
  strike_count INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_chat_status_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_chat_status_online (is_online),
  INDEX idx_user_chat_status_muted_until (muted_until),
  INDEX idx_user_chat_status_banned (is_chat_banned),
  INDEX idx_user_chat_status_chat_banned_until (chat_banned_until)
);

CREATE TABLE user_penalties (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  admin_id BIGINT NULL,
  type ENUM('warning', 'mute', 'chat_ban') NOT NULL,
  reason TEXT NOT NULL,
  muted_until DATETIME NULL,
  banned_until DATETIME NULL,
  is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_penalties_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_penalties_admin
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_penalties_user_created (user_id, created_at),
  INDEX idx_user_penalties_type (type)
);

CREATE TABLE conversations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('private') NOT NULL DEFAULT 'private',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_conversations_updated_at (updated_at)
);

CREATE TABLE conversation_participants (
  conversation_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  last_read_message_id BIGINT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_marked_unread BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at DATETIME NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (conversation_id, user_id),
  CONSTRAINT fk_conversation_participants_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_participants_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_conversation_participants_user (user_id),
  INDEX idx_conversation_participants_user_deleted (user_id, deleted_at),
  INDEX idx_conversation_participants_user_pinned (user_id, is_pinned),
  INDEX idx_conversation_participants_last_read (last_read_message_id)
);

CREATE TABLE messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  reply_to_message_id BIGINT NULL,
  message_type ENUM('text', 'cocktail_share', 'image', 'file', 'voice', 'system') NOT NULL,
  content TEXT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_reply
    FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL,
  INDEX idx_messages_conversation_created (conversation_id, created_at),
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_reply (reply_to_message_id),
  INDEX idx_messages_type (message_type)
);

CREATE TABLE message_reads (
  message_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id, user_id),
  CONSTRAINT fk_message_reads_message
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_reads_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_message_reads_user (user_id)
);

CREATE TABLE message_deletions (
  message_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id, user_id),
  CONSTRAINT fk_message_deletions_message
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_deletions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_message_deletions_user (user_id)
);

CREATE TABLE message_reactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  message_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  emoji VARCHAR(16) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_message_reactions_message
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_reactions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_message_reactions_user (message_id, user_id),
  INDEX idx_message_reactions_message (message_id),
  INDEX idx_message_reactions_user (user_id)
);

CREATE TABLE message_pins (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  message_id BIGINT NOT NULL,
  pinned_by BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_message_pins_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_pins_message
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_pins_pinned_by
    FOREIGN KEY (pinned_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_message_pins_message (message_id),
  INDEX idx_message_pins_conversation (conversation_id, created_at),
  INDEX idx_message_pins_pinned_by (pinned_by)
);

CREATE TABLE chat_reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reporter_user_id BIGINT NOT NULL,
  target_type ENUM('message', 'user') NOT NULL,
  target_user_id BIGINT NOT NULL,
  message_id BIGINT NULL,
  reason ENUM('spam', 'harassment', 'abuse', 'inappropriate_content', 'scam', 'fake_account', 'other') NOT NULL,
  details TEXT NULL,
  status ENUM('open', 'reviewed', 'rejected') NOT NULL DEFAULT 'open',
  reviewed_by BIGINT NULL,
  reviewed_at DATETIME NULL,
  admin_reason TEXT NULL,
  action_taken ENUM('dismiss', 'delete_message', 'warn', 'mute', 'temporary_chat_ban', 'permanent_chat_ban') NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_reports_reporter
    FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_reports_target_user
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_reports_message
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL,
  CONSTRAINT fk_chat_reports_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_chat_reports_status_created (status, created_at),
  INDEX idx_chat_reports_target_user (target_user_id),
  INDEX idx_chat_reports_message (message_id),
  INDEX idx_chat_reports_reporter (reporter_user_id)
);

CREATE TABLE reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reporter_user_id BIGINT NOT NULL,
  target_type ENUM('public_cocktail', 'comment') NOT NULL,
  target_id BIGINT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  admin_reason TEXT NULL,
  details TEXT NULL,
  status ENUM('open', 'reviewed', 'rejected') NOT NULL DEFAULT 'open',
  reviewed_by BIGINT NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_reporter
    FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

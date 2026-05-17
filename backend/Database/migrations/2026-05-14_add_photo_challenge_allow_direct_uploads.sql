ALTER TABLE photo_challenges ADD COLUMN allow_direct_uploads TINYINT(1) NOT NULL DEFAULT 0 AFTER submission_limit_per_user;

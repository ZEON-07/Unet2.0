CREATE TABLE `admin_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_user_id` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text,
	`metadata` text,
	`client_ip` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `pen_brands` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo_url` text,
	`country_of_origin` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pen_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`pen_model_id` text NOT NULL,
	`source_id` text,
	`purchased_at` text,
	`mileage_claimed` real,
	`ink_flow_rating` integer,
	`notes` text,
	`is_verified` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pen_model_id`) REFERENCES `pen_models`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`source_id`) REFERENCES `pen_sources`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `pen_models` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`flow_category` text NOT NULL,
	`barrel_visibility` text NOT NULL,
	`nominal_mileage_m` real,
	`community_mileage_m` real,
	`image_url` text,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `pen_brands`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `pen_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`source_type` text NOT NULL,
	`name` text NOT NULL,
	`url` text,
	`country_code` text(2),
	`is_verified` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` text PRIMARY KEY NOT NULL,
	`pen_model_id` text NOT NULL,
	`predicted_mileage_m` real NOT NULL,
	`confidence` text NOT NULL,
	`model_version` text NOT NULL,
	`sample_size` integer DEFAULT 0 NOT NULL,
	`metadata` text,
	`computed_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`pen_model_id`) REFERENCES `pen_models`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `search_lookups` (
	`id` text PRIMARY KEY NOT NULL,
	`query` text NOT NULL,
	`pen_model_id` text,
	`result_count` integer DEFAULT 0 NOT NULL,
	`client_ip_hash` text,
	`searched_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`pen_model_id`) REFERENCES `pen_models`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`password_hash` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_logs_admin_idx` ON `admin_audit_logs` (`admin_user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_idx` ON `admin_audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_logs_target_idx` ON `admin_audit_logs` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_idx` ON `admin_audit_logs` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `pen_brands_slug_unique` ON `pen_brands` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `pen_brands_slug_idx` ON `pen_brands` (`slug`);--> statement-breakpoint
CREATE INDEX `pen_claims_user_idx` ON `pen_claims` (`user_id`);--> statement-breakpoint
CREATE INDEX `pen_claims_model_idx` ON `pen_claims` (`pen_model_id`);--> statement-breakpoint
CREATE INDEX `pen_claims_source_idx` ON `pen_claims` (`source_id`);--> statement-breakpoint
CREATE INDEX `pen_claims_created_idx` ON `pen_claims` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `pen_models_slug_unique` ON `pen_models` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `pen_models_slug_idx` ON `pen_models` (`slug`);--> statement-breakpoint
CREATE INDEX `pen_models_brand_idx` ON `pen_models` (`brand_id`);--> statement-breakpoint
CREATE INDEX `pen_models_flow_idx` ON `pen_models` (`flow_category`);--> statement-breakpoint
CREATE INDEX `pen_models_visibility_idx` ON `pen_models` (`barrel_visibility`);--> statement-breakpoint
CREATE INDEX `pen_sources_type_idx` ON `pen_sources` (`source_type`);--> statement-breakpoint
CREATE INDEX `pen_sources_country_idx` ON `pen_sources` (`country_code`);--> statement-breakpoint
CREATE INDEX `predictions_model_idx` ON `predictions` (`pen_model_id`);--> statement-breakpoint
CREATE INDEX `predictions_computed_idx` ON `predictions` (`computed_at`);--> statement-breakpoint
CREATE INDEX `predictions_confidence_idx` ON `predictions` (`confidence`);--> statement-breakpoint
CREATE INDEX `search_lookups_query_idx` ON `search_lookups` (`query`);--> statement-breakpoint
CREATE INDEX `search_lookups_model_idx` ON `search_lookups` (`pen_model_id`);--> statement-breakpoint
CREATE INDEX `search_lookups_searched_at_idx` ON `search_lookups` (`searched_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);
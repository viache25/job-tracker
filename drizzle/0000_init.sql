CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text,
	`url_hash` text,
	`source` text,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`city` text,
	`country` text,
	`work_mode` text,
	`salary_min` real,
	`salary_max` real,
	`salary_currency` text,
	`salary_period` text,
	`salary_is_net` integer,
	`salary_monthly_gross` real,
	`employment_type` text,
	`stack` text DEFAULT '[]' NOT NULL,
	`language` text,
	`posted_at` text,
	`deadline` text,
	`description` text,
	`stage_id` text NOT NULL,
	`notes` text,
	`contact_name` text,
	`contact_email` text,
	`custom` text DEFAULT '{}' NOT NULL,
	`field_sources` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text,
	`deleted_at` text,
	FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `applications_stage_idx` ON `applications` (`stage_id`);--> statement-breakpoint
CREATE INDEX `applications_url_hash_idx` ON `applications` (`url_hash`);--> statement-breakpoint
CREATE INDEX `applications_updated_idx` ON `applications` (`updated_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`from_stage_id` text,
	`to_stage_id` text NOT NULL,
	`at` text NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stage_events_application_idx` ON `stage_events` (`application_id`);--> statement-breakpoint
CREATE TABLE `stages` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`position` integer NOT NULL,
	`kind` text NOT NULL,
	`needs_action` integer DEFAULT false NOT NULL,
	`hidden` integer DEFAULT false NOT NULL
);

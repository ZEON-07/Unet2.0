-- =============================================================================
-- Migration 0004 – Make predictions.pen_model_id nullable
-- Allows persisting predictions calculated for manually entered / unlisted pens.
-- =============================================================================

CREATE TABLE `predictions_new` (
	`id` text PRIMARY KEY NOT NULL,
	`pen_model_id` text,
	`predicted_mileage_m` real NOT NULL,
	`confidence` text NOT NULL,
	`model_version` text NOT NULL,
	`sample_size` integer DEFAULT 0 NOT NULL,
	`result_json` text,
	`metadata` text,
	`computed_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`pen_model_id`) REFERENCES `pen_models`(`id`) ON UPDATE no action ON DELETE cascade
);

INSERT INTO `predictions_new` (
  `id`, `pen_model_id`, `predicted_mileage_m`, `confidence`,
  `model_version`, `sample_size`, `result_json`, `metadata`, `computed_at`
)
SELECT
  `id`, `pen_model_id`, `predicted_mileage_m`, `confidence`,
  `model_version`, `sample_size`, `result_json`, `metadata`, `computed_at`
FROM `predictions`;

DROP TABLE `predictions`;

ALTER TABLE `predictions_new` RENAME TO `predictions`;

CREATE INDEX `predictions_model_idx` ON `predictions` (`pen_model_id`);
CREATE INDEX `predictions_computed_idx` ON `predictions` (`computed_at`);
CREATE INDEX `predictions_confidence_idx` ON `predictions` (`confidence`);

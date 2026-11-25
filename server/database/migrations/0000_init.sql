CREATE TABLE `accounts` (
	`id` char(36) NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`provider_id` varchar(64) NOT NULL,
	`user_id` char(36) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` datetime(3),
	`refresh_token_expires_at` datetime(3),
	`scope` text,
	`password` text,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `addresses` (
	`id` char(36) NOT NULL,
	`customer_id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`line1` varchar(255) NOT NULL,
	`line2` varchar(255),
	`city` varchar(120) NOT NULL,
	`postal_code` varchar(32) NOT NULL,
	`region` varchar(120),
	`country` char(2) NOT NULL,
	`phone` varchar(40),
	`is_default` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `addresses_id` PRIMARY KEY(`id`),
	CONSTRAINT `addresses_country_iso` CHECK(REGEXP_LIKE(`addresses`.`country`, '^[A-Z]{2}$', 'c'))
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` char(36) NOT NULL,
	`user_id` char(36),
	`email` varchar(255) NOT NULL,
	`name` varchar(255),
	`stripe_customer_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
	`locale` enum('en','es','ca') NOT NULL DEFAULT 'en',
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_user_unique` UNIQUE(`user_id`),
	CONSTRAINT `customers_stripe_unique` UNIQUE(`stripe_customer_id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`variant_id` char(36) NOT NULL,
	`quantity_total` int NOT NULL,
	`quantity_reserved` int NOT NULL DEFAULT 0,
	`quantity_sold` int NOT NULL DEFAULT 0,
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `inventory_variant_id` PRIMARY KEY(`variant_id`),
	CONSTRAINT `inventory_non_negative` CHECK(`inventory`.`quantity_total` >= 0 AND `inventory`.`quantity_reserved` >= 0 AND `inventory`.`quantity_sold` >= 0),
	CONSTRAINT `inventory_no_oversell` CHECK(`inventory`.`quantity_reserved` + `inventory`.`quantity_sold` <= `inventory`.`quantity_total`)
);
--> statement-breakpoint
CREATE TABLE `inventory_reservations` (
	`id` char(36) NOT NULL,
	`variant_id` char(36) NOT NULL,
	`quantity` int NOT NULL,
	`status` enum('active','committed','released','expired') NOT NULL DEFAULT 'active',
	`reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `inventory_reservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_reservations_reference_variant` UNIQUE(`reference`,`variant_id`),
	CONSTRAINT `inventory_reservations_quantity_positive` CHECK(`inventory_reservations`.`quantity` > 0)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` char(36) NOT NULL,
	`order_id` char(36) NOT NULL,
	`variant_id` char(36) NOT NULL,
	`title_snapshot` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`unit_amount` int NOT NULL,
	`total_amount` int NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `order_items_quantity_positive` CHECK(`order_items`.`quantity` > 0),
	CONSTRAINT `order_items_unit_non_negative` CHECK(`order_items`.`unit_amount` >= 0),
	CONSTRAINT `order_items_total_consistent` CHECK(`order_items`.`total_amount` = `order_items`.`unit_amount` * `order_items`.`quantity`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` char(36) NOT NULL,
	`number` varchar(32) NOT NULL,
	`customer_id` char(36),
	`email` varchar(255) NOT NULL,
	`status` enum('pending','awaiting_payment','paid','fulfilled','shipped','delivered','cancelled','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
	`locale` enum('en','es','ca') NOT NULL DEFAULT 'en',
	`currency` char(3) NOT NULL DEFAULT 'EUR',
	`subtotal_amount` int NOT NULL,
	`shipping_amount` int NOT NULL DEFAULT 0,
	`tax_amount` int NOT NULL DEFAULT 0,
	`total_amount` int NOT NULL,
	`shipping_method_id` char(36),
	`shipping_address` json,
	`idempotency_key` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`stripe_checkout_session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
	`stripe_payment_intent_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_number_unique` UNIQUE(`number`),
	CONSTRAINT `orders_idempotency_unique` UNIQUE(`idempotency_key`),
	CONSTRAINT `orders_stripe_session_unique` UNIQUE(`stripe_checkout_session_id`),
	CONSTRAINT `orders_stripe_pi_unique` UNIQUE(`stripe_payment_intent_id`),
	CONSTRAINT `orders_amounts_non_negative` CHECK(`orders`.`subtotal_amount` >= 0 AND `orders`.`shipping_amount` >= 0 AND `orders`.`tax_amount` >= 0),
	CONSTRAINT `orders_total_consistent` CHECK(`orders`.`total_amount` = `orders`.`subtotal_amount` + `orders`.`shipping_amount` + `orders`.`tax_amount`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` char(36) NOT NULL,
	`order_id` char(36) NOT NULL,
	`provider` varchar(32) NOT NULL DEFAULT 'stripe',
	`provider_payment_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`status` enum('pending','succeeded','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
	`amount` int NOT NULL,
	`refunded_amount` int NOT NULL DEFAULT 0,
	`currency` char(3) NOT NULL DEFAULT 'EUR',
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_provider_id_unique` UNIQUE(`provider_payment_id`),
	CONSTRAINT `payments_amounts_valid` CHECK(`payments`.`amount` >= 0 AND `payments`.`refunded_amount` >= 0 AND `payments`.`refunded_amount` <= `payments`.`amount`)
);
--> statement-breakpoint
CREATE TABLE `product_translations` (
	`product_id` char(36) NOT NULL,
	`locale` enum('en','es','ca') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	CONSTRAINT `product_translations_product_id_locale_pk` PRIMARY KEY(`product_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` char(36) NOT NULL,
	`product_id` char(36) NOT NULL,
	`sku` varchar(40) NOT NULL,
	`name` varchar(255) NOT NULL,
	`price_amount` int NOT NULL,
	`currency` char(3) NOT NULL DEFAULT 'EUR',
	`stripe_price_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
	`billing_interval` enum('month','year'),
	`interval_count` int,
	`active` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_variants_sku_unique` UNIQUE(`sku`),
	CONSTRAINT `product_variants_stripe_price_unique` UNIQUE(`stripe_price_id`),
	CONSTRAINT `product_variants_price_non_negative` CHECK(`product_variants`.`price_amount` >= 0),
	CONSTRAINT `product_variants_currency_upper` CHECK(REGEXP_LIKE(`product_variants`.`currency`, '^[A-Z]{3}$', 'c')),
	CONSTRAINT `product_variants_interval_pair` CHECK((`product_variants`.`billing_interval` IS NULL) = (`product_variants`.`interval_count` IS NULL) AND (`product_variants`.`interval_count` IS NULL OR `product_variants`.`interval_count` > 0))
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` char(36) NOT NULL,
	`slug` varchar(80) NOT NULL,
	`type` enum('original','print','art_mail_single','art_mail_subscription','art_mail_gift','limited_edition') NOT NULL,
	`collection_id` char(36),
	`artwork_id` char(36),
	`active` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `products_original_has_artwork` CHECK(`products`.`type` <> 'original' OR `products`.`artwork_id` IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` char(36) NOT NULL,
	`key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`count` int NOT NULL,
	`last_request` bigint NOT NULL,
	CONSTRAINT `rate_limits_id` PRIMARY KEY(`id`),
	CONSTRAINT `rate_limits_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` char(36) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`ip_address` varchar(64),
	`user_agent` text,
	`user_id` char(36) NOT NULL,
	`impersonated_by` char(36),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` char(36) NOT NULL,
	`order_id` char(36) NOT NULL,
	`shipping_method_id` char(36),
	`status` enum('pending','label_created','shipped','in_transit','delivered','returned','lost') NOT NULL DEFAULT 'pending',
	`carrier` varchar(120),
	`tracking_reference` varchar(120),
	`shipped_at` datetime(3),
	`delivered_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipping_methods` (
	`id` char(36) NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`carrier` varchar(120),
	`price_amount` int NOT NULL,
	`currency` char(3) NOT NULL DEFAULT 'EUR',
	`countries` json NOT NULL,
	`active` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `shipping_methods_id` PRIMARY KEY(`id`),
	CONSTRAINT `shipping_methods_code_unique` UNIQUE(`code`),
	CONSTRAINT `shipping_methods_price_non_negative` CHECK(`shipping_methods`.`price_amount` >= 0)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` char(36) NOT NULL,
	`customer_id` char(36) NOT NULL,
	`stripe_customer_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`stripe_subscription_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`status` enum('incomplete','incomplete_expired','trialing','active','past_due','canceled','unpaid','paused') NOT NULL,
	`price_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`variant_id` char(36),
	`current_period_start` datetime(3),
	`current_period_end` datetime(3),
	`cancel_at_period_end` boolean NOT NULL DEFAULT false,
	`is_gift` boolean NOT NULL DEFAULT false,
	`gift_recipient_email` varchar(255),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_stripe_unique` UNIQUE(`stripe_subscription_id`),
	CONSTRAINT `subscriptions_gift_recipient` CHECK(NOT `subscriptions`.`is_gift` OR `subscriptions`.`gift_recipient_email` IS NOT NULL),
	CONSTRAINT `subscriptions_period_order` CHECK(`subscriptions`.`current_period_start` IS NULL OR `subscriptions`.`current_period_end` IS NULL OR `subscriptions`.`current_period_end` > `subscriptions`.`current_period_start`)
);
--> statement-breakpoint
CREATE TABLE `two_factors` (
	`id` char(36) NOT NULL,
	`secret` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`backup_codes` text NOT NULL,
	`user_id` char(36) NOT NULL,
	`verified` boolean DEFAULT true,
	`failed_verification_count` int DEFAULT 0,
	`locked_until` datetime(3),
	CONSTRAINT `two_factors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`two_factor_enabled` boolean DEFAULT false,
	`role` varchar(64) DEFAULT 'user',
	`banned` boolean DEFAULT false,
	`ban_reason` text,
	`ban_expires` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` char(36) NOT NULL,
	`identifier` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`value` text NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `artists` (
	`id` char(36) NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `artists_id` PRIMARY KEY(`id`),
	CONSTRAINT `artists_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `artwork_translations` (
	`artwork_id` char(36) NOT NULL,
	`locale` enum('en','es','ca') NOT NULL,
	`title` varchar(255),
	`description` text,
	`image_alt` text,
	CONSTRAINT `artwork_translations_artwork_id_locale_pk` PRIMARY KEY(`artwork_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `artworks` (
	`id` char(36) NOT NULL,
	`artist_id` char(36) NOT NULL,
	`slug` varchar(80) NOT NULL,
	`status` enum('available','sold','archived') NOT NULL,
	`featured` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`year` int,
	`medium` varchar(200),
	`width_cm` decimal(6,1),
	`height_cm` decimal(6,1),
	`depth_cm` decimal(6,1),
	`image` json,
	`gallery` json NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `artworks_id` PRIMARY KEY(`id`),
	CONSTRAINT `artworks_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `artworks_year_range` CHECK(`artworks`.`year` IS NULL OR `artworks`.`year` BETWEEN 1900 AND 2200),
	CONSTRAINT `artworks_dimensions_positive` CHECK((`artworks`.`width_cm` IS NULL OR `artworks`.`width_cm` > 0) AND (`artworks`.`height_cm` IS NULL OR `artworks`.`height_cm` > 0) AND (`artworks`.`depth_cm` IS NULL OR `artworks`.`depth_cm` > 0)),
	CONSTRAINT `artworks_dimensions_pair` CHECK((`artworks`.`width_cm` IS NULL) = (`artworks`.`height_cm` IS NULL))
);
--> statement-breakpoint
CREATE TABLE `collection_translations` (
	`collection_id` char(36) NOT NULL,
	`locale` enum('en','es','ca') NOT NULL,
	`tagline` varchar(255) NOT NULL,
	`description` text NOT NULL,
	CONSTRAINT `collection_translations_collection_id_locale_pk` PRIMARY KEY(`collection_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` char(36) NOT NULL,
	`slug` varchar(80) NOT NULL,
	`number` varchar(32) NOT NULL,
	`title` varchar(255) NOT NULL,
	`edition_size` int NOT NULL,
	`accent` varchar(32) NOT NULL DEFAULT 'tomato',
	`contents` json NOT NULL,
	`active` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `collections_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `collections_edition_size_positive` CHECK(`collections`.`edition_size` > 0)
);
--> statement-breakpoint
CREATE TABLE `admin_audit_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`actor_user_id` char(36),
	`action` varchar(80) NOT NULL,
	`entity_type` varchar(40) NOT NULL,
	`entity_id` varchar(120),
	`changes` json,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `admin_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` char(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`locale` enum('en','es','ca') NOT NULL DEFAULT 'en',
	`status` enum('pending','subscribed','unsubscribed') NOT NULL DEFAULT 'pending',
	`consent_at` datetime(3) NOT NULL,
	`consent_source` varchar(120) NOT NULL,
	`confirmation_token_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
	`confirmed_at` datetime(3),
	`unsubscribed_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`provider` varchar(32) NOT NULL DEFAULT 'stripe',
	`type` varchar(120) NOT NULL,
	`status` enum('received','processed','failed') NOT NULL DEFAULT 'received',
	`error` text,
	`received_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`processed_at` datetime(3),
	CONSTRAINT `webhook_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_reservations` ADD CONSTRAINT `inventory_reservations_variant_id_inventory_variant_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `inventory`(`variant_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_shipping_method_id_shipping_methods_id_fk` FOREIGN KEY (`shipping_method_id`) REFERENCES `shipping_methods`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_translations` ADD CONSTRAINT `product_translations_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_collection_id_collections_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_artwork_id_artworks_id_fk` FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_shipping_method_id_shipping_methods_id_fk` FOREIGN KEY (`shipping_method_id`) REFERENCES `shipping_methods`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `two_factors` ADD CONSTRAINT `two_factors_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `artwork_translations` ADD CONSTRAINT `artwork_translations_artwork_id_artworks_id_fk` FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `artworks` ADD CONSTRAINT `artworks_artist_id_artists_id_fk` FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collection_translations` ADD CONSTRAINT `collection_translations_collection_id_collections_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_audit_logs` ADD CONSTRAINT `admin_audit_logs_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `addresses_customer_idx` ON `addresses` (`customer_id`);--> statement-breakpoint
CREATE INDEX `customers_email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `inventory_reservations_active_expiry_idx` ON `inventory_reservations` (`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `orders_customer_idx` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`order_id`);--> statement-breakpoint
CREATE INDEX `product_variants_product_idx` ON `product_variants` (`product_id`);--> statement-breakpoint
CREATE INDEX `products_collection_idx` ON `products` (`collection_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `shipments_order_idx` ON `shipments` (`order_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_customer_idx` ON `subscriptions` (`customer_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_status_idx` ON `subscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `two_factors_user_idx` ON `two_factors` (`user_id`);--> statement-breakpoint
CREATE INDEX `two_factors_secret_idx` ON `two_factors` (`secret`);--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
CREATE INDEX `artworks_status_idx` ON `artworks` (`status`);--> statement-breakpoint
CREATE INDEX `artworks_featured_idx` ON `artworks` (`featured`,`sort_order`);--> statement-breakpoint
CREATE INDEX `admin_audit_logs_created_idx` ON `admin_audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `admin_audit_logs_entity_idx` ON `admin_audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `webhook_events_status_idx` ON `webhook_events` (`status`);
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text NOT NULL,
	`receiver_id` text NOT NULL,
	`content` text NOT NULL,
	`image_url` text,
	`created_at` integer NOT NULL,
	`read_at` integer,
	`friend_request_id` text,
	FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receiver_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`friend_request_id`) REFERENCES `friend_request`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `friend_request` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text NOT NULL,
	`receiver_id` text NOT NULL,
	`sender_email` text NOT NULL,
	`receiver_email` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receiver_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_email`) REFERENCES `user`(`email`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receiver_email`) REFERENCES `user`(`email`) ON UPDATE no action ON DELETE no action
);

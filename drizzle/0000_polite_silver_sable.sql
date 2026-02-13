CREATE TABLE "attack_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" text NOT NULL,
	"severity" integer NOT NULL,
	"type" text NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"city" text,
	"country" text,
	"latitude" text,
	"longitude" text
);

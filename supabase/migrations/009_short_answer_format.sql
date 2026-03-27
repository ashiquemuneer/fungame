ALTER TABLE "public"."questions"
ADD COLUMN "short_answer_type" text DEFAULT 'text',
ADD COLUMN "number_min" numeric,
ADD COLUMN "number_max" numeric;

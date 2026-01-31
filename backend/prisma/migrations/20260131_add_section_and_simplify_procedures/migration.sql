-- CreateEnum
CREATE TYPE "Section" AS ENUM ('SCRIPTS', 'REGISTRIES', 'ZABBIX', 'NOTES', 'PROCEDURES', 'TODOS', 'RSS');

-- Add section column to categories table
ALTER TABLE "categories" ADD COLUMN "section" "Section";

-- Add section column to tags table
ALTER TABLE "tags" ADD COLUMN "section" "Section";

-- Drop old unique constraints and create new ones
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_user_id_slug_key";
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_slug_section_key" UNIQUE ("user_id", "slug", "section");

ALTER TABLE "tags" DROP CONSTRAINT IF EXISTS "tags_user_id_slug_key";
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_slug_section_key" UNIQUE ("user_id", "slug", "section");

-- Add content column to procedures table
ALTER TABLE "procedures" ADD COLUMN "content" TEXT;

-- Migrate existing procedure data: combine all steps into content
UPDATE "procedures" p
SET "content" = COALESCE(
  (SELECT string_agg(
    '<h2>' || s.title || '</h2>' || E'\n' || '<p>' || s.content || '</p>',
    E'\n\n'
    ORDER BY s.step_number
  )
  FROM "procedure_steps" s
  WHERE s.procedure_id = p.id),
  ''
);

-- Set default content for procedures without steps
UPDATE "procedures" SET "content" = '' WHERE "content" IS NULL;

-- Make content NOT NULL after migration
ALTER TABLE "procedures" ALTER COLUMN "content" SET NOT NULL;

-- Drop version and description columns from procedures (no longer needed)
ALTER TABLE "procedures" DROP COLUMN IF EXISTS "description";
ALTER TABLE "procedures" DROP COLUMN IF EXISTS "version";

-- Drop procedure_steps table
DROP TABLE IF EXISTS "procedure_steps";

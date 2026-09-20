import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignOrganizationSchema1700000000001 implements MigrationInterface {
  name = 'AlignOrganizationSchema1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "slug" varchar(100);
    `);
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "logo" varchar(500);
    `);
    await queryRunner.query(`
      UPDATE "organizations"
      SET "slug" = lower(trim(coalesce("code", regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'))))
      WHERE "slug" IS NULL OR trim("slug") = '';
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_organizations_slug"
      ON "organizations" ("slug")
      WHERE "slug" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organization_auth_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL UNIQUE,
        "provider" varchar(50) NOT NULL DEFAULT 'LOCAL',
        "enabled" boolean NOT NULL DEFAULT false,
        "client_id" varchar(255),
        "client_secret" varchar(255),
        "issuer_url" varchar(500),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_org_auth_settings_organization"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "organization_auth_settings";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_organizations_slug";`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN IF EXISTS "logo";`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN IF EXISTS "slug";`);
  }
}

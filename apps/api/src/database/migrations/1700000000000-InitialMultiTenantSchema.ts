import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMultiTenantSchema1700000000000 implements MigrationInterface {
  name = 'InitialMultiTenantSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Roles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(50) NOT NULL UNIQUE,
        "description" varchar(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);

    // 2. Create Organizations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organizations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "code" varchar(50) NOT NULL UNIQUE,
        "domain" varchar(255),
        "status" varchar(20) NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);

    // 3. Create Users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizationId" uuid NOT NULL,
        "employeeNumber" varchar(50) NOT NULL,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "password" varchar(255) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'ACTIVE',
        "roleId" uuid NOT NULL,
        "lastLoginAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_users_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_users_role" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT
      );
    `);

    // Compound unique index for multi-tenancy: each employee number is unique within its organization
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_org_employee_number" ON "users" ("organizationId", "employeeNumber");
    `);

    // Index for fast organization scoped lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_organizationId" ON "users" ("organizationId");
    `);

    // 4. Create Rooms table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rooms" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizationId" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "code" varchar(50) NOT NULL,
        "capacity" integer NOT NULL DEFAULT 10,
        "floor" integer NOT NULL DEFAULT 1,
        "building" varchar(100),
        "status" varchar(30) NOT NULL DEFAULT 'AVAILABLE',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_rooms_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_rooms_organizationId" ON "rooms" ("organizationId");
    `);

    // 5. Create Reservations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reservations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizationId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "roomId" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'CONFIRMED',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_reservations_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reservations_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reservations_room" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reservations_organizationId" ON "reservations" ("organizationId");
    `);

    // 6. Seed Default System Roles
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "description")
      VALUES 
        ('SUPER_ADMIN', 'Super administrator with platform-wide governance and organization management access'),
        ('ORGANIZATION_ADMIN', 'Organization administrator managing internal employees, roles, rooms, and policies'),
        ('MANAGER', 'Department or room manager responsible for meeting room oversight and approval workflows'),
        ('EMPLOYEE', 'Standard corporate employee with room booking and personal schedule access')
      ON CONFLICT ("name") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reservations";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rooms";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles";`);
  }
}

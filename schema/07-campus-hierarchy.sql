-- Enterprise campus hierarchy (Phase 3) — additive, rooms keep legacy building/floor columns
CREATE TABLE IF NOT EXISTS org_locations (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64),
    address TEXT,
    timezone VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_locations_org ON org_locations(organization_id);

CREATE TABLE IF NOT EXISTS org_buildings (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id VARCHAR(64) REFERENCES org_locations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_buildings_org ON org_buildings(organization_id);

CREATE TABLE IF NOT EXISTS org_floors (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    building_id VARCHAR(64) NOT NULL REFERENCES org_buildings(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_floors_building ON org_floors(building_id);

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS location_id VARCHAR(64);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS building_id VARCHAR(64);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor_id VARCHAR(64);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS manager_user_id VARCHAR(64);

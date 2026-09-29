import type { Organization, Room } from '../types';

export type BuildingFloorsMap = Record<string, number[]>;

export function getBuildingFloorsFromSettings(
  settings: Organization['settings'] | undefined,
): BuildingFloorsMap {
  const raw = (settings as { buildingFloors?: BuildingFloorsMap } | undefined)?.buildingFloors;
  if (!raw || typeof raw !== 'object') return {};
  const map: BuildingFloorsMap = {};
  for (const [key, floors] of Object.entries(raw)) {
    if (!Array.isArray(floors)) continue;
    const nums = floors
      .map((f) => Number(f))
      .filter((f) => Number.isFinite(f))
      .sort((a, b) => a - b);
    if (nums.length) map[key] = [...new Set(nums)];
  }
  return map;
}

/** Ensure every building has a sorted floor list; infer from rooms when settings are empty. */
export function resolveBuildingFloors(
  buildings: string[],
  settings: Organization['settings'] | undefined,
  rooms: Room[] = [],
): BuildingFloorsMap {
  const map = { ...getBuildingFloorsFromSettings(settings) };
  for (const b of buildings) {
    if (map[b]?.length) continue;
    const fromRooms = rooms
      .filter((r) => r.building === b)
      .map((r) => r.floor)
      .filter((f) => Number.isFinite(f));
    const unique = [...new Set(fromRooms)].sort((a, b) => a - b);
    map[b] = unique.length ? unique : [1];
  }
  for (const key of Object.keys(map)) {
    if (!buildings.includes(key)) delete map[key];
  }
  return map;
}

export function sortFloors(floors: number[]): number[] {
  return [...new Set(floors.map((f) => Number(f)).filter((f) => Number.isFinite(f)))].sort(
    (a, b) => a - b,
  );
}

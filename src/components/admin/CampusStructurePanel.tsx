import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Layers, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import type { Room } from '../../types';
import type { BuildingFloorsMap } from '../../utils/buildingFloors';
import { sortFloors } from '../../utils/buildingFloors';

type Props = {
  buildings: string[];
  buildingFloors: BuildingFloorsMap;
  rooms: Room[];
  saving: boolean;
  onChange: (buildings: string[], buildingFloors: BuildingFloorsMap) => void;
  onSave: () => void | Promise<void>;
  onNotify?: (message: string, type: 'error' | 'success') => void;
};

export const CampusStructurePanel: React.FC<Props> = ({
  buildings,
  buildingFloors,
  rooms,
  saving,
  onChange,
  onSave,
  onNotify,
}) => {
  const [newBuilding, setNewBuilding] = useState('');
  const [activeBuilding, setActiveBuilding] = useState(buildings[0] ?? '');
  const [newFloor, setNewFloor] = useState('');

  useEffect(() => {
    if (!buildings.length) {
      setActiveBuilding('');
      return;
    }
    if (!buildings.includes(activeBuilding)) setActiveBuilding(buildings[0]);
  }, [buildings, activeBuilding]);

  const activeFloors = useMemo(
    () => buildingFloors[activeBuilding] ?? [1],
    [buildingFloors, activeBuilding],
  );

  const roomCountByBuilding = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rooms) {
      m.set(r.building, (m.get(r.building) ?? 0) + 1);
    }
    return m;
  }, [rooms]);

  const addBuilding = () => {
    const name = newBuilding.trim();
    if (!name || buildings.includes(name)) return;
    const nextBuildings = [...buildings, name];
    const nextFloors = { ...buildingFloors, [name]: [1] };
    onChange(nextBuildings, nextFloors);
    setActiveBuilding(name);
    setNewBuilding('');
  };

  const removeBuilding = (name: string) => {
    if (buildings.length <= 1) {
      onNotify?.('حداقل یک ساختمان باید باقی بماند', 'error');
      return;
    }
    if ((roomCountByBuilding.get(name) ?? 0) > 0) {
      onNotify?.('این ساختمان هنوز اتاق دارد؛ ابتدا اتاق‌ها را حذف یا منتقل کنید', 'error');
      return;
    }
    const nextBuildings = buildings.filter((b) => b !== name);
    const nextFloors = { ...buildingFloors };
    delete nextFloors[name];
    onChange(nextBuildings, nextFloors);
    if (activeBuilding === name) setActiveBuilding(nextBuildings[0] ?? '');
  };

  const addFloor = () => {
    const n = Number(newFloor);
    if (!activeBuilding || !Number.isFinite(n) || n < -5 || n > 200) return;
    const merged = sortFloors([...(buildingFloors[activeBuilding] ?? []), n]);
    onChange(buildings, { ...buildingFloors, [activeBuilding]: merged });
    setNewFloor('');
  };

  const removeFloor = (floor: number) => {
    if (!activeBuilding) return;
    const list = buildingFloors[activeBuilding] ?? [];
    if (list.length <= 1) return;
    const inUse = rooms.some((r) => r.building === activeBuilding && r.floor === floor);
    if (inUse) {
      onNotify?.('این طبقه در اتاق‌ها استفاده شده و قابل حذف نیست', 'error');
      return;
    }
    const merged = list.filter((f) => f !== floor);
    onChange(buildings, { ...buildingFloors, [activeBuilding]: merged });
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] portal-card-pad rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-[var(--brand-primary-light)] flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            ساختمان‌ها و طبقات
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            قبل از تعریف اتاق، ساختمان و طبقات مجاز را مشخص کنید. هنگام ثبت اتاق، فقط از این لیست
            انتخاب می‌شود.
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSave()}
          className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--brand-primary-light)] hover:bg-[var(--brand-primary-hover)] text-white flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          ذخیره ساختمان و طبقات
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-[#334155]">
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">ساختمان‌ها</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newBuilding}
              onChange={(e) => setNewBuilding(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBuilding())}
              placeholder="نام ساختمان جدید"
              className="flex-1 text-xs px-3 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A]"
            />
            <button
              type="button"
              onClick={addBuilding}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#334155] text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              افزودن
            </button>
          </div>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {buildings.map((b) => {
              const count = roomCountByBuilding.get(b) ?? 0;
              const active = b === activeBuilding;
              return (
                <li
                  key={b}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs ${
                    active
                      ? 'border-[var(--brand-primary-light)] bg-[rgb(var(--brand-primary-rgb)/0.08)]'
                      : 'border-slate-200 dark:border-[#334155]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveBuilding(b)}
                    className="font-semibold text-slate-800 dark:text-slate-100 text-right flex-1 cursor-pointer"
                  >
                    {b}
                    <span className="text-slate-400 font-normal ms-2">({count} اتاق)</span>
                  </button>
                  {buildings.length > 1 && count === 0 && (
                    <button
                      type="button"
                      onClick={() => removeBuilding(b)}
                      className="text-rose-600 p-1 cursor-pointer"
                      title="حذف ساختمان"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            طبقات — {activeBuilding || '—'}
          </p>
          {!activeBuilding ? (
            <p className="text-xs text-slate-500">ابتدا یک ساختمان انتخاب یا اضافه کنید.</p>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={-5}
                  max={200}
                  value={newFloor}
                  onChange={(e) => setNewFloor(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFloor())}
                  placeholder="شماره طبقه (مثلاً ۳)"
                  className="flex-1 text-xs px-3 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A]"
                />
                <button
                  type="button"
                  onClick={addFloor}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#334155] text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  طبقه
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFloors.map((f) => {
                  const inUse = rooms.some((r) => r.building === activeBuilding && r.floor === f);
                  return (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-xs font-semibold"
                    >
                      طبقه {f}
                      {activeFloors.length > 1 && !inUse && (
                        <button
                          type="button"
                          onClick={() => removeFloor(f)}
                          className="text-rose-500 cursor-pointer"
                          aria-label={`حذف طبقه ${f}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

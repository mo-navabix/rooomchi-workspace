import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Room } from '../../types';
import { CampusStructurePanel } from './CampusStructurePanel';
import { resolveBuildingFloors, type BuildingFloorsMap } from '../../utils/buildingFloors';
import { AdminRoomsSkeleton } from '../common/Skeletons';

export const AdminCampusView: React.FC = () => {
  const { currentOrg, showToast, updateCurrentOrgData } = useApp();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [campusBuildings, setCampusBuildings] = useState<string[]>([]);
  const [campusFloors, setCampusFloors] = useState<BuildingFloorsMap>({});
  const [campusSaving, setCampusSaving] = useState(false);

  useEffect(() => {
    if (!currentOrg) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await ApiService.getRooms({ orgId: currentOrg.id });
        if (!cancelled) setRooms(data);
      } catch {
        if (!cancelled) showToast('خطا در بارگذاری اتاق‌ها برای اعتبارسنجی ساختمان', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentOrg, showToast]);

  useEffect(() => {
    if (!currentOrg) return;
    const buildings =
      currentOrg.buildings?.length ? [...currentOrg.buildings] : ['ساختمان مرکزی'];
    setCampusBuildings(buildings);
    setCampusFloors(resolveBuildingFloors(buildings, currentOrg.settings, rooms));
  }, [currentOrg, rooms]);

  const saveCampusStructure = async () => {
    if (!currentOrg) return;
    if (!campusBuildings.length) {
      showToast('حداقل یک ساختمان تعریف کنید', 'error');
      return;
    }
    setCampusSaving(true);
    try {
      const updated = await ApiService.updateOrganization(currentOrg.id, {
        buildings: campusBuildings,
        settings: {
          ...currentOrg.settings,
          buildingFloors: campusFloors,
        },
      });
      updateCurrentOrgData({
        buildings: updated.buildings ?? campusBuildings,
        settings: updated.settings ?? {
          ...currentOrg.settings,
          buildingFloors: campusFloors,
        },
      });
      showToast('ساختمان‌ها و طبقات ذخیره شد', 'success');
    } catch (e) {
      console.error(e);
      showToast('خطا در ذخیره ساختمان و طبقات', 'error');
    } finally {
      setCampusSaving(false);
    }
  };

  if (loading) return <AdminRoomsSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0" id="admin-campus-view">
      <div className="bg-white dark:bg-[#1E293B] portal-card-pad rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">ساختمان‌ها و طبقات</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          ساختمان‌ها و شماره طبقات را برای فرم تعریف اتاق و فیلترهای رزرو تعریف کنید. حذف ساختمان یا
          طبقه‌ای که اتاق فعال دارد مجاز نیست.
        </p>
      </div>
      <CampusStructurePanel
        buildings={campusBuildings}
        buildingFloors={campusFloors}
        rooms={rooms}
        saving={campusSaving}
        onChange={(b, f) => {
          setCampusBuildings(b);
          setCampusFloors(f);
        }}
        onSave={saveCampusStructure}
        onNotify={(message, type) => showToast(message, type)}
      />
    </div>
  );
};

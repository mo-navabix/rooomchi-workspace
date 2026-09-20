import { Organization } from './entities/organization.entity';
import { ProvisionOrganizationDto } from './dto/provision-organization.dto';

/** Shape expected by the React app (legacy Express mock). */
/** Defaults for list/detail when only DB columns exist (no provisioning payload). */
export function toClientOrganizationFromEntity(org: Organization) {
  return toClientOrganization(org, { name: org.name });
}

export function toClientOrganization(
  org: Organization,
  dto: ProvisionOrganizationDto,
) {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logo ?? dto.logo ?? '🏢',
    primaryColor: dto.primaryColor ?? '#2563eb',
    plan: dto.plan ?? 'business',
    contactEmail: dto.contactEmail ?? '',
    buildings:
      dto.buildings && dto.buildings.length > 0
        ? dto.buildings
        : ['ساختمان مرکزی'],
    departments:
      dto.departments && dto.departments.length > 0
        ? dto.departments
        : ['فنی و مهندسی', 'مارکتینگ', 'منابع انسانی', 'مدیریت', 'مالی'],
    workHours: dto.workHours ?? { start: '08:00', end: '19:00' },
    settings: dto.settings ?? {
      autoApprove: true,
      maxBookingHours: 4,
      allowWeekend: false,
    },
  };
}

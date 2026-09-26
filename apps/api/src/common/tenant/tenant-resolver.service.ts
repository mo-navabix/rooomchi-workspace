import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { OrganizationStatus } from '../enums/organization-status.enum';
import { TenantContext } from './tenant-context.interface';

@Injectable()
export class TenantResolverService {
  private readonly logger = new Logger(TenantResolverService.name);

  // System and reserved subdomains that do not represent an organization tenant
  private readonly reservedSubdomains = new Set([
    'app',
    'api',
    'admin',
    'www',
    'mail',
    'status',
    'billing',
    'auth',
    'rooomchi',
    'static',
    'assets',
  ]);

  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  /**
   * Extracts the organization slug from a given hostname or custom header.
   *
   * Examples:
   * - "technova.rooomchi.ir" -> "technova"
   * - "companya.rooomchi.ir:3000" -> "companya"
   * - "technova.localhost" -> "technova"
   * - "app.rooomchi.ir" -> null (central application portal)
   * - "rooomchi.ir" -> null (main landing website)
   */
  extractSlugFromHost(host?: string | null): string | null {
    if (!host) return null;

    // Strip port if present
    const cleanHost = host.split(':')[0].trim().toLowerCase();

    // Check if host is direct IP or plain localhost
    if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
      return null;
    }

    const parts = cleanHost.split('.');

    // Example: technova.localhost -> parts: ['technova', 'localhost']
    if (parts.length === 2 && parts[1] === 'localhost') {
      return parts[0];
    }

    // Example: technova.rooomchi.ir -> parts: ['technova', 'rooomchi', 'ir'] (length >= 3)
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (!this.reservedSubdomains.has(subdomain)) {
        return subdomain;
      }
    }

    return null;
  }

  /**
   * Resolves the organization tenant context based on hostname and fallback headers.
   */
  async resolveTenant(
    host?: string | null,
    headerSlug?: string | null,
    headerOrgId?: string | null,
  ): Promise<TenantContext | null> {
    // 1. Check direct header by ID if supplied (e.g. internal service-to-service)
    if (headerOrgId) {
      const org = await this.organizationRepository.findOne({
        where: { id: headerOrgId },
      });
      if (org && org.status === OrganizationStatus.ACTIVE) {
        return {
          organizationId: org.id,
          organizationSlug: org.slug,
          organizationName: org.name,
          domain: org.domain,
        };
      }
    }

    // 2. Extract slug from hostname or custom header
    const slug = headerSlug?.trim().toLowerCase() || this.extractSlugFromHost(host);
    if (!slug) {
      // 3. Fallback: check if entire domain matches a custom enterprise domain (e.g., meeting.companya.com)
      if (host) {
        const cleanHost = host.split(':')[0].trim().toLowerCase();
        const orgByDomain = await this.organizationRepository.findOne({
          where: { domain: cleanHost },
        });
        if (orgByDomain && orgByDomain.status === OrganizationStatus.ACTIVE) {
          return {
            organizationId: orgByDomain.id,
            organizationSlug: orgByDomain.slug,
            organizationName: orgByDomain.name,
            domain: orgByDomain.domain,
          };
        }
      }
      return null;
    }

    // 4. Query organization by unique slug
    const organization = await this.organizationRepository.findOne({
      where: { slug },
    });

    if (!organization) {
      this.logger.warn(`Tenant resolution failed: no organization found for slug '${slug}'`);
      return null;
    }

    if (organization.status !== OrganizationStatus.ACTIVE) {
      this.logger.warn(
        `Tenant '${slug}' is currently ${organization.status}. Access blocked.`,
      );
      return null;
    }

    return {
      organizationId: organization.id,
      organizationSlug: organization.slug,
      organizationName: organization.name,
      domain: organization.domain,
    };
  }
}

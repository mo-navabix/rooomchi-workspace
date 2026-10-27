import type { IntegrationCatalogId } from './integrationCatalog';

const STORAGE_KEY = 'rooomchi_open_integration';

export function queueIntegrationConfigView(id: IntegrationCatalogId): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function consumeIntegrationConfigView(): IntegrationCatalogId | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (
      raw === 'resend' ||
      raw === 'smtp' ||
      raw === 'sms' ||
      raw === 'telegram' ||
      raw === 'storage'
    ) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return null;
}

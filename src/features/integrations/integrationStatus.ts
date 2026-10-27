import type { NotificationSettings } from '../../types';
import {
  isResendIntegrationActive,
  isSmtpIntegrationActive,
} from '../enterprise-admin/IntegrationProviderCard';

export function isEmailIntegrationConfigured(integrations: Record<string, unknown>): boolean {
  return isResendIntegrationActive(integrations) || isSmtpIntegrationActive(integrations);
}

export function isSmsIntegrationConfigured(integrations: Record<string, unknown>): boolean {
  const sms = (integrations.sms || {}) as Record<string, unknown>;
  if (sms.enabled === false || sms.enabled === 'false') return false;
  return Boolean(String(sms.apiKey || '').trim() && String(sms.lineNumber || '').trim());
}

export function isTelegramIntegrationConfigured(integrations: Record<string, unknown>): boolean {
  const tg = (integrations.telegram || {}) as Record<string, unknown>;
  if (tg.enabled === false || tg.enabled === 'false') return false;
  return Boolean(String(tg.botToken || '').trim() && String(tg.targetChatId || '').trim());
}

export function isStorageIntegrationConfigured(integrations: Record<string, unknown>): boolean {
  const storage = (integrations.storage || {}) as Record<string, unknown>;
  return Boolean(String(storage.uploadPath || storage.bucketName || '').trim());
}

export type NotificationChannelId = 'email' | 'sms' | 'telegram' | 'in_app';

export function isNotificationChannelActive(
  channel: NotificationChannelId,
  settings: NotificationSettings,
  integrations: Record<string, unknown>,
): boolean {
  switch (channel) {
    case 'email':
      return isEmailIntegrationConfigured(integrations);
    case 'sms':
      return settings.sms.enabled && isSmsIntegrationConfigured(integrations);
    case 'telegram':
      return settings.telegram.enabled && isTelegramIntegrationConfigured(integrations);
    case 'in_app':
      return settings.inApp.enabled;
    default:
      return false;
  }
}

export function integrationIdForChannel(
  channel: NotificationChannelId,
): 'resend' | 'smtp' | 'sms' | 'telegram' | null {
  if (channel === 'email') return 'resend';
  if (channel === 'sms') return 'sms';
  if (channel === 'telegram') return 'telegram';
  return null;
}

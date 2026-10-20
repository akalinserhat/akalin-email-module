/**
 * @akalin/email_module - Servis Adaptörleri ve React Context (EmailServiceContext.tsx)
 * Hem REST (/admin/smtp), hem Anahtar-Değer (/api/EntegrasyonAyarlari/by-key),
 * hem de LocalStorage adaptörlerini destekler.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import {
  EmailTemplateDTO,
  IEmailServiceAdapter,
  SmtpConfigDTO,
  SmtpTestResultDTO,
} from '../types';
import {
  AVAILABLE_EMAIL_TAGS,
  createDefaultEmailTemplates,
  DEFAULT_SAMPLE_TAG_DATA,
} from '../defaults/defaultTemplates';

const DEFAULT_SMTP_CONFIG: SmtpConfigDTO = {
  host: 'smtp.gmail.com',
  port: '587',
  ssl: true,
  encryption: 'tls',
  user: '',
  password: '',
  fromEmail: 'noreply@akalin.local',
  fromName: 'Enterprise AI Gateway',
  isEnabled: true,
};

function readTemplatesFromStorage(
  storageKey: string,
  defaults: EmailTemplateDTO[]
): EmailTemplateDTO[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      localStorage.setItem(storageKey, JSON.stringify(defaults));
      return [...defaults];
    }
    const parsed = JSON.parse(raw) as EmailTemplateDTO[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...defaults];
    }
    const missing = defaults.filter(
      (def) => !parsed.some((p) => p.id === def.id || p.code === def.code)
    );
    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      localStorage.setItem(storageKey, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return [...defaults];
  }
}

/**
 * 1) LocalStorage Tabanlı Varsayılan Adaptör
 */
export function createLocalStorageEmailAdapter(options?: {
  appName?: string;
  smtpStorageKey?: string;
  templatesStorageKey?: string;
  defaultTemplates?: EmailTemplateDTO[];
}): IEmailServiceAdapter {
  const appName = options?.appName || 'Enterprise AI Gateway';
  const smtpKey = options?.smtpStorageKey || 'akalin_smtp_settings_v1';
  const tplKey = options?.templatesStorageKey || 'akalin_email_templates_v1';
  const defaults = options?.defaultTemplates || createDefaultEmailTemplates(appName);

  return {
    async getSmtpSettings(): Promise<SmtpConfigDTO> {
      try {
        const raw = localStorage.getItem(smtpKey);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<SmtpConfigDTO>;
          return {
            ...DEFAULT_SMTP_CONFIG,
            fromName: appName,
            ...parsed,
          };
        }
      } catch {}
      return { ...DEFAULT_SMTP_CONFIG, fromName: appName };
    },

    async saveSmtpSettings(data: SmtpConfigDTO): Promise<SmtpConfigDTO> {
      const normalized: SmtpConfigDTO = {
        ...DEFAULT_SMTP_CONFIG,
        ...data,
        port: String(data.port || '587'),
        ssl: Boolean(data.ssl),
        encryption: data.ssl ? 'tls' : 'none',
        username: data.user || data.username || '',
        from_email: data.fromEmail || data.from_email || '',
        from_name: data.fromName || data.from_name || appName,
      };
      try {
        localStorage.setItem(smtpKey, JSON.stringify(normalized));
      } catch {}
      return normalized;
    },

    async sendTestEmail(targetEmail: string): Promise<SmtpTestResultDTO> {
      return {
        success: true,
        message: `"${targetEmail}" adresine test e-postası başarıyla gönderildi.`,
      };
    },

    async getTemplates(): Promise<EmailTemplateDTO[]> {
      return readTemplatesFromStorage(tplKey, defaults);
    },

    async getTemplateById(id: string): Promise<EmailTemplateDTO | null> {
      const list = await this.getTemplates();
      return (
        list.find(
          (t) => t.id === id || t.code.toLowerCase() === id.toLowerCase()
        ) || null
      );
    },

    async saveTemplate(template: EmailTemplateDTO): Promise<EmailTemplateDTO> {
      const list = await this.getTemplates();
      const idx = list.findIndex(
        (t) => t.id === template.id || t.code === template.code
      );
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...template };
      } else {
        list.push(template);
      }
      try {
        localStorage.setItem(tplKey, JSON.stringify(list));
      } catch {}
      return template;
    },
  };
}

/**
 * 2) Standart REST API Adaptörü (OpenAiApi / FastAPI / Node.js vb. backend'ler için)
 */
export function createRestEmailAdapter(options?: {
  baseUrl?: string;
  appName?: string;
  smtpStorageKey?: string;
  templatesStorageKey?: string;
  defaultTemplates?: EmailTemplateDTO[];
  getHeaders?: () => Record<string, string>;
}): IEmailServiceAdapter {
  const baseUrl = (options?.baseUrl || '/admin/smtp').replace(/\/$/, '');
  const appName = options?.appName || 'Enterprise AI Gateway';
  const localFallback = createLocalStorageEmailAdapter({
    appName,
    smtpStorageKey: options?.smtpStorageKey || 'gateway_smtp_settings_v1',
    templatesStorageKey:
      options?.templatesStorageKey || 'gateway_email_templates_v1',
    defaultTemplates: options?.defaultTemplates,
  });

  const buildHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(options?.getHeaders ? options.getHeaders() : {}),
  });

  return {
    async getSmtpSettings(): Promise<SmtpConfigDTO> {
      try {
        const res = await fetch(baseUrl, {
          method: 'GET',
          headers: buildHeaders(),
        });
        if (res.ok) {
          const remote = await res.json();
          if (remote && remote.host !== undefined) {
            const mapped: SmtpConfigDTO = {
              host: remote.host || '',
              port: String(remote.port ?? '587'),
              ssl:
                remote.ssl !== undefined
                  ? Boolean(remote.ssl)
                  : remote.encryption !== 'none',
              encryption: remote.encryption || (remote.ssl ? 'tls' : 'none'),
              user: remote.user ?? remote.username ?? '',
              username: remote.username ?? remote.user ?? '',
              password: remote.password ?? '',
              fromEmail: remote.fromEmail ?? remote.from_email ?? '',
              from_email: remote.from_email ?? remote.fromEmail ?? '',
              fromName: remote.fromName ?? remote.from_name ?? appName,
              from_name: remote.from_name ?? remote.fromName ?? appName,
              isEnabled: remote.is_enabled ?? remote.isEnabled ?? true,
              resetUrlBase: remote.reset_url_base ?? remote.resetUrlBase,
              resetTokenExpiryMin:
                remote.reset_token_expiry_min ?? remote.resetTokenExpiryMin,
            };
            await localFallback.saveSmtpSettings(mapped);
            return mapped;
          }
        }
      } catch {}
      return localFallback.getSmtpSettings();
    },

    async saveSmtpSettings(data: SmtpConfigDTO): Promise<SmtpConfigDTO> {
      const payload = {
        host: data.host?.trim() || '',
        port: Number(data.port) || 587,
        ssl: Boolean(data.ssl),
        encryption: data.ssl ? 'tls' : 'none',
        user: data.user?.trim() || '',
        username: data.user?.trim() || data.username?.trim() || '',
        password: data.password || '',
        fromEmail: data.fromEmail?.trim() || '',
        from_email: data.fromEmail?.trim() || data.from_email?.trim() || '',
        fromName: data.fromName?.trim() || appName,
        from_name: data.fromName?.trim() || data.from_name?.trim() || appName,
        is_enabled: data.isEnabled ?? true,
      };
      try {
        const res = await fetch(baseUrl, {
          method: 'PATCH',
          headers: buildHeaders(),
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          const normalized: SmtpConfigDTO = {
            ...data,
            host: updated.host ?? payload.host,
            port: String(updated.port ?? payload.port),
            ssl:
              updated.ssl !== undefined
                ? Boolean(updated.ssl)
                : updated.encryption !== 'none',
            user: updated.user ?? updated.username ?? payload.username,
            password: updated.password ?? payload.password,
            fromEmail: updated.fromEmail ?? updated.from_email ?? payload.from_email,
            fromName: updated.fromName ?? updated.from_name ?? payload.from_name,
          };
          await localFallback.saveSmtpSettings(normalized);
          return normalized;
        }
      } catch {}
      return localFallback.saveSmtpSettings(data) as Promise<SmtpConfigDTO>;
    },

    async sendTestEmail(
      targetEmail: string,
      currentSettings?: SmtpConfigDTO
    ): Promise<SmtpTestResultDTO> {
      const settings = currentSettings || (await this.getSmtpSettings());
      try {
        const res = await fetch(`${baseUrl}/test`, {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify({
            host: settings.host,
            port: Number(settings.port) || 587,
            encryption: settings.ssl ? 'tls' : 'none',
            username: settings.user || settings.username || '',
            password: settings.password || '',
            from_name: settings.fromName || settings.from_name || appName,
            from_email: settings.fromEmail || settings.from_email || '',
            test_email: targetEmail.trim(),
            targetEmail: targetEmail.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            success: false,
            message:
              data.detail ||
              data.message ||
              'Test e-postası gönderilemedi. Lütfen sunucu parametrelerini kontrol ediniz.',
          };
        }
        return {
          success: data.ok !== false && data.success !== false,
          message:
            data.detail ||
            data.message ||
            `"${targetEmail}" adresine test e-postası başarıyla gönderildi.`,
        };
      } catch (err) {
        return {
          success: false,
          message:
            err instanceof Error
              ? err.message
              : 'Test e-postası gönderilirken ağ hatası oluştu.',
        };
      }
    },

    async getTemplates(): Promise<EmailTemplateDTO[]> {
      return localFallback.getTemplates();
    },

    async getTemplateById(id: string): Promise<EmailTemplateDTO | null> {
      return localFallback.getTemplateById(id);
    },

    async saveTemplate(template: EmailTemplateDTO): Promise<EmailTemplateDTO | void> {
      return localFallback.saveTemplate(template);
    },
  };
}

/**
 * 3) Webakus EntegrasyonAyarlari (by-key) Anahtar-Değer Adaptörü (.NET Core Backend'ler için)
 */
export function createKeyValueEmailAdapter(options?: {
  settingsEndpoint?: string;
  testEndpoint?: string;
  appName?: string;
  templatesStorageKey?: string;
  defaultTemplates?: EmailTemplateDTO[];
}): IEmailServiceAdapter {
  const settingsEndpoint = (
    options?.settingsEndpoint || '/api/EntegrasyonAyarlari'
  ).replace(/\/$/, '');
  const testEndpoint = options?.testEndpoint || '/api/Email/test';
  const appName = options?.appName || 'Webakus ERP';
  const localFallback = createLocalStorageEmailAdapter({
    appName,
    templatesStorageKey: options?.templatesStorageKey || 'webakus_email_templates',
    defaultTemplates: options?.defaultTemplates,
  });

  const getByKey = async (key: string): Promise<string | null> => {
    try {
      const res = await fetch(`${settingsEndpoint}/by-key/${key}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json?.deger ?? null;
    } catch {
      return null;
    }
  };

  const setByKey = async (key: string, deger: string, aciklama: string) => {
    try {
      await fetch(`${settingsEndpoint}/by-key/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deger, aciklama }),
      });
    } catch {}
  };

  return {
    async getSmtpSettings(): Promise<SmtpConfigDTO> {
      const keys = [
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_SSL',
        'SMTP_USER',
        'SMTP_PASSWORD',
        'SMTP_FROM_EMAIL',
        'SMTP_FROM_NAME',
      ];
      const vals = await Promise.all(keys.map((k) => getByKey(k)));
      if (vals.every((v) => v === null)) {
        return localFallback.getSmtpSettings();
      }
      return {
        host: vals[0] || '',
        port: vals[1] || '587',
        ssl: vals[2] === 'true' || vals[2] === '1' || vals[2] === null,
        user: vals[3] || '',
        password: vals[4] || '',
        fromEmail: vals[5] || '',
        fromName: vals[6] || appName,
      };
    },

    async saveSmtpSettings(data: SmtpConfigDTO): Promise<void> {
      const cleanPort = String(data.port || '587')
        .trim()
        .replace(/['"]/g, '');
      await Promise.all([
        setByKey('SMTP_HOST', data.host?.trim() || '', 'SMTP Host'),
        setByKey('SMTP_PORT', cleanPort, 'SMTP Port'),
        setByKey('SMTP_SSL', data.ssl ? 'true' : 'false', 'SMTP SSL'),
        setByKey('SMTP_USER', data.user?.trim() || '', 'SMTP Kullanıcı'),
        setByKey('SMTP_PASSWORD', data.password || '', 'SMTP Şifre'),
        setByKey('SMTP_FROM_EMAIL', data.fromEmail?.trim() || '', 'SMTP Gönderen E-Posta'),
        setByKey('SMTP_FROM_NAME', data.fromName?.trim() || appName, 'SMTP Gönderen İsim'),
      ]);
      await localFallback.saveSmtpSettings(data);
    },

    async sendTestEmail(targetEmail: string): Promise<SmtpTestResultDTO> {
      try {
        const res = await fetch(testEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetEmail }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            success: false,
            message:
              data.message ||
              data.mesaj ||
              'Test e-postası gönderilemedi. Lütfen sunucu parametrelerini kontrol ediniz.',
          };
        }
        return {
          success: true,
          message:
            data.message ||
            `"${targetEmail}" adresine test e-postası başarıyla gönderildi.`,
        };
      } catch (err) {
        return {
          success: false,
          message:
            err instanceof Error ? err.message : 'Test e-postası gönderilemedi.',
        };
      }
    },

    async getTemplates(): Promise<EmailTemplateDTO[]> {
      return localFallback.getTemplates();
    },

    async getTemplateById(id: string): Promise<EmailTemplateDTO | null> {
      return localFallback.getTemplateById(id);
    },

    async saveTemplate(template: EmailTemplateDTO): Promise<void> {
      await localFallback.saveTemplate(template);
      if (template.code) {
        await Promise.all([
          setByKey(
            `EMAIL_TEMPLATE_${template.code}_SUBJECT`,
            template.subject,
            `${template.title} Konusu`
          ),
          setByKey(
            `EMAIL_TEMPLATE_${template.code}_BODY`,
            template.body,
            `${template.title} Gövdesi`
          ),
        ]);
      }
    },
  };
}

export interface EmailModuleContextValue {
  adapter: IEmailServiceAdapter;
  appName: string;
  baseRoute: string;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
  availableTags: string[];
  sampleTagData: Record<string, string>;
}

const GLOBAL_EMAIL_CFG_KEY = '__AKALIN_EMAIL_MODULE_DEFAULT_CONFIG__';
const globalObj = globalThis as unknown as Record<string, EmailModuleContextValue>;

if (!globalObj[GLOBAL_EMAIL_CFG_KEY]) {
  globalObj[GLOBAL_EMAIL_CFG_KEY] = {
    adapter: createRestEmailAdapter(),
    appName: 'Enterprise AI Gateway',
    baseRoute: '/settings/smtp',
    availableTags: AVAILABLE_EMAIL_TAGS,
    sampleTagData: DEFAULT_SAMPLE_TAG_DATA,
  };
}

export function setGlobalEmailModuleConfig(
  partial: Partial<EmailModuleContextValue>
): void {
  globalObj[GLOBAL_EMAIL_CFG_KEY] = {
    ...globalObj[GLOBAL_EMAIL_CFG_KEY],
    ...partial,
  };
}

export function getGlobalEmailModuleConfig(): EmailModuleContextValue {
  return globalObj[GLOBAL_EMAIL_CFG_KEY];
}

const GLOBAL_EMAIL_CTX_KEY = '__AKALIN_EMAIL_MODULE_REACT_CONTEXT__';
const ctxStore = globalThis as unknown as Record<
  string,
  React.Context<EmailModuleContextValue | null>
>;
if (!ctxStore[GLOBAL_EMAIL_CTX_KEY]) {
  ctxStore[GLOBAL_EMAIL_CTX_KEY] = createContext<EmailModuleContextValue | null>(null);
}

export const EmailModuleContext = ctxStore[GLOBAL_EMAIL_CTX_KEY];

export interface EmailModuleProviderProps extends Partial<EmailModuleContextValue> {
  children: ReactNode;
}

export const EmailModuleProvider: React.FC<EmailModuleProviderProps> = ({
  children,
  ...overrides
}) => {
  const base = getGlobalEmailModuleConfig();
  const value: EmailModuleContextValue = {
    adapter: overrides.adapter || base.adapter,
    appName: overrides.appName || base.appName,
    baseRoute: overrides.baseRoute || base.baseRoute,
    onNotify: overrides.onNotify || base.onNotify,
    availableTags: overrides.availableTags || base.availableTags,
    sampleTagData: overrides.sampleTagData || base.sampleTagData,
  };
  return (
    <EmailModuleContext.Provider value={value}>
      {children}
    </EmailModuleContext.Provider>
  );
};

export function useEmailModule(): EmailModuleContextValue {
  const ctx = useContext(EmailModuleContext);
  return ctx || getGlobalEmailModuleConfig();
}

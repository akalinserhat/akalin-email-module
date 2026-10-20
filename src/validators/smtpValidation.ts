/**
 * @akalin/email_module - SMTP Doğrulama Kuralları (smtpValidation.ts)
 */

import { SmtpConfigDTO } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSmtpField(
  field: string,
  value: unknown,
  t?: (key: string, fallback?: string) => string
): string {
  const tr = (key: string, fallback: string) => (t ? t(key, fallback) : fallback);
  const str = String(value ?? '').trim();

  switch (field) {
    case 'host':
      if (!str) {
        return tr('validation_smtp_host_zorunlu', 'SMTP sunucu adresi (Host) zorunludur.');
      }
      return '';

    case 'port': {
      if (!str) {
        return tr('validation_smtp_port_zorunlu', 'SMTP port numarası zorunludur.');
      }
      const num = Number(str);
      if (!Number.isInteger(num) || num < 1 || num > 65535) {
        return tr('validation_smtp_port_gecersiz', 'Geçerli bir port numarası giriniz (1 - 65535).');
      }
      return '';
    }

    case 'user':
    case 'username':
      if (!str) {
        return tr('validation_smtp_user_zorunlu', 'SMTP kullanıcı adı / e-posta adresi zorunludur.');
      }
      return '';

    case 'fromEmail':
    case 'from_email':
      if (str && !EMAIL_REGEX.test(str)) {
        return tr('validation_gecerli_eposta_giriniz', 'Geçerli bir gönderen e-posta adresi giriniz.');
      }
      return '';

    case 'testEmail':
      if (!str) {
        return tr('validation_test_email_zorunlu', 'Test e-postası gönderilecek alıcı adresini giriniz.');
      }
      if (!EMAIL_REGEX.test(str)) {
        return tr('validation_gecerli_eposta_giriniz', 'Geçerli bir alıcı e-posta adresi giriniz.');
      }
      return '';

    default:
      return '';
  }
}

export function validateSmtpForm(
  data: Partial<SmtpConfigDTO>,
  t?: (key: string, fallback?: string) => string
): Record<string, string> {
  const errors: Record<string, string> = {};

  const hostErr = validateSmtpField('host', data.host, t);
  if (hostErr) errors.host = hostErr;

  const portErr = validateSmtpField('port', data.port, t);
  if (portErr) errors.port = portErr;

  const fromEmailErr = validateSmtpField(
    'fromEmail',
    data.fromEmail ?? data.from_email,
    t
  );
  if (fromEmailErr) errors.fromEmail = fromEmailErr;

  return errors;
}

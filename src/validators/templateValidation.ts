/**
 * @akalin/email_module - E-Posta Şablonu Doğrulama Kuralları (templateValidation.ts)
 */

import { EmailTemplateDTO } from '../types';

export function validateTemplateField(
  field: string,
  value: unknown,
  t?: (key: string, fallback?: string) => string
): string {
  const tr = (key: string, fallback: string) => (t ? t(key, fallback) : fallback);
  const str = String(value ?? '').trim();

  switch (field) {
    case 'title':
      if (!str) {
        return tr('validation_sablon_basligi_zorunlu', 'Şablon başlığı zorunludur.');
      }
      return '';
    case 'code':
      if (!str) {
        return tr('validation_sablon_kodu_zorunlu', 'Şablon kodu (kimlik) zorunludur.');
      }
      return '';
    case 'subject':
      if (!str) {
        return tr('validation_eposta_konusu_zorunlu', 'E-posta konusu (Subject) zorunludur.');
      }
      return '';
    case 'body':
      if (!str) {
        return tr('validation_eposta_govdesi_zorunlu', 'E-posta gövde metni zorunludur.');
      }
      return '';
    default:
      return '';
  }
}

export function validateTemplateForm(
  data: Partial<EmailTemplateDTO>,
  t?: (key: string, fallback?: string) => string
): Record<string, string> {
  const errors: Record<string, string> = {};
  (['title', 'code', 'subject', 'body'] as const).forEach((field) => {
    const err = validateTemplateField(field, data[field], t);
    if (err) errors[field] = err;
  });
  return errors;
}

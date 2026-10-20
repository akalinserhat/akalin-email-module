/**
 * @akalin/email_module - E-Posta, SMTP ve Şablon Yönetimi Sözleşme Tipleri (types.ts)
 */

export interface SmtpConfigDTO {
  host: string;
  port: string | number;
  ssl: boolean;
  encryption?: 'tls' | 'ssl' | 'none' | string;
  user: string;
  username?: string;
  password?: string;
  fromEmail: string;
  from_email?: string;
  fromName: string;
  from_name?: string;
  isEnabled?: boolean;
  resetUrlBase?: string;
  resetTokenExpiryMin?: number;
}

export interface EmailTemplateDTO {
  id: string;
  code: string;
  title: string;
  description: string;
  subject: string;
  body: string;
  tags: string[];
  isDefault?: boolean;
}

export interface SmtpTestResultDTO {
  success: boolean;
  message: string;
  errorDetails?: string;
}

export interface IEmailServiceAdapter {
  getSmtpSettings(): Promise<SmtpConfigDTO>;
  saveSmtpSettings(data: SmtpConfigDTO): Promise<SmtpConfigDTO | void>;
  sendTestEmail(targetEmail: string, currentSettings?: SmtpConfigDTO): Promise<SmtpTestResultDTO>;
  getTemplates(): Promise<EmailTemplateDTO[]>;
  getTemplateById(id: string): Promise<EmailTemplateDTO | null>;
  saveTemplate(template: EmailTemplateDTO): Promise<EmailTemplateDTO | void>;
}

export interface CreateEmailModuleOptions {
  /** Modül tekil kimliği (Varsayılan: 'email-module') */
  id?: string;
  /** Gönderen ve şablonlarda kullanılacak uygulama/sistem adı (Örn: 'Webakus ERP', 'Enterprise AI Gateway') */
  appName?: string;
  /** E-posta modülü temel rotası (Varsayılan: '/email') */
  baseRoute?: string;
  /** Sistem Ayarları (BaseSystemPage) içindeki kart ID'si (Varsayılan: 'smtp') */
  settingsModuleId?: string;
  /** Sistem Ayarları kart başlığı */
  settingsModuleName?: string;
  /** Sistem Ayarları kart açıklaması */
  settingsModuleDesc?: string;
  /** Sistem Ayarları kart rozeti */
  settingsModuleBadge?: string;
  /** Sistem Ayarları kart sıralaması */
  settingsOrder?: number;
  /** Özel backend servis adaptörü */
  adapter?: IEmailServiceAdapter;
  /** Bildirim/Toast geri çağrısı */
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
  /** Özel varsayılan şablon listesi */
  defaultTemplates?: EmailTemplateDTO[];
  /** Kullanılabilir dinamik etiket listesi */
  availableTags?: string[];
  /** Canlı önizleme için örnek veri sözlüğü */
  sampleTagData?: Record<string, string>;
}

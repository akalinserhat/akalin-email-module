/**
 * @akalin/email_module - Bağımsız E-Posta, SMTP ve Şablon Yönetimi Kütüphanesi Ana Giriş Noktası
 */

export * from './types';
export {
  AVAILABLE_EMAIL_TAGS,
  DEFAULT_SAMPLE_TAG_DATA,
  DEFAULT_EMAIL_TEMPLATES,
  createDefaultEmailTemplates,
} from './defaults/defaultTemplates';
export {
  validateSmtpField,
  validateSmtpForm,
} from './validators/smtpValidation';
export {
  validateTemplateField,
  validateTemplateForm,
} from './validators/templateValidation';
export {
  createLocalStorageEmailAdapter,
  createRestEmailAdapter,
  createKeyValueEmailAdapter,
  EmailModuleContext,
  EmailModuleProvider,
  useEmailModule,
  setGlobalEmailModuleConfig,
  getGlobalEmailModuleConfig,
  type EmailModuleContextValue,
  type EmailModuleProviderProps,
} from './adapters/EmailServiceContext';
export {
  SmtpAyarlariPage,
  SmtpSettings,
  SmtpServerSettings,
  SmtpTestSettings,
  SmtpTemplatesSettings,
  type SmtpSettingsProps,
  type SmtpServerSettingsProps,
  type SmtpTestSettingsProps,
  type SmtpTemplatesSettingsProps,
} from './pages/SmtpAyarlari';
export {
  EmailTemplateEditor,
  type EmailTemplateEditorProps,
} from './pages/EmailTemplateEditor';
export {
  createEmailModule,
  EmailModulu,
} from './createEmailModule';

/**
 * @akalin/email_module - E-Posta & SMTP Ayarları Sayfası (SmtpAyarlari.tsx)
 * BaseSystemPage altyapısı üzerinde çalışan sistem e-posta, SMTP ve şablon yönetim ekranı.
 * 
 * MİMARİ NOTLARI:
 * - Sayfa içi münferit düğmeler (Kaydet butonu, Teste Geç butonu, Yeni Şablon butonu) kaldırılmış;
 *   tüm birincil ve ikincil operasyonlar Base sınıftan gelen ActionMenu (split-button & dropdown)
 *   üzerinden merkezi olarak yönetilmektedir.
 * - Sunucu sekmesinde global Cmd+S / Ctrl+S klavye kısayolu ile form kaydetme desteklenmektedir.
 * - Sekmeler değiştikçe ActionMenu dinamik ve reaktif olarak ilgili sekmenin aksiyonlarını sunar.
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Send,
  Server,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Save,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  BaseSystemPage,
  useBaseSystemPage,
  ActionMenu,
  FieldError,
  EmailTemplateCard,
  type BaseTabItem,
  type ActionMenuItem,
} from '@akalin/ui';
import { EmailTemplateDTO, SmtpConfigDTO } from '../types';
import { useEmailModule } from '../adapters/EmailServiceContext';
import { validateSmtpField, validateSmtpForm } from '../validators/smtpValidation';
import { EmailTemplateEditor } from './EmailTemplateEditor';

/* ─────────────────────────────────────────────────────────────
 * ALT BİLEŞEN 1: SMTP Sunucu Yapılandırması Formu
 * ───────────────────────────────────────────────────────────── */
export interface SmtpServerSettingsProps {
  onSaved?: (data: SmtpConfigDTO) => void;
  onGoToTest?: () => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSavingChange?: (saving: boolean) => void;
  showBottomButtons?: boolean;
}

export interface SmtpServerSettingsHandle {
  save: () => Promise<boolean>;
  reload: () => Promise<void>;
  isSaving: boolean;
}

export const SmtpServerSettings = forwardRef<
  SmtpServerSettingsHandle,
  SmtpServerSettingsProps
>(
  (
    {
      onSaved,
      onGoToTest,
      onNotify: propNotify,
      onSavingChange,
      showBottomButtons = false,
    },
    ref
  ) => {
    const { adapter, appName, onNotify: ctxNotify } = useEmailModule();

    const notify = useCallback(
      (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
        if (propNotify) propNotify(msg, type);
        else if (ctxNotify) ctxNotify(msg, type);
      },
      [propNotify, ctxNotify]
    );

    const [smtpData, setSmtpData] = useState<SmtpConfigDTO>({
      host: '',
      port: '587',
      ssl: true,
      user: '',
      password: '',
      fromEmail: '',
      fromName: appName || 'Enterprise AI Gateway',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const fetchSmtpSettings = useCallback(async () => {
      try {
        const data = await adapter.getSmtpSettings();
        if (data) {
          setSmtpData({
            host: data.host || '',
            port: String(data.port ?? '587'),
            ssl: data.ssl !== undefined ? Boolean(data.ssl) : data.encryption !== 'none',
            user: data.user ?? data.username ?? '',
            password: data.password ?? '',
            fromEmail: data.fromEmail ?? data.from_email ?? '',
            fromName: data.fromName ?? data.from_name ?? appName,
          });
        }
      } catch {}
    }, [adapter, appName]);

    useEffect(() => {
      fetchSmtpSettings();
    }, [fetchSmtpSettings]);

    const handleFieldChange = <K extends keyof SmtpConfigDTO>(
      field: K,
      value: SmtpConfigDTO[K]
    ) => {
      setSmtpData((prev) => ({ ...prev, [field]: value }));
      if (errors[field as string]) {
        setErrors((prev) => ({ ...prev, [field as string]: '' }));
      }
    };

    const handleFieldBlur = (field: string, value: unknown) => {
      const errorMsg = validateSmtpField(field, value);
      setErrors((prev) => ({ ...prev, [field]: errorMsg }));
    };

    const handleSave = useCallback(
      async (e?: React.FormEvent): Promise<boolean> => {
        if (e) e.preventDefault();

        const formErrors = validateSmtpForm(smtpData);
        if (Object.keys(formErrors).length > 0) {
          setErrors(formErrors);
          notify('Lütfen formdaki zorunlu alanları kontrol ediniz.', 'error');
          return false;
        }

        try {
          setSaving(true);
          onSavingChange?.(true);
          await adapter.saveSmtpSettings(smtpData);
          notify('SMTP e-posta ayarları başarıyla kaydedildi.', 'success');
          if (onSaved) onSaved(smtpData);
          return true;
        } catch {
          notify('SMTP ayarları kaydedilirken hata oluştu.', 'error');
          return false;
        } finally {
          setSaving(false);
          onSavingChange?.(false);
        }
      },
      [smtpData, adapter, notify, onSaved, onSavingChange]
    );

    useImperativeHandle(
      ref,
      () => ({
        save: handleSave,
        reload: fetchSmtpSettings,
        isSaving: saving,
      }),
      [handleSave, fetchSmtpSettings, saving]
    );

    const isConfigured = Boolean(
      smtpData.host && (smtpData.user || smtpData.fromEmail)
    );

    return (
      <div className="settings-section-card">
        <div className="settings-section-header">
          <div>
            <h3 className="settings-section-title">
              <Server size={20} color="var(--accent-primary)" />
              SMTP Sunucu Parametreleri
            </h3>
            <p className="settings-section-desc">
              Giden sistem bildirimleri, şifre sıfırlama ve otomatik rapor e-postaları için SMTP sunucu bağlantısı.
            </p>
          </div>
          {isConfigured && (
            <span className="chip-primary email-chip-sm flex items-center gap-4">
              <CheckCircle2 size={13} />
              Yapılandırıldı
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="form-grid max-w-680">
          <div className="form-field">
            <label className="form-label">SMTP Sunucusu (Host)</label>
            <input
              type="text"
              className={`form-input ${errors.host ? 'is-invalid' : ''}`}
              value={smtpData.host}
              onChange={(e) => handleFieldChange('host', e.target.value)}
              onBlur={(e) => handleFieldBlur('host', e.target.value)}
              placeholder="Örn: smtp.gmail.com veya mail.sirket.com"
            />
            <FieldError error={errors.host} />
          </div>

          <div className="form-field">
            <label className="form-label">Port</label>
            <input
              type="text"
              className={`form-input ${errors.port ? 'is-invalid' : ''}`}
              value={String(smtpData.port ?? '')}
              onChange={(e) => handleFieldChange('port', e.target.value)}
              onBlur={(e) => handleFieldBlur('port', e.target.value)}
              placeholder="587 veya 465"
            />
            <span className="form-helper-text">
              Önerilen: 587 (STARTTLS/TLS) veya 465 (SSL)
            </span>
            <FieldError error={errors.port} />
          </div>

          <div className="form-field">
            <label className="form-label">Kullanıcı Adı / E-Posta</label>
            <input
              type="text"
              className={`form-input ${errors.user ? 'is-invalid' : ''}`}
              value={smtpData.user}
              onChange={(e) => handleFieldChange('user', e.target.value)}
              onBlur={(e) => handleFieldBlur('user', e.target.value)}
              placeholder="bilgi@sirket.com"
            />
            <FieldError error={errors.user} />
          </div>

          <div className="form-field">
            <label className="form-label">SMTP Şifresi (Uygulama Parolası)</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input password-input-field"
                value={smtpData.password || ''}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Gizle' : 'Göster'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <span className="form-helper-text">
              Gmail veya Yandex kullanıyorsanız Uygulama Şifresi giriniz.
            </span>
          </div>

          <div className="form-field">
            <label className="form-label">Gönderen E-Posta</label>
            <input
              type="email"
              className={`form-input ${errors.fromEmail ? 'is-invalid' : ''}`}
              value={smtpData.fromEmail}
              onChange={(e) => handleFieldChange('fromEmail', e.target.value)}
              onBlur={(e) => handleFieldBlur('fromEmail', e.target.value)}
              placeholder="noreply@sirket.com"
            />
            <FieldError error={errors.fromEmail} />
          </div>

          <div className="form-field">
            <label className="form-label">Gönderen Adı</label>
            <input
              type="text"
              className="form-input"
              value={smtpData.fromName}
              onChange={(e) => handleFieldChange('fromName', e.target.value)}
              placeholder={appName || 'Webakus ERP'}
            />
          </div>

          <div className="form-field full-width">
            <div
              className="email-switch-card"
              onClick={() => handleFieldChange('ssl', !smtpData.ssl)}
            >
              <div className="email-switch-left">
                <div
                  className={`email-switch-icon ${
                    smtpData.ssl ? 'ssl-active' : ''
                  }`}
                >
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="email-switch-title">
                    SSL / TLS Güvenli Bağlantı Kullan
                  </div>
                  <div className="email-switch-desc">
                    Giden e-postaların SMTP sunucusuna güvenli şifreli tünel (SSL/TLS) üzerinden aktarılmasını sağlar.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(smtpData.ssl)}
                onChange={(e) => handleFieldChange('ssl', e.target.checked)}
                className="email-checkbox"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {showBottomButtons && (
            <div className="form-field full-width flex items-center gap-12 pt-8">
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-8"
                disabled={saving}
              >
                <Save size={15} />
                SMTP Ayarlarını Kaydet
              </button>
              {onGoToTest && (
                <button
                  type="button"
                  className="btn btn-outline flex items-center gap-8"
                  onClick={onGoToTest}
                >
                  <Send size={15} />
                  E-Posta Testine Geç
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    );
  }
);

/* ─────────────────────────────────────────────────────────────
 * ALT BİLEŞEN 2: Canlı E-Posta Gönderim Testi Konsolu
 * ───────────────────────────────────────────────────────────── */
export interface SmtpTestSettingsProps {
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSendingChange?: (sending: boolean) => void;
}

export interface SmtpTestSettingsHandle {
  sendTest: () => Promise<boolean>;
  reset: () => void;
  isSending: boolean;
}

export const SmtpTestSettings = forwardRef<
  SmtpTestSettingsHandle,
  SmtpTestSettingsProps
>(({ onNotify: propNotify, onSendingChange }, ref) => {
  const { adapter, onNotify: ctxNotify } = useEmailModule();

  const notify = useCallback(
    (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
      if (propNotify) propNotify(msg, type);
      else if (ctxNotify) ctxNotify(msg, type);
    },
    [propNotify, ctxNotify]
  );

  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    time: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState('');

  const handleSendTest = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      if (e) e.preventDefault();

      const err = validateSmtpField('testEmail', testEmail);
      if (err) {
        setError(err);
        notify(err, 'error');
        return false;
      }
      setError('');

      try {
        setSending(true);
        onSendingChange?.(true);
        setLastResult(null);
        const res = await adapter.sendTestEmail(testEmail.trim());
        setLastResult({
          success: res.success,
          time: new Date().toLocaleTimeString('tr-TR'),
          message: res.message,
        });
        notify(res.message, res.success ? 'success' : 'error');
        return res.success;
      } catch (err) {
        const serverMsg =
          err instanceof Error
            ? err.message
            : 'Test e-postası gönderilemedi. Lütfen sunucu parametrelerini kontrol ediniz.';
        setLastResult({
          success: false,
          time: new Date().toLocaleTimeString('tr-TR'),
          message: serverMsg,
        });
        notify(serverMsg, 'error');
        return false;
      } finally {
        setSending(false);
        onSendingChange?.(false);
      }
    },
    [testEmail, adapter, notify, onSendingChange]
  );

  const handleReset = useCallback(() => {
    setTestEmail('');
    setError('');
    setLastResult(null);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      sendTest: handleSendTest,
      reset: handleReset,
      isSending: sending,
    }),
    [handleSendTest, handleReset, sending]
  );

  return (
    <div className="settings-section-card">
      <div className="settings-section-header">
        <div>
          <h3 className="settings-section-title">
            <Send size={20} color="var(--accent-primary)" />
            E-Posta Gönderim Testi
          </h3>
          <p className="settings-section-desc">
            Girdiğiniz SMTP yapılandırmasının çalıştığını doğrulamak için bir alıcı e-posta adresi yazıp canlı test e-postası gönderin.
          </p>
        </div>
      </div>

      <form onSubmit={handleSendTest} className="max-w-680 flex flex-col gap-16">
        <div className="form-field">
          <label className="form-label flex items-center gap-6">
            <Mail size={15} color="var(--accent-primary)" />
            Alıcı E-Posta Adresi
          </label>
          <div className="flex gap-10">
            <input
              type="email"
              className={`form-input flex-1 ${error ? 'is-invalid' : ''}`}
              placeholder="alici@example.com"
              value={testEmail}
              onChange={(e) => {
                setTestEmail(e.target.value);
                if (error) setError('');
              }}
            />
          </div>
          <span className="form-helper-text">
            Test e-postasını göndermek için üst başlıktaki ActionMenu içerisinden "Test E-Postası Gönder" düğmesini kullanabilir veya Enter tuşuna basabilirsiniz.
          </span>
          <FieldError error={error} />
        </div>

        {lastResult && (
          <div
            className={`test-result-alert ${
              lastResult.success ? 'test-result-success' : 'test-result-error'
            }`}
          >
            <div className="flex items-center gap-10">
              {lastResult.success ? (
                <CheckCircle2 size={18} color="var(--success)" />
              ) : (
                <AlertCircle size={18} color="var(--danger)" />
              )}
              <div className="flex-1">
                <div className="font-600 text-13">
                  {lastResult.success ? 'Bağlantı Başarılı!' : 'Bağlantı Hatası'}
                  <span className="text-secondary text-12 font-400 ml-8">
                    ({lastResult.time})
                  </span>
                </div>
                <div className="text-12 mt-2">{lastResult.message}</div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────
 * ALT BİLEŞEN 3: Sistem E-Posta Şablonları Listesi
 * ───────────────────────────────────────────────────────────── */
export interface SmtpTemplatesSettingsProps {
  templates?: EmailTemplateDTO[];
  onOpenTemplate?: (templateId: string) => void;
  hideHeaderButton?: boolean;
}

export const SmtpTemplatesSettings: React.FC<SmtpTemplatesSettingsProps> = ({
  templates: propTemplates,
  onOpenTemplate,
  hideHeaderButton = true,
}) => {
  const { adapter } = useEmailModule();
  const navigate = useNavigate();
  const location = useLocation();
  const [internalTemplates, setInternalTemplates] = useState<EmailTemplateDTO[]>([]);

  useEffect(() => {
    if (propTemplates) return;
    let active = true;
    adapter
      .getTemplates()
      .then((list) => {
        if (active) setInternalTemplates(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [adapter, propTemplates]);

  const templates = propTemplates || internalTemplates;

  const handleOpen = (tplId: string) => {
    sessionStorage.setItem('smtp_active_tab', 'templates');
    if (onOpenTemplate) {
      onOpenTemplate(tplId);
      return;
    }
    const targetBase = location.pathname.startsWith('/ayarlar')
      ? '/ayarlar/SmtpAyarlari/templates'
      : '/email/templates';
    navigate(`${targetBase}/${tplId}`, {
      state: {
        returnUrl: `${location.pathname}?tab=templates`,
        returnTab: 'templates',
      },
    });
  };

  return (
    <div className="settings-section-card">
      <div className="settings-section-header">
        <div>
          <h3 className="settings-section-title">
            <FileText size={20} color="var(--accent-primary)" />
            E-Posta Şablonları & Bildirimler
          </h3>
          <p className="settings-section-desc">
            Sistem bildirimleri, şifre sıfırlama ve karşılama e-postaları için şablon yönetimi.
          </p>
        </div>
        {!hideHeaderButton && (
          <button
            type="button"
            className="btn btn-outline flex items-center gap-8"
            onClick={() => handleOpen('new')}
          >
            <Plus size={15} />
            Yeni Şablon
          </button>
        )}
      </div>

      <div className="flex flex-col gap-16 w-full">
        {templates.map((tpl) => (
          <EmailTemplateCard
            key={tpl.id}
            id={tpl.id}
            code={tpl.code}
            title={tpl.title}
            description={tpl.description}
            preview={tpl.subject}
            tags={tpl.tags}
            badge={tpl.isDefault ? 'Varsayılan Şablon' : undefined}
            onClick={() => handleOpen(tpl.id)}
          />
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
 * BİRLEŞİK BİLEŞEN & ANA SAYFA: SmtpSettings ve SmtpAyarlariPage
 * ───────────────────────────────────────────────────────────── */
export interface SmtpSettingsProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
  embedInParentSystemPage?: boolean;
}

export const SmtpSettings: React.FC<SmtpSettingsProps> = ({
  activeTab: controlledActiveTab,
  onTabChange,
  onNotify,
  embedInParentSystemPage = false,
}) => {
  const { adapter, baseRoute } = useEmailModule();
  const { moduleId } = useParams<{ moduleId?: string }>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const baseSystem = useBaseSystemPage();

  const serverSettingsRef = useRef<SmtpServerSettingsHandle>(null);
  const testSettingsRef = useRef<SmtpTestSettingsHandle>(null);
  const [isServerSaving, setIsServerSaving] = useState(false);
  const [isTestSending, setIsTestSending] = useState(false);

  const isMac = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      navigator.platform.toUpperCase().indexOf('MAC') >= 0,
    []
  );

  const resolveInitialTab = () => {
    if (controlledActiveTab) return controlledActiveTab;
    const urlTab = searchParams.get('tab');
    if (urlTab && ['server', 'test', 'templates'].includes(urlTab)) return urlTab;
    const stateAny = location.state as any;
    if (
      stateAny?.returnTab &&
      ['server', 'test', 'templates'].includes(stateAny.returnTab)
    ) {
      return stateAny.returnTab;
    }
    if (moduleId) {
      const lower = moduleId.toLowerCase();
      if (lower.includes('test')) return 'test';
      if (lower.includes('sablon') || lower.includes('template')) return 'templates';
    }
    const savedTab = sessionStorage.getItem('smtp_active_tab');
    if (savedTab && ['server', 'test', 'templates'].includes(savedTab)) {
      return savedTab;
    }
    return 'server';
  };

  const [internalActiveTab, setInternalActiveTab] = useState<string>(resolveInitialTab);
  const [templates, setTemplates] = useState<EmailTemplateDTO[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    () => searchParams.get('template')
  );

  const loadTemplates = useCallback(async () => {
    try {
      const data = await adapter.getTemplates();
      setTemplates(data);
    } catch {}
  }, [adapter]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (
      urlTab &&
      ['server', 'test', 'templates'].includes(urlTab) &&
      urlTab !== internalActiveTab
    ) {
      setInternalActiveTab(urlTab);
      sessionStorage.setItem('smtp_active_tab', urlTab);
    }
    const tplParam = searchParams.get('template');
    setEditingTemplateId(tplParam || null);
  }, [searchParams, location.state]);

  const currentTab =
    controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabChange = useCallback(
    (tabId: string | number) => {
      const nextTab = String(tabId);
      sessionStorage.setItem('smtp_active_tab', nextTab);
      setInternalActiveTab(nextTab);

      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', nextTab);
      newParams.delete('template');
      setSearchParams(newParams, { replace: true });

      if (onTabChange) {
        onTabChange(nextTab);
      }
    },
    [searchParams, setSearchParams, onTabChange]
  );

  const handleOpenTemplate = useCallback(
    (tplId: string) => {
      sessionStorage.setItem('smtp_active_tab', 'templates');
      setEditingTemplateId(tplId);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('tab', 'templates');
      nextParams.set('template', tplId);
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  const handleCloseTemplate = useCallback(() => {
    setEditingTemplateId(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', 'templates');
    nextParams.delete('template');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Global Cmd+S / Ctrl+S Kısayolu (Sunucu sekmesinde kaydetme)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        if (currentTab === 'server' && serverSettingsRef.current) {
          e.preventDefault();
          serverSettingsRef.current.save();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab]);

  // Sekme bazlı reaktif ActionMenu aksiyonları
  const currentTabActions = useMemo<ActionMenuItem[]>(() => {
    if (currentTab === 'server') {
      return [
        {
          label: isServerSaving ? 'Kaydediliyor...' : 'SMTP Ayarlarını Kaydet',
          icon: isServerSaving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          ),
          badge: (
            <kbd className="document-save-hotkey">
              {isMac ? '⌘S' : 'Ctrl+S'}
            </kbd>
          ),
          isDefault: true,
          variant: 'primary',
          disabled: isServerSaving,
          onClick: () => {
            serverSettingsRef.current?.save();
          },
        },
        {
          label: 'E-Posta Testine Geç',
          icon: <Send size={15} />,
          onClick: () => handleTabChange('test'),
        },
        {
          label: 'Yenile',
          icon: <RefreshCw size={15} />,
          dividerAbove: true,
          onClick: () => {
            serverSettingsRef.current?.reload();
          },
        },
      ];
    }

    if (currentTab === 'test') {
      return [
        {
          label: isTestSending ? 'Gönderiliyor...' : 'Test E-Postası Gönder',
          icon: isTestSending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          ),
          isDefault: true,
          variant: 'primary',
          disabled: isTestSending,
          onClick: () => {
            testSettingsRef.current?.sendTest();
          },
        },
        {
          label: 'Sunucu Yapılandırmasına Dön',
          icon: <Server size={15} />,
          onClick: () => handleTabChange('server'),
        },
        {
          label: 'Sıfırla / Yenile',
          icon: <RefreshCw size={15} />,
          dividerAbove: true,
          onClick: () => {
            testSettingsRef.current?.reset();
          },
        },
      ];
    }

    if (currentTab === 'templates') {
      return [
        {
          label: 'Yeni Şablon',
          icon: <Plus size={15} />,
          isDefault: true,
          variant: 'primary',
          onClick: () => handleOpenTemplate('new'),
        },
        {
          label: 'Şablonları Yenile',
          icon: <RefreshCw size={15} />,
          dividerAbove: true,
          onClick: loadTemplates,
        },
      ];
    }

    return [];
  }, [
    currentTab,
    isServerSaving,
    isTestSending,
    isMac,
    handleTabChange,
    handleOpenTemplate,
    loadTemplates,
  ]);

  const tabs = useMemo<BaseTabItem[]>(
    () => [
      {
        id: 'server',
        label: 'Sunucu Yapılandırması',
        icon: <Server size={18} />,
        content: (
          <SmtpServerSettings
            ref={serverSettingsRef}
            onNotify={onNotify}
            onSavingChange={setIsServerSaving}
            onGoToTest={() => handleTabChange('test')}
            showBottomButtons={false}
          />
        ),
      },
      {
        id: 'test',
        label: 'E-Posta Testi',
        icon: <Send size={18} />,
        content: (
          <SmtpTestSettings
            ref={testSettingsRef}
            onNotify={onNotify}
            onSendingChange={setIsTestSending}
          />
        ),
      },
      {
        id: 'templates',
        label: 'Şablonlar & Bildirimler',
        icon: <FileText size={18} />,
        content: (
          <SmtpTemplatesSettings
            templates={templates}
            onOpenTemplate={handleOpenTemplate}
            hideHeaderButton={true}
          />
        ),
      },
    ],
    [onNotify, handleTabChange, templates, handleOpenTemplate]
  );

  useEffect(() => {
    if (embedInParentSystemPage && baseSystem?.setTabs && !editingTemplateId) {
      baseSystem.setTabs(tabs);
      return () => {
        baseSystem.setTabs?.(null);
      };
    }
  }, [embedInParentSystemPage, tabs, baseSystem, editingTemplateId]);

  if (editingTemplateId) {
    return (
      <EmailTemplateEditor
        templateId={editingTemplateId}
        onClose={handleCloseTemplate}
        onSaved={async () => {
          await loadTemplates();
          handleCloseTemplate();
        }}
        onNotify={onNotify}
      />
    );
  }

  if (embedInParentSystemPage && baseSystem?.setTabs) {
    return null;
  }

  return (
    <BaseSystemPage
      title="E-Posta & SMTP Ayarları"
      subtitle="Sistem e-posta sunucu parametrelerini, SMTP yapılandırmasını, gönderim testlerini ve e-posta şablonlarını buradan yönetin."
      icon={<Mail size={24} />}
      baseRoute={baseRoute || '/settings/smtp'}
      headerSync={false}
      showBackButton={false}
      tabs={tabs}
      activeTabId={currentTab}
      onTabChange={handleTabChange}
      onRefresh={
        currentTab === 'templates'
          ? loadTemplates
          : currentTab === 'server'
          ? () => serverSettingsRef.current?.reload()
          : () => testSettingsRef.current?.reset()
      }
      extraDropdownActions={currentTabActions}
      customActionMenu={
        <ActionMenu
          showDefaultActionAsButton={true}
          actions={currentTabActions}
        />
      }
    />
  );
};

export const SmtpAyarlariPage: React.FC<SmtpSettingsProps> = (props) => (
  <SmtpSettings {...props} />
);

export default SmtpAyarlariPage;

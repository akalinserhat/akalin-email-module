/**
 * @akalin/email_module - E-Posta Şablon Tanımlama & Düzenleme Formu (EmailTemplateEditor.tsx)
 * BaseCardPage temel iskeletinden türetilmiş, e-posta şablonu ve gövde editörü.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FileText, Sparkles, Eye, Tag, CheckCircle2 } from 'lucide-react';
import {
  BaseCardPage,
  FieldError,
  BaseSwitch,
  BackButton,
  useHeaderApi,
  type BaseTabItem,
} from '@akalin/ui';
import { EmailTemplateDTO } from '../types';
import { useEmailModule } from '../adapters/EmailServiceContext';
import {
  validateTemplateField,
  validateTemplateForm,
} from '../validators/templateValidation';

export interface EmailTemplateEditorProps {
  templateId?: string;
  onClose?: () => void;
  onSaved?: (template: EmailTemplateDTO) => void | Promise<void>;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  templateId: propTemplateId,
  onClose: propOnClose,
  onSaved: propOnSaved,
  onNotify: propOnNotify,
}) => {
  const params = useParams<{ templateId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    adapter,
    onNotify: ctxNotify,
    availableTags,
    sampleTagData,
  } = useEmailModule();

  const notify = useCallback(
    (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
      if (propOnNotify) {
        propOnNotify(msg, type);
      } else if (ctxNotify) {
        ctxNotify(msg, type);
      }
    },
    [propOnNotify, ctxNotify]
  );

  const effectiveTemplateId = propTemplateId ?? params.templateId ?? 'new';
  const isNew = !effectiveTemplateId || effectiveTemplateId === 'new';

  const [formData, setFormData] = useState<EmailTemplateDTO>({
    id: '',
    code: '',
    title: '',
    description: '',
    subject: '',
    body: '',
    tags: [],
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string | number>('general');

  const handleClose = useCallback(() => {
    if (propOnClose) {
      propOnClose();
      return;
    }
    const stateAny = location.state as any;
    if (stateAny?.returnUrl) {
      navigate(stateAny.returnUrl, { replace: true });
      return;
    }
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/settings/smtp?tab=templates', { replace: true });
    }
  }, [propOnClose, navigate, location.state]);

  useEffect(() => {
    let active = true;
    const loadTemplate = async () => {
      try {
        setLoading(true);
        if (!isNew) {
          const found = await adapter.getTemplateById(effectiveTemplateId);
          if (!active) return;
          if (found) {
            setFormData({
              id: found.id || effectiveTemplateId,
              code: found.code || '',
              title: found.title || '',
              description: found.description || '',
              subject: found.subject || '',
              body: found.body || '',
              tags: Array.isArray(found.tags) ? found.tags : [],
              isDefault: Boolean(found.isDefault),
            });
          } else {
            notify('İlgili e-posta şablonu bulunamadı.', 'error');
            handleClose();
          }
        } else {
          setFormData({
            id: `tpl_${Date.now()}`,
            code: '',
            title: '',
            description: '',
            subject: '',
            body: '',
            tags: ['{{KullaniciAdi}}', '{{FirmaAdi}}'],
            isDefault: false,
          });
        }
      } catch {
        if (active) {
          notify('Şablon yüklenirken hata oluştu.', 'error');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadTemplate();
    return () => {
      active = false;
    };
  }, [effectiveTemplateId, isNew, adapter, notify, handleClose]);

  const handleFieldChange = <K extends keyof EmailTemplateDTO>(
    field: K,
    value: EmailTemplateDTO[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const handleFieldBlur = (field: string, value: unknown) => {
    const errMsg = validateTemplateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: errMsg }));
  };

  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormData((prev) => ({
        ...prev,
        body: prev.body + (prev.body ? '\n' : '') + tag,
        tags: prev.tags.includes(tag) ? prev.tags : [...prev.tags, tag],
      }));
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const currentText = formData.body || '';
    const newText =
      currentText.substring(0, start) + tag + currentText.substring(end);

    setFormData((prev) => ({
      ...prev,
      body: newText,
      tags: prev.tags.includes(tag) ? prev.tags : [...prev.tags, tag],
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);

    notify(`${tag} etiketi içeriğe eklendi.`, 'success');
  };

  const resolvedPreview = useMemo(() => {
    let subj = formData.subject || '';
    let bdy = formData.body || '';

    Object.entries(sampleTagData).forEach(([tag, val]) => {
      subj = subj.split(tag).join(val);
      bdy = bdy.split(tag).join(val);
    });

    return {
      subject: subj || '(Konu belirtilmedi)',
      body: bdy || '(İçerik henüz girilmedi)',
    };
  }, [formData.subject, formData.body, sampleTagData]);

  const handleSave = async () => {
    const validationErrors = validateTemplateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      notify('Lütfen formdaki zorunlu alanları kontrol ediniz.', 'error');
      if (validationErrors.title || validationErrors.code) {
        setActiveTabId('general');
      } else if (validationErrors.subject || validationErrors.body) {
        setActiveTabId('content');
      }
      return;
    }

    try {
      setSaving(true);
      await adapter.saveTemplate(formData);
      notify('E-posta şablonu başarıyla kaydedildi.', 'success');
      if (propOnSaved) {
        await propOnSaved(formData);
      } else {
        handleClose();
      }
    } catch {
      notify('Şablon kaydedilirken hata oluştu.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const headerApi = useHeaderApi() || ({} as any);
  const { setHeader, clearHeader, setHeaderBreadcrumbOptions } = headerApi;

  useEffect(() => {
    if (!propOnClose && setHeader) {
      setHeader(
        'email-template-editor-header',
        <BackButton onClick={handleClose} title="Geri Dön" />
      );
    }
    if (setHeaderBreadcrumbOptions) {
      setHeaderBreadcrumbOptions({
        recordTitle: formData.title || 'E-Posta Şablonu',
      });
    }
    return () => {
      if (!propOnClose && clearHeader) clearHeader('email-template-editor-header');
      if (setHeaderBreadcrumbOptions) setHeaderBreadcrumbOptions(null);
    };
  }, [
    propOnClose,
    setHeader,
    clearHeader,
    setHeaderBreadcrumbOptions,
    handleClose,
    formData.title,
  ]);

  const tabs = useMemo<BaseTabItem[]>(
    () => [
      {
        id: 'general',
        label: 'Genel Bilgiler',
        icon: <FileText size={16} />,
        content: (
          <div className="flex flex-col gap-20 max-w-960 pt-16">
            <div className="settings-section-card">
              <div className="settings-section-header">
                <div>
                  <h3 className="settings-section-title">
                    <FileText size={19} color="var(--accent-primary)" />
                    Şablon Genel Bilgileri
                  </h3>
                  <p className="settings-section-desc">
                    Şablonun sistem içindeki adı, tekil kodu ve kullanım amacı.
                  </p>
                </div>
                {formData.isDefault && (
                  <span className="chip-primary email-chip-sm flex items-center gap-4">
                    <CheckCircle2 size={13} />
                    Varsayılan Şablon
                  </span>
                )}
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Şablon Başlığı</label>
                  <input
                    type="text"
                    className={`form-input ${errors.title ? 'is-invalid' : ''}`}
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    onBlur={(e) => handleFieldBlur('title', e.target.value)}
                    placeholder="Örn: Şifre Sıfırlama Bildirimi"
                  />
                  <FieldError error={errors.title} />
                </div>

                <div className="form-field">
                  <label className="form-label">Şablon Kodu (Kimlik)</label>
                  <input
                    type="text"
                    className={`form-input ${errors.code ? 'is-invalid' : ''}`}
                    value={formData.code}
                    onChange={(e) =>
                      handleFieldChange('code', e.target.value.toUpperCase())
                    }
                    onBlur={(e) => handleFieldBlur('code', e.target.value)}
                    placeholder="Örn: PASSWORD_RESET"
                  />
                  <span className="form-helper-text">
                    Sistem servislerinin şablonu çağırmak için kullandığı benzersiz anahtar.
                  </span>
                  <FieldError error={errors.code} />
                </div>

                <div className="form-field full-width">
                  <label className="form-label">Şablon Açıklaması</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Şablonun hangi senaryoda gönderildiğini açıklayın"
                  />
                </div>

                <div className="form-field full-width">
                  <div className="flex items-center justify-between p-12 surface-card rounded-12 border border-glass">
                    <div>
                      <div className="font-600 text-14 text-primary">
                        Varsayılan Sistem Şablonu Olarak Kullan
                      </div>
                      <div className="text-12 text-secondary">
                        Bu kod için birden fazla şablon varsa sistem öncelikli olarak bu şablonu gönderir.
                      </div>
                    </div>
                    <BaseSwitch
                      checked={Boolean(formData.isDefault)}
                      onChange={(e: any) =>
                        handleFieldChange(
                          'isDefault',
                          typeof e === 'boolean' ? e : Boolean(e?.target?.checked)
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'content',
        label: 'E-Posta İçeriği',
        icon: <Sparkles size={16} />,
        content: (
          <div className="flex flex-col gap-20 max-w-960 pt-16">
            <div className="settings-section-card">
              <div className="settings-section-header">
                <div>
                  <h3 className="settings-section-title">
                    <Sparkles size={19} color="var(--accent-primary)" />
                    E-Posta İçerik ve Gövdesi
                  </h3>
                  <p className="settings-section-desc">
                    Alıcıya gönderilecek e-postanın konusu, mesaj metni ve dinamik veri etiketleri.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-16">
                <div className="form-field">
                  <label className="form-label">E-Posta Konusu (Subject)</label>
                  <input
                    type="text"
                    className={`form-input ${errors.subject ? 'is-invalid' : ''}`}
                    value={formData.subject}
                    onChange={(e) => handleFieldChange('subject', e.target.value)}
                    onBlur={(e) => handleFieldBlur('subject', e.target.value)}
                    placeholder="Örn: Hesabınız İçin Şifre Sıfırlama Talebi"
                  />
                  <FieldError error={errors.subject} />
                </div>

                <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-6 text-13 font-500 text-secondary">
                    <Tag size={15} color="var(--accent-primary)" />
                    Kullanılabilir Dinamik Değişkenler (Tıklayarak içeriğe ekleyin):
                  </div>
                  <div className="flex flex-wrap gap-8">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="email-tag-chip-btn"
                        onClick={() => handleInsertTag(tag)}
                        title={`${tag} etiketini imlecin olduğu yere ekle`}
                      >
                        <span>+</span>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">
                    E-Posta Gövde Metni (Message Body)
                  </label>
                  <textarea
                    ref={textareaRef}
                    className={`email-template-editor-textarea ${
                      errors.body ? 'is-invalid' : ''
                    }`}
                    value={formData.body}
                    onChange={(e) => handleFieldChange('body', e.target.value)}
                    onBlur={(e) => handleFieldBlur('body', e.target.value)}
                    placeholder="E-posta içeriğini buraya yazın veya yukarıdaki değişkenleri ekleyin..."
                  />
                  <FieldError error={errors.body} />
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'preview',
        label: 'Canlı Önizleme',
        icon: <Eye size={16} />,
        content: (
          <div className="flex flex-col gap-20 max-w-960 pt-16">
            <div className="settings-section-card">
              <div className="settings-section-header">
                <div>
                  <h3 className="settings-section-title">
                    <Eye size={19} color="var(--accent-primary)" />
                    Canlı E-Posta Önizlemesi
                  </h3>
                  <p className="settings-section-desc">
                    Aşağıdaki önizlemede dinamik etiketler gerçekçi test verileriyle çözümlenerek gösterilmektedir.
                  </p>
                </div>
              </div>

              <div className="email-preview-box">
                <div className="email-preview-subject">
                  <span className="text-secondary text-12 font-500 mr-8">
                    Konu:
                  </span>
                  {resolvedPreview.subject}
                </div>
                <div className="email-preview-body">{resolvedPreview.body}</div>
              </div>
            </div>
          </div>
        ),
      },
    ],
    [formData, errors, resolvedPreview, availableTags]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-48 text-secondary min-h-280">
        Şablon bilgileri yükleniyor...
      </div>
    );
  }

  return (
    <BaseCardPage
      id="email-template-editor"
      title={
        isNew
          ? 'Yeni E-Posta Şablonu'
          : formData.title || 'E-Posta Şablonu Düzenle'
      }
      pageTitle={formData.title || 'E-Posta Şablonu Düzenle'}
      icon={<FileText size={20} />}
      subtitleLeft={formData.title ? 'Sistem E-Posta Şablonu' : undefined}
      subtitleRight={formData.code ? `Kod: ${formData.code}` : undefined}
      showBackButton={Boolean(propOnClose)}
      onBack={handleClose}
      onClose={handleClose}
      onSave={handleSave}
      isSaving={saving}
      saveButtonText="Kaydet"
      enableAiAssistant={false}
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={setActiveTabId}
      asForm={false}
      className="fade-in"
    />
  );
};

export default EmailTemplateEditor;

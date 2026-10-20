/**
 * @akalin/email_module - Modül Fabrikası (createEmailModule.tsx)
 * @akalin/module_core ModuleRegistry ile tam uyumlu IModuleDefinition üretir.
 */

import React from 'react';
import { Mail, Server, Send, FileText } from 'lucide-react';
import type { IModuleDefinition } from '@akalin/module_core';
import { CreateEmailModuleOptions } from './types';
import {
  AVAILABLE_EMAIL_TAGS,
  createDefaultEmailTemplates,
  DEFAULT_SAMPLE_TAG_DATA,
} from './defaults/defaultTemplates';
import {
  createRestEmailAdapter,
  EmailModuleProvider,
  setGlobalEmailModuleConfig,
} from './adapters/EmailServiceContext';
import {
  SmtpAyarlariPage,
  SmtpSettings,
  SmtpServerSettings,
  SmtpTestSettings,
  SmtpTemplatesSettings,
} from './pages/SmtpAyarlari';
import { EmailTemplateEditor } from './pages/EmailTemplateEditor';

export function createEmailModule(
  options?: CreateEmailModuleOptions
): IModuleDefinition {
  const id = options?.id || 'email-module';
  const appName = options?.appName || 'Enterprise AI Gateway';
  const baseRoute = (options?.baseRoute || '/email').replace(/\/$/, '');
  const settingsModuleId = options?.settingsModuleId || 'smtp';
  const defaultTemplates =
    options?.defaultTemplates || createDefaultEmailTemplates(appName);
  const availableTags = options?.availableTags || AVAILABLE_EMAIL_TAGS;
  const sampleTagData = {
    ...DEFAULT_SAMPLE_TAG_DATA,
    '{{FirmaAdi}}': appName,
    ...(options?.sampleTagData || {}),
  };

  const adapter =
    options?.adapter ||
    createRestEmailAdapter({
      appName,
      defaultTemplates,
    });

  setGlobalEmailModuleConfig({
    adapter,
    appName,
    baseRoute,
    onNotify: options?.onNotify,
    availableTags,
    sampleTagData,
  });

  const ConnectedSmtpPage: React.FC<any> = (props) => (
    <EmailModuleProvider
      adapter={adapter}
      appName={appName}
      baseRoute={`/settings/${settingsModuleId}`}
      onNotify={props.onShowToast || options?.onNotify}
      availableTags={availableTags}
      sampleTagData={sampleTagData}
    >
      <SmtpAyarlariPage onNotify={props.onShowToast || options?.onNotify} />
    </EmailModuleProvider>
  );

  const ConnectedTemplateEditor: React.FC<any> = (props) => (
    <EmailModuleProvider
      adapter={adapter}
      appName={appName}
      baseRoute={baseRoute}
      onNotify={props.onShowToast || options?.onNotify}
      availableTags={availableTags}
      sampleTagData={sampleTagData}
    >
      <EmailTemplateEditor {...props} />
    </EmailModuleProvider>
  );

  return {
    id,
    title: 'E-Posta & SMTP Yönetimi',
    name: 'E-Posta & SMTP Yönetimi',
    description:
      'Sistem genelindeki giden e-posta (SMTP) sunucu yapılandırması, gönderim testleri ve dinamik e-posta şablon yönetimi modülü.',
    version: '1.0.0',
    permissionPrefix: 'smtp',
    icon: <Mail size={20} />,
    iconName: 'Mail',
    order: options?.settingsOrder ?? 40,
    isCore: true,
    defaultActive: true,

    routes: [
      {
        path: `${baseRoute}/smtp`,
        element: <ConnectedSmtpPage />,
        title: 'SMTP Sunucu Yapılandırması',
        requiredPermissions: ['smtp.view'],
      },
      {
        path: `${baseRoute}/test`,
        element: <ConnectedSmtpPage />,
        title: 'E-Posta Gönderim Testi',
        requiredPermissions: ['email.test.send'],
      },
      {
        path: `${baseRoute}/templates`,
        element: <ConnectedSmtpPage />,
        title: 'E-Posta Şablonları & Bildirimler',
        requiredPermissions: ['email.templates.manage'],
      },
      {
        path: `${baseRoute}/templates/new`,
        element: <ConnectedTemplateEditor />,
        title: 'Yeni E-Posta Şablonu',
        requiredPermissions: ['email.templates.manage'],
      },
      {
        path: `${baseRoute}/templates/:templateId`,
        element: <ConnectedTemplateEditor />,
        title: 'E-Posta Şablonu Düzenle',
        requiredPermissions: ['email.templates.manage'],
      },
    ],

    menuItems: [
      {
        id: 'email-module-root',
        label: 'E-Posta & SMTP',
        icon: <Mail size={20} />,
        order: 65,
        children: [
          {
            id: 'email-smtp-server',
            label: 'SMTP Yapılandırması',
            path: `${baseRoute}/smtp`,
            icon: <Server size={18} />,
            requiredPermissions: ['smtp.view'],
          },
          {
            id: 'email-smtp-test',
            label: 'E-Posta Gönderim Testi',
            path: `${baseRoute}/test`,
            icon: <Send size={18} />,
            requiredPermissions: ['email.test.send'],
          },
          {
            id: 'email-smtp-templates',
            label: 'E-Posta Şablonları',
            path: `${baseRoute}/templates`,
            icon: <FileText size={18} />,
            requiredPermissions: ['email.templates.manage'],
          },
        ],
      },
    ],

    settingsModules: [
      {
        id: settingsModuleId,
        name: options?.settingsModuleName || 'E-Posta & SMTP Ayarları',
        desc:
          options?.settingsModuleDesc ||
          'Sistem genelindeki giden e-posta (SMTP) sunucu yapılandırması, gönderim testleri ve e-posta şablon yönetimi',
        icon: <Mail size={22} />,
        badge: options?.settingsModuleBadge || 'SMTP & Şablonlar',
        keywords:
          'smtp ayarları e-posta mail sunucu port tls ssl şablonlar bildirimler şifre sıfırlama test',
        order: options?.settingsOrder ?? 40,
        hasOwnLayout: true,
        aliases: ['SmtpAyarlari', 'email', 'smtp'],
        component: ConnectedSmtpPage,
      },
    ],

    cards: [
      {
        id: 'email-template',
        category: 'kart',
        titleKey: 'E-Posta Şablon Kartı',
        route: `${baseRoute}/templates`,
      },
    ],

    operations: [
      {
        id: 'smtp-sunucu',
        category: 'islem',
        titleKey: 'SMTP Sunucu Yapılandırması ve Test',
        useStandardCrud: false,
        customActions: [
          {
            action: 'goruntule',
            labelKey: 'SMTP Ayarlarını Görüntüleme',
            description: 'SMTP sunucu parametrelerini görüntüleme yetkisi.',
          },
          {
            action: 'duzenle',
            labelKey: 'SMTP Ayarlarını Güncelleme',
            description: 'SMTP sunucu ve güvenlik parametrelerini değiştirme yetkisi.',
          },
          {
            action: 'test-gonder',
            labelKey: 'Test E-Postası Gönderme',
            description: 'Canlı SMTP bağlantı ve test e-postası gönderme yetkisi.',
          },
        ],
      },
    ],

    permissions: [
      {
        key: 'smtp.view',
        name: 'SMTP Ayarlarını Görüntüleme',
        description: 'E-Posta (SMTP) sunucu ayarlarını görüntüleme yetkisi.',
        group: 'E-Posta & SMTP Yönetimi',
      },
      {
        key: 'smtp.manage',
        name: 'SMTP Sunucu Ayarlarını Güncelleme',
        description: 'SMTP sunucu bilgilerini, port ve SSL ayarlarını değiştirme yetkisi.',
        group: 'E-Posta & SMTP Yönetimi',
      },
      {
        key: 'email.templates.manage',
        name: 'E-Posta Şablonlarını Yönetme',
        description: 'Şifre sıfırlama ve bildirim e-posta şablonlarını düzenleme yetkisi.',
        group: 'E-Posta & SMTP Yönetimi',
      },
      {
        key: 'email.test.send',
        name: 'Test E-Postası Gönderme',
        description: 'SMTP yapılandırmasını doğrulamak için test e-postası gönderme yetkisi.',
        group: 'E-Posta & SMTP Yönetimi',
      },
    ],

    components: {
      SmtpAyarlariPage: ConnectedSmtpPage,
      SmtpSettings,
      SmtpServerSettings,
      SmtpTestSettings,
      SmtpTemplatesSettings,
      EmailTemplateEditor: ConnectedTemplateEditor,
    },
  };
}

export const EmailModulu = createEmailModule();
export default EmailModulu;

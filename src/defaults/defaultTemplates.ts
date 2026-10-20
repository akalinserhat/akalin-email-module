import { EmailTemplateDTO } from '../types';

export const AVAILABLE_EMAIL_TAGS: string[] = [
  '{{KullaniciAdi}}',
  '{{FirmaAdi}}',
  '{{DavetEdenKullanici}}',
  '{{KullaniciRolu}}',
  '{{DavetBaglantisi}}',
  '{{SifirlamaBaglantisi}}',
  '{{SonGecerlilikTarihi}}',
  '{{GirisAdresi}}',
  '{{KullaniciEposta}}',
  '{{CihazAdi}}',
  '{{IpAdresi}}',
  '{{GirisZamani}}',
  '{{HedefEmail}}',
  '{{SmtpSunucu}}',
  '{{Gonderen}}',
  '{{GonderimZamani}}',
];

export const DEFAULT_SAMPLE_TAG_DATA: Record<string, string> = {
  '{{KullaniciAdi}}': 'Serhat Akalın',
  '{{FirmaAdi}}': 'Akalın Teknoloji A.Ş.',
  '{{DavetEdenKullanici}}': 'Serhat Akalın (Sistem Yöneticisi)',
  '{{KullaniciRolu}}': 'Admin',
  '{{DavetBaglantisi}}': 'https://app.akalin.local/auth/invite?token=e7d3a1b9',
  '{{SifirlamaBaglantisi}}': 'https://app.akalin.local/auth/reset?token=a8f9c2d1',
  '{{SonGecerlilikTarihi}}': '21.10.2026 18:00',
  '{{GirisAdresi}}': 'https://app.akalin.local/login',
  '{{KullaniciEposta}}': 'akalinserhat@gmail.com',
  '{{CihazAdi}}': 'MacBook Pro (Chrome)',
  '{{IpAdresi}}': '195.175.204.12',
  '{{GirisZamani}}': '20.10.2026 21:00',
  '{{HedefEmail}}': 'akalinserhat@gmail.com',
  '{{SmtpSunucu}}': 'smtp.gmail.com:587',
  '{{Gonderen}}': 'Sistem Bildirim Servisi <noreply@akalin.local>',
  '{{GonderimZamani}}': '20.10.2026 21:00',
};

export function createDefaultEmailTemplates(
  appName = 'Sistem'
): EmailTemplateDTO[] {
  return [
    {
      id: 'password_reset',
      code: 'PASSWORD_RESET',
      title: 'Şifre Sıfırlama Bildirimi',
      description:
        'Kullanıcı şifre sıfırlama talebinde bulunduğunda gönderilen güvenlik kodu veya bağlantı e-postası.',
      subject: `${appName} Hesabınız İçin Şifre Sıfırlama Talebi`,
      body: `Merhaba {{KullaniciAdi}},\n\n${appName} hesabınız için bir şifre sıfırlama talebinde bulundunuz.\n\nŞifrenizi yenilemek için aşağıdaki bağlantıyı kullanabilirsiniz:\n{{SifirlamaBaglantisi}}\n\nBu bağlantı {{SonGecerlilikTarihi}} tarihine kadar geçerlidir.\nEğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayınız.\n\nSaygılarımızla,\n{{FirmaAdi}} Destek Ekibi`,
      tags: [
        '{{KullaniciAdi}}',
        '{{SifirlamaBaglantisi}}',
        '{{SonGecerlilikTarihi}}',
        '{{FirmaAdi}}',
      ],
      isDefault: true,
    },
    {
      id: 'company_user_invitation',
      code: 'COMPANY_USER_INVITATION',
      title: 'Firmaya / Organizasyona Kullanıcı Daveti',
      description:
        'Organizasyona yeni bir yönetici veya çalışan davet edildiğinde gönderilen davet ve erişim aktivasyon e-postası.',
      subject: `{{FirmaAdi}} Sizi ${appName} Ekibine Davet Etti`,
      body: `Sayın {{KullaniciAdi}},\n\n{{DavetEdenKullanici}}, sizi {{FirmaAdi}} organizasyonuna "{{KullaniciRolu}}" yetkisiyle katılmaya davet etti.\n\nDaveti kabul etmek ve hesabınızı aktifleştirmek için lütfen aşağıdaki bağlantıya tıklayınız:\n{{DavetBaglantisi}}\n\nBu davet bağlantısı {{SonGecerlilikTarihi}} tarihine kadar geçerlidir.\nEğer bu daveti beklemiyorsanız, bu e-postayı güvenle göz ardı edebilirsiniz.\n\nİyi çalışmalar dileriz,\n{{FirmaAdi}} Ekibi`,
      tags: [
        '{{KullaniciAdi}}',
        '{{FirmaAdi}}',
        '{{DavetEdenKullanici}}',
        '{{KullaniciRolu}}',
        '{{DavetBaglantisi}}',
        '{{SonGecerlilikTarihi}}',
      ],
      isDefault: true,
    },
    {
      id: 'user_invitation',
      code: 'USER_INVITATION',
      title: 'Yeni Kullanıcı Karşılama',
      description:
        'Sisteme yeni bir kullanıcı eklendiğinde gönderilen hesap aktivasyon e-postası.',
      subject: `{{FirmaAdi}} ${appName} Sistemine Hoş Geldiniz`,
      body: `Sayın {{KullaniciAdi}},\n\n{{FirmaAdi}} organizasyonu altındaki ${appName} sistemine erişiminiz başarıyla tanımlanmıştır.\n\nSisteme giriş yapabilmek için lütfen aşağıdaki adresten parolanızı oluşturunuz:\n{{GirisAdresi}}\n\nKayıtlı E-Posta: {{KullaniciEposta}}\n\nİyi çalışmalar dileriz.`,
      tags: [
        '{{KullaniciAdi}}',
        '{{FirmaAdi}}',
        '{{GirisAdresi}}',
        '{{KullaniciEposta}}',
      ],
      isDefault: true,
    },
    {
      id: 'security_alert',
      code: 'SECURITY_ALERT',
      title: 'Oturum Güvenlik Uyarısı',
      description:
        'Yeni bir cihazdan veya bilinmeyen bir IP adresinden giriş yapıldığında kullanıcıya gönderilen uyarı.',
      subject: 'Güvenlik Uyarısı: Hesabınıza Yeni Bir Cihazdan Giriş Yapıldı',
      body: 'Sayın {{KullaniciAdi}},\n\n{{GirisZamani}} tarihinde {{CihazAdi}} cihazından (IP: {{IpAdresi}}) hesabınıza yeni bir oturum açma işlemi gerçekleştirildi.\n\nEğer bu işlem bilginiz dahilinde değilse, lütfen vakit kaybetmeden hesabınızın şifresini değiştiriniz ve sistem yöneticinizle irtibata geçiniz.',
      tags: [
        '{{KullaniciAdi}}',
        '{{CihazAdi}}',
        '{{IpAdresi}}',
        '{{GirisZamani}}',
      ],
      isDefault: true,
    },
    {
      id: 'smtp_test_email',
      code: 'SMTP_TEST_EMAIL',
      title: 'SMTP Bağlantı ve Test İletisi',
      description:
        'SMTP sunucu yapılandırmasının çalıştığını doğrulamak için gönderilen canlı test e-postası şablonu.',
      subject: `${appName} - SMTP Bağlantı Testi`,
      body: `Sayın Yönetici,\n\nBu test e-postası, {{FirmaAdi}} bünyesindeki ${appName} üzerinden yapılandırılan SMTP sunucusu ({{SmtpSunucu}}) aracılığıyla canlı olarak iletilmiştir.\n\nTest İletisi Detayları:\n• SMTP Sunucusu: {{SmtpSunucu}}\n• Gönderen: {{Gonderen}}\n• Hedef Alıcı: {{HedefEmail}}\n• Tarih / Saat: {{GonderimZamani}}\n\nBu ileti, SMTP e-posta sunucunuzun başarıyla yapılandırıldığını ve e-posta gönderiminde herhangi bir problem bulunmadığını onaylamaktadır.\n\nİyi çalışmalar dileriz,\n{{FirmaAdi}} Ekibi`,
      tags: [
        '{{HedefEmail}}',
        '{{SmtpSunucu}}',
        '{{Gonderen}}',
        '{{GonderimZamani}}',
        '{{FirmaAdi}}',
      ],
      isDefault: true,
    },
  ];
}

export const DEFAULT_EMAIL_TEMPLATES = createDefaultEmailTemplates('Webakus ERP');

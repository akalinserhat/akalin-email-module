# @akalin/email_module

`@akalin/ui` ve `@akalin/module_core` altyapısı üzerinde çalışan bağımsız **E-Posta (SMTP) Sunucu Yapılandırması, Canlı Gönderim Test Konsolu ve Dinamik E-Posta Şablon Editörü** kütüphanesi.

## Kurulum

```json
{
  "dependencies": {
    "@akalin/module_core": "github:akalinserhat/akalin-module-core#main",
    "@akalin/email_module": "github:akalinserhat/akalin-email-module#main"
  }
}
```

## Kullanım

```tsx
import { ModuleRegistry } from '@akalin/module_core';
import { createEmailModule, createRestEmailAdapter } from '@akalin/email_module';

ModuleRegistry.register(
  createEmailModule({
    appName: 'Enterprise AI Gateway',
    adapter: createRestEmailAdapter({
      baseUrl: '/admin/smtp',
    }),
  })
);
```

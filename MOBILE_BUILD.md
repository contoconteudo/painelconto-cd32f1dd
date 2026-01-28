# 📱 Guia de Build Mobile (APK Android)

Este guia explica como gerar um APK Android do Conto CMS usando Capacitor.

---

## Pré-requisitos

### Software Necessário

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Android Studio** - [Download](https://developer.android.com/studio)
3. **Java JDK 17+** - Instalado automaticamente com Android Studio
4. **Git** - Para clonar o repositório

### Configuração do Android Studio

1. Abra Android Studio
2. Vá em **SDK Manager** (Tools > SDK Manager)
3. Instale:
   - Android SDK Platform 33 ou superior
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
4. Configure o `ANDROID_HOME` nas variáveis de ambiente

---

## Passos para Gerar o APK

### 1. Clone e Prepare o Projeto

```bash
# Clone do repositório
git clone [URL_DO_REPOSITORIO]
cd [NOME_DO_PROJETO]

# Instale dependências
npm install
```

### 2. Configure para Produção

Para produção, comente ou remova o bloco `server` no `capacitor.config.ts`:

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'app.lovable.b57cd4b811a642739262ee0200dad886',
  appName: 'Painel Conto',
  webDir: 'dist',
  
  // COMENTE PARA PRODUÇÃO:
  // server: {
  //   url: 'https://...',
  //   cleartext: true
  // },
  
  // ... resto da config
};
```

### 3. Build do Projeto

```bash
# Build de produção
npm run build

# OU usando o script mobile
npm run build:mobile
```

### 4. Adicione a Plataforma Android

```bash
# Inicialize Capacitor (se primeiro build)
npx cap init

# Adicione Android
npx cap add android

# Sincronize arquivos
npx cap sync android
```

### 5. Abra no Android Studio

```bash
npx cap open android
```

### 6. Gere o APK

No Android Studio:

1. Vá em **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Aguarde a compilação
3. O APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Scripts NPM Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run build:mobile` | Build otimizado para mobile |
| `npm run cap:sync` | Sincroniza web com nativo |
| `npm run cap:add:android` | Adiciona plataforma Android |
| `npm run cap:open:android` | Abre Android Studio |

---

## Configuração do App

### Ícones e Splash Screen

Os ícones estão configurados em:
- `public/icons/icon-192.png` - Ícone padrão
- `public/icons/icon-512.png` - Ícone grande

Para personalizar ícones Android:
1. Abra Android Studio com `npx cap open android`
2. Right-click em `res` > New > Image Asset
3. Configure o ícone do launcher

### Cores e Tema

As cores do app estão definidas em:
- `capacitor.config.ts` - StatusBar e SplashScreen
- `index.html` - theme-color meta tag

---

## Troubleshooting

### Erro: "Android SDK not found"

Configure as variáveis de ambiente:

```bash
# Windows (PowerShell)
$env:ANDROID_HOME = "C:\Users\[USER]\AppData\Local\Android\Sdk"

# macOS/Linux
export ANDROID_HOME=~/Library/Android/sdk
```

### Erro: "Gradle build failed"

```bash
# Limpe o cache
cd android
./gradlew clean
cd ..
npx cap sync android
```

### App não carrega conteúdo

Verifique se o bloco `server` está comentado para produção e que o build foi gerado corretamente.

---

## Publicação na Play Store

### 1. Gere um APK Assinado

No Android Studio:
1. Build > Generate Signed Bundle / APK
2. Crie ou use uma keystore existente
3. Selecione "APK" e build type "release"

### 2. Requisitos da Play Store

- Ícones de alta resolução (512x512)
- Screenshots do app
- Descrição e política de privacidade
- Target API Level 33+

---

## Desenvolvimento com Hot Reload

Para desenvolver com hot reload no dispositivo:

1. Mantenha o bloco `server` no `capacitor.config.ts`
2. Execute `npm run dev` no terminal
3. Conecte o dispositivo via USB ou emulador
4. Execute `npx cap run android`

O app carregará a versão de desenvolvimento com hot reload ativado.

---

## Suporte

Em caso de problemas:
1. Verifique os logs do Android Studio (Logcat)
2. Execute `npx cap doctor` para diagnóstico
3. Consulte [docs.capacitorjs.com](https://capacitorjs.com/docs)

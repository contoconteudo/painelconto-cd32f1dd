# Build Mobile (APK Android) - Painel Conto

Guia para gerar APK Android usando Capacitor.

## 📋 Pré-requisitos

### Software Necessário

1. **Node.js 18+**
   ```bash
   node --version  # Deve ser >= 18
   ```

2. **Java Development Kit (JDK) 17**
   ```bash
   # macOS (Homebrew)
   brew install openjdk@17
   
   # Ubuntu/Debian
   sudo apt install openjdk-17-jdk
   
   # Windows: Baixe de https://adoptium.net/
   ```

3. **Android Studio**
   - Baixe em: https://developer.android.com/studio
   - Durante instalação, selecione:
     - Android SDK
     - Android SDK Platform-Tools
     - Android Virtual Device (AVD)

4. **Variáveis de Ambiente**
   ```bash
   # Adicione ao ~/.bashrc ou ~/.zshrc
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   ```

## 🚀 Setup Inicial (Primeira Vez)

### 1. Clonar e Instalar

```bash
git clone https://github.com/seu-usuario/painel-conto.git
cd painel-conto
npm install
```

### 2. Inicializar Capacitor

```bash
# Inicializar Capacitor (se ainda não feito)
npx cap init "Painel Conto" "com.conto.painel" --web-dir=dist

# Adicionar plataforma Android
npx cap add android
```

### 3. Build do Projeto

```bash
# Build de produção
npm run build

# Sincronizar com Android
npx cap sync android
```

### 4. Configurar para Produção

Edite `capacitor.config.ts` e **REMOVA** a seção `server`:

```typescript
// REMOVA isso para produção:
// server: {
//   url: 'https://...',
//   cleartext: true,
// },
```

## 📱 Gerar APK de Debug

```bash
# Abrir no Android Studio
npx cap open android

# Ou gerar via linha de comando:
cd android
./gradlew assembleDebug
```

O APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🏪 Gerar APK/AAB de Release (Play Store)

### 1. Criar Keystore (primeira vez)

```bash
keytool -genkey -v -keystore painel-conto-release.keystore \
  -alias painel-conto \
  -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANTE**: Guarde a senha e o arquivo keystore em local seguro!

### 2. Configurar Signing

Crie `android/key.properties`:

```properties
storePassword=SUA_SENHA
keyPassword=SUA_SENHA
keyAlias=painel-conto
storeFile=../painel-conto-release.keystore
```

**NUNCA commite este arquivo!**

### 3. Editar build.gradle

Em `android/app/build.gradle`, adicione:

```groovy
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ...
    
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 4. Gerar Bundle (AAB) para Play Store

```bash
cd android
./gradlew bundleRelease
```

O AAB estará em: `android/app/build/outputs/bundle/release/app-release.aab`

### 5. Gerar APK Signed

```bash
cd android
./gradlew assembleRelease
```

O APK estará em: `android/app/build/outputs/apk/release/app-release.apk`

## 🧪 Testar no Emulador

```bash
# Listar dispositivos disponíveis
emulator -list-avds

# Iniciar emulador
emulator -avd Pixel_6_API_33

# Rodar app
npx cap run android
```

## 🔌 Testar em Dispositivo Físico

1. Habilite "Opções do desenvolvedor" no Android
2. Ative "Depuração USB"
3. Conecte o dispositivo via USB
4. Execute:

```bash
adb devices  # Verificar conexão
npx cap run android --target=SEU_DEVICE_ID
```

## 🔄 Atualização do App

Após modificações no código:

```bash
npm run build
npx cap sync android
npx cap run android
```

## 🐛 Troubleshooting

### "SDK location not found"

Crie `android/local.properties`:
```
sdk.dir=/Users/SEU_USUARIO/Android/Sdk
```

### Erro de memória no Gradle

Em `android/gradle.properties`:
```
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### APK muito grande

Habilite divisão por ABI em `build.gradle`:
```groovy
android {
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            universalApk false
        }
    }
}
```

## 📊 Tamanhos Esperados

- APK Debug: ~15-25 MB
- APK Release: ~8-15 MB
- AAB Release: ~6-12 MB

---

Para publicar na Play Store, siga o guia oficial:
https://developer.android.com/studio/publish

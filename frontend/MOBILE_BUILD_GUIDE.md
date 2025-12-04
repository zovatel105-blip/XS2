# 📱 Guía de Compilación Mobile - VotaTok

Esta guía explica cómo generar la APK (Android) y la app iOS para VotaTok.

## 🔧 Requisitos Previos

### Para Android:
- **Android Studio** (última versión recomendada)
- **Java JDK 17** o superior
- **Android SDK** con API Level 34 (Android 14) o superior
- Variables de entorno configuradas:
  - `ANDROID_HOME` apuntando al SDK de Android
  - `JAVA_HOME` apuntando a la instalación de Java

### Para iOS:
- **macOS** (requerido para compilar iOS)
- **Xcode 15** o superior
- **CocoaPods** (`sudo gem install cocoapods`)
- Cuenta de desarrollador de Apple (para publicar en App Store)

---

## 📲 Permisos Configurados

La aplicación tiene configurados los siguientes permisos para ambas plataformas:

| Permiso | Android | iOS |
|---------|---------|-----|
| 📷 **Cámara** | `CAMERA` | `NSCameraUsageDescription` |
| 🎤 **Micrófono** | `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` | `NSMicrophoneUsageDescription` |
| 🔔 **Notificaciones** | `POST_NOTIFICATIONS`, `VIBRATE` | Push Notifications Entitlement |
| 🖼️ **Fotos y Vídeos** | `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` | `NSPhotoLibraryUsageDescription` |
| 👥 **Contactos** | `READ_CONTACTS`, `WRITE_CONTACTS` | `NSContactsUsageDescription` |
| 📍 **Ubicación** | `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | `NSLocationWhenInUseUsageDescription` |
| 📡 **Dispositivos Cercanos** | `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `NEARBY_WIFI_DEVICES` | `NSBluetoothAlwaysUsageDescription` |
| 🎵 **Música y Audio** | `READ_MEDIA_AUDIO` | `NSAppleMusicUsageDescription` |

---

## 🤖 Compilar para Android

### Paso 1: Construir la aplicación web
```bash
cd frontend
yarn build
```

### Paso 2: Sincronizar con Android
```bash
npx cap sync android
```

### Paso 3: Abrir en Android Studio
```bash
npx cap open android
```

### Paso 4: Generar APK en Android Studio
1. En Android Studio, ir a **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Esperar a que compile
3. El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

### Paso 5: Generar APK firmada (para producción)
1. Ir a **Build > Generate Signed Bundle / APK**
2. Seleccionar **APK**
3. Crear o seleccionar un keystore
4. Elegir **release** como variante
5. El APK firmada estará en: `android/app/release/`

### Comandos rápidos:
```bash
# Compilar y sincronizar
yarn run cap:build:android

# O manualmente:
yarn build && npx cap sync android && npx cap open android
```

---

## 🍎 Compilar para iOS

### Paso 1: Construir la aplicación web
```bash
cd frontend
yarn build
```

### Paso 2: Sincronizar con iOS
```bash
npx cap sync ios
```

### Paso 3: Instalar dependencias de CocoaPods
```bash
cd ios/App
pod install
cd ../..
```

### Paso 4: Abrir en Xcode
```bash
npx cap open ios
```

### Paso 5: Configurar en Xcode
1. Seleccionar el proyecto **App** en el navegador
2. En **Signing & Capabilities**:
   - Seleccionar tu Team de desarrollo
   - Configurar el Bundle Identifier (`com.votatok.app`)
3. Agregar capacidades necesarias:
   - **Push Notifications**
   - **Background Modes** (fetch, remote-notification, audio, location)

### Paso 6: Compilar
1. Seleccionar un dispositivo o simulador
2. Presionar **Cmd + R** para compilar y ejecutar
3. Para archiver: **Product > Archive**

### Comandos rápidos:
```bash
# Compilar y sincronizar
yarn run cap:build:ios

# O manualmente:
yarn build && npx cap sync ios && npx cap open ios
```

---

## 📁 Estructura de Archivos Mobile

```
frontend/
├── capacitor.config.json          # Configuración de Capacitor
├── android/                       # Proyecto Android nativo
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml   # Permisos Android
│   │   │   └── assets/public/        # Web assets
│   │   └── build.gradle
│   └── gradle.properties
├── ios/                           # Proyecto iOS nativo
│   ├── App/
│   │   ├── App/
│   │   │   ├── Info.plist            # Permisos iOS
│   │   │   └── public/               # Web assets
│   │   └── App.xcodeproj
│   └── Podfile
└── src/
    └── services/
        └── permissionsService.js     # Servicio de permisos React
```

---

## 🔐 Uso del Servicio de Permisos en React

El archivo `src/services/permissionsService.js` proporciona funciones para gestionar permisos:

```javascript
import {
  requestCameraPermission,
  requestLocationPermission,
  requestNotificationPermission,
  checkAllPermissions,
  takePhoto,
  getCurrentLocation,
} from './services/permissionsService';

// Verificar todos los permisos
const status = await checkAllPermissions();
console.log(status);

// Solicitar permiso de cámara
const cameraStatus = await requestCameraPermission();
if (cameraStatus.camera === 'granted') {
  // Tomar una foto
  const photo = await takePhoto();
}

// Solicitar ubicación
const locationStatus = await requestLocationPermission();
if (locationStatus.location === 'granted') {
  const position = await getCurrentLocation();
  console.log(position.latitude, position.longitude);
}

// Solicitar notificaciones
const notifStatus = await requestNotificationPermission();
```

---

## 🚀 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `yarn cap:sync` | Sincroniza web assets con plataformas nativas |
| `yarn cap:copy` | Copia web assets sin actualizar plugins |
| `yarn cap:open:android` | Abre proyecto en Android Studio |
| `yarn cap:open:ios` | Abre proyecto en Xcode |
| `yarn cap:build:android` | Build + sync para Android |
| `yarn cap:build:ios` | Build + sync para iOS |
| `yarn mobile:build` | Build + sync para ambas plataformas |

---

## ⚠️ Notas Importantes

1. **Android**: Los permisos se solicitan en tiempo de ejecución (runtime). El usuario verá diálogos cuando la app intente usar una funcionalidad que requiera permisos.

2. **iOS**: Los mensajes de permisos están en español y explican por qué la app necesita cada permiso.

3. **Producción**: Para publicar en Play Store o App Store, necesitarás:
   - Firmar la APK con un keystore propio
   - Configurar tu cuenta de desarrollador
   - Cumplir con las políticas de cada tienda

4. **Debugging**: Para depurar en dispositivos físicos:
   - Android: Habilitar "Opciones de desarrollador" y "Depuración USB"
   - iOS: Confiar en el certificado de desarrollo en el dispositivo

---

## 🔄 Actualizar la App

Después de hacer cambios en el código React:

```bash
# 1. Construir
yarn build

# 2. Sincronizar
npx cap sync

# 3. Recompilar en Android Studio / Xcode
```

---

## 📞 Soporte

Si tienes problemas con la compilación:

1. Verificar que todas las dependencias estén instaladas
2. Limpiar cache: `cd android && ./gradlew clean`
3. Eliminar node_modules y reinstalar: `rm -rf node_modules && yarn install`
4. Regenerar plataformas: `npx cap sync`

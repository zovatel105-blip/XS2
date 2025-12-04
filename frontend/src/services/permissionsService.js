/**
 * Servicio de gestión de permisos para dispositivos móviles
 * Utiliza Capacitor para solicitar y verificar permisos en Android e iOS
 */

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Verificar si estamos en una plataforma nativa
const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // 'ios', 'android', or 'web'

/**
 * Estado de los permisos
 */
export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  PROMPT: 'prompt',
  PROMPT_WITH_RATIONALE: 'prompt-with-rationale',
};

/**
 * Tipos de permisos disponibles
 */
export const PermissionTypes = {
  CAMERA: 'camera',
  MICROPHONE: 'microphone',
  NOTIFICATIONS: 'notifications',
  PHOTOS: 'photos',
  CONTACTS: 'contacts',
  LOCATION: 'location',
  BLUETOOTH: 'bluetooth',
  AUDIO: 'audio',
};

/**
 * Verificar estado del permiso de cámara
 */
export const checkCameraPermission = async () => {
  if (!isNative) return { camera: PermissionStatus.GRANTED, photos: PermissionStatus.GRANTED };
  
  try {
    const status = await Camera.checkPermissions();
    return status;
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return { camera: PermissionStatus.DENIED, photos: PermissionStatus.DENIED };
  }
};

/**
 * Solicitar permiso de cámara
 */
export const requestCameraPermission = async () => {
  if (!isNative) return { camera: PermissionStatus.GRANTED, photos: PermissionStatus.GRANTED };
  
  try {
    const status = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
    return status;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return { camera: PermissionStatus.DENIED, photos: PermissionStatus.DENIED };
  }
};

/**
 * Verificar estado del permiso de ubicación
 */
export const checkLocationPermission = async () => {
  if (!isNative) return { location: PermissionStatus.GRANTED, coarseLocation: PermissionStatus.GRANTED };
  
  try {
    const status = await Geolocation.checkPermissions();
    return status;
  } catch (error) {
    console.error('Error checking location permission:', error);
    return { location: PermissionStatus.DENIED, coarseLocation: PermissionStatus.DENIED };
  }
};

/**
 * Solicitar permiso de ubicación
 */
export const requestLocationPermission = async () => {
  if (!isNative) return { location: PermissionStatus.GRANTED, coarseLocation: PermissionStatus.GRANTED };
  
  try {
    const status = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
    return status;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return { location: PermissionStatus.DENIED, coarseLocation: PermissionStatus.DENIED };
  }
};

/**
 * Verificar estado del permiso de notificaciones
 */
export const checkNotificationPermission = async () => {
  if (!isNative) {
    // En web, usar la API de notificaciones del navegador
    if ('Notification' in window) {
      return { receive: Notification.permission === 'granted' ? PermissionStatus.GRANTED : PermissionStatus.DENIED };
    }
    return { receive: PermissionStatus.DENIED };
  }
  
  try {
    const status = await PushNotifications.checkPermissions();
    return status;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return { receive: PermissionStatus.DENIED };
  }
};

/**
 * Solicitar permiso de notificaciones
 */
export const requestNotificationPermission = async () => {
  if (!isNative) {
    // En web, usar la API de notificaciones del navegador
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return { receive: permission === 'granted' ? PermissionStatus.GRANTED : PermissionStatus.DENIED };
    }
    return { receive: PermissionStatus.DENIED };
  }
  
  try {
    const status = await PushNotifications.requestPermissions();
    
    if (status.receive === 'granted') {
      // Registrar para recibir notificaciones push
      await PushNotifications.register();
    }
    
    return status;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { receive: PermissionStatus.DENIED };
  }
};

/**
 * Verificar estado del permiso de almacenamiento/archivos
 */
export const checkFilesystemPermission = async () => {
  if (!isNative) return { publicStorage: PermissionStatus.GRANTED };
  
  try {
    const status = await Filesystem.checkPermissions();
    return status;
  } catch (error) {
    console.error('Error checking filesystem permission:', error);
    return { publicStorage: PermissionStatus.DENIED };
  }
};

/**
 * Solicitar permiso de almacenamiento/archivos
 */
export const requestFilesystemPermission = async () => {
  if (!isNative) return { publicStorage: PermissionStatus.GRANTED };
  
  try {
    const status = await Filesystem.requestPermissions();
    return status;
  } catch (error) {
    console.error('Error requesting filesystem permission:', error);
    return { publicStorage: PermissionStatus.DENIED };
  }
};

/**
 * Solicitar todos los permisos necesarios para la app
 */
export const requestAllPermissions = async () => {
  const results = {
    camera: null,
    photos: null,
    location: null,
    notifications: null,
    filesystem: null,
  };
  
  try {
    // Cámara y fotos
    const cameraStatus = await requestCameraPermission();
    results.camera = cameraStatus.camera;
    results.photos = cameraStatus.photos;
    
    // Ubicación
    const locationStatus = await requestLocationPermission();
    results.location = locationStatus.location;
    
    // Notificaciones
    const notificationStatus = await requestNotificationPermission();
    results.notifications = notificationStatus.receive;
    
    // Almacenamiento
    const filesystemStatus = await requestFilesystemPermission();
    results.filesystem = filesystemStatus.publicStorage;
    
  } catch (error) {
    console.error('Error requesting all permissions:', error);
  }
  
  return results;
};

/**
 * Verificar todos los permisos
 */
export const checkAllPermissions = async () => {
  const results = {
    camera: null,
    photos: null,
    location: null,
    notifications: null,
    filesystem: null,
    platform: platform,
    isNative: isNative,
  };
  
  try {
    // Cámara y fotos
    const cameraStatus = await checkCameraPermission();
    results.camera = cameraStatus.camera;
    results.photos = cameraStatus.photos;
    
    // Ubicación
    const locationStatus = await checkLocationPermission();
    results.location = locationStatus.location;
    
    // Notificaciones
    const notificationStatus = await checkNotificationPermission();
    results.notifications = notificationStatus.receive;
    
    // Almacenamiento
    const filesystemStatus = await checkFilesystemPermission();
    results.filesystem = filesystemStatus.publicStorage;
    
  } catch (error) {
    console.error('Error checking all permissions:', error);
  }
  
  return results;
};

/**
 * Abrir la configuración de la app para que el usuario cambie permisos manualmente
 */
export const openAppSettings = async () => {
  if (!isNative) {
    console.log('openAppSettings is only available on native platforms');
    return;
  }
  
  // En Capacitor 7, no hay un método directo para abrir settings
  // Se puede implementar usando un plugin nativo o indicar al usuario
  console.log('Por favor, ve a Configuración > Apps > VotaTok para cambiar los permisos');
};

/**
 * Tomar una foto usando la cámara
 */
export const takePhoto = async (options = {}) => {
  const defaultOptions = {
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    saveToGallery: true,
  };
  
  try {
    const photo = await Camera.getPhoto({ ...defaultOptions, ...options });
    return photo;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

/**
 * Seleccionar foto de la galería
 */
export const selectPhotoFromGallery = async (options = {}) => {
  const defaultOptions = {
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri,
    source: CameraSource.Photos,
  };
  
  try {
    const photo = await Camera.getPhoto({ ...defaultOptions, ...options });
    return photo;
  } catch (error) {
    console.error('Error selecting photo:', error);
    throw error;
  }
};

/**
 * Obtener la ubicación actual
 */
export const getCurrentLocation = async (options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  };
  
  try {
    const position = await Geolocation.getCurrentPosition({ ...defaultOptions, ...options });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};

/**
 * Observar cambios de ubicación
 */
export const watchLocation = async (callback, options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  };
  
  try {
    const watchId = await Geolocation.watchPosition({ ...defaultOptions, ...options }, (position, err) => {
      if (err) {
        callback(null, err);
        return;
      }
      
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      }, null);
    });
    
    return watchId;
  } catch (error) {
    console.error('Error watching location:', error);
    throw error;
  }
};

/**
 * Detener observación de ubicación
 */
export const clearLocationWatch = async (watchId) => {
  try {
    await Geolocation.clearWatch({ id: watchId });
  } catch (error) {
    console.error('Error clearing location watch:', error);
    throw error;
  }
};

/**
 * Configurar listeners de notificaciones push
 */
export const setupPushNotifications = async (handlers = {}) => {
  if (!isNative) {
    console.log('Push notifications are only available on native platforms');
    return;
  }
  
  const { onRegistration, onRegistrationError, onNotification, onActionPerformed } = handlers;
  
  // Listener cuando se registra el dispositivo
  if (onRegistration) {
    await PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token:', token.value);
      onRegistration(token.value);
    });
  }
  
  // Listener de error de registro
  if (onRegistrationError) {
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      onRegistrationError(error);
    });
  }
  
  // Listener cuando llega una notificación
  if (onNotification) {
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      onNotification(notification);
    });
  }
  
  // Listener cuando el usuario interactúa con la notificación
  if (onActionPerformed) {
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action performed:', action);
      onActionPerformed(action);
    });
  }
};

/**
 * Exportar información de la plataforma
 */
export const getPlatformInfo = () => ({
  platform,
  isNative,
  isAndroid: platform === 'android',
  isIOS: platform === 'ios',
  isWeb: platform === 'web',
});

export default {
  // Estados y tipos
  PermissionStatus,
  PermissionTypes,
  
  // Funciones de verificación
  checkCameraPermission,
  checkLocationPermission,
  checkNotificationPermission,
  checkFilesystemPermission,
  checkAllPermissions,
  
  // Funciones de solicitud
  requestCameraPermission,
  requestLocationPermission,
  requestNotificationPermission,
  requestFilesystemPermission,
  requestAllPermissions,
  
  // Utilidades de cámara
  takePhoto,
  selectPhotoFromGallery,
  
  // Utilidades de ubicación
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
  
  // Notificaciones
  setupPushNotifications,
  
  // Info
  openAppSettings,
  getPlatformInfo,
};

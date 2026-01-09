/**
 * VoiceService - Servicio de Text-to-Speech con detección automática de idioma
 * 
 * Características:
 * - Detección automática del idioma del texto
 * - Selección inteligente de la mejor voz disponible
 * - Soporte para múltiples idiomas y acentos
 * - Fallback automático si no hay voz disponible
 */

// Mapeo de idiomas a códigos de voz
const LANGUAGE_CODES = {
  // Español
  es: { code: 'es', variants: ['es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-CL', 'es-PE', 'es-VE', 'es-US'] },
  // Inglés
  en: { code: 'en', variants: ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en-NZ', 'en-ZA'] },
  // Portugués
  pt: { code: 'pt', variants: ['pt-BR', 'pt-PT'] },
  // Francés
  fr: { code: 'fr', variants: ['fr-FR', 'fr-CA', 'fr-BE', 'fr-CH'] },
  // Alemán
  de: { code: 'de', variants: ['de-DE', 'de-AT', 'de-CH'] },
  // Italiano
  it: { code: 'it', variants: ['it-IT', 'it-CH'] },
  // Japonés
  ja: { code: 'ja', variants: ['ja-JP'] },
  // Coreano
  ko: { code: 'ko', variants: ['ko-KR'] },
  // Chino
  zh: { code: 'zh', variants: ['zh-CN', 'zh-TW', 'zh-HK'] },
  // Ruso
  ru: { code: 'ru', variants: ['ru-RU'] },
  // Árabe
  ar: { code: 'ar', variants: ['ar-SA', 'ar-EG', 'ar-AE'] },
  // Hindi
  hi: { code: 'hi', variants: ['hi-IN'] },
  // Holandés
  nl: { code: 'nl', variants: ['nl-NL', 'nl-BE'] },
  // Polaco
  pl: { code: 'pl', variants: ['pl-PL'] },
  // Turco
  tr: { code: 'tr', variants: ['tr-TR'] },
  // Sueco
  sv: { code: 'sv', variants: ['sv-SE'] },
  // Noruego
  no: { code: 'no', variants: ['no-NO', 'nb-NO'] },
  // Danés
  da: { code: 'da', variants: ['da-DK'] },
  // Finés
  fi: { code: 'fi', variants: ['fi-FI'] },
  // Griego
  el: { code: 'el', variants: ['el-GR'] },
  // Hebreo
  he: { code: 'he', variants: ['he-IL'] },
  // Tailandés
  th: { code: 'th', variants: ['th-TH'] },
  // Vietnamita
  vi: { code: 'vi', variants: ['vi-VN'] },
  // Indonesio
  id: { code: 'id', variants: ['id-ID'] },
  // Malayo
  ms: { code: 'ms', variants: ['ms-MY'] },
  // Catalán
  ca: { code: 'ca', variants: ['ca-ES'] },
  // Gallego
  gl: { code: 'gl', variants: ['gl-ES'] },
  // Euskera
  eu: { code: 'eu', variants: ['eu-ES'] },
};

// Patrones de caracteres para detección de idioma
const LANGUAGE_PATTERNS = {
  // Caracteres únicos de idiomas
  ja: /[\u3040-\u309F\u30A0-\u30FF]/,  // Hiragana y Katakana
  ko: /[\uAC00-\uD7AF\u1100-\u11FF]/,  // Hangul
  zh: /[\u4E00-\u9FFF]/,  // Caracteres chinos
  ar: /[\u0600-\u06FF]/,  // Árabe
  he: /[\u0590-\u05FF]/,  // Hebreo
  ru: /[\u0400-\u04FF]/,  // Cirílico
  el: /[\u0370-\u03FF]/,  // Griego
  th: /[\u0E00-\u0E7F]/,  // Tailandés
  hi: /[\u0900-\u097F]/,  // Devanagari (Hindi)
};

// Palabras comunes por idioma para detección más precisa
const COMMON_WORDS = {
  es: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'por', 'con', 'para', 'los', 'del', 'se', 'las', 'una', 'pero', 'más', 'como', 'ya', 'todo', 'esta', 'ser', 'son', 'también', 'fue', 'hay', 'está', 'muy', 'años', 'hasta', 'desde', 'están', 'nosotros', 'ustedes', 'ellos', 'ellas', 'hola', 'gracias', 'bueno', 'qué', 'cómo', 'cuándo', 'dónde', 'por qué', 'opción'],
  en: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'option', 'hello', 'thanks', 'good'],
  pt: ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'também', 'só', 'pelo', 'opção', 'olá', 'obrigado'],
  fr: ['le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je', 'son', 'que', 'se', 'qui', 'ce', 'dans', 'en', 'du', 'elle', 'au', 'pour', 'pas', 'vous', 'par', 'sur', 'faire', 'plus', 'dire', 'me', 'on', 'mon', 'lui', 'nous', 'comme', 'mais', 'pouvoir', 'avec', 'tout', 'option', 'bonjour', 'merci'],
  de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch', 'es', 'an', 'er', 'hat', 'aus', 'bei', 'wir', 'nach', 'am', 'sie', 'werden', 'oder', 'option', 'hallo', 'danke'],
  it: ['di', 'che', 'è', 'e', 'la', 'il', 'un', 'a', 'per', 'in', 'una', 'mi', 'sono', 'ho', 'non', 'ma', 'lo', 'ha', 'le', 'si', 'come', 'con', 'io', 'questo', 'ti', 'da', 'se', 'ci', 'no', 'più', 'del', 'era', 'della', 'opzione', 'ciao', 'grazie'],
  nl: ['de', 'het', 'een', 'van', 'en', 'in', 'is', 'dat', 'op', 'te', 'zijn', 'voor', 'met', 'als', 'aan', 'er', 'maar', 'om', 'ook', 'naar', 'optie', 'hallo', 'bedankt'],
  pl: ['i', 'w', 'nie', 'na', 'do', 'to', 'że', 'się', 'z', 'co', 'jak', 'ale', 'po', 'tak', 'od', 'o', 'za', 'opcja', 'cześć', 'dzięki'],
  tr: ['bir', 've', 'bu', 'için', 'de', 'da', 'ile', 'ben', 'ne', 'var', 'gibi', 'daha', 'çok', 'olarak', 'o', 'seçenek', 'merhaba', 'teşekkürler'],
  sv: ['och', 'i', 'att', 'det', 'som', 'en', 'på', 'är', 'av', 'för', 'med', 'till', 'den', 'har', 'de', 'alternativ', 'hej', 'tack'],
  no: ['og', 'i', 'det', 'er', 'på', 'en', 'som', 'for', 'av', 'til', 'med', 'har', 'de', 'alternativ', 'hei', 'takk'],
  da: ['og', 'i', 'at', 'det', 'er', 'en', 'til', 'på', 'de', 'for', 'med', 'som', 'af', 'mulighed', 'hej', 'tak'],
  fi: ['ja', 'on', 'ei', 'se', 'että', 'hän', 'oli', 'mutta', 'niin', 'kun', 'vaihtoehto', 'hei', 'kiitos'],
  vi: ['và', 'của', 'là', 'có', 'trong', 'được', 'này', 'cho', 'không', 'một', 'lựa chọn', 'xin chào', 'cảm ơn'],
  id: ['dan', 'yang', 'di', 'ini', 'dengan', 'untuk', 'tidak', 'dari', 'dalam', 'adalah', 'pilihan', 'halo', 'terima kasih'],
  ms: ['dan', 'yang', 'di', 'ini', 'dengan', 'untuk', 'tidak', 'dari', 'dalam', 'adalah', 'pilihan', 'hai', 'terima kasih'],
};

// Cache de voces disponibles
let cachedVoices = null;
let voicesLoadedPromise = null;

/**
 * Obtiene las voces disponibles en el dispositivo
 * @returns {Promise<SpeechSynthesisVoice[]>}
 */
const getVoices = () => {
  if (cachedVoices) {
    return Promise.resolve(cachedVoices);
  }

  if (voicesLoadedPromise) {
    return voicesLoadedPromise;
  }

  voicesLoadedPromise = new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
      return;
    }

    // Esperar a que se carguen las voces
    const checkVoices = () => {
      const loadedVoices = window.speechSynthesis.getVoices();
      if (loadedVoices.length > 0) {
        cachedVoices = loadedVoices;
        resolve(loadedVoices);
      }
    };

    window.speechSynthesis.onvoiceschanged = checkVoices;
    
    // Fallback con timeout
    setTimeout(() => {
      const fallbackVoices = window.speechSynthesis.getVoices();
      cachedVoices = fallbackVoices;
      resolve(fallbackVoices);
    }, 1000);
  });

  return voicesLoadedPromise;
};

/**
 * Detecta el idioma de un texto
 * @param {string} text - Texto a analizar
 * @returns {string} - Código de idioma (ej: 'es', 'en', 'pt')
 */
const detectLanguage = (text) => {
  if (!text || text.trim().length === 0) {
    return 'es'; // Default español
  }

  const normalizedText = text.toLowerCase().trim();
  
  // 1. Primero verificar caracteres especiales de idiomas
  for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    if (pattern.test(normalizedText)) {
      console.log(`🌍 Idioma detectado por caracteres: ${lang}`);
      return lang;
    }
  }

  // 2. Contar coincidencias de palabras comunes
  const words = normalizedText.split(/\s+/);
  const scores = {};

  for (const [lang, commonWords] of Object.entries(COMMON_WORDS)) {
    scores[lang] = 0;
    for (const word of words) {
      // Limpiar puntuación
      const cleanWord = word.replace(/[.,!?¿¡;:'"()]/g, '');
      if (commonWords.includes(cleanWord)) {
        scores[lang]++;
      }
    }
  }

  // 3. Encontrar el idioma con más coincidencias
  let maxScore = 0;
  let detectedLang = 'es'; // Default

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  // 4. Verificar caracteres especiales del español (ñ, tildes)
  if (/[ñáéíóúü¿¡]/i.test(normalizedText) && maxScore < 3) {
    detectedLang = 'es';
  }

  // 5. Verificar caracteres portugueses específicos
  if (/[ãõç]/i.test(normalizedText) && !normalizedText.includes('ñ')) {
    detectedLang = 'pt';
  }

  console.log(`🌍 Idioma detectado: ${detectedLang} (score: ${maxScore})`);
  return detectedLang;
};

/**
 * Obtiene la mejor voz disponible para un idioma
 * @param {string} languageCode - Código de idioma
 * @param {SpeechSynthesisVoice[]} voices - Lista de voces disponibles
 * @returns {SpeechSynthesisVoice|null}
 */
const getBestVoice = async (languageCode) => {
  const voices = await getVoices();
  
  if (!voices || voices.length === 0) {
    console.warn('⚠️ No hay voces disponibles');
    return null;
  }

  const langConfig = LANGUAGE_CODES[languageCode] || LANGUAGE_CODES.es;
  
  // Buscar voz en orden de preferencia
  for (const variant of langConfig.variants) {
    // Primero buscar voces nativas/de alta calidad
    const nativeVoice = voices.find(v => 
      v.lang === variant && 
      (v.localService || v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Premium'))
    );
    if (nativeVoice) {
      console.log(`🎤 Voz seleccionada (premium): ${nativeVoice.name} (${nativeVoice.lang})`);
      return nativeVoice;
    }

    // Luego cualquier voz que coincida con la variante
    const variantVoice = voices.find(v => v.lang === variant);
    if (variantVoice) {
      console.log(`🎤 Voz seleccionada: ${variantVoice.name} (${variantVoice.lang})`);
      return variantVoice;
    }
  }

  // Fallback: buscar cualquier voz que coincida con el código base
  const baseVoice = voices.find(v => v.lang.startsWith(langConfig.code));
  if (baseVoice) {
    console.log(`🎤 Voz seleccionada (fallback): ${baseVoice.name} (${baseVoice.lang})`);
    return baseVoice;
  }

  // Último recurso: primera voz disponible
  console.warn(`⚠️ No se encontró voz para ${languageCode}, usando default`);
  return voices[0];
};

/**
 * Habla un texto con detección automática de idioma
 * @param {string} text - Texto a hablar
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<void>}
 */
const speak = async (text, options = {}) => {
  const {
    rate = 1.1,
    pitch = 1.0,
    volume = 1.0,
    forceLanguage = null,
    onStart = () => {},
    onEnd = () => {},
    onError = () => {},
  } = options;

  // Cancelar cualquier speech anterior
  window.speechSynthesis.cancel();

  if (!text || text.trim().length === 0) {
    console.warn('⚠️ Texto vacío, nada que hablar');
    onEnd();
    return;
  }

  // Detectar idioma o usar el forzado
  const detectedLang = forceLanguage || detectLanguage(text);
  
  // Obtener la mejor voz para el idioma
  const voice = await getBestVoice(detectedLang);
  
  // Crear utterance
  const utterance = new SpeechSynthesisUtterance(text);
  
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    // Fallback a código de idioma si no hay voz
    const langConfig = LANGUAGE_CODES[detectedLang] || LANGUAGE_CODES.es;
    utterance.lang = langConfig.variants[0] || 'es-ES';
  }
  
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  utterance.onstart = onStart;
  utterance.onend = onEnd;
  utterance.onerror = (event) => {
    console.error('❌ Error en speech:', event.error);
    onError(event);
  };

  console.log(`🔊 Hablando en ${utterance.lang}: "${text.substring(0, 50)}..."`);
  window.speechSynthesis.speak(utterance);

  return utterance;
};

/**
 * Detiene cualquier speech en curso
 */
const stop = () => {
  window.speechSynthesis.cancel();
};

/**
 * Pausa el speech actual
 */
const pause = () => {
  window.speechSynthesis.pause();
};

/**
 * Reanuda el speech pausado
 */
const resume = () => {
  window.speechSynthesis.resume();
};

/**
 * Verifica si el speech está en curso
 * @returns {boolean}
 */
const isSpeaking = () => {
  return window.speechSynthesis.speaking;
};

/**
 * Obtiene todos los idiomas soportados con sus voces disponibles
 * @returns {Promise<Object>}
 */
const getSupportedLanguages = async () => {
  const voices = await getVoices();
  const supported = {};

  for (const [lang, config] of Object.entries(LANGUAGE_CODES)) {
    const availableVoices = voices.filter(v => 
      config.variants.some(variant => v.lang === variant || v.lang.startsWith(config.code))
    );
    
    if (availableVoices.length > 0) {
      supported[lang] = {
        name: getLanguageName(lang),
        voices: availableVoices.map(v => ({
          name: v.name,
          lang: v.lang,
          isNative: v.localService
        }))
      };
    }
  }

  return supported;
};

/**
 * Obtiene el nombre legible del idioma
 * @param {string} code - Código de idioma
 * @returns {string}
 */
const getLanguageName = (code) => {
  const names = {
    es: 'Español',
    en: 'English',
    pt: 'Português',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    ja: '日本語',
    ko: '한국어',
    zh: '中文',
    ru: 'Русский',
    ar: 'العربية',
    hi: 'हिन्दी',
    nl: 'Nederlands',
    pl: 'Polski',
    tr: 'Türkçe',
    sv: 'Svenska',
    no: 'Norsk',
    da: 'Dansk',
    fi: 'Suomi',
    el: 'Ελληνικά',
    he: 'עברית',
    th: 'ไทย',
    vi: 'Tiếng Việt',
    id: 'Bahasa Indonesia',
    ms: 'Bahasa Melayu',
    ca: 'Català',
    gl: 'Galego',
    eu: 'Euskara',
  };
  return names[code] || code.toUpperCase();
};

/**
 * Prepara el texto con el idioma detectado (útil para mostrar información)
 * @param {string} text 
 * @returns {Object}
 */
const analyzeText = (text) => {
  const language = detectLanguage(text);
  return {
    text,
    language,
    languageName: getLanguageName(language),
    langConfig: LANGUAGE_CODES[language]
  };
};

// Exportar el servicio
const voiceService = {
  speak,
  stop,
  pause,
  resume,
  isSpeaking,
  detectLanguage,
  getBestVoice,
  getVoices,
  getSupportedLanguages,
  getLanguageName,
  analyzeText,
  LANGUAGE_CODES,
};

export default voiceService;

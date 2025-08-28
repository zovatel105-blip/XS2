import { useState, useEffect } from 'react';
import i18n from '../i18n';

export const useTranslation = () => {
  const [locale, setLocale] = useState(i18n.getCurrentLocale());

  useEffect(() => {
    const handleLocaleChange = (event) => {
      setLocale(event.detail);
    };

    window.addEventListener('localeChanged', handleLocaleChange);
    
    return () => {
      window.removeEventListener('localeChanged', handleLocaleChange);
    };
  }, []);

  const t = (key, variables) => i18n.t(key, variables);
  
  const changeLocale = (newLocale) => {
    i18n.setLocale(newLocale);
  };

  return {
    t,
    locale,
    changeLocale,
    formatNumber: i18n.formatNumber.bind(i18n),
    formatDuration: i18n.formatDuration.bind(i18n), 
    formatDate: i18n.formatDate.bind(i18n),
    getAvailableLocales: i18n.getAvailableLocales.bind(i18n)
  };
};
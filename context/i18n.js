// context/i18n.js
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../langs/en.json';
import ko from '../langs/ko.json';

const translations = {
  en,
  ko,
};

const getTranslation = (key) => {
  const locales = getLocales();
  const locale = locales[0]?.languageCode || 'en'; // 'en-US' -> 'en'
  return translations[locale]?.[key] || translations['en'][key];
};

const setI18nConfig = async () => {
  const storedLang = await AsyncStorage.getItem('LangCode');
  const locales = getLocales();
  let locale = storedLang || locales[0]?.languageCode || 'en';

  if (storedLang === 'auto' || !translations[locale]) {
    locale = locales[0]?.languageCode || 'en';
  }

  if (!translations[locale]) {
    locale = 'en';
  }

  return locale;
};

export { getTranslation, setI18nConfig };

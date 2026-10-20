import i18n from 'i18next';
import HttpApi from 'i18next-http-backend';

// Could be used for automatic language detection, but seems to cause fi-FI as language code instead of just fi
// import LanguageDetector from 'i18next-browser-languagedetector';
//i18n.use(XHR).use(LanguageDetector).init({
i18n.use(HttpApi).init({
  // we init with resources
  lng: 'en',
  fallbackLng: 'en',
  debug: false,

  // have a common namespace used around the full app
  ns: ['translations'],
  defaultNS: 'translations',

  keySeparator: false, // we use content as keys
  nsSeparator: false, // we use content as keys

  interpolation: {
    escapeValue: false, // not needed for react!!
    formatSeparator: ',',
  },

  react: {
    wait: true,
  },
  backend: {
    loadPath: '/translations/{{lng}}/{{ns}}',
  },
});

export default i18n;

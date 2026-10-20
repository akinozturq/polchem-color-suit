import { authenticated } from './WebRequest';

export default class TranslationsAPI {
  static loadProposals(language) {
    return authenticated.get(`/translation_proposals/${language}`);
  }

  static proposeTranslations(payload) {
    return authenticated.post('/translations/propose', payload);
  }
}

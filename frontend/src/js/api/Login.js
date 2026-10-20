import { unauthenticated, authenticated, refresh_token } from './WebRequest';

export class LoginAPI {
  login(payload) {
    return unauthenticated.post('/auth', payload);
  }

  logout() {
    return authenticated.get('/logout');
  }

  refresh_create() {
    return refresh_token.post('/refresh/create');
  }

  refresh_confirm(payload) {
    return refresh_token.post('/refresh/confirm', payload);
  }
}

const api = new LoginAPI();

export { api as default };

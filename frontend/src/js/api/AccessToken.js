import JSONRPC from 'jsonrpc-dispatch';

/** Deprecated: TokenApiV1 relies on the App to keep track of the URL which the token is for. */
export class TokenApiV1 {
  // dummy dispatcher that resolves all calls to null
  constructor() {
    // dummy dispatcher that resolves all calls to null
    this.jsonrpc = { request: () => new Promise((resolve) => resolve(null)) };
  }

  connect(qtobject) {
    // connecting all machine actions here
    try {
      this.jsonrpc = new JSONRPC((message) =>
        qtobject.dispatch(JSON.stringify(message))
      );
      qtobject.response.connect((str) =>
        this.jsonrpc.handleResponse(JSON.parse(str))
      );
    } catch (e) {
      console.log(e);
      this.jsonrpc = { request: () => new Promise((resolve) => resolve(null)) };
    }
  }

  getToken() {
    return this.jsonrpc.request('get_token');
  }

  setToken(token) {
    return this.jsonrpc.request('set_token', [token]);
  }

  getRefreshToken() {
    return this.jsonrpc.request('get_refresh_token');
  }

  setRefreshToken(token) {
    return this.jsonrpc.request('set_refresh_token', [token]);
  }
}

/** TokenApiV2 passes the URL as a parameter to the methods */
export class TokenApiV2 {
  constructor() {
    // dummy dispatcher that resolves all calls to null
    this.jsonrpc = { request: () => new Promise((resolve) => resolve(null)) };
  }

  connect(qtobject) {
    try {
      this.jsonrpc = new JSONRPC((message) =>
        qtobject.dispatch(JSON.stringify(message))
      );
      qtobject.response.connect((str) =>
        this.jsonrpc.handleResponse(JSON.parse(str))
      );
    } catch (e) {
      console.log(e);
      this.jsonrpc = { request: () => new Promise((resolve) => resolve(null)) };
    }
  }

  getToken(url) {
    return this.jsonrpc.request('get_token', ['access_token', url]);
  }

  setToken(token, url) {
    return this.jsonrpc.request('set_token', [token, 'access_token', url]);
  }
  getRefreshToken(url) {
    return this.jsonrpc.request('get_token', ['refresh_token', url]);
  }
  setRefreshToken(token, url) {
    return this.jsonrpc.request('set_token', [token, 'refresh_token', url]);
  }
}

/** Wrapper to redirect calls to the most current version available */
export class TokenApi {
  constructor() {
    this.api1 = new TokenApiV1();
    this.api2 = new TokenApiV2();
    this.api = this.api1; // Default to whichever
    this.version = 1; // Default version
  }

  connect(qtobject, version = 1) {
    this.version = version;
    this.api = version === 2 ? this.api2 : this.api1;
    this.api.connect(qtobject);
  }

  getToken(url) {
    return this.api.getToken(url);
  }
  setToken(token, url) {
    return this.api.setToken(token, url);
  }
  getRefreshToken(url) {
    return this.api.getRefreshToken(url);
  }
  setRefreshToken(token, url) {
    return this.api.setRefreshToken(token, url);
  }
}

const api = new TokenApi();

export { api as default };

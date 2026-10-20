import JSONRPC from 'jsonrpc-dispatch';

export class PosAppPermissionsApi {
  // dummy dispatcher that resolves all calls to null
  constructor() {
    // dummy dispatcher that resolves all calls to null
    this.jsonrpc = { request: () => new Promise((resolve) => resolve(null)) };
  }

  connect(qtobject) {
    // connecting all state actions here
    try {
      if (qtobject) {
        this.jsonrpc = new JSONRPC((message) =>
          qtobject.dispatch(JSON.stringify(message))
        );
        qtobject.response.connect((str) =>
          this.jsonrpc.handleResponse(JSON.parse(str))
        );
      }
    } catch (e) {
      console.log(e);
      this.jsonrpc = { request: () => new Promise((resolve) => resolve(null)) };
    }
  }

  getState() {
    return this.jsonrpc.request('get_state');
  }

  reStartAsAdmin() {
    return this.jsonrpc.request('re_start_as_admin');
  }
}
const api = new PosAppPermissionsApi();

export { api as default };

import JSONRPC from 'jsonrpc-dispatch';

export class MiniGDataApi {
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

  generate_minigdata(cnts) {
    return this.jsonrpc.request('generate_minigdata', [cnts]);
  }

  list_minigdata() {
    return this.jsonrpc.request('list_gdatas');
  }
}
const api = new MiniGDataApi();

export { api as default };

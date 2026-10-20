import JSONRPC from 'jsonrpc-dispatch';

export default class JSONRPCAPI {
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
      console.log('Error in JSONRPC Qt connection');
      console.log(e);
    }
  }
}

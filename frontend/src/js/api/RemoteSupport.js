import JSONRPC from 'jsonrpc-dispatch';
import remoteSupportActions from '../redux/reducers/RemoteSupport';

export class RemoteSupportAPI {
  // dummy dispatcher that resolves all calls to null
  constructor() {
    // dummy dispatcher that resolves all calls to null
    this.jsonrpc = { request: () => new Promise((resolve) => resolve(null)) };
  }

  connect(qtobject, store) {
    // connecting all machine actions here
    try {
      if (qtobject) {
        this.jsonrpc = new JSONRPC((message) =>
          qtobject.dispatch(JSON.stringify(message))
        );
        qtobject.response.connect((str) =>
          this.jsonrpc.handleResponse(JSON.parse(str))
        );
      }

      store.dispatch(remoteSupportActions.checkIsRemoteSupportAvailable());
    } catch (e) {
      console.log(e);
      this.jsonrpc = { request: () => new Promise((resolve) => resolve(null)) };
    }
  }

  openTeamviewer() {
    return this.jsonrpc.request('open_teamviewer');
  }

  isRunning() {
    return this.jsonrpc.request('is_running');
  }

  isRemoteSupportAvailable() {
    return this.jsonrpc.request('is_remote_support_available');
  }
}
const api = new RemoteSupportAPI();

export { api as default };

import JSONRPC from 'jsonrpc-dispatch';
import standalone2cloudActions from 'js/redux/reducers/Standalone2Cloud';

class Standalone2CloudAPI {
  constructor() {
    this.jsonrpc = { request: () => new Promise((resolve) => resolve(null)) };
  }

  connect(qtobject, store) {
    if (!qtobject) {
      return;
    }
    try {
      this.jsonrpc = new JSONRPC((message) =>
        qtobject.dispatch(JSON.stringify(message))
      );
      qtobject.response.connect((str) =>
        this.jsonrpc.handleResponse(JSON.parse(str))
      );

      qtobject.progress.connect((message, percent) =>
        store.dispatch(
          standalone2cloudActions.progressUpdated(message, percent)
        )
      );
      qtobject.sync_started.connect(() =>
        store.dispatch(standalone2cloudActions.syncStarted())
      );
      qtobject.sync_finished.connect((success, info) =>
        store.dispatch(standalone2cloudActions.syncFinished(success, info))
      );
      qtobject.sync_cancelled.connect(() =>
        store.dispatch(standalone2cloudActions.syncCancelled())
      );
    } catch (error) {
      // Fallback to dummy jsonrpc if connection fails
      this.jsonrpc = { request: () => new Promise((resolve) => resolve(null)) };
      console.error(error);
    }
  }

  _normalizePort(port) {
    const parsed = Number(port);
    return Number.isInteger(parsed) ? parsed : 3306;
  }

  listDatabases(host, port, user, password) {
    return this.jsonrpc.request('list_databases', [
      host,
      this._normalizePort(port),
      user,
      password,
    ]);
  }

  listSites(host, port, user, password, database) {
    return this.jsonrpc.request('list_sites', [
      host,
      this._normalizePort(port),
      user,
      password,
      database,
    ]);
  }

  startSync(payload) {
    const {
      host,
      port,
      user,
      password,
      database,
      site_id,
      upload_site_id,
      timeout,
    } = payload;
    return this.jsonrpc.request('start_sync', [
      host,
      this._normalizePort(port),
      user,
      password,
      database,
      site_id,
      upload_site_id,
      timeout,
    ]);
  }

  cancelSync() {
    return this.jsonrpc.request('cancel_sync');
  }
}

const api = new Standalone2CloudAPI();
export default api;


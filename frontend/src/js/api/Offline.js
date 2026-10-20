import JSONRPC from 'jsonrpc-dispatch';
import offlineActions from 'js/redux/reducers/Offline';

export class OfflineAPI {
  // dummy dispatcher that resolves all calls to null
  constructor() {
    // dummy dispatcher that resolves all calls to null
    this.jsonrpc = { request: () => new Promise((resolve) => resolve(null)) };
  }

  connect(qtobject, store) {
    // connecting all machine actions here
    try {
      if (qtobject) {
        qtobject.online_mode_available.connect((bool) => {
          store.dispatch(offlineActions.setOnlineAvailable(bool));
        });
        qtobject.order_sync_succeeded.connect((bool) => {
          store.dispatch(offlineActions.setOrdersSynced(bool));
        });

        qtobject.offline_mode_available.connect((bool) => {
          store.dispatch(offlineActions.setOfflineAvailable(bool));
        });
        qtobject.force_check_finished.connect(() => {
          store.dispatch(offlineActions.forceCheckFinished());
        });

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

  getOfflineAccessToken() {
    return this.jsonrpc.request('get_offline_access_token');
  }

  getOfflineTimeRemaining() {
    return this.jsonrpc.request('get_offline_access_time_remaining');
  }

  createOfflineAccessToken(data) {
    return this.jsonrpc.request('set_offline_access_token', [data]);
  }

  getCloudServerAddress() {
    return this.jsonrpc.request('get_cloud_server_address');
  }

  start_fall_backend() {
    return this.jsonrpc.request('start_fall_backend');
  }

  stop_fall_backend() {
    return this.jsonrpc.request('stop_fall_backend');
  }

  force_check_offline_db_updates() {
    return this.jsonrpc.request('force_check_offline_db_updates');
  }

  remove_offline_mode_files_and_settings() {
    return this.jsonrpc.request('remove_offline_mode_files_and_settings');
  }

  get_offline_info() {
    try {
      return this.jsonrpc.request('get_offline_info');
    } catch (e) {
      return null;
    }
  }
}
const api = new OfflineAPI();

export { api as default };

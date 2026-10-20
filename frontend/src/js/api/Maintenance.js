import { authenticated } from './WebRequest';
import { omitNil } from '../mylib/Utils';
import JSONRPC from 'jsonrpc-dispatch';

export class MaintenanceAPI {
  // dummy dispatcher that resolves all calls to null
  constructor() {
    // dummy dispatcher that resolves all calls to null
    this.jsonrpc = { request: () => new Promise((resolve) => resolve(null)) };
  }

  connect(qtobject) {
    // connecting all maintenance actions here
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

  browseLogs(maintenanceid) {
    return this.jsonrpc.request('browse_logs', [maintenanceid]);
  }

  sendLogs(siteid, maintenanceid) {
    return this.jsonrpc.request('send_logs', [siteid, maintenanceid]);
  }

  get_site_maintenance(parameters) {
    const { siteid, machinedbid } = omitNil(parameters);
    return authenticated.get(
      `/maintenance/site/${siteid}/machine/${machinedbid}`
    );
  }

  save_intervention(parameters) {
    const { siteid, machinedbid, ...params } = omitNil(parameters);
    return authenticated.post(
      `/maintenance/site/${siteid}/machine/${machinedbid}`,
      { params }
    );
  }

  set_service_data(parameters) {
    const { siteid, machinedbid, ...params } = omitNil(parameters);
    return authenticated.post(
      `/maintenance/site/${siteid}/machine/${machinedbid}/set_service_data`,
      { params }
    );
  }

  delete_maintenance_case(parameters) {
    const { siteid, maintenanceid } = omitNil(parameters);
    return authenticated.delete(
      `/maintenance/site/${siteid}/maintenance/${maintenanceid}`
    );
  }

  get_unseen(parameters) {
    const { siteid } = omitNil(parameters);

    return authenticated.get(`/maintenance/site/${siteid}/unseen`);
  }
}
const api = new MaintenanceAPI();

export { api as default };

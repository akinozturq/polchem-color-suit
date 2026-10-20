import { authenticated } from './WebRequest';
import { omitNil } from '../mylib/Utils';

export default class ReplicationApi {
  static fetchReplicationDetails(parameters) {
    const { siteid, ...params } = omitNil(parameters);
    return authenticated.get(`/replication/site/${siteid}/details/`, {
      params,
    });
  }

  static runReplicationAction(parameters) {
    const { siteid, ...params } = omitNil(parameters);
    return authenticated.get(`/replication/site/${siteid}/runaction/`, {
      params,
    });
  }

  static setReplicationFullSync(parameters) {
    const { siteid, ...params } = omitNil(parameters);
    return authenticated.post(`/replication/site/${siteid}/set_full_sync/`, {
      ...params,
    });
  }

  static resendOrders(parameters) {
    const { siteid, ...params } = omitNil(parameters);
    return authenticated.post(`/replication/site/${siteid}/resend_orders/`, {
      ...params,
    });
  }
}

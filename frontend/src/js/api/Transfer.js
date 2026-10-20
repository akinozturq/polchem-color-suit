import JSONRPCAPI from './JSONRPCAPI';
import transferActions from 'js/redux/reducers/Transfer';

export class TransferAPI extends JSONRPCAPI {
  connect(qtobject, store) {
    super.connect(qtobject);
    try {
      qtobject.addOrder.connect((str) => {
        store.dispatch(transferActions.addOrder(JSON.parse(str)));
      });
    } catch (e) {
      // Older version of POS app doesn't export this
    }
  }
  writeFlink(content) {
    return this.jsonrpc.request('write_flink', [content]);
  }
}

const api = new TransferAPI();

export { api as default };

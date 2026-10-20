import { io } from 'socket.io-client';

import loginActions from '../redux/reducers/Login';
import queueActions from '../redux/reducers/OrderQueue';
import cacheActions from '../redux/reducers/Cache';
import { getToken, getOfflineToken } from './WebRequest';
import { DB_NAME, offline_mode } from '../Constants';
import { logTime } from '../mylib/DateUtils';
import log from './Logger';

class Socket {
  constructor({ getState, dispatch }) {
    this.getState = getState;
    this.dispatch = dispatch;

    this.socket = io('/pos', {
      autoConnect: false,
      auth: (cb) => {
        cb({
          token: offline_mode ? getOfflineToken() : getToken(),
          schema: DB_NAME,
          zoneid: this.getState().configurations?.zone?.zoneid,
          systemgroupid: this.getState().configurations?.site?.systemgroupid,
        });
      },
    });
    // default events
    this.socket.on('connect_error', (err) => {
      log.error(`socketio: ${err?.message}`, err);
      if (err?.message === 'Invalid authorization') {
        // ^must match message on server
        this.dispatch(loginActions.refreshToken());
      }
    });
    this.socket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') {
        log.error('socketio: disconnect, ' + reason);
      }
    });
    this.socket.on('connect', () => {
      console.log(`socketio: id ${this.socket.id} @ ${logTime()}`);
    });

    // custom events
    this.socket.on('server_error', () => {
      log.error('socketio: server side error');
    });

    this.socket.on('orders_list', (data) => {
      try {
        const { siteid, orders } = data;
        this.dispatch(queueActions.setOrderQueue(siteid, orders));
      } catch (e) {
        log.error(e);
      }
    });

    this.socket.on('products_list', (data) => {
      try {
        const { products, cansizes } = data;

        this.dispatch(cacheActions.setProductsCansizes(products, cansizes));
      } catch (e) {
        log.error(e);
      }
    });

    this.socket.on('cards_list', (data) => {
      try {
        const { cards } = data;
        this.dispatch(cacheActions.setCardsList(cards));
      } catch (e) {
        log.error(e);
      }
    });
    this.socket.onAny((event) => {
      console.log(`socketio: received ${event} @ ${logTime()}`);
    });
    this.socket.onAnyOutgoing((event) => {
      console.log(`socketio: sent ${event} @ ${logTime()}`);
    });
  }

  connect() {
    console.log(`socketio: connect @ ${logTime()}`);
    this.socket.connect();
  }

  disconnect() {
    console.log(`socketio: disconnect @ ${logTime()}`);
    this.socket.disconnect();
  }

  orders_list(siteid) {
    this.socket.emit('orders_list', { siteid, schema: DB_NAME });
  }
}

let socketInstance = null;

export function initSocket(store) {
  // call once during app bootstrap
  socketInstance = new Socket({
    dispatch: store.dispatch,
    getState: store.getState,
  });
  return socketInstance;
}

export function getSocket() {
  if (!socketInstance)
    throw new Error('Socket not initialized. Call initSocket(store) first.');
  return socketInstance;
}

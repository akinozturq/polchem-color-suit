import {
  take,
  put,
  all,
  takeLatest,
  call,
  delay,
  select,
  takeEvery,
} from 'redux-saga/effects';
// import { push } from 'connected-react-router';

import _ from 'lodash';

import machineActions, {
  selectors as machineSelectors,
  actionTypes as machineActionTypes,
  selectors,
} from '../reducers/Machine';
import {
  selectors as cacheSelectors,
  actionTypes as cacheActionTypes,
} from '../reducers/Cache';
import orderActions, {
  actionTypes as orderActionTypes,
} from '../reducers/Order';

import {
  ORDER_STATUS_PREPARING,
  ORDER_STATUS_WAITING,
  MACHINE_STATE_CAN_READY,
  MACHINE_STATE_DISPENSE,
  MACHINE_STATE_WAIT_FOR_CAN_IN,
  MACHINE_STATE_CAN_INSERTED,
  BARCODE_MODE_DISPENSE,
  BARCODE_MODE_NORMAL,
  MACHINE_ERROR_ABORT,
  MACHINE_VALIDATE_CRITICAL_LEVEL,
  MACHINE_VALIDATE_WARNING_LEVEL,
  MACHINE_VALIDATE_CNT_MISSING,
  MACHINE_VALIDATE_OK,
  MACHINE_STATE_IDLE,
} from '../../Constants';
import { watch_machine_state } from './Machine';
import { waitForAction } from './Utils';
import { actionTypes as barcodeActionTypes } from '../reducers/BarcodeAction';
import webRequest from './WebRequest';
import machineApi from '../../api/Machine';
import { fetchWithSiteid, waitForSite } from './Configuration';
import { isSiteUser } from '../../api/WebRequest';
import { fulfilled, rejected } from '../factories/ApiCall';
import log from '../../api/Logger';

function* fetch_machines_list() {
  const is_site = isSiteUser();
  if (!is_site) {
    return null;
  }

  const site = yield call(waitForSite);
  const clientid = (site.localclient || {}).clientid;

  for (let i = 0; i < 2; i++) {
    let cnts = yield select(cacheSelectors.cnts);
    if (!cnts.length)
      cnts = (yield take(cacheActionTypes.FETCH_CNTS_FULFILLED)).payload.data;

    const info = {
      canisterCount: cnts.length,
      circuitCount: cnts.length,
      dispenserName: 'Simulation' + i,
      driverType: 'SIMULATE' + i,
      progressSupported: false,
      purgeAmountSupported: true,
      brand: 'Simulation',
      serialNumber: '1234' + i,
    };

    const { data } = yield call(
      webRequest,
      machineApi.get_machine_DB({
        siteid: site.siteid,
        clientid: clientid,
        machinename: i.toString(),
        ...info,

        machinecategory: 'A',
      })
    );

    yield put({
      type: machineActionTypes.SET_DBMACHINE_INFO,
      payload: {
        dispID: [i.toString()],
        results: data,
      },
    });

    yield put({
      type: machineActionTypes.SET_MACHINE_INFO,
      payload: {
        dispID: i.toString(),
        results: {
          info: info,
          commands: { reset: true, backup: true, purge: true },
        },
      },
    });

    yield put({
      type: machineActionTypes.SET_MACHINE_CONFIG,
      payload: {
        dispID: i.toString(),
        results: {
          purge_at_time: Date.now(),
          purge_every_day: 0,
          purge_every_time_hm: '12:00',
          purge_every_time: 360,
          purge_amounts: cnts.map(() => 1),
          canister_barcodes: ['', '012930157'],
        },
      },
    });

    yield put({
      type: machineActionTypes.SET_MACHINE_STATE,
      payload: { dispID: i.toString(), results: default_machine_state },
    });

    yield put({
      type: machineActionTypes.SET_MACHINE_ERROR,
      payload: { dispID: i.toString(), results: [] },
    });
  }
  yield put({
    type: machineActionTypes.SET_DISPIDS,
    payload: ['0', '1'],
  });
}

const default_machine_state = {
  error: null,
  msgID: 1,
  msgIDOrig: 1,
  msgText: 'Hello this is machine',
  msgButtons: [],
  orderItem: null,
  state: MACHINE_STATE_IDLE,
  busy: false,
};

function* put_status(dispID, status) {
  yield put({
    type: machineActionTypes.SET_MACHINE_STATE,
    payload: { dispID, results: status },
  });
}

function* fetch_machine_state(action) {
  let { dispID } = action.payload;

  const data = { dispID, results: default_machine_state };

  yield put({ type: machineActionTypes.SET_MACHINE_STATE, payload: data });
}

function* fetch_machine_colorants(action) {
  let { dispID } = action.payload;
  try {
    let cnts = yield select(cacheSelectors.cnts);
    if (!cnts.length)
      cnts = (yield take(cacheActionTypes.FETCH_CNTS_FULFILLED)).payload.data;

    let { colorants } = yield select(machineSelectors.machine, dispID);
    if (colorants.length) {
      // copy existing data as if re-fetched
      colorants = _.cloneDeep(colorants);
    } else {
      // initial data
      // Put one colorant in two canisters (MS in integration_test db)
      cnts = [...cnts.slice(0, 6), ...cnts.slice(5)];
      colorants = cnts.map((x, i) => ({
        rgb: x.rgb,
        code: x.cntcode,
        specificgravity: x.specificgravity,
        enabled: true,
        canEnable: true,
        maxLevel: 2000,
        currLevel: 1800,
        warnLevel: 200,
        minLevel: 100,
        barcode: '',
        id: i,
        cntid: x.cntid,
        circuits: [i + 1],
        description: x.description,
      }));
    }

    yield put({
      type: machineActionTypes.SET_MACHINE_COLORANTS,
      payload: { dispID, results: colorants },
    });
  } catch (e) {
    log.error(e);
  }
}

function* cmd_set_machine_colorants(action) {
  try {
    const { dispID, cnts } = action.payload;
    yield put({
      type: machineActionTypes.SET_MACHINE_COLORANTS,
      payload: { dispID, results: _.cloneDeep(cnts) },
    });
  } catch (e) {
    log.error(e);
  }
}

function* cmd_purge(action) {
  try {
    yield call(() => null);

    // Update machine colorant levels!
    yield put(machineActions.fetchMachineColorants(action.dispID));
  } catch (e) {
    log.error(e);
  }
}

function* cmd_purge_automatic_prepare(action) {
  try {
    yield call(() => null);

    // Update machine colorant levels!
    yield put(machineActions.fetchMachineColorants(action.dispID));
  } catch (e) {
    log.error(e);
  }
}

function* cmd_clear_dispenser_warning() {
  yield delay(2000);
  yield* fetch_machine_state(machineActions.fetchMachineState('0'));
}

function* cmd_clear_hopper_warning() {
  yield delay(2000);
  yield* fetch_machine_state(machineActions.fetchMachineState('0'));
}

function* cmd_tint(action) {
  try {
    yield put({
      type: barcodeActionTypes.SETMODE,
      payload: BARCODE_MODE_DISPENSE,
    });

    const { dispID } = action.payload;
    let { order } = action.payload;
    const { lotSize, cansTinted } = order;
    yield put({
      type: orderActionTypes.SET_ITEM_STATUS,
      payload: ORDER_STATUS_PREPARING,
    });

    for (let i = cansTinted + 1; i <= lotSize; i++) {
      let status = {
        ...default_machine_state,
        msgID: 2,
        msgIDOrig: 2,
        orderItem: order,
        msgText: `Please insert can ${i}/${lotSize}`,
        state: MACHINE_STATE_WAIT_FOR_CAN_IN,
        msgButtons: ['ok', 'cancel'],
      };

      yield* put_status(dispID, status);
      // wait for button click
      const act = yield take(machineActionTypes.CMD_MACHINE_ACTION);
      if (act.payload.machine_action === 'cancel') {
        break;
      }

      status = {
        ...default_machine_state,
        msgID: 150000051,
        msgIDOrig: 150000051,
        orderItem: order,
        msgText: `Get ready to tint ${i}/${lotSize}`,
        state: MACHINE_STATE_CAN_INSERTED,
        msgButtons: ['ok'],
      };
      yield* put_status(dispID, status);

      // wait for ok button click
      yield* waitForAction(machineActions.machineAction(dispID, 'ok'));

      status = {
        ...default_machine_state,
        msgID: 106,
        msgIDOrig: 106,
        msgText: 'Working...',
        orderItem: order,
        state: MACHINE_STATE_DISPENSE,
        busy: true,
      };
      yield* put_status(dispID, status);
      yield delay(2000);
      order = { ...order, cansTinted: i };
      yield put(
        orderActions.canTinted(order.itemID, undefined, i - 1, i, lotSize)
      );
      yield put(orderActions.tintCanReady(order.itemID, undefined));

      status = {
        ...default_machine_state,
        orderItem: order,
        state: MACHINE_STATE_CAN_READY,
      };
      yield* put_status(dispID, status);
    }
    yield* put_status(dispID, default_machine_state);

    const data = { results: true };
    if (data.results) {
      // Successfull tint
      yield put({
        type: orderActionTypes.ORDERITEM_TINTED,
        payload: action.payload.order,
      });
      // Navigate back to home
      // yield put(push('/'));
    } else {
      // Canceled / failed
      yield put({
        type: orderActionTypes.SET_ITEM_STATUS,
        payload: ORDER_STATUS_WAITING,
      });
    }
  } catch (e) {
    log.error(e);
  }

  yield put({
    type: barcodeActionTypes.SETMODE,
    payload: BARCODE_MODE_NORMAL,
  });
}

function* cmd_machine_action() {
  try {
    yield call(() => null);
  } catch (e) {
    log.error(e);
  }
}

function validate_cnt(code, volume, canisters) {
  const canister = canisters.find((x) => x.code === code);
  if (!canister) return MACHINE_VALIDATE_CNT_MISSING;

  const level = canister.currLevel - volume;
  if (level < canister.minLevel) return MACHINE_VALIDATE_CRITICAL_LEVEL;
  if (level < canister.warnLevel) return MACHINE_VALIDATE_WARNING_LEVEL;
  return MACHINE_VALIDATE_OK;
}

function* cmd_check_formula(action) {
  try {
    const { dispID, frm } = action.payload;
    const { colorants } = yield select(machineSelectors.machine, dispID);
    const result = frm.map((cnt) => ({
      ...cnt,
      warn: validate_cnt(cnt.code, cnt.volume, colorants),
    }));

    yield put({
      type: orderActionTypes.CHECK_FORMULA_FULFILLED,
      payload: result,
    });
  } catch (e) {
    log.error(e);
  }
}

function* cmd_backup(action) {
  try {
    const dispID = action.payload.dispID;

    const machine = yield select(selectors.machine, dispID);
    const model = machine?.dbinfo?.model || dispID;

    const site = yield call(waitForSite);

    const clientid = (site.localclient || {}).clientid;
    const data = { results: btoa('TESTIDATA') };

    const rs = yield call(
      webRequest,
      machineApi.save_client_data({
        siteid: site.siteid,
        clientid,
        datakey: model + ' backup',
        modificationdate: new Date(),
        notes: action.payload.notes,
        mimetype: 'application/zip',
      })
    );

    yield call(
      webRequest,
      machineApi.save_backup({
        siteid: site.siteid,
        dataid: rs.data.dataid,
        data: data.results,
      })
    );
    yield put({ type: fulfilled(action.type), payload: data });
    yield put({
      type: machineActionTypes.FETCH_MACHINE_CONFIG_BACKUP,
      payload: { clientid },
    });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
    if (e.error_code === MACHINE_ERROR_ABORT) {
      yield put({
        type: orderActionTypes.SET_ITEM_STATUS,
        payload: ORDER_STATUS_WAITING,
      });
    }
  }
}

function* reload_machine_backup() {
  try {
    const site = yield call(waitForSite);

    const clientid = (site.localclient || {}).clientid;
    yield put({
      type: machineActionTypes.FETCH_MACHINE_CONFIG_BACKUP,
      payload: { clientid },
    });
  } catch (e) {
    log.error(e);
  }
}

export default function* saga() {
  yield all([
    takeLatest(
      machineActionTypes.FETCH_MACHINE_CONFIG_BACKUP,
      fetchWithSiteid,
      machineApi.fetch_client_data
    ),
    takeLatest(
      machineActionTypes.DELETE_MACHINE_CONFIG_BACKUP,
      fetchWithSiteid,
      machineApi.delete_client_data
    ),
    takeLatest(
      fulfilled(machineActionTypes.DELETE_MACHINE_CONFIG_BACKUP),
      reload_machine_backup
    ),
    takeLatest(machineActionTypes.CMD_BACKUP, cmd_backup),
    takeLatest(machineActionTypes.FETCH_MACHINES_LIST, fetch_machines_list),
    takeLatest(machineActionTypes.FETCH_MACHINE_STATE, fetch_machine_state),
    takeEvery(
      machineActionTypes.FETCH_MACHINE_COLORANTS,
      fetch_machine_colorants
    ),
    takeLatest(
      machineActionTypes.CMD_SET_MACHINE_COLORANTS,
      cmd_set_machine_colorants
    ),

    takeLatest(machineActionTypes.CMD_PURGE, cmd_purge),
    takeLatest(
      machineActionTypes.CMD_PURGE_AUTOMATIC_PREPARE,
      cmd_purge_automatic_prepare
    ),
    takeLatest(machineActionTypes.CMD_MACHINE_ACTION, cmd_machine_action),
    takeLatest(
      machineActionTypes.CMD_CLEAR_DISPENSER_WARNING,
      cmd_clear_dispenser_warning
    ),
    takeLatest(
      machineActionTypes.CMD_CLEAR_HOPPER_WARNING,
      cmd_clear_hopper_warning
    ),

    takeLatest(machineActionTypes.CMD_CHECK_FORMULA, cmd_check_formula),
    takeLatest(machineActionTypes.CMD_TINT, cmd_tint),

    call(watch_machine_state),
  ]);
}

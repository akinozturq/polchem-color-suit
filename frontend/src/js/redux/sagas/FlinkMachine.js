import { all, put, call, select, takeLatest } from 'redux-saga/effects';
import i18n from 'js/localization/i18n';
import {
  DISPID_FLINK_DISPENSER,
  FLINK_TYPE_STANDARD,
  FLINK_TYPE_STANDARD_GRAVIMETRIC,
  FLINK_TYPE_TDF,
  FLINK_TYPE_TDF_GRAVIMETRIC,
  MACHINECATEGORY_FLINK,
  MACHINE_STATE_IDLE,
  MACHINE_VALIDATE_CNT_MISSING,
  MACHINE_VALIDATE_OK,
} from '../../Constants';
import machineApi from '../../api/Machine';
import transferApi from '../../api/Transfer';
import { selectors as configSelectors } from '../reducers/Configuration';
import {
  actionTypes as machineActionTypes,
  selectors as machineSelectors,
} from '../reducers/Machine';
import { actionTypes as cacheActionTypes } from '../reducers/Cache';
import orderActions, {
  actionTypes as orderActionTypes,
} from '../reducers/Order';
import errorActions from '../reducers/Errors';
import webRequest from './WebRequest';
import { waitForConfig, waitForSite } from './Configuration';
import { flinkFormat } from '../selectors/FlinkFormatter';
import log from '../../api/Logger';

const MACHINE_STATE_OBJECT_IDLE = {
  msgText: null,
  blockUI: false,
  busy: false,
  msgID: null,
  msgButtons: null,
  msgOrigText: null,
  currentProcess: null,
  state: MACHINE_STATE_IDLE,
  msgIcon: null,
  msgParams: [],
  error: false,
  progress: null,
  msgSupported: false,
  msgIDOrig: null,
};

export function* fetch_machines_list() {
  yield call(waitForConfig);
  const site = yield call(waitForSite);
  const clientid = (site.localclient || {}).clientid;

  const dispID = DISPID_FLINK_DISPENSER;
  const name = 'Flink';

  const info = {
    dispenserName: name,
    driverType: 'FLINK',
    progressSupported: false,
    purgeAmountSupported: false,
    brand: name,
  };

  const { data } = yield call(
    webRequest,
    machineApi.get_machine_DB({
      siteid: site.siteid,
      clientid: clientid,
      machinename: name,
      machinecategory: MACHINECATEGORY_FLINK,
      ...info,
    })
  );

  yield put({
    type: machineActionTypes.SET_DBMACHINE_INFO,
    payload: { dispID, results: data },
  });

  yield put({
    type: machineActionTypes.SET_MACHINE_INFO,
    payload: {
      dispID,
      results: { info: info, commands: { tint: true } },
    },
  });

  yield put({
    type: machineActionTypes.SET_MACHINE_STATE,
    payload: { dispID, results: MACHINE_STATE_OBJECT_IDLE },
  });

  return [dispID];
}

function* _check_formula(action) {
  const { dispID, frm } = action.payload;
  try {
    const { colorants } = yield select(machineSelectors.machine, dispID);
    const allCntCodes = new Set(colorants.map((x) => x.code));
    return frm.map((x) => ({
      ...x,
      warn: allCntCodes.has(x.code)
        ? MACHINE_VALIDATE_OK
        : MACHINE_VALIDATE_CNT_MISSING,
    }));
  } catch (e) {
    log.error(e);
    return frm;
  }
}

export function* cmd_check_formula(action) {
  yield put({
    type: orderActionTypes.CHECK_FORMULA_FULFILLED,
    payload: yield call(_check_formula, action),
  });
}

function disable_tdf(flink_type) {
  switch (flink_type) {
    case FLINK_TYPE_TDF:
      return FLINK_TYPE_STANDARD;
    case FLINK_TYPE_TDF_GRAVIMETRIC:
      return FLINK_TYPE_STANDARD_GRAVIMETRIC;
    default:
      return flink_type;
  }
}

export function* cmd_tint(action) {
  try {
    const { dispID, skip_tdf_base } = action.payload;
    const machine = yield select(machineSelectors.machine, dispID);

    let { flink_dispenser_type } = yield select(configSelectors.config_values);
    if (skip_tdf_base) {
      flink_dispenser_type = disable_tdf(flink_dispenser_type);
    }

    const flinkContent = flinkFormat(yield select(), flink_dispenser_type);
    try {
      yield call(() => transferApi.writeFlink(flinkContent));
    } catch (e) {
      yield put(
        errorActions.showCriticalError(i18n.t('msg.errorOnFileTransmission'), e)
      );
      return;
    }

    const { lotSize, cansTinted, itemID } = action.payload.order;
    yield put(
      orderActions.canTinted(
        itemID,
        machine.dbinfo.machineid,
        cansTinted,
        lotSize,
        lotSize
      )
    );
    for (let i = cansTinted; i < lotSize; i++) {
      yield put(orderActions.tintCanReady(itemID, machine.dbinfo.machineid));
    }

    yield put({
      type: orderActionTypes.ORDERITEM_TINTED,
      payload: action.payload.order,
    });
  } catch (e) {
    log.error(e);
  }
}

function* fetch_cnts_fulfilled(action) {
  const cnts = action.payload.data;
  const canisters = cnts.map((x, i) => ({
    rgb: x.rgb,
    code: x.cntcode,
    specificgravity: x.specificgravity,
    id: i,
    cntid: x.cntid,
    circuits: [],
    minLevel: 0,
    currLevel: 0,
    warnLevel: 0,
    maxLevel: 0,
    enabled: true,
  }));
  yield put({
    type: machineActionTypes.SET_MACHINE_COLORANTS,
    payload: { dispID: DISPID_FLINK_DISPENSER, results: canisters },
  });
}

export default function* saga() {
  yield all([
    takeLatest(cacheActionTypes.FETCH_CNTS_FULFILLED, fetch_cnts_fulfilled),
  ]);
}

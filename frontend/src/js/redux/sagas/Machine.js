import {
  put,
  all,
  takeEvery,
  takeLatest,
  call,
  select,
  take,
  spawn,
  race,
  delay,
  actionChannel,
} from 'redux-saga/effects';

import machineActions, {
  actionTypes as machineActionTypes,
  selectors,
} from '../reducers/Machine';
import orderActions, {
  actionTypes as orderActionTypes,
  selectors as orderSelectors,
} from '../reducers/Order';
import {
  actionTypes as barcodeActionTypes,
  selectors as barcodeActionSelectors,
} from '../reducers/BarcodeAction';
import printTaskActions from '../reducers/PrintTask';
import * as flink from './FlinkMachine';

import machineApi from 'js/api/Machine';
import {
  ORDER_STATUS_PREPARING,
  ORDER_STATUS_DONE,
  ORDER_STATUS_WAITING,
  MACHINE_STATE_FORMULA_DISPENSED_GRAVIMETRICALLY,
  MACHINE_ACTION_CAN_CONFIRM,
  MACHINE_ERROR_ABORT,
  BARCODE_MODE_NORMAL,
  BARCODE_MODE_DISPENSE,
  MACHINE_PROGRESS_PURGE_ALL,
  MACHINE_PROGRESS_PURGE_AUTOMATIC,
  MACHINE_PROGRESS_PURGE,
  MACHINE_STATE_DISPENSE,
  NUMERIC_ORDER_STATUS,
  SOURCE_PURGE,
  MACHINE_STATE_WAIT_FOR_CAN_REMOVAL,
  MACHINE_ACTION_CANCEL,
  MACHINE_STATE_IDLE,
  DISPID_FLINK_DISPENSER,
  MIN_PERCENTAGE_THRESHOLD_BATCH_WARNING,
  MACHINE_PROGRESS_PURGE_AUTOMATIC_PREPARE,
  MACHINE_ACTION_OK,
  MACHINE_MSG_ID_FILL_UP_CANISTERS,
  MACHINE_STATE_ERROR,
  MACHINE_PROGRESS_TINT,
  MACHINE_ACTION_RETRY,
  MACHINE_STATE_FORMULA_PARTIALLY_DISPENSED_GRAVIMETRICALLY,
  MACHINE_ACTION_BARCODE_CONFIRMATION,
  BARCODE_VALIDATION_OK,
  MACHINE_STATE_WAIT_FOR_BARCODE_VALIDATION,
  MACHINE_MSG_ID_CAN_READY,
  MACHINE_MSG_ID_CAN_TINTED,
} from '../../Constants';
import webRequest from './WebRequest';
import {
  post_dispense,
  save_localorder,
  save_orderitem,
} from '../../api/Order';
import {
  actionTypes as cacheActionTypes,
  selectors as cacheSelectors,
} from '../reducers/Cache';
import { selectors as configSelectors } from '../reducers/Configuration';
import { selectors as userSelectors } from '../reducers/User';
import errorActions from '../reducers/Errors';
import i18n from '../../localization/i18n';
import { fetchWithSiteid, waitForSite } from './Configuration';
import { waitForTintPrivileges } from './User';
import { fetchOrderitem } from './OrderFetching';
import { fulfilled, rejected } from '../factories/ApiCall';
import log from '../../api/Logger';

function* fetch_combined_machines_list(action) {
  try {
    const config_values = yield select(configSelectors.config_values);

    const autoDispIDs = config_values.enable_automatic_dispensers
      ? yield call(fetch_machines_list, action)
      : [];
    const no_automatic = !autoDispIDs.length;
    const flinkDispIDs = config_values.enable_flink_simple_dispensers
      ? yield call(flink.fetch_machines_list, action)
      : [];
    const dispIDs = [...autoDispIDs, ...flinkDispIDs];

    yield put({
      type: machineActionTypes.SET_DISPIDS,
      payload: dispIDs,
    });

    // set the first disp id as current machine id
    yield put({
      type: machineActionTypes.SET_CURRENT_MACHINE,
      payload: { dispID: dispIDs[0] },
    });

    for (const id of autoDispIDs) {
      yield* fetch_machine_error(machineActions.fetchMachineError(id));
      yield* fetch_machine_colorants(machineActions.fetchMachineColorants(id));
    }

    yield put(
      machineActions.setMachineMissing(
        no_automatic &&
          config_values.enable_automatic_dispensers &&
          !config_values.enable_flink_simple_dispensers
      )
    );
  } catch (e) {
    log.error(e);
  }
}

function* fetch_machines_list() {
  console.log('Fetching machines list');
  try {
    yield call(fetch_driver_config);

    // Getting site info + localclientid
    const site = yield call(waitForSite);

    const { results } = yield call(() => machineApi.machines_list());
    let connected_machines = [];
    const clientid = (site.localclient || {}).clientid;

    for (const r of results) {
      try {
        const { data } = yield call(
          webRequest,
          machineApi.get_machine_DB({
            siteid: site.siteid,
            clientid: clientid,
            machinename: r.id,
            ...r.info,
            machinecategory: 'A',
          })
        );

        yield put({
          type: machineActionTypes.SET_DBMACHINE_INFO,
          payload: {
            dispID: r.id,
            results: data,
          },
        });

        connected_machines.push({ machineid: data.machineid });
      } catch (e) {
        log.error(e);
      }
      const commandsArray = (yield call(() =>
        machineApi.getSupportedCommands(r.id)
      )).results;
      const commands = Object.fromEntries(commandsArray.map((x) => [x, true]));
      yield put({
        type: machineActionTypes.SET_MACHINE_INFO,
        payload: {
          dispID: r.id,
          results: { info: r.info, commands },
        },
      });

      const machine_state = yield* fetch_machine_state(
        machineActions.fetchMachineState(r.id)
      );
      if (machine_state) {
        yield* check_interrupted_tint(r.id, machine_state);
      }
      yield* fetch_machine_config(machineActions.fetchMachineConfig(r.id));
    }
    // Send connected machines information to the backend.
    try {
      yield call(
        webRequest,
        machineApi.connected_machines_DB({
          siteid: site.siteid,
          clientid: clientid,
          machines: connected_machines,
        })
      );
    } catch (e) {
      log.error(e);
    }

    const dispIDs = results.map((x) => x.id);

    console.log('Finished fetching machines list');
    return dispIDs;
  } catch (e) {
    log.error(e);
  }
}

function* fetch_driver_config() {
  let payload = null;
  try {
    const data = yield call(() => machineApi.getDriverConfiguration());
    payload = data.results;
  } catch (e) {
    // NEED TO HANDLE ERROR HERE
    log.error(e);
  }
  yield put({ type: machineActionTypes.SET_DRIVER_CONFIG, payload });
}

function* cmd_set_driver_config(action) {
  try {
    yield call(() => machineApi.setDriverConfiguration(action.payload.config));
    // Reload config
    yield put({
      type: machineActionTypes.FETCH_DRIVER_CONFIG,
      payload: null,
    });
  } catch (e) {
    log.error(e);
  }
}

function* fetch_machine_state(action) {
  const { dispID } = action.payload;
  if (!dispID) {
    /**
     * Nothing to do as the dispID is missing
     */
    return;
  }
  try {
    const data = yield call(() => machineApi.getState(dispID));

    yield put({ type: machineActionTypes.SET_MACHINE_STATE, payload: data });
    return data.results;
  } catch (e) {
    // NEED TO HANDLE ERROR HERE
    log.error(e);
  }
}

/**
 * Checks if tinting is in progress but the order is not currently loaded in the UI,
 * and dispatch an action to resume it if so.
 *
 * Note: At them moment this is only called from fetch_machines_list at startup,
 * other cases should be considered as well.
 * @param {*} machine_state
 * @returns
 */
function* check_interrupted_tint(dispID, machine_state) {
  try {
    const { currentProcess, orderItem } = machine_state;
    if (orderItem && currentProcess === MACHINE_PROGRESS_TINT) {
      const ui_itemid = yield select(orderSelectors.itemid);
      if (ui_itemid !== orderItem.itemID) {
        yield put({
          type: machineActionTypes.RESUME_INTERRUPTED_TINT,
          payload: { dispID, machine_state },
        });
      }
    }
  } catch (e) {
    log.error(e);
  }
  return false;
}

/**
 * Loads the order item in the UI as soon as user has tint privileges.
 * Uses a take loop instead of takeEvery to avoid multiple concurrent executions
 */
function* watch_resume_interrupted_tint() {
  while (true) {
    try {
      const action = yield take(machineActionTypes.RESUME_INTERRUPTED_TINT);
      const { dispID, machine_state } = action.payload;
      if (machine_state.cancelable) {
        // If the tinting can be cancelled without user interaction, do it
        yield call(cancel_interrupted_tint, dispID);
        continue;
      }
      const { itemID } = machine_state.orderItem || {};
      yield call(waitForTintPrivileges);
      // Navigates to /orderpage
      yield call(fetchOrderitem, {
        payload: {
          itemid: itemID,
          retint: false,
          resume: true,
          zoneid: null,
        },
      });
      yield put(machineActions.setCurrentMachine(dispID));
      yield spawn(resume_interrupted_tint);
    } catch (e) {
      log.error(e);
    }
  }
}

function* resume_interrupted_tint() {
  try {
    // Wait until machine is idle on idle state
    // and update the order state based on the results
    let m_state = null;
    let cancelled = false;
    while (m_state !== MACHINE_STATE_IDLE && !cancelled) {
      const { rms, rma } = yield race({
        rms: take(machineActionTypes.SET_MACHINE_STATE),
        rma: take(machineActionTypes.CMD_MACHINE_ACTION),
      });

      if (rms) {
        m_state = rms.payload.results?.state;
      }
      if (rma) {
        if (rma.payload.machine_action === MACHINE_ACTION_CANCEL) {
          cancelled = true;
        }
      }
    }

    if (!cancelled) {
      // Successfull tint
      yield put({ type: orderActionTypes.ORDERITEM_TINTED });
    } else {
      // operation cancelled
      yield put({
        type: orderActionTypes.SET_ITEM_STATUS,
        payload: ORDER_STATUS_WAITING,
      });
    }
  } catch (e) {
    log.error(e);
  }
}

function* cancel_interrupted_tint(dispID) {
  try {
    log.info(`Cancelling interrupted tint on machine ${dispID}`);
    yield put(machineActions.machineAction(dispID, MACHINE_ACTION_CANCEL));
    let m_state = null;
    while (m_state !== MACHINE_STATE_IDLE) {
      const rms = yield take(machineActionTypes.SET_MACHINE_STATE);
      m_state = rms.payload.results?.state;
    }
    log.info(`Cancelled interrupted tint on machine ${dispID}`);
  } catch (e) {
    log.error(e);
  }
}

function* fetch_machine_batch(action) {
  let { dispID, canisterIndex, currLevel } = action.payload;
  try {
    const data = yield call(() =>
      machineApi.getBatchRefillsList(dispID, canisterIndex, currLevel)
    );
    yield put({
      type: machineActionTypes.SET_MACHINE_BATCH_REFILLS_LIST,
      payload: data,
    });
  } catch (e) {
    log.error(e);
  }
}

function* fetch_machine_refills(action) {
  let { dispID, canisterIndex } = action.payload;
  try {
    const data = yield call(() =>
      machineApi.getRefillsList(dispID, canisterIndex)
    );

    yield put({
      type: machineActionTypes.SET_MACHINE_REFILLS_LIST,
      payload: data,
    });
  } catch (e) {
    // NEED TO HANDLE ERROR HERE
  }
}
// new Date(Date.now()).toISOString()
function* set_machine_refills(action) {
  let {
    machineid,
    refilldate,
    feedback,
    batchnumber,
    dispID,
    canisterIndex,
    volume,
    user,
  } = action.payload;
  try {
    yield call(
      webRequest,
      machineApi.set_refills_list({
        machineid,
        refilldate,
        feedback,
        cntbatch: batchnumber,
      })
    );
    yield call(() =>
      machineApi.addRefill(
        dispID,
        canisterIndex,
        volume,
        batchnumber,
        refilldate,
        user
      )
    );
    yield call(fetch_machine_refills, { payload: { dispID } });
  } catch (e) {
    log.error(e);
  }
}

function* set_machine_refills_batch_list(action) {
  let { dispID, canisterIndex, delta, currLevel, maxLevel, batch, refillDate } =
    action.payload;
  yield call(() =>
    machineApi.addBatchRefill(
      dispID,
      canisterIndex,
      delta,
      currLevel,
      maxLevel,
      batch,
      refillDate
    )
  );
  yield call(fetch_machine_batch, {
    payload: { dispID, canisterIndex, currLevel },
  });
}

function* fetch_machine_config(action) {
  let { dispID } = action.payload;
  try {
    const data = yield call(() => machineApi.getConfiguration(dispID));

    yield put({ type: machineActionTypes.SET_MACHINE_CONFIG, payload: data });
  } catch (e) {
    // NEED TO HANDLE ERROR HERE
    log.error(e);
  }
}

function* wait_for_machine_config(dispID) {
  let { config } = yield select(selectors.machine, dispID);
  while (!config) {
    const a = yield take(machineActionTypes.SET_MACHINE_CONFIG);
    config = a.payload;
  }
  return config;
}

function* fetch_machine_error(action) {
  let { dispID } = action.payload;
  try {
    const data = yield call(() => machineApi.getErrors(dispID));
    yield put({ type: machineActionTypes.SET_MACHINE_ERROR, payload: data });
  } catch (e) {
    // NEED TO HANDLE ERROR HERE
    log.error(e);
  }
}

function* clear_machine_error(action) {
  try {
    yield call(() => machineApi.clearErrors(action.payload.dispID));
    // Reload errors
    yield put(machineActions.fetchMachineError(action.payload.dispID));
  } catch (e) {
    // NEED TO HANDLE ERROR HERE
    log.error(e);
  }
}

function* cmd_set_machine_config(action) {
  try {
    const dispID = action.payload.dispID;
    yield call(() =>
      machineApi.setConfiguration(dispID, action.payload.config)
    );
    // Reload config to be sure it's set!
    yield put(machineActions.fetchMachineConfig(dispID));
  } catch (e) {
    log.error(e);
  }
}

export function* watch_machine_state() {
  const previous = {};
  const channel = yield actionChannel(machineActionTypes.SET_MACHINE_STATE);
  while (true) {
    const action = yield take(channel);
    const { dispID } = action.payload;
    const results = action.payload.results || {};
    const { state, msgID } = results;
    const isNewState = state !== previous[dispID]?.state;
    const isNewMsgID = msgID !== previous[dispID]?.msgID;

    // Skip duplicate messages for states that trigger response to driver
    if (msgID === MACHINE_MSG_ID_CAN_TINTED) {
      if (isNewState) {
        yield call(handle_can_tinted, action);
      } else {
        continue;
      }
    } else if (msgID === MACHINE_MSG_ID_CAN_READY) {
      if (isNewState) {
        const { supportsConfirmEarly } = yield select(selectors.driver_config);
        if (!supportsConfirmEarly) {
          // CAN_TINTED does not occur, handle here
          yield call(handle_can_tinted, action);
        }
        yield call(handle_can_ready, action);
      } else {
        continue;
      }
    } else if (state === MACHINE_STATE_WAIT_FOR_BARCODE_VALIDATION) {
      // If already validated when entering this state, respond. Validation
      // while in this state is handled by barcode_validation_state_change
      const validation_state = yield select(
        barcodeActionSelectors.validation_state
      );
      if (isNewState && validation_state === BARCODE_VALIDATION_OK) {
        yield put(
          machineActions.machineAction(
            dispID,
            MACHINE_ACTION_BARCODE_CONFIRMATION
          )
        );
      } else {
        yield call(set_machine_state, action);
      }
    } else if (msgID === MACHINE_MSG_ID_FILL_UP_CANISTERS) {
      // Skipping "fill up canisters to continue" message on UI by sending ok action
      if (isNewMsgID) {
        yield put(machineActions.machineAction(dispID, MACHINE_ACTION_OK));
      } else {
        continue;
      }
    } else {
      yield call(set_machine_state, action);
    }

    previous[dispID] = results;
  }
}

function* barcode_validation_state_change(action) {
  if (action.payload === BARCODE_VALIDATION_OK) {
    const machine = yield select(selectors.current_machine);
    if (
      machine?.machine_state?.state ===
      MACHINE_STATE_WAIT_FOR_BARCODE_VALIDATION
    ) {
      // If we are in barcode validation state, send confirmation to machine
      yield put(
        machineActions.machineAction(
          machine.dispID,
          MACHINE_ACTION_BARCODE_CONFIRMATION
        )
      );
    }
  }
}

function get_tinting_result(action) {
  const data = action.payload.results?.gravimetricMeasurements || [];
  return {
    cnts: data.map((x) => ({
      cntcode: x.code,
      expected_mass: x.expectedDispenseAmountGrams,
      actual_mass: x.totalDispensedGrams,
      actual_volume: x.totalDispensedAmountML,
      scale_resolution: x.scale_resolution,
    })),
  };
}

function* handle_can_tinted(action) {
  try {
    const { dispID } = action.payload;
    const itemid = action.payload.results?.orderItem?.itemID;
    if (itemid == null) {
      log.error('Driver client did not return itemID');
    }
    const { lotSize, cansTinted } = action.payload.results.orderItem;

    const m = yield select(selectors.machine, dispID);
    yield put(
      orderActions.canTinted(
        itemid,
        m.dbinfo.machineid,
        cansTinted,
        cansTinted + 1,
        lotSize
      )
    );
    yield put({
      type: machineActionTypes.CMD_MACHINE_ACTION,
      payload: { dispID, machine_action: MACHINE_ACTION_CAN_CONFIRM },
    });
  } catch (e) {
    log.error(e);
  }
}

function* handle_can_ready(action) {
  try {
    const { dispID } = action.payload;
    const itemid = action.payload.results?.orderItem?.itemID;
    if (itemid == null) {
      log.error('Driver client did not return itemID');
    }

    const m = yield select(selectors.machine, dispID);
    yield put(orderActions.tintCanReady(itemid, m.dbinfo.machineid));
    yield put({
      type: machineActionTypes.CMD_MACHINE_ACTION,
      payload: { dispID, machine_action: MACHINE_ACTION_CAN_CONFIRM },
    });
  } catch (e) {
    log.error(e);
  }
}

function* set_machine_state(action) {
  try {
    const { dispID } = action.payload;
    const results = action.payload.results || {};

    yield put({
      type: machineActionTypes.SET_MACHINE_STATE_REDUX,
      payload: action.payload,
    });

    if (
      [
        MACHINE_STATE_FORMULA_DISPENSED_GRAVIMETRICALLY,
        MACHINE_STATE_FORMULA_PARTIALLY_DISPENSED_GRAVIMETRICALLY,
      ].includes(results.state)
    ) {
      const tinting_result = get_tinting_result(action);
      yield put({
        type: machineActionTypes.TINT_WEIGHED,
        payload: {
          dispID,
          tinting_result,
        },
      });
    }
    if (
      results.state === MACHINE_STATE_ERROR &&
      results.currentProcess === MACHINE_PROGRESS_TINT
    ) {
      yield put({
        type: machineActionTypes.TINT_ERROR_STATUS,
        payload: results,
      });
    }

    if (
      [
        MACHINE_PROGRESS_PURGE_ALL,
        MACHINE_PROGRESS_PURGE_AUTOMATIC,
        MACHINE_PROGRESS_PURGE_AUTOMATIC_PREPARE,
        MACHINE_PROGRESS_PURGE,
      ].includes(results.currentProcess)
    ) {
      // checking state purge
      const purging = yield select(selectors.is_purging, dispID);
      if (!purging) {
        // Running purge handling on background
        yield spawn(handle_purge, action);
      }
    }
  } catch (e) {
    //
  }
}

function* fetch_machine_colorants(action) {
  let { dispID } = action.payload;
  const cacheColorants = yield select(cacheSelectors.cntcodemap);
  try {
    const config = yield call(wait_for_machine_config, dispID);
    const data = yield call(() =>
      machineApi.getColorants(dispID, config.batch_refill)
    );

    const colorantsWithRGB = data.results.map((colorant) => {
      const cnt = cacheColorants.get(colorant.code);
      const rgb = cnt ? cnt.rgb : null;
      const cntid = cnt ? cnt.cntid : null;
      const specificgravity = cnt ? cnt.specificgravity : 1;
      const description = cnt ? cnt.description : '';
      return { ...colorant, rgb, specificgravity, cntid, description };
    });
    data.results = colorantsWithRGB;
    yield put({
      type: machineActionTypes.SET_MACHINE_COLORANTS,
      payload: data,
    });
  } catch (e) {
    log.error(e);
    errorActions.showCriticalError(
      i18n.t(
        'msg.unableToLoadMachineColorants',
        'Unable to load machine colorants'
      ),
      e
    );
  }
}

function* check_warning_batch() {
  try {
    const machine_colorants = yield select(selectors.machinesColorants);
    const cache_colorants = yield select(cacheSelectors.cnts);
    const warning_batch = cache_colorants
      .map((colorant) => {
        const colorant_in_machine = machine_colorants.find(
          (machine_colorant) => machine_colorant.cntid === colorant.cntid
        );
        const colorant_machine_batches = colorant_in_machine?.batches?.map(
          (batch) => {
            const colorant_cache_batches_match_with_machine =
              colorant?.cntbatchinfo.find((cache_batch) => {
                if (
                  cache_batch.cntbatch === batch.batch &&
                  batch.percentage >= MIN_PERCENTAGE_THRESHOLD_BATCH_WARNING
                ) {
                  return true;
                }
                return false;
              });
            return {
              ...colorant_cache_batches_match_with_machine,
              cntcode: colorant_in_machine.code,
              canisterIndex: colorant_in_machine.id,
            };
          }
        );
        return colorant_machine_batches;
      })
      .flat()
      .filter((clr) =>
        clr
          ? clr.blocked ||
            new Date(clr.expirationdate).getTime() < new Date().getTime()
          : false
      );
    yield put({
      type: machineActionTypes.SET_WARNING_BATCH,
      payload: warning_batch,
    });

    //wait for a day then run the check again
    yield delay(864000);
    yield put(machineActions.checkWarningBatch());
  } catch (e) {
    log.error(e);
    errorActions.showCriticalError(
      'Unable to check machine batch colorants',
      e
    );
  }
}

function* cmd_set_machine_colorants(action) {
  try {
    const { dispID } = action.payload;
    yield call(() => machineApi.setColorants(dispID, action.payload.cnts));
    // Always update machine colorant levels
    yield put(machineActions.fetchMachineColorants(dispID));

    // Send levels to API as well
    for (var x in action.payload.cnts) {
      let cnt = action.payload.cnts[x];

      if (cnt.refillCans) {
        // Spawn if sending to server takes a while
        yield spawn(send_refill_to_api, { ...cnt, ...cnt.refillCans[0] });
      }
    }
  } catch (e) {
    log.error(e);
  }
}

function* send_refill_to_api(data) {
  try {
    const localuserid = yield select(userSelectors.localuserid);

    yield call(
      webRequest,
      machineApi.set_refills_list({
        machineid: data.machineid,
        refilldate: data.date,
        canisterposition: data.canisterIndex,
        cntcode: data.code,
        cntbatch: data.batch,
        volume: data.volume,
        feedback: data.note,
        localuserid: localuserid,
      })
    );
  } catch (e) {
    log.error(e);
  }
}

function* cmd_purge(action) {
  try {
    const dispID = action.payload.dispID;
    yield call(() =>
      machineApi.purge(dispID, action.payload.frm, action.payload.sequential)
    );

    // Update machine colorant levels!
    yield put(machineActions.fetchMachineColorants(dispID));
  } catch (e) {
    if (e.error_code === MACHINE_ERROR_ABORT) {
      yield put({
        type: orderActionTypes.SET_ITEM_STATUS,
        payload: ORDER_STATUS_WAITING,
      });
    }
  }
}

function* cmd_purge_automatic_prepare(action) {
  try {
    const dispID = action.payload.dispID;
    yield call(() => machineApi.purgeAutomaticPrepare(dispID));
    yield put(machineActions.purgeAutomatic(dispID));
  } catch (e) {
    if (e.error_code === MACHINE_ERROR_ABORT) {
      yield put({
        type: orderActionTypes.SET_ITEM_STATUS,
        payload: ORDER_STATUS_WAITING,
      });
    }
  }
}

function* cmd_purge_automatic(action) {
  try {
    const dispID = action.payload.dispID;
    yield call(() => machineApi.purgeAutomatic(dispID));

    // Update machine colorant levels!
    yield put(machineActions.fetchMachineColorants(dispID));
  } catch (e) {
    if (e.error_code === MACHINE_ERROR_ABORT) {
      yield put({
        type: orderActionTypes.SET_ITEM_STATUS,
        payload: ORDER_STATUS_WAITING,
      });
    }
  }
}

function* cmd_backup(action) {
  try {
    const dispID = action.payload.dispID;

    const config_values = yield select(configSelectors.config_values);
    const machine = yield select(selectors.machine, dispID);
    const model = machine?.dbinfo?.model || dispID;

    const site = yield call(waitForSite);

    const clientid = (site.localclient || {}).clientid;
    const data = yield call(() =>
      machineApi.backup(dispID, config_values.max_size_machine_backup_mb)
    );

    if (data.results) {
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
    } else {
      yield put({ type: rejected(action.type), payload: data });
    }
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

function* cmd_purge_all(action) {
  try {
    const dispID = action.payload.dispID;
    yield call(() =>
      machineApi.purgeAll(
        dispID,
        action.payload.amount,
        action.payload.sequential
      )
    );

    // Update machine colorant levels!
    yield put(machineActions.fetchMachineColorants(dispID));
  } catch (e) {
    if (e.error_code === MACHINE_ERROR_ABORT) {
      yield put({
        type: orderActionTypes.SET_ITEM_STATUS,
        payload: ORDER_STATUS_WAITING,
      });
    }
  }
}

function* cmd_stir(action) {
  try {
    yield call(() =>
      machineApi.stir(
        action.payload.dispID,
        action.payload.canid,
        action.payload.time
      )
    );
  } catch (e) {
    log.error(e);
  }
}

function* cmd_clear_dispenser_warning(action) {
  try {
    yield call(() => machineApi.clearDispenserWarning(action.payload.dispID));
  } catch (e) {
    log.error(e);
  }
}

function* cmd_clear_hopper_warning(action) {
  try {
    yield call(() => machineApi.clearHopperWarning(action.payload.dispID));
  } catch (e) {
    log.error(e);
  }
}

function* cmd_clean(action) {
  try {
    yield call(() =>
      machineApi.clean(action.payload.dispID, action.payload.canid)
    );
  } catch (e) {
    log.error(e);
  }
}

function* cmd_move_to_fill(action) {
  try {
    yield call(() =>
      machineApi.moveToFill(action.payload.dispID, action.payload.canid)
    );
    yield put({
      type: machineActionTypes.SET_MACHINE_SELECTED_CNT_CODE,
      payload: {
        dispID: action.payload.dispID,
        code: action.payload.code,
      },
    });
  } catch (e) {
    log.error(e);
  }
}

function* cmd_move_to_home(action) {
  try {
    yield call(() => machineApi.moveToHome(action.payload.dispID));
  } catch (e) {
    log.error(e);
  }
}

function* cmd_initialize(action) {
  try {
    yield call(() => machineApi.initialize(action.payload.dispID));
  } catch (e) {
    log.error(e);
  }
}

function* cmd_reset(action) {
  try {
    yield call(() => machineApi.reset(action.payload.dispID));
  } catch (e) {
    log.error(e);
  }
}

function* cmd_cap(action) {
  try {
    yield call(() =>
      machineApi.cap(action.payload.dispID, action.payload.value)
    );
  } catch (e) {
    log.error(e);
  }
}

function* cmd_stir_all(action) {
  try {
    yield call(() =>
      machineApi.stirAll(action.payload.dispID, action.payload.time)
    );
  } catch (e) {
    log.error(e);
  }
}

function* cmd_clean_all(action) {
  try {
    yield call(() => machineApi.cleanAll(action.payload.dispID));
  } catch (e) {
    log.error(e);
  }
}

function* cmd_tint(action) {
  try {
    yield put({
      type: barcodeActionTypes.SETMODE,
      payload: BARCODE_MODE_DISPENSE,
    });

    // TODO: Clear previous orders from machine? Is this ok?
    let machine = yield select(selectors.machine, action.payload.dispID);
    while (machine.machine_state.msgButtons?.includes(MACHINE_ACTION_CANCEL)) {
      // Cancel all previous work to be sure that correct order is tinted
      yield call(() =>
        machineApi.machine_action(action.payload.dispID, MACHINE_ACTION_CANCEL)
      );
      // Ensure correct tinting machine
      while (true) {
        const rs = yield take(machineActionTypes.SET_MACHINE_STATE);
        if (rs.payload.dispID === action.payload.dispID) {
          machine = { machine_state: rs.payload.results };
          break;
        }
      }
    }

    yield put({
      type: machineActionTypes.TINT_ERROR_STATUS,
      payload: null,
    });
    yield put({
      type: orderActionTypes.SET_ITEM_STATUS,
      payload: ORDER_STATUS_PREPARING,
    });
    const { supportsConfirmEarly } = yield select(selectors.driver_config);
    const data = yield call(() =>
      machineApi.tint(
        action.payload.dispID,
        action.payload.order,
        action.payload.barcodeValidation,
        supportsConfirmEarly
      )
    );

    if (data.results) {
      // Successfull tint
      yield put({ type: orderActionTypes.ORDERITEM_TINTED });

      // Navigate back to home Moved to print task handling
      // yield put(push('/'));
    } else {
      // Canceled / failed
      const error = yield select(orderSelectors.tinting_error);
      if (error) {
        yield put(printTaskActions.processTasksAfterError());
      }
      yield put({
        type: orderActionTypes.SET_ITEM_STATUS,
        payload: ORDER_STATUS_WAITING,
      });
    }
  } catch (e) {
    log.error(e);
    if (e.error_code === MACHINE_ERROR_ABORT) {
      yield put({
        type: orderActionTypes.SET_ITEM_STATUS,
        payload: ORDER_STATUS_WAITING,
      });
    }
  }
  yield put({
    type: barcodeActionTypes.SETMODE,
    payload: BARCODE_MODE_NORMAL,
  });
}

function* cmd_machine_action(action) {
  try {
    const { dispID, machine_action } = action.payload;
    if (machine_action === MACHINE_ACTION_RETRY) {
      yield put({
        type: machineActionTypes.TINT_ERROR_STATUS,
        payload: null,
      });
    }
    yield call(() => machineApi.machine_action(dispID, machine_action));
  } catch (e) {
    log.error(e);
  }
}

function* cmd_check_formula(action) {
  try {
    const { results } = yield call(() =>
      machineApi.check_formula(action.payload.dispID, action.payload.frm)
    );
    yield put({
      type: orderActionTypes.CHECK_FORMULA_FULFILLED,
      payload: results,
    });
  } catch (e) {
    log.error(e);
  }
}

/**
 * Handle purge orderitem saving!
 * @param action
 * @returns {IterableIterator<<"PUT", PutEffectDescriptor<{payload: *, type: *}>>|<"CALL", CallEffectDescriptor>>}
 */
function* handle_purge(action) {
  const { results, dispID } = action.payload;
  try {
    const purge_start = new Date(Date.now()).toISOString();
    // Mark machine with purge state
    yield put({
      type: machineActionTypes.SET_MACHINE_IN_PURGE,
      payload: { dispID, purging: true },
    });

    const original_process = results.currentProcess;
    // Fetch original colorant volumes
    const original = yield call(() => machineApi.getColorants(dispID));

    // check if user cancelled purge
    let ms = (yield select(selectors.machine, dispID)).machine_state;

    // Can be dispense in purge without can in checking!
    if (ms.state !== MACHINE_STATE_DISPENSE) {
      while (true) {
        let { rma, rms } = yield race({
          rma: yield take(machineActionTypes.CMD_MACHINE_ACTION),
          rms: yield take(machineActionTypes.SET_MACHINE_STATE),
        });
        // Machine action made
        if (rma && rma.payload.dispID === dispID) {
          if (rma.payload.machine_action === MACHINE_ACTION_CANCEL) {
            yield put({
              type: machineActionTypes.SET_MACHINE_IN_PURGE,
              payload: { dispID, purging: false },
            });
            return; // user cancelled
          }
          break;
        }
        // Machine state changes
        if (
          rms &&
          rms.payload.dispID === dispID &&
          rms.payload.results.state === MACHINE_STATE_DISPENSE
        ) {
          break;
        }
      }
    }
    // Also works when ma is not defined
    // waiting until machine action has finished
    while (true) {
      let ms = yield take(machineActionTypes.SET_MACHINE_STATE);
      if (ms && ms.payload.dispID === dispID) {
        ms = ms.payload.results;
        if (
          ms.state === MACHINE_STATE_WAIT_FOR_CAN_REMOVAL ||
          ms.currentProcess !== original_process
        ) {
          break; // Purge ready
        }
      }
    }
    const updated = yield call(() => machineApi.getColorants(dispID));

    let purged = [];
    original.results.forEach((ori) => {
      updated.results.forEach((upd) => {
        if (
          upd.id === ori.id &&
          upd.code === ori.code &&
          upd.currLevel !== ori.currLevel
        ) {
          purged.push({
            cntcode: upd.code,
            volume: ori.currLevel - upd.currLevel,
          });
        }
      });
    });

    // Save only in case when some calue has actually changed
    if (purged.length > 0) {
      // save localorder
      const { siteid, localclient } = yield select(configSelectors.site);
      const { zoneid } = yield select(configSelectors.zone);
      const localuserid = yield select(userSelectors.localuserid);

      const localorder = {
        siteid,
        zoneid,
        localuserid,
      };
      localorder.orderstatus = NUMERIC_ORDER_STATUS[ORDER_STATUS_DONE];

      const now = new Date(Date.now()).toISOString();
      localorder.orderdate = purge_start;
      localorder.modificationdate = now;
      localorder.clientid = (localclient || {}).clientid;

      const {
        data: { orderid },
      } = yield call(webRequest, save_localorder(localorder));

      // save orderitem
      const orderitem = {
        orderid,
        siteid,
        ncans: 1,
        source: SOURCE_PURGE,
        cntsinitem: purged,
        status: NUMERIC_ORDER_STATUS[ORDER_STATUS_DONE],
      };
      const {
        data: { itemid },
      } = yield call(webRequest, save_orderitem(orderitem));

      const m = yield select(selectors.machine, dispID);

      yield call(
        webRequest,
        post_dispense({
          itemid,
          dispensetime: new Date(Date.now()).toISOString(),
          machineid: m.dbinfo.machineid,
          localuserid,
        })
      );
    }
  } catch (e) {
    log.error(e);
  }

  yield put({
    type: machineActionTypes.SET_MACHINE_IN_PURGE,
    payload: { dispID, purging: false },
  });
}

function* fetch_cnts_fulfilled(action) {
  const cnts = action.payload.data.map((x) => ({
    code: x.cntcode,
    rgb: x.rgb,
    specificGravity: x.specificgravity,
  }));
  yield call(() => machineApi.setColorantsFromDb(cnts));
}

function saga_switch_dispid(worker, flinkWorker) {
  return function* (action) {
    switch (action.payload?.dispID) {
      case DISPID_FLINK_DISPENSER: {
        if (flinkWorker) {
          yield* flinkWorker(action);
        }
        return;
      }
      default:
        yield* worker(action);
    }
  };
}

function takeEvery_switch(pattern, worker, flinkWorker) {
  return takeEvery(pattern, saga_switch_dispid(worker, flinkWorker));
}

function takeLatest_switch(pattern, worker, flinkWorker) {
  return takeLatest(pattern, saga_switch_dispid(worker, flinkWorker));
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
    takeLatest(machineActionTypes.FETCH_DRIVER_CONFIG, fetch_driver_config),
    takeLatest(machineActionTypes.CMD_SET_DRIVER_CONFIG, cmd_set_driver_config),
    takeLatest(
      machineActionTypes.FETCH_MACHINES_LIST,
      fetch_combined_machines_list
    ),
    takeLatest_switch(
      machineActionTypes.FETCH_MACHINE_STATE,
      fetch_machine_state
    ),
    takeLatest_switch(
      machineActionTypes.FETCH_MACHINE_CONFIG,
      fetch_machine_config
    ),
    takeLatest_switch(
      machineActionTypes.FETCH_MACHINE_ERROR,
      fetch_machine_error
    ),
    takeLatest_switch(
      machineActionTypes.CLEAR_MACHINE_ERROR,
      clear_machine_error
    ),
    takeLatest_switch(
      machineActionTypes.SET_MACHINE_REFILLS_LIST_SAGA,
      set_machine_refills
    ),
    takeLatest_switch(
      machineActionTypes.SET_MACHINE_REFILLS_BATCH_LIST_SAGA,
      set_machine_refills_batch_list
    ),
    takeLatest_switch(
      machineActionTypes.CMD_SET_MACHINE_CONFIG,
      cmd_set_machine_config
    ),

    takeLatest_switch(
      machineActionTypes.FETCH_MACHINE_REFILLS_LIST,
      fetch_machine_refills
    ),
    takeLatest_switch(
      machineActionTypes.FETCH_MACHINE_BATCH_REFILLS_LIST,
      fetch_machine_batch
    ),
    takeEvery_switch(
      machineActionTypes.FETCH_MACHINE_COLORANTS,
      fetch_machine_colorants
    ),
    takeLatest_switch(
      machineActionTypes.CMD_SET_MACHINE_COLORANTS,
      cmd_set_machine_colorants
    ),
    takeLatest_switch(machineActionTypes.CMD_PURGE, cmd_purge),
    takeLatest_switch(machineActionTypes.CMD_PURGE_ALL, cmd_purge_all),
    takeLatest_switch(
      machineActionTypes.CMD_PURGE_AUTOMATIC_PREPARE,
      cmd_purge_automatic_prepare
    ),
    takeLatest_switch(
      machineActionTypes.CMD_PURGE_AUTOMATIC,
      cmd_purge_automatic
    ),
    takeLatest_switch(machineActionTypes.CMD_BACKUP, cmd_backup),
    takeLatest_switch(machineActionTypes.CMD_STIR, cmd_stir),
    takeLatest_switch(machineActionTypes.CMD_CLEAN, cmd_clean),
    takeLatest_switch(machineActionTypes.CMD_STIR_ALL, cmd_stir_all),
    takeLatest_switch(
      machineActionTypes.CMD_CLEAR_DISPENSER_WARNING,
      cmd_clear_dispenser_warning
    ),
    takeLatest_switch(
      machineActionTypes.CMD_CLEAR_HOPPER_WARNING,
      cmd_clear_hopper_warning
    ),
    takeLatest_switch(machineActionTypes.CMD_CLEAN_ALL, cmd_clean_all),
    takeLatest_switch(machineActionTypes.CMD_MOVE_TO_FILL, cmd_move_to_fill),
    takeLatest_switch(machineActionTypes.CMD_MOVE_TO_HOME, cmd_move_to_home),
    takeEvery_switch(machineActionTypes.CMD_MACHINE_ACTION, cmd_machine_action),

    takeLatest_switch(
      machineActionTypes.CMD_CHECK_FORMULA,
      cmd_check_formula,
      flink.cmd_check_formula
    ),
    takeLatest_switch(machineActionTypes.CMD_TINT, cmd_tint, flink.cmd_tint),
    takeLatest_switch(machineActionTypes.CMD_INITIALIZE, cmd_initialize),
    takeLatest_switch(machineActionTypes.CMD_RESET, cmd_reset),
    takeLatest_switch(machineActionTypes.CMD_CAP, cmd_cap),

    takeLatest(cacheActionTypes.FETCH_CNTS_FULFILLED, fetch_cnts_fulfilled),
    takeLatest_switch(
      machineActionTypes.CHECK_WARNING_BATCH,
      check_warning_batch
    ),

    takeEvery(
      barcodeActionTypes.SET_VALIDATION_STATE,
      barcode_validation_state_change
    ),

    call(watch_machine_state),
    call(watch_resume_interrupted_tint),
  ]);
}

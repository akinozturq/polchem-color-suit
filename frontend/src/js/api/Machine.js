import machineActions from 'js/redux/reducers/Machine';
import errorActions from 'js/redux/reducers/Errors';
import JSONRPC from 'jsonrpc-dispatch';
import { authenticated } from './WebRequest';
import { omitNil } from 'js/mylib/Utils';
import { ERROR_TINTING_MACHINE } from 'js/Constants';

export class MachineAPI {
  constructor() {
    // dummy dispatcher that resolves all calls to null
    this.dispenser = null;
  }

  connect(qtobject, store) {
    // connecting all machine actions here
    try {
      if (qtobject) {
        qtobject.machineState.connect((machinestate) => {
          store.dispatch(machineActions.setMachineState(machinestate));
        });

        this.jsonrpc = new JSONRPC((message) =>
          qtobject.dispatch(JSON.stringify(message))
        );

        qtobject.response.connect((str) =>
          this.jsonrpc.handleResponse(JSON.parse(str))
        );

        try {
          qtobject.machineException.connect((str) => {
            let error = JSON.parse(str);

            store.dispatch(
              errorActions.showCriticalError(
                error.message,
                error,
                ERROR_TINTING_MACHINE
              )
            );
          });
        } catch (e) {
          // The previous version of POS app doesn't export machineException
        }

        // Assume application loaded so fire the purge action
        this.jsonrpc.request('purge_at_program_startup', []);
      }
    } catch (e) {
      console.log('Error in Machine Qt connection');
      console.log(e);
    }
  }

  // Notes:
  // - All methods return promises
  // - dispID must be the first parameter if any parameters are sent; null can be used as placeholder

  machines_list() {
    return this.jsonrpc.request('machines_list', []);
  }

  moveToFill(dispID, canid) {
    return this.jsonrpc.request('move_to_fill', [dispID, canid]);
  }

  moveToHome(dispID) {
    return this.jsonrpc.request('move_to_home', [dispID]);
  }

  getColorants(dispID, getBatches = false) {
    return this.jsonrpc.request('canisters_list', [dispID, getBatches]);
  }

  getConfiguration(dispID) {
    return this.jsonrpc.request('controller_configuration', [dispID]);
  }

  getDriverConfiguration() {
    return this.jsonrpc.request('configuration', []);
  }

  getSupportedCommands(dispID) {
    return this.jsonrpc.request('supported_commands', [dispID]);
  }

  getErrors(dispID) {
    return this.jsonrpc.request('errors_list', [dispID]);
  }

  initialize(dispID) {
    return this.jsonrpc.request('initialize', [dispID]);
  }

  reset(dispID) {
    return this.jsonrpc.request('reset', [dispID]);
  }

  cap(dispID, value) {
    return this.jsonrpc.request('cap', [dispID, value]);
  }

  resetHard(dispID) {
    return this.jsonrpc.request('reset_hard', [dispID]);
  }

  clean(dispID, circuitid) {
    return this.jsonrpc.request('clean', [dispID, circuitid]);
  }

  cleanAll(dispID) {
    return this.jsonrpc.request('clean_all', [dispID]);
  }

  clearErrors(dispID) {
    return this.jsonrpc.request('errors_clean', [dispID]);
  }

  setConfiguration(dispID, config) {
    return this.jsonrpc.request('controller_configuration_set', [
      dispID,
      config,
      true,
      true,
    ]);
  }

  setDriverConfiguration(config) {
    return this.jsonrpc.request('configuration_set', [config]);
  }

  setColorants(dispID, levels) {
    return this.jsonrpc.request('levels_set', [
      dispID,
      convertDatesInLevels(levels),
    ]);
  }

  setColorantsFromDb(cnts) {
    return this.jsonrpc.request('colorants_from_db_set', [cnts]);
  }

  getState(dispID) {
    return this.jsonrpc.request('machine_status', [dispID]);
  }

  getRefillsList(
    dispID,
    canisterIndex,
    startDate,
    endDate,
    startingFrom,
    maxResults
  ) {
    return this.jsonrpc.request('refills_list', [
      dispID,
      canisterIndex,
      startDate,
      endDate,
      startingFrom,
      maxResults,
    ]);
    /**
     * Gets list of all refills

    :param canisterIndex: if present, result contains only canister that equal to this param
    :type canisterIndex: integer

    :param startDate: get orders with timestamp great than
    :type startDate: datetime

    :param endDate: get orders with timestamp less then
    :type endDate: datetime

    :param startingFrom: if present, result contains only items with rowid higher or equal to this param
    :type startingFrom: int

    :param maxResults: the number of results wanted
    :type maxResults: int

    :return: a list of dictionaries
    */
  }

  addRefill(dispID, canisterIndex, volume, batch, refillDate, user, note) {
    return this.jsonrpc.request('refill_add', [
      dispID, // Required
      canisterIndex, // Required
      volume, // Required
      batch,
      refillDate,
      user,
      note,
    ]);

    /**
     * Documentation from chromaflo driver of this function

        :param canisterIndex: index of canister that was refilled
        :type canisterIndex: integer

        :param volume: volume, that was added to canister
        :type volume: unicode

        :param batch: batch number
        :type batch: unicode

        :param refillDate: datetime of refill
        :type refillDate: datetime

        :param user: user
        :type user: unicode

        :param note: note
        :type note: unicode

        :return: None
     */
  }

  addBatchRefill(
    dispID,
    canisterIndex,
    delta,
    currLevel,
    maxLevel,
    batch,
    refillDate,
    expirationDate,
    minVolume
  ) {
    /**
        Updates refill for particular canister


        :param canisterIndex: if present, result contains only canister that equal to this param
        :type canisterIndex: integer

        :param delta: canister change value (can be also negative)
        :type delta: double

        :param currLevel: current level of canister (delta is already included)
        :param currLevel: double

        :param maxLevel: maximum level of canister
        :param maxLevel: double

        :param batch: batch number
        :type batch: unicode

        :param refillDate: datetime of refill
        :type refillDate: datetime

        :param expirationDate: datetime when batch will expire
        :type expirationDate: datetime

        :param minVolume: minimum volume when the batch will no longer taken into consideration
        :type user: unicode

        :return: None
        */
    return this.jsonrpc.request('batch_refill_add', [
      dispID, // Required
      canisterIndex, // Required
      delta,
      currLevel,
      maxLevel,
      batch,
      refillDate,
      expirationDate,
      minVolume,
    ]);
  }

  getBatchRefillsList(dispID, canisterIndex, currLevel) {
    /**
     * Gets list of all refills

        :param canisterIndex: if present, result contains only canister that equal to this param
        :type canisterIndex: integer

        :param currLevel: current level of canister (delta is already included)
        :param currLevel: double

        :return: a list of dictionaries
     */
    return this.jsonrpc.request('batch_refills_list', [
      dispID, // Required
      canisterIndex, // Required
      currLevel,
    ]);
  }

  stir(dispID, canid, time) {
    return this.jsonrpc.request('stir', [dispID, [{ id: canid, time }]]);
  }

  stirAll(dispID, time) {
    return this.jsonrpc.request('stir_all', [dispID, time]);
  }

  clearDispenserWarning(dispID) {
    return this.jsonrpc.request('clear_dispenser_warning', [dispID]);
  }

  clearHopperWarning(dispID) {
    return this.jsonrpc.request('clear_hopper_warning', [dispID]);
  }

  purgeAll(dispID, amount, sequential) {
    return this.jsonrpc.request('purge_all', [dispID, amount, sequential]);
  }

  purgeAutomaticPrepare(dispID) {
    return this.jsonrpc.request('purge_automatic_prepare', [dispID]);
  }

  purgeAutomatic(dispID) {
    return this.jsonrpc.request('purge_automatic', [dispID]);
  }

  backup(dispID, maxsize) {
    return this.jsonrpc.request('backup', [dispID, maxsize]);
  }

  purge(dispID, frm, sequential) {
    return this.jsonrpc.request('purge', [dispID, frm, sequential]);
  }

  machine_action(dispID, machine_action) {
    return this.jsonrpc.request('machine_action', [dispID, machine_action]);
  }

  check_formula(dispID, frm) {
    /**
     * @frm:[{'code': 'FT', 'volume': 12.091},
     *       {'code': 'LT', 'volume': 5.89}, ..]
     */
    return this.jsonrpc.request('check_formula', [dispID, frm]);
  }

  validate_formula(dispID, frm) {
    /**
     * @frm:[{'code': 'FT', 'volume': 12.091},
     *       {'code': 'LT', 'volume': 5.89}, ..]
     */
    return this.jsonrpc.request('validate_formula', [dispID, frm]);
  }

  /**
   * Send tinting command to machine
   * NOTE: check driver_config for supportsConfirmEarly before enabling confirmEarly parameter
   */
  tint(dispID, order, barcodeValidation = false, confirmEarly = false) {
    /**
     * @order: {'productName': 'Test product',
                'cansTinted': 0,
                'lotSize': 3,
                'formula': {'base': 'B',
                            'cnts': [{'code': 'FT', 'volume': 12.091},
                                      {'code': 'LT', 'volume': 5.89},
                                      {'code': 'VT', 'volume': 8.71}]},
                'can': {'name': '1 l',
                        'punch': 1,
                        'shelfPositions': [20, 0, -1]}}
     */
    if (confirmEarly) {
      return this.jsonrpc.request('tint', [
        dispID,
        order,
        false, // sequential = false,
        barcodeValidation,
        false, // setTintingInfo = false
        true, // confirmEarly = true
      ]);
    }
    // Compatibility with old versions of Driver that do not expect 6th parameter
    return this.jsonrpc.request('tint', [
      dispID,
      order,
      false, // sequential = false,
      barcodeValidation,
    ]);
  }

  /*
  get_machine_DB_id(clientid, machineinfo) {
    /**
     * Getting machine database id
     * Deprecated use get_machine_DB instead!
    return authenticated.get(`/query/clientid/${clientid}/machineid/`, {
      params: machineinfo,
    });
  }
  
   */

  get_machine_DB(parameters) {
    /**
     * Getting machine from database
     */

    const { siteid, clientid, ...params } = omitNil(parameters);
    return authenticated.post(
      `/query/site/${siteid}/client/${clientid}/machine`,
      { params }
    );
  }

  set_refills_list(data) {
    return authenticated.post('/rest/refill/', data);
  }

  connected_machines_DB(parameters) {
    /**
     * Sending info to backend which machines are actually connected to driver
     */

    const { siteid, clientid, ...params } = omitNil(parameters);
    return authenticated.post(
      `/query/site/${siteid}/client/${clientid}/connected_machines`,
      { params }
    );
  }

  save_client_data(parameters) {
    const { siteid, ...params } = omitNil(parameters);
    return authenticated.post(`/rest/site/${siteid}/clientdata/`, params);
  }

  save_backup(parameters) {
    const { siteid, dataid, data } = omitNil(parameters);
    // Send data as base64 encoded
    return authenticated.put(
      `/rest/site/${siteid}/clientdata/${dataid}/data`,
      new Blob([data]),
      {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Encoding': 'base64',
        },
      }
    );
  }

  fetch_client_data(parameters) {
    const { siteid, clientid } = omitNil(parameters);
    return authenticated.get(
      `/rest/site/${siteid}/clientdata/?clientid=${clientid}`
    );
  }

  delete_client_data(parameters) {
    const { siteid, dataid } = omitNil(parameters);
    return authenticated.delete(`/rest/site/${siteid}/clientdata/${dataid}`);
  }
}

export function download_client_data(parameters, callback) {
  const { siteid, dataid } = omitNil(parameters);
  return authenticated.get(`/rest/site/${siteid}/clientdata/${dataid}/data`, {
    responseType: 'blob',
    onDownloadProgress: callback,
  });
}

/**
 * Date format conversion needed by levels_set
 * @param {array} levels
 * @returns array
 */
function convertDatesInLevels(levels) {
  return levels.map((canister) => ({
    ...canister,
    refillCans: (canister.refillCans || []).map((refill) => {
      const { date } = refill;
      return {
        ...refill,
        date: date ? date.replace('T', ' ').replace('Z', '') : null,
      };
    }),
  }));
}

const api = new MachineAPI();

export { api as default };

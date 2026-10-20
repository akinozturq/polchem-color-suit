import _ from 'lodash';
import i18next from 'i18next';
import {
  COLORCODE_MAX_LENGTH,
  DISPID_FLINK_DISPENSER,
  FLINK_TYPE_TDF,
  FLINK_TYPE_TDF_GRAVIMETRIC,
  MACHINE_VALIDATE_CNT_MORE_THAN_CANISTER,
  MACHINE_VALIDATE_CRITICAL_LEVEL,
  ORDER_MODE_FREE_DISPENSE,
} from '../../Constants';
import { TOO_MUCH_CNT } from '../../mylib/RulesChecker';
import { selectors as cacheSelectors } from '../reducers/Cache';
import { selectors as configSelectors } from '../reducers/Configuration';
import { selectors as machineSelectors } from '../reducers/Machine';
import { selectors as userSelectors } from '../reducers/User';
import { cnts_to_tint } from '../reducers/Order';
import { commentnotes } from './FormulaComments';

// values for modalsToShow
export const SHOW_SMALL_DOSE_MODAL = 'SMALL_DOSE';
export const SHOW_FORMULA_NOTE_MODAL = 'FORMULA_NOTE';
export const SHOW_IS_PREFILLED_MODAL = 'IS_PREFILLED';

/**
 *
 * @param {*} state Redux root state
 * @returns {allow_dispense: boolean, allow_save: boolean, dispense_note: string[]}
 */
export function readyToDispense(state) {
  const { order } = state;
  const priority_init_pending = cacheSelectors.priority_init_pending(state);

  if (priority_init_pending || order.item.cnts == null) {
    return { allow_dispense: false, allow_save: false, dispense_note: [] };
  }

  const config_values = configSelectors.config_values(state);
  const dispID = machineSelectors.current_dispID(state);
  const machine = machineSelectors.current_machine(state);
  const isMachineMissing = machineSelectors.isMachineMissing(state);
  const t = i18next.t;

  let dispense_note = [];
  let allow_save = true;
  if (dispID != null && order.engine_validation != null) {
    if (
      [
        MACHINE_VALIDATE_CNT_MORE_THAN_CANISTER,
        MACHINE_VALIDATE_CRITICAL_LEVEL,
      ].includes(order.engine_validation)
    ) {
      if (!machine?.config?.formula_splitting) {
        if (order.base_check?.warn === order.engine_validation)
          dispense_note.push(
            t(
              'msg.formulaMachineNotEnoughtBase',
              'Formula requires too much base'
            )
          );
        else
          dispense_note.push(
            t(
              'msg.formulaMachineNotEnoughtColorant',
              'Formula requires too much colorant'
            )
          );
      }
    } else {
      const is_valid =
        order.engine_validation < MACHINE_VALIDATE_CRITICAL_LEVEL ||
        machine?.config?.remove_incompatible_colorants;
      if (!is_valid)
        dispense_note.push(
          t(
            'msg.formulaMachineIncompatible',
            'Formula is invalid for the tinting machine'
          )
        );
    }
  }
  // Checking if customer data is given and allow dispense
  if (
    config_values.force_customer_data &&
    order.order_mode !== ORDER_MODE_FREE_DISPENSE
  ) {
    if (!order.customer) {
      dispense_note.push(
        t('msg.customerInfoMissing', 'Please add customer information')
      );
    }
  }

  const error_overfill =
    order.formula?.rules?.violations?.includes(TOO_MUCH_CNT);
  if (error_overfill) {
    allow_save = false;
    dispense_note.push(t('frm.overfill', 'Over fill detected'));
  }

  if (config_values.prevent_formulas_breaking_rules) {
    const break_rules =
      order.formula?.rules &&
      (order.formula.rules.violations.length > 0 ||
        order.formula.rules.cnt_violations.length > 0);
    if (break_rules) {
      allow_save = false;
      dispense_note.push(t('frm.break_rules', 'Formula breaks rules'));
    }
  }

  if (config_values.prevent_tinting_below_minshot) {
    const hasSmallDose = cnts_to_tint(order)?.find(
      (cnt) => (machine?.config?.minimum_dosable_amount || 0) > cnt.volume
    );
    if (hasSmallDose) {
      allow_save = false;
      dispense_note.push(t('lbl.small_dose_warning', 'Small dose warning'));
    }
  }

  // Check colorants valid.
  if (
    machine &&
    !machine.config?.remove_incompatible_colorants &&
    _.difference(
      order?.formula?.cntinformula.map((x) => x.cntcode),
      machine.colorants?.map((y) => y.code)
    ).length > 0
  ) {
    dispense_note.push(
      t(
        'frm.colorants_not_in_machine',
        'Formula colorants are not in tinting machine'
      )
    );
  }

  if (!machine) {
    dispense_note.push(
      isMachineMissing == null
        ? t(
            'msg.waitingForMachineInit',
            'Waiting for tinting machine initialization'
          )
        : t('lbl.dispenserNotConnected')
    );
  }

  if (order.item.colourcode?.length > COLORCODE_MAX_LENGTH) {
    allow_save = false;
    dispense_note.push(
      t('frm.tooLongColorCode', 'Formula too long color code')
    );
  }

  const allow_dispense =
    !dispense_note.length &&
    order.item.ncans > 0 &&
    userSelectors.has_privilege(state, 'order_tinting_start');

  return { allow_dispense, allow_save, dispense_note };
}

export function preDispenseModals(state) {
  const machine = machineSelectors.current_machine(state);
  if (!machine) {
    return {};
  }

  const { order } = state;
  const config_values = configSelectors.config_values(state);
  const dispID = machineSelectors.current_dispID(state);
  const { config } = machine;

  const modalsToShow = [];

  if (config_values.show_formula_note_in_popup && commentnotes(state)) {
    modalsToShow.push(SHOW_FORMULA_NOTE_MODAL);
  }

  const hasSmallDose = cnts_to_tint(order).find(
    (cnt) => (config?.minimum_dosable_amount || 0) > cnt.volume
  );
  if (hasSmallDose) {
    modalsToShow.push(SHOW_SMALL_DOSE_MODAL);
  }

  if (
    dispID === DISPID_FLINK_DISPENSER &&
    [FLINK_TYPE_TDF, FLINK_TYPE_TDF_GRAVIMETRIC].includes(
      config_values.flink_dispenser_type
    ) &&
    config_values.flink_tdf_ask_if_prefilled
  ) {
    modalsToShow.push(SHOW_IS_PREFILLED_MODAL);
    // NOTE: this modal must be last, now that Yes button starts dispensing
  }
  return modalsToShow;
}

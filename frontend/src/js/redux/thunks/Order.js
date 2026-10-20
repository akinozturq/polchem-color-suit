import i18n from 'js/localization/i18n';
import _ from 'lodash';

import {
  merge_original_volumes,
  scale_to_can,
  update_extender_volume_from_redux,
} from 'js/mylib/Formula';

import { ORDER_MODE_FREE_DISPENSE } from '../../Constants';
import { get_cnt_for_product } from '../../mylib/Product';
import { CheckRules } from '../../mylib/RulesChecker';
import { selectors as cacheSelectors } from '../reducers/Cache';
import { selectors as configSelectors } from '../reducers/Configuration';
import errorActions from '../reducers/Errors';
import formulaActions from '../reducers/Formula';
import actions, {
  actionTypes,
  selectors as orderSelectors,
} from '../reducers/Order';

function setFormula(action) {
  const { formula, isInitial } = action.payload;
  return (dispatch, getState) => {
    let state = getState();

    let augmented_formula = null;
    let base = null;
    if (formula) {
      const product = orderSelectors.product(state);
      // set base if baseid is defined
      if (formula.baseid != undefined) {
        base = _.find(product.basepaints, (x) => x.baseid === formula.baseid);

        if (base === undefined) {
          // Base not found by baseid. --> different product so need to look via abstract base...

          const products = cacheSelectors.products(state);
          const bases = _.map(products, (prod) => {
            return prod.basepaints;
          }).flat();

          const tmp = _.find(bases, (x) => x.baseid === formula.baseid);

          base = _.find(product.basepaints, (x) => x.abaseid === tmp.abaseid);
        }
        dispatch({ type: actionTypes.SET_BASE, payload: base });
      }

      // Replace formula comment with product specific comment if enabled and not null
      const { pcomment, ...rest } = formula;
      const fcomment =
        product?.usepcomment && pcomment != null ? pcomment : formula.fcomment;

      // add colorant data
      const cntmap = cacheSelectors.cntmap(state);

      const cntinformula = formula.cntinformula.map(({ cntid, volume }) => ({
        ...get_cnt_for_product(cntid, cntmap, product),
        cntid,
        volume,
      }));

      augmented_formula = { ...rest, fcomment, cntinformula };
      if (product && base?.baseid) {
        augmented_formula.rules = CheckRules(
          product,
          base,
          augmented_formula,
          configSelectors.config_values(state).enable_overfill_checking
        );
      }
    }
    dispatch({
      type: actionTypes.SET_FORMULA_FULFILLED,
      payload: augmented_formula,
    });
    if (isInitial) {
      // Set initial formula = original formula = augmented_formula
      // to include sg in initial and original formulas
      dispatch(actions.setOriginalFormula(augmented_formula));
    }

    // Set default can
    state = getState();
    const { default_can_size } = configSelectors.config_values(state);
    if (default_can_size && base && !orderSelectors.can(state)) {
      const can = base.cans.find((x) => x.cansizecode === default_can_size);
      if (can) {
        dispatch(actions.setCan(can));
      }
    }

    dispatch(formulaActions.choosePrimer());
  };
}

function setCan(action) {
  return (dispatch, getState) => {
    let { can, update_extender } = action.payload;

    // Need to update the formula colorant amounts according to the selected can
    // Also run validation here
    // check also that the machine is connected before calling

    try {
      // If can has wrong baseid, try to find can by cansizeid
      const base = orderSelectors.base(getState());
      if (base && can) {
        if (can.baseid !== base.baseid) {
          can = base.cans.find((x) => x.cansizeid === can.cansizeid) || null;
        }
      }
      dispatch({ type: actionTypes.SET_CAN, payload: { can } });
      const state = getState();

      // scale the formula
      const frm = orderSelectors.formula(state);

      let cnts = null;
      const mode = orderSelectors.order_mode(state);
      // Handle free dispense differently!
      if (mode === ORDER_MODE_FREE_DISPENSE) {
        cnts = frm && frm.cntinformula;
      } else {
        // Normal tinting
        if (frm && base && can) {
          const initial_formula = orderSelectors.initial_formula(state);
          const original_formula = orderSelectors.original_formula(state);
          const formulaCorrectionScalingFactor =
            orderSelectors.formulaCorrectionScalingFactor(state);
          if (original_formula) {
            const initial_cnts = scale_to_can(
              initial_formula.cntinformula,
              base,
              can
            );
            const original_cnts = scale_to_can(
              original_formula.cntinformula,
              base,
              can
            );

            cnts = merge_original_volumes(
              scale_to_can(frm.cntinformula, base, can),
              initial_cnts,
              original_cnts,
              formulaCorrectionScalingFactor
            );
          } else {
            cnts = scale_to_can(frm.cntinformula, base, can);
          }
          if (update_extender) {
            cnts = update_extender_volume_from_redux(cnts, state);
          }
        }
      }

      dispatch({ type: actionTypes.SET_SCALED_CNTS, payload: cnts });
    } catch (e) {
      dispatch(
        errorActions.showCriticalError(
          i18n.t('msg.errorWhileSettingCan', 'Error while setting can'),
          e
        )
      );
    }
  };
}

// Connect action types here:
const thunks = [
  [actionTypes.SET_FORMULA, setFormula],
  [actionTypes.SET_CAN, setCan],
];

export default thunks;

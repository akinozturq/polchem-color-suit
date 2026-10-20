import {
  all,
  call,
  put,
  select,
  takeEvery,
  take,
  takeLatest,
  actionChannel,
  cancel,
  fork,
} from 'redux-saga/effects';
import FormulaAPI, {
  CHOOSE_PRIMER_LOOK_UP_AND_CALCULATE,
  CHOOSE_PRIMER_LOOK_UP_ONLY,
} from '../../api/Formula.js';
import { selectors as configSelectors } from '../reducers/Configuration';
import {
  selectors as machineSelectors,
  actionTypes as machineActionTypes,
} from '../reducers/Machine.js';
import {
  actionTypes,
  selectors as formulaSelectors,
} from '../reducers/Formula';
import orderActions, {
  actionTypes as orderActionTypes,
  selectors as orderSelectors,
} from '../reducers/Order';
import { selectors as spectroSelectors } from '../reducers/Spectro';
import {
  waitForConfig,
  waitForConfigValues,
  waitForIsPro,
  waitForSite,
  waitForZone,
} from './Configuration';
import WebRequest from './WebRequest';
import { INFO_CARD, MATCH_SEARCH } from 'js/Constants';
import i18n from 'js/localization/i18n';
import errorActions from 'js/redux/reducers/Errors';
import _ from 'lodash';
import busyActions from '../reducers/Busy';
import { offline_mode } from '../../Constants';
import { selectors as orderQueueSelectors } from '../reducers/OrderQueue.js';
import { selectors as cacheSelectors } from '../reducers/Cache.js';

function* searchColors(action) {
  yield put({ type: actionTypes.FETCH_COLORS_PENDING });

  const zone = yield call(waitForZone);
  const card = yield select(orderSelectors.card);
  const site = yield select(configSelectors.site);
  const product = yield select(orderSelectors.product);
  const productid = product ? product.productid : null;
  const colourcardid = card ? card.colourcardid : null;
  const colorSearchMode = yield select(orderSelectors.color_search_mode);

  const config_values = yield call(waitForConfigValues);
  const { search_by_both_color_codes, unique_color_codes = true } =
    config_values;

  let search = action.payload;
  if (search === null) {
    search = yield select(formulaSelectors.color_search_str);
  }

  try {
    const response = yield call(
      WebRequest,
      productid == null
        ? // any colors
          FormulaAPI.searchColors(
            zone.zoneid,
            colourcardid,
            search,
            unique_color_codes,
            search_by_both_color_codes
          )
        : colorSearchMode === MATCH_SEARCH
          ? FormulaAPI.searchColorsForMatching(
              site.systemgroupid,
              zone.zoneid,
              productid,
              colourcardid,
              search,
              unique_color_codes,
              search_by_both_color_codes
            )
          : // colors having formulas
            FormulaAPI.searchColorsForProduct(
              site.systemgroupid,
              zone.zoneid,
              productid,
              colourcardid,
              search,
              unique_color_codes,
              search_by_both_color_codes
            )
    );
    let colors = response ? response.data : [];
    // Do the swap for code and name here
    const swap = config_values.color_code_name_swap;

    // If not unique color codes then show the alternatives if available
    colors = colors.map((color) => ({
      ...color,
      colourcode: unique_color_codes
        ? color.colourcode
        : color.altcolourcode || color.colourcode,
      uniquecode: color.colourcode,
    }));

    if (swap) {
      colors = colors.map((color) => ({
        ...color,
        colourcode:
          color.colournames.length > 0
            ? color.colournames[0]
            : color.colourcode,
        colournames: color.colournames.length > 0 ? [color.colourcode] : [],
      }));
    }

    sortColors(colors, search);

    // send returned object back to reducer as payload:
    yield put({
      type: actionTypes.FETCH_COLORS_FULFILLED,
      payload: { data: colors, search: search },
    });
  } catch (e) {
    yield put({ type: actionTypes.FETCH_COLORS_REJECTED, payload: e });
  }
}

/** Sort colors in-place based on the start with. First sorted based on color code then based on color name
 * #6938
 *
 * @param {array} colors
 * @param {string} search
 */
function sortColors(colors, search) {
  if (search) {
    const collator = new Intl.Collator('en', { sensitivity: 'base' }); // trying to simulate MariaDb generic collation
    const prefixMatch = (s) =>
      collator.compare(search, s.slice(0, search.length)) === 0;
    const sortKey = (color) => {
      if (prefixMatch(color.colourcode)) {
        return '1'; // 1st group in results, already sorted by code
      }
      for (const name of color.colournames) {
        if (prefixMatch(name)) {
          return '2' + name; // 2nd group, sort by the matching name
        }
      }
      return '3'; // 3rd group, already sorted by code
    };
    colors.sort((a, b) => collator.compare(sortKey(a), sortKey(b)));
  }
}

function* fetchCardsForProduct(action) {
  const zone = yield call(waitForZone);
  const site = yield select(configSelectors.site);
  const productid = action.payload;
  try {
    if (productid) {
      yield put({ type: actionTypes.FETCH_PRODUCT_CARDS_PENDING });
      const response = yield call(
        WebRequest,
        FormulaAPI.cardsForProduct(site.systemgroupid, zone.zoneid, productid)
      );

      // send returned object back to reducer as payload:
      yield put({
        type: actionTypes.FETCH_PRODUCT_CARDS_FULFILLED,
        payload: response.data,
      });
    } else {
      yield put({
        type: actionTypes.FETCH_PRODUCT_CARDS_FULFILLED,
        payload: null,
      });
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCH_PRODUCT_CARDS_REJECTED, payload: e });
  }
}

function* fetchProductsWithFormulas() {
  yield put({ type: actionTypes.FETCH_PROD_WITH_FORMULA_PENDING });

  const zone = yield call(waitForZone);
  const site = yield select(configSelectors.site);
  const color = yield select(orderSelectors.color);
  const colourid = color ? color.colourid : null;
  try {
    let payload = null;
    if (colourid != null) {
      const response = yield call(
        WebRequest,
        FormulaAPI.searchProducts(site.systemgroupid, zone.zoneid, colourid)
      );
      payload = response ? response.data : {};
    }
    // send returned object back to reducer as payload:
    yield put({
      type: actionTypes.FETCH_PROD_WITH_FORMULA_FULFILLED,
      payload,
    });
  } catch (e) {
    yield put({
      type: actionTypes.FETCH_PROD_WITH_FORMULA_REJECTED,
      payload: e,
    });
  }
}

function* findCompatibleFormula(frms, dispID) {
  let formula = frms[0];
  if (formula) {
    const machine = yield select(machineSelectors.machine, dispID);
    const machineCntIds = new Set(
      machine?.colorants?.filter((x) => x.enabled).map((c) => c.cntid) || []
    );

    // Check if all colorant ids in the formula are present in the machine
    const formulaCntIds = formula.cntinformula.map((c) => c.cntid);
    const allCntsInMachine = formulaCntIds.every((cntid) =>
      machineCntIds.has(cntid)
    );
    if (!allCntsInMachine) {
      // Try to find a fallback formula that is not an alternative
      const fallback = frms.find((f) => f.isfallback && !f.isalternative);
      if (fallback) {
        const fallbackCntIds = fallback.cntinformula.map((c) => c.cntid);
        const fallbackAllCntsInMachine = fallbackCntIds.every((cntid) =>
          machineCntIds.has(cntid)
        );
        // Ok to pick this formula into use
        if (fallbackAllCntsInMachine) {
          formula = fallback;
        }
      }
    }
  }
  return formula;
}

function* machineChanged(action) {
  try {
    const frms = yield select(formulaSelectors.frms);
    if (frms.length > 0) {
      const formula = yield* findCompatibleFormula(
        frms,
        action.payload?.dispID
      );

      const original_frm = yield select(orderSelectors.initial_formula);
      if (
        formula.baseid !== original_frm.baseid ||
        !_.isEqual(
          formula.cntinformula,
          original_frm.cntinformula.map((c) => ({
            cntid: c.cntid,
            volume: c.volume,
          }))
        )
      ) {
        yield put(orderActions.setFormula(formula, true));
        // In case of being in INFO page load the can selectd for order
        const open_section = yield select(orderSelectors.open_section);
        if (open_section === INFO_CARD) {
          const can = action.payload.can || (yield select(orderSelectors.can));
          // Load the can selected for order
          yield put(orderActions.setCan(can));
        }
      }
    }
  } catch (e) {
    yield put(
      errorActions.showCriticalError(
        i18n.t(
          'msg.unableToDeleteLocalFormula',
          'Unable to delete local formula'
        ),
        e
      )
    );
  }
}

function* loadFormula(action) {
  try {
    yield put({ type: actionTypes.FETCH_FORMULA_PENDING });
    const site = yield select(configSelectors.site);
    const response = yield call(
      WebRequest,
      FormulaAPI.loadFormula(site.systemgroupid, action.payload)
    );
    // Add productid and colourid to formulas
    const { productid, colourid } = action.payload;
    const frms = (response?.data || []).map((x) => ({
      ...x,
      productid,
      colourid,
    }));

    // send returned object back to reducer as payload:
    yield put({ type: actionTypes.FETCH_FORMULA_FULFILLED, payload: frms });

    // ensure that selected formula is not from history
    if (frms.length > 0 && !frms[0].ishistory) {
      // Check if there is fallback formula available and if it should be used instead

      const dispID = yield select(machineSelectors.current_dispID);

      const formula = yield* findCompatibleFormula(frms, dispID);

      yield put(orderActions.setFormula(formula, true));
      const open_section = yield select(orderSelectors.open_section);
      if (open_section === INFO_CARD) {
        const can = action.payload.can || (yield select(orderSelectors.can));
        yield put(orderActions.setCan(can));
      }
    } else {
      yield put(orderActions.clearFormula());
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCH_FORMULA_REJECTED, payload: e });
  }
}
function* searchLocalFormulas(action) {
  try {
    yield put({ type: actionTypes.FETCH_LOCAL_FORMULA_PENDING });

    const zone = yield call(waitForZone);
    const site = yield call(waitForSite);
    const response = yield call(
      WebRequest,
      FormulaAPI.searchLocalFormulas(zone.zoneid, site.siteid, action.payload)
    );

    const frms = response ? response.data : [];

    yield put({
      type: actionTypes.FETCH_LOCAL_FORMULA_FULFILLED,
      payload: frms,
    });
  } catch (e) {
    yield put({ type: actionTypes.FETCH_LOCAL_FORMULA_REJECTED, payload: e });
  }
}

function* hideLocalFormula(action) {
  try {
    const site = yield call(waitForSite);
    yield call(
      WebRequest,
      FormulaAPI.hideLocalFormula(site.siteid, action.payload)
    );
  } catch (e) {
    yield put(
      errorActions.showCriticalError(
        i18n.t(
          'msg.unableToDeleteLocalFormula',
          'Unable to delete local formula'
        ),
        e
      )
    );
  }
}

/** Use channel to handle search and hide actions so that
 * search action is blocked by hide action.
 */
function* watchLocalFormula() {
  let searchTask;
  const channel = yield actionChannel([
    actionTypes.FETCH_LOCAL_FORMULA,
    actionTypes.HIDE_LOCAL_FORMULA,
  ]);
  while (true) {
    const action = yield take(channel);
    if (searchTask) {
      // cancel previous search task like takeLatest does
      yield cancel(searchTask);
      searchTask = null;
    }
    switch (action.type) {
      case actionTypes.FETCH_LOCAL_FORMULA:
        searchTask = yield fork(searchLocalFormulas, action);
        break;
      case actionTypes.HIDE_LOCAL_FORMULA:
        yield call(hideLocalFormula, action); // blocks
    }
  }
}

function* synthesizeRgb(action) {
  try {
    const is_pro = yield call(waitForIsPro);
    const { systemgroupid } = yield call(waitForSite);
    const product = yield select(orderSelectors.product);
    const formula = action.payload?.formula
      ? action.payload?.formula
      : yield select(orderSelectors.formula);
    let rgb = null;
    if (
      !offline_mode &&
      is_pro &&
      product?.has_matching &&
      formula?.baseid != null &&
      formula?.cntinformula
    ) {
      const { zoneid } = yield call(waitForZone);
      const response = yield call(
        WebRequest,
        FormulaAPI.matchingSynthesizeRgb(
          zoneid,
          systemgroupid,
          product.productid,
          formula
        )
      );
      rgb = response.data;
    }
    if (action.payload.before) {
      yield put({ type: orderActionTypes.SET_RGB_BEFORE_EDIT, payload: rgb });
    }
    yield put({ type: orderActionTypes.SET_RGB, payload: rgb });
  } catch (e) {
    yield put(errorActions.showCriticalError(e.message, e));
  }
}

function* searchClosest(action) {
  try {
    yield put({ type: actionTypes.SEARCH_CLOSEST_PENDING });
    const zone = yield call(waitForZone);
    const site = yield call(waitForSite);
    const config_values = yield call(waitForConfigValues);
    const { lab, productid, can, colourid, coldataclass, refl, colourcardid } =
      action.payload;
    const { cansizeid, nominalamount, gravimetric } = can;
    const response = yield call(
      WebRequest,
      FormulaAPI.matchingSearchClosest(
        zone.zoneid,
        site.siteid,
        refl,
        lab,
        productid,
        cansizeid,
        nominalamount,
        gravimetric,
        colourid,
        coldataclass,
        config_values.closest_color_max_de,
        config_values.de_function_index_v4,
        config_values.closest_color_max_results,
        colourcardid,
        site.systemgroupid,
        config_values.closest_color_preferred_cards_only
      )
    );

    let { data } = response;
    let { matches } = data;
    if (config_values.color_code_name_swap) {
      matches = data.matches.map((color) => ({
        ...color,
        colourcode:
          color.colournames.length > 0
            ? color.colournames[0]
            : color.colourcode,
        colournames: color.colournames.length > 0 ? [color.colourcode] : [],
      }));
    }
    // Add ids to formulas
    data = {
      ...data,
      matches: matches.map((x) => ({
        ...x,
        formula: { ...x.formula, colourid: x.colourid, productid },
      })),
    };

    yield put({
      type: actionTypes.SEARCH_CLOSEST_FULFILLED,
      payload: data,
    });
  } catch (e) {
    yield put({ type: actionTypes.SEARCH_CLOSEST_REJECTED, payload: e });
  }
}

function* matchFormula(action) {
  try {
    yield put({ type: actionTypes.MATCH_FORMULA_PENDING });
    const zone = yield call(waitForZone);
    const site = yield call(waitForSite);
    const config = yield select(configSelectors.config_values);

    const { refl, productid, can, baseids, template, cntids } = action.payload;
    const { cansizeid, nominalamount, gravimetric } = can;
    const response = yield call(
      WebRequest,
      FormulaAPI.matchingMatch(
        zone.zoneid,
        site.systemgroupid,
        site.siteid,
        refl,
        productid,
        cansizeid,
        nominalamount,
        gravimetric,
        template || config.default_matching_template,
        baseids,
        cntids, // cntids array, or null,
        config.color_match_max_results,
        config.color_match_max_de,
        config.de_function_index_v4
      )
    );

    yield put({
      type: actionTypes.MATCH_FORMULA_FULFILLED,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: actionTypes.MATCH_FORMULA_REJECTED, payload: e });
    if (e?.response?.status !== 409) {
      yield put(
        errorActions.showCriticalError(
          i18n.t('msg.unableToMatchFormulas', 'Unable to match formulas'),
          e
        )
      );
    }
  }
}

function* correctFormula() {
  try {
    yield put(busyActions.setBusy(true));
    yield put({ type: actionTypes.CORRECT_FORMULA_PENDING });
    const { zoneid } = yield call(waitForZone);
    const { siteid, systemgroupid } = yield call(waitForSite);
    const {
      can: { cansizeid, nominalamount, gravimetric },
      color: { reflectance },
      formula,
      product: { productid },
    } = yield select(orderSelectors.order);
    const batchrefl = (yield select(spectroSelectors.measurement_paint)).refl;
    const measured_target = yield select(spectroSelectors.measurement_target);
    const stdrefl =
      measured_target?.refl || reflectance?.rinf || reflectance?.rw;
    const { default_matching_template, de_function_index_v4 } = yield select(
      configSelectors.config_values
    );
    const response = yield call(
      WebRequest,
      FormulaAPI.matchingCorrectFormula(
        zoneid,
        systemgroupid,
        siteid,
        productid,
        cansizeid,
        nominalamount,
        gravimetric,
        formula,
        stdrefl,
        batchrefl,
        default_matching_template,
        de_function_index_v4
      )
    );
    yield put({
      type: actionTypes.CORRECT_FORMULA_FULFILLED,
      payload: response.data,
    });
    yield put(busyActions.setBusy(false));
  } catch (e) {
    yield put({ type: actionTypes.CORRECT_FORMULA_REJECTED, payload: e });
    yield put(busyActions.setBusy(false));
  }
}

function* choosePrimer() {
  try {
    const is_pro = yield call(waitForIsPro);

    const config_values = yield call(waitForConfigValues);
    const enable_primer = !!config_values.enable_primer;
    const { primer_use_matching_engine } = config_values;

    const order = yield select(orderSelectors.order);
    const { product, formula } = order;

    if (
      !is_pro ||
      !enable_primer ||
      !product ||
      !formula ||
      product.primercardid == null
    ) {
      yield put({
        type: actionTypes.CHOOSE_PRIMER_REJECTED,
        payload: { is_pro, enable_primer },
      });
      return; // Only in pro version
    }

    if (order.orderid) {
      // If order is already saved and has primer color, skip choosing primer
      const local_queue = yield select(orderQueueSelectors.local_queue);
      const queue_order = local_queue.find((x) => x.orderid === order.orderid);
      if (
        queue_order?.orderitems.find(
          (x) => x.parentitemid === order.item.itemid
        )
      ) {
        return;
      }
    }

    yield put({ type: actionTypes.CHOOSE_PRIMER_PENDING });
    const { zoneid } = yield call(waitForZone);
    const { systemgroupid } = yield call(waitForSite);

    const colourid = order.color?.colourid;
    const productid = product.productid;

    const response = yield call(
      WebRequest,
      FormulaAPI.choosePrimer({
        systemgroupid,
        zoneid,
        productid,
        colourid,
        formula: {
          baseid: formula.baseid,
          cntinformula: formula.cntinformula.map((c) => ({
            cntid: c.cntid,
            volume: c.volume,
          })),
        },
        primer_mode: primer_use_matching_engine
          ? CHOOSE_PRIMER_LOOK_UP_AND_CALCULATE
          : CHOOSE_PRIMER_LOOK_UP_ONLY,
      })
    );

    const primer_color = response.data?.colourid != null ? response.data : null;

    if (primer_color?.productid) {
      // Ensure that product is available for this site
      const product = yield select(
        cacheSelectors.getProduct,
        primer_color.productid
      );
      if (!product) {
        yield put(
          errorActions.showError(
            i18n.t('msg.primerProductNotFound', 'Primer product not found'),
            null,
            i18n.t(
              'msg.primerProductNotFoundReason',
              'Primer product is not available for this site. Please check your configuration.'
            )
          )
        );
        yield put({
          type: actionTypes.CHOOSE_PRIMER_REJECTED,
          payload: {
            primer_color,
            msg: 'Primer product not available for site',
          },
        });
        return;
      }
    }

    // Use alternative colourcode if set to use it in the configuration
    const { color_code_name_swap, unique_color_codes = true } = config_values;

    let colourcode = unique_color_codes
      ? primer_color.colourcode
      : primer_color.altcolourcode || primer_color.colourcode;

    if (primer_color.colournames?.length && color_code_name_swap) {
      colourcode = primer_color.colournames[0];
    }

    yield put({
      type: actionTypes.CHOOSE_PRIMER_FULFILLED,
      payload: {
        ...primer_color,
        colourcode: colourcode,
        uniquecode: primer_color.colourcode,
      },
    });
  } catch (e) {
    yield put({ type: actionTypes.CHOOSE_PRIMER_REJECTED, payload: e });
  }
}

function* fetchFormulaChanges() {
  try {
    yield put({ type: actionTypes.FETCH_FORMULA_CHANGES_PENDING });
    const { zoneid } = yield call(waitForZone);
    const { systemgroupid } = yield call(waitForSite);

    const response = yield call(
      WebRequest,
      FormulaAPI.formulaChanges({
        systemgroupid,
        zoneid,
      })
    );

    yield put({
      type: actionTypes.FETCH_FORMULA_CHANGES_FULFILLED,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: actionTypes.FETCH_FORMULA_CHANGES_REJECTED, payload: e });
  }
}

function* fetchColorDetails(action) {
  try {
    yield put({ type: actionTypes.FETCH_COLOR_DETAILS_PENDING });

    const zone = yield call(waitForZone);
    const response = yield call(
      WebRequest,
      FormulaAPI.fetchColorDetails(zone.zoneid, action.payload.colourid)
    );

    let data = response.data;
    const config = yield call(waitForConfig);
    const swap = _.get(config, 'color_code_name_swap.value', false);
    const unique_color_codes = _.get(config, 'unique_color_codes.value', true);

    // If not unique color codes then show the alternatives if available
    data = {
      ...data,
      colourcode: unique_color_codes
        ? data.colourcode
        : data.altcolourcode || data.colourcode,
      uniquecode: data.colourcode,
    };

    if (swap) {
      data = {
        ...data,

        colourcode:
          data.colournames.length > 0 ? data.colournames[0] : data.colourcode,
        colournames: data.colournames.length > 0 ? [data.colourcode] : [],
      };
    }

    yield put({
      type: actionTypes.FETCH_COLOR_DETAILS_FULFILLED,
      payload: data,
    });

    yield put({
      type: orderActionTypes.SET_COLOR_DETAILS,
      payload: data,
    });
  } catch (e) {
    yield put({ type: actionTypes.FETCH_COLOR_DETAILS_REJECTED, payload: e });
    yield put(
      errorActions.showCriticalError(
        i18n.t(
          'msg.unableToFetchColorDetails',
          'Unable to fetch color details'
        ),
        e
      )
    );
  }
}

function* fetchLocalFormulaCompatibleProducts(action) {
  try {
    yield put({ type: actionTypes.FETCH_COMPATIBLE_LOCALFRM_PROD_PENDING });
    const { itemid } = action.payload;
    if (itemid) {
      const zone = yield call(waitForZone);
      const response = yield call(
        WebRequest,
        FormulaAPI.loadCompatibleLocalFormula(
          zone.zoneid,
          itemid,
          action.payload.baseid
        )
      );
      yield put({
        type: actionTypes.FETCH_COMPATIBLE_LOCALFRM_PROD_FULFILLED,
        payload: response.data.map((x) => ({ ...x, itemid })),
      });
    } else {
      // No itemid available --> completely new local formula
      yield put({
        type: actionTypes.FETCH_COMPATIBLE_LOCALFRM_PROD_FULFILLED,
        payload: [],
      });
    }
  } catch (e) {
    yield put({
      type: actionTypes.FETCH_COMPATIBLE_LOCALFRM_PROD_REJECTED,
      payload: e,
    });
    yield put(
      errorActions.showCriticalError(
        i18n.t(
          'msg.unableToLoadCompatibleLocalFormulas',
          'Unable to load compatible local formulas'
        ),
        e
      )
    );
  }
}

export default function* saga() {
  yield all([
    call(watchLocalFormula),
    takeLatest(actionTypes.FETCH_COLORS, searchColors),
    takeLatest(actionTypes.FETCH_PRODUCT_CARDS, fetchCardsForProduct),

    takeLatest(actionTypes.FETCH_FORMULA, loadFormula),
    takeLatest(actionTypes.FETCH_PROD_WITH_FORMULA, fetchProductsWithFormulas),
    takeLatest(
      actionTypes.FETCH_COMPATIBLE_LOCALFRM_PROD,
      fetchLocalFormulaCompatibleProducts
    ),
    takeEvery(actionTypes.SYNTHESIZE_RGB_BEFORE_EDIT, synthesizeRgb),
    takeLatest(actionTypes.SYNTHESIZE_RGB, synthesizeRgb),
    takeLatest(actionTypes.SEARCH_CLOSEST, searchClosest),
    takeLatest(actionTypes.MATCH_FORMULA, matchFormula),
    takeLatest(actionTypes.CORRECT_FORMULA, correctFormula),
    takeLatest(actionTypes.CHOOSE_PRIMER, choosePrimer),
    takeLatest(actionTypes.FETCH_COLOR_DETAILS, fetchColorDetails),
    takeLatest(actionTypes.FETCH_FORMULA_CHANGES, fetchFormulaChanges),
    takeLatest(machineActionTypes.SET_CURRENT_MACHINE, machineChanged),
  ]);
}

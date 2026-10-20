import {

  all,

  call,

  delay,

  put,

  race,

  select,

  take,

  takeEvery,

  takeLatest,

} from 'redux-saga/effects';

import ConfigurationsAPI from 'js/api/Configuration';

import configActions, {

  actionTypes,

  selectors,

} from '../reducers/Configuration';

import cacheActions, {

  actionTypes as cacheActionTypes,

  selectors as cacheSelectors,

} from '../reducers/Cache';

import { fulfilled, rejected } from '../factories/ApiCall';

import WebRequest from './WebRequest';

import busyActions from 'js/redux/reducers/Busy';

import offlineActions from 'js/redux/reducers/Offline';

import errorActions from 'js/redux/reducers/Errors';

import protectionActions, {

  actionTypes as protectionActionTypes,

  selectors as protectionSelectors,

} from 'js/redux/reducers/Protection';

import orderActions from 'js/redux/reducers/Order';

import inventoryActions from 'js/redux/reducers/Inventory';

import formulaActions from 'js/redux/reducers/Formula';

import i18n from 'js/localization/i18n';

import loginActions from 'js/redux/reducers/Login';

import userActions, {

  selectors as userSelectors,

} from 'js/redux/reducers/User';

import { actionTypes as machineActionTypes } from 'js/redux/reducers/Machine';

import { actionTypes as updateActionTypes } from 'js/redux/reducers/UpdateChecker';

import _ from 'lodash';

import { LOCATION_CHANGE, push, getLocation } from 'connected-react-router';

import {

  ADD_TYPE_SPLASH,

  FEATURE_PRO,

  FORMULA_INPUT_CARD,

  ORDER_MODE_FREE_DISPENSE,

  ORDER_MODE_LOCAL_FORMULA,

  ORDER_MODE_MATCHING,

} from 'js/Constants';

import {

  IT3_LANGUAGE_TO_IT4,

  IT4_LANGUAGE_TO_IT3,

} from '../../mylib/LanguageMap';



import CacheAPI from '../../api/Cache';

import updateApi from '../../api/SWUpdateApi';

import { handle_db_name } from '../Utils';

import log from '../../api/Logger';

import { autoLogin } from './Login';

import { setBackgroundImage } from '../../../backgroundImage.js';



export const MS_IN_MINUTE = 60000;

export const AUTO_RELOAD_INTERVAL = 60 * MS_IN_MINUTE;

export const AUTO_RELOAD_DELAY = 5 * MS_IN_MINUTE;

export const FORCED_AUTO_RELOAD_INTERVAL = 90 * MS_IN_MINUTE;



function* updateShotformatters() {

  // Setting shotformater

  try {

    const config_values = yield call(waitForConfigValues);

    const unitname = config_values.formula_display_unit;

    const unit = yield select(cacheSelectors.getUnit, unitname);

    if (unit) {

      yield put({ type: actionTypes.SET_SHOTFORMATTER_UNIT, payload: unit });

    }

  } catch (e) {

    log.error(e);

  }

}



function* loadConfigurations(action) {

  const { zoneid } = yield call(waitForZone);

  const { siteid } = yield call(waitForSite);

  const is_pro = yield call(waitForIsPro);



  try {

    let payload;

    if (action?.payload.bundle) {

      payload = action.payload.bundle.configuration;

    } else {

      yield put({ type: actionTypes.FETCH_CONFIG_PENDING });

      const response = yield call(

        WebRequest,

        ConfigurationsAPI.loadConfigurations(zoneid, siteid)

      );

      payload = response.data;

    }

    // set value property from site_value or common_value

    for (let obj of Object.values(payload)) {

      obj.value =

        obj.site_value === undefined ? obj.common_value : obj.site_value;

    }



    // update language to correct one based on IT3_LANGUAGE_TO_IT4 map

    if (IT3_LANGUAGE_TO_IT4.has(payload.language?.value)) {

      payload.language.value = IT3_LANGUAGE_TO_IT4.get(payload.language.value);

    }



    if (!is_pro) {

      const in_use = String(payload.home_buttons?.value).split(';');

      const pro_only = ['article', 'matching', 'customer'];

      const value = _.difference(in_use, pro_only).join(';');

      payload['home_buttons'] = {

        ...payload.home_buttons,

        value,

      };

    }

    // send returned object back to reducer as payload:

    yield put({ type: actionTypes.FETCH_CONFIG_FULFILLED, payload: payload });

    yield put({ type: machineActionTypes.FETCH_MACHINES_LIST, payload: null });

    yield put({ type: actionTypes.UPDATE_SHOTFORMATTER });



    // Send config to QtSide as well

    if (window.qtside) {

      window.qtside.bridge.setConfig(JSON.stringify(payload));

    }

  } catch (e) {

    yield put({ type: actionTypes.FETCH_CONFIG_REJECTED, payload: e });

    yield put(

      errorActions.showCriticalError(

        i18n.t('msg.unableToLoadConfiguration', 'Unable to load configuration'),

        e

      )

    );

  }

}



function* loadPrintLabels() {

  try {

    const { zoneid } = yield call(waitForZone);

    const { siteid } = yield call(waitForSite);

    const response = yield call(

      WebRequest,

      ConfigurationsAPI.loadPrintLabels(zoneid, siteid)

    );

    yield put(configActions.setPrintLabels(response.data));

  } catch (e) {

    yield put(

      errorActions.showCriticalError(

        i18n.t('msg.unableToLoadPrintLabels', 'Unable to load print labels'),

        e

      )

    );

  }

}

function* loadEmailTemplates() {

  try {

    const { zoneid } = yield call(waitForZone);

    const { siteid } = yield call(waitForSite);

    const response = yield call(

      WebRequest,

      ConfigurationsAPI.loadEmailTemplates(zoneid, siteid)

    );

    yield put(configActions.setEmailTemplates(response.data));

  } catch (e) {

    yield put(

      errorActions.showCriticalError(

        i18n.t(

          'msg.unableToLoadEmailTemplates',

          'Unable to load email templates'

        ),

        e

      )

    );

  }

}



function* savePrintLabels(action) {

  try {

    const { siteid } = yield call(waitForSite);

    const response = yield call(

      WebRequest,

      ConfigurationsAPI.savePrintLabels(siteid, action.payload)

    );

    const site_labels = response.data; // these have true id from db

    const zone_labels = (yield select(selectors.print_labels)).filter(

      (x) => x.zoneid != null

    );

    yield put(configActions.setPrintLabels([...zone_labels, ...site_labels]));

  } catch (e) {

    yield put(

      errorActions.showCriticalError(

        i18n.t('msg.unableToSetConfiguration', 'Unable to set configuration'),

        e

      )

    );

  }

}



function* saveEmailTemplates(action) {

  try {

    const { siteid } = yield call(waitForSite);

    const response = yield call(

      WebRequest,

      ConfigurationsAPI.saveEmailTemplates(siteid, action.payload)

    );

    const site_templates = response.data; // these have true id from db

    const zone_templates = (yield select(selectors.email_templates)).filter(

      (x) => x.zoneid != null

    );

    yield put(

      configActions.setEmailTemplates([...zone_templates, ...site_templates])

    );

  } catch (e) {

    yield put(

      errorActions.showCriticalError(

        i18n.t('msg.unableToSetConfiguration', 'Unable to set configuration'),

        e

      )

    );

  }

}



function* saveSiteDetails(action) {

  // update site data

  try {

    yield call(WebRequest, ConfigurationsAPI.updateSite(action.payload));

    yield put(configActions.setSite(action.payload));

  } catch (e) {

    yield put({ type: actionTypes.UPDATE_SITE_REJECTED, payload: e });

    yield put(

      errorActions.showCriticalError(

        i18n.t(

          'msg.unableToUpdateSiteDetails',

          'Unable to update site details'

        ),

        e

      )

    );

  }

}



function* setConfiguration(action) {

  const config = yield select(selectors.config);

  const { zoneid } = yield call(waitForZone);

  const { siteid } = yield call(waitForSite);

  try {

    const { key, value } = action.payload;

    const value_object = { ...config[key] };



    // Do not update if not changed

    if (_.isEqual(value_object.value, value)) {

      return;

    }



    // transform values for server

    let dbvalue = value;

    if (key === 'language') {

      dbvalue = IT4_LANGUAGE_TO_IT3.get(value);

      if (dbvalue === undefined) return;

    }



    yield put(configActions.savingConfig(true));



    // update redux

    value_object.value = value;

    value_object.site_value = value;

    yield put({

      type: actionTypes.SET_CONFIG_VALUE_REDUX,

      payload: { key, object: value_object },

    });



    // Send config to QtSide as well

    if (window.qtside) {

      const updated_config = yield select(selectors.config);

      window.qtside.bridge.setConfig(JSON.stringify(updated_config));

    }

    // update server

    yield call(

      WebRequest,

      ConfigurationsAPI.setSiteConfiguration(zoneid, siteid, key, dbvalue)

    );



    yield put(configActions.savingConfig(false));



    yield* afterConfigChange(action);

  } catch (e) {

    yield put(

      errorActions.showCriticalError(

        i18n.t('msg.unableToSetConfiguration', 'Unable to set configuration'),

        e

      )

    );

    // restore previous config

    yield put({ type: actionTypes.FETCH_CONFIG_FULFILLED, payload: config });

  }

}



function* unsetConfiguration(action) {

  const config = yield select(selectors.config);

  const { zoneid } = yield call(waitForZone);

  const { siteid } = yield call(waitForSite);

  try {

    const { key } = action.payload;



    const { site_value, ...value_object } = config[key]; // excludes site_value



    if (

      key === 'language' &&

      IT3_LANGUAGE_TO_IT4.has(value_object.common_value)

    ) {

      value_object.value = IT3_LANGUAGE_TO_IT4.get(value_object.common_value);

    } else {

      value_object.value = value_object.common_value;

    }



    yield put(configActions.savingConfig(true));



    // update redux

    yield put({

      type: actionTypes.SET_CONFIG_VALUE_REDUX,

      payload: { key, object: value_object },

    });



    // Send config to QtSide as well

    if (window.qtside) {

      const updated_config = yield select(selectors.config);

      window.qtside.bridge.setConfig(JSON.stringify(updated_config));

    }

    // update server

    yield call(

      WebRequest,

      ConfigurationsAPI.unsetSiteConfiguration(zoneid, siteid, key)

    );



    yield put(configActions.savingConfig(false));



    yield* afterConfigChange(action);

  } catch (e) {

    yield put(

      errorActions.showCriticalError(

        i18n.t('msg.unableToSetConfiguration', 'Unable to set configuration'),

        e

      )

    );

    // restore previous config

    yield put({ type: actionTypes.FETCH_CONFIG_FULFILLED, payload: config });

  }

}



function* afterConfigChange(action) {

  try {

    const { key } = action.payload;

    // notify other sagas

    if (key === 'formula_display_unit') {

      // Update only if really needed

      yield put({ type: actionTypes.UPDATE_SHOTFORMATTER });

    }

  } catch (e) {

    log.error(e);

  }

}



function* setZone(action) {

  // fire load zone related data actions!

  // only dispatch actions if zone is available since they are all null by default

  if (action.payload) {

    yield put({

      type: cacheActionTypes.TOGGLE_PRIORITY_INIT_PENDING,

      payload: true,

    });

    const currentLocalUser = yield select(userSelectors.current_user);

    const users = yield select(userSelectors.users);

    yield put({ type: actionTypes.SET_ZONE_REDUX, payload: action.payload });



    // Fetching site users

    yield put(userActions.fetchSiteUsers());

    // Login quest account, null username and null password if current user is not a local user.

    if (

      users.length === 0 ||

      currentLocalUser.stduser ||

      !currentLocalUser.username

    ) {

      yield put(userActions.loginUser());

    }



    yield call(loadConfigurations);

    yield call(loadInitZoneBundle);



    yield put({

      type: cacheActionTypes.TOGGLE_PRIORITY_INIT_PENDING,

      payload: false,

    });



    // low priority fetches

    yield call(loadPrintLabels);

    yield call(loadEmailTemplates);

    yield put(cacheActions.loadCommentsList(action.payload.zoneid));



    // set background image

    setBackgroundImage(action.payload.zoneid);



    yield put({

      type: actionTypes.SET_ZONE_FULLFILLED,

    });

  }

}



function* loadInitZoneBundle() {

  try {

    const zone = yield call(waitForZone);

    const site = yield call(waitForSite);



    yield put({ type: cacheActionTypes.FETCH_PRODUCTS_PENDING });

    yield put({ type: cacheActionTypes.FETCH_PRODUCT_GROUPS_PENDING });

    yield put({ type: cacheActionTypes.FETCH_CARDS_PENDING });

    yield put({ type: cacheActionTypes.FETCH_UNITS_PENDING });

    yield put({ type: cacheActionTypes.FETCH_CNTS_PENDING });



    const { data } = yield call(

      WebRequest,

      CacheAPI.loadInitZoneBundle(zone.zoneid, site.siteid, site.systemgroupid)

    );



    yield put(cacheActions.loadProducts(data));

    yield put(cacheActions.loadCards(data));

    yield put(cacheActions.loadUnits(data));

    yield put(cacheActions.loadColorants(data));

  } catch (e) {

    yield put(

      errorActions.showCriticalError(

        i18n.t('msg.unableToLoadConfiguration', 'Unable to load configuration'),

        e

      )

    );

  }

}



// return selected zone, waiting for SET_ZONE if necessary

export function* waitForZone() {

  let zone = yield select(selectors.zone);

  while (!zone) {

    const a = yield take(actionTypes.SET_ZONE);

    zone = a.payload;

  }

  return zone;

}



// return config, waiting for FETCH_CONFIG_FULFILLED if necessary

export function* waitForConfig() {

  let config = yield select(selectors.config);

  while (_.isEmpty(config)) {

    const a = yield take(actionTypes.FETCH_CONFIG_FULFILLED);

    config = a.payload;

  }

  return config;

}



// return config_values, waiting for FETCH_CONFIG_FULFILLED if necessary

export function* waitForConfigValues() {

  let config = yield select(selectors.config_values);

  while (_.isEmpty(config)) {

    yield take(actionTypes.FETCH_CONFIG_FULFILLED);

    config = yield select(selectors.config_values);

  }

  return config;

}



// return selected site, waiting for SET_SITE if necessary

export function* waitForSite() {

  let site = yield select(selectors.site);

  while (!site) {

    const a = yield take(actionTypes.SET_SITE);

    site = a.payload;

  }

  return site;

}



// return selected site, waiting for SET_SITE if necessary

export function* waitForIsPro() {

  let status = yield select(protectionSelectors.status);

  while (!status) {

    const a = yield take(protectionActionTypes.FETCH_STATUS_FULLFILLED);

    status = a.payload;

  }

  return status.features.includes(FEATURE_PRO);

}



export function* fetchWithSiteid(apifunc, action) {

  const { siteid } = yield call(waitForSite);

  try {

    const params = { ...action.payload, siteid };

    const { data } = yield call(WebRequest, apifunc(params));

    yield put({ type: fulfilled(action.type), payload: data });

  } catch (e) {

    yield put({ type: rejected(action.type), payload: e });

  }

}



export function* fetchWithZoneid(apifunc, action) {

  const { zoneid } = yield call(waitForZone);

  try {

    const params = { ...action.payload, zoneid };

    const { data } = yield call(WebRequest, apifunc(params));

    yield put({ type: fulfilled(action.type), payload: data });

  } catch (e) {

    yield put({ type: rejected(action.type), payload: e });

  }

}



export function* saveWithSiteid(savefunc, action) {

  const { siteid } = yield select(selectors.site);

  try {

    if (siteid == null) throw new Error('Site not set');

    const obj = { ...action.payload, siteid };

    const { data } = yield call(WebRequest, savefunc(obj));

    yield put({ type: fulfilled(action.type), payload: data });

    return data;

  } catch (e) {

    yield put({ type: rejected(action.type), payload: e });

  }

}



export function* deleteWithSiteid(deleteFunc, action) {

  const { siteid } = yield select(selectors.site);

  try {

    const params = { ...action.payload, siteid };

    const { data } = yield call(WebRequest, deleteFunc(params));

    yield put(busyActions.setBusy(true));

    if (data.deleted) {

      yield put({ type: fulfilled(action.type), payload: data });

      yield put(busyActions.setBusy(false));

    }

  } catch (e) {

    yield put({ type: rejected(action.type), payload: e });

    yield put(busyActions.setBusy(false));

  }

}



function* initApp(action) {

  // Notify busy

  try {

    yield put(busyActions.setBusy(true));



    if (action.payload.first_init) {

      yield call(autoLogin);

    }



    // Fetching protection status

    yield put(protectionActions.fetchStatus());



    // Clear previous values

    yield put(errorActions.clearError());

    yield put(configActions.setSite(null));



    yield put(cacheActions.loadZones());



    yield put(cacheActions.loadLanguages());



    let versions = null;



    if (window.qtside) {

      yield call(() => updateApi.get_sw_versions());



      let { vers } = yield race({

        vers: take(updateActionTypes.SW_VERSIONS),

        timeout: delay(20 * 1000),

      });

      versions = vers?.payload;

    }



    // Load site to be used

    const clientname = window.computername || 'webbrowser';



    try {

      const response = yield call(

        WebRequest,

        ConfigurationsAPI.loadSite(clientname, versions)

      );

      yield put(configActions.setSite(response.data));

    } catch (e) {

      if (e.response?.status === 404) {

        yield put(

          errorActions.showCriticalError(

            i18n.t(

              'msg.notSiteAccount',

              'User used for login is not connected to any site. Please verify username from resource manager.'

            ),

            null

          )

        );

        yield delay(10000);

        yield put(errorActions.clearError());

        yield put(loginActions.logOutSite());

        return;

      } else {

        throw e;

      }

    }



    // waiting zone to be set and config to be loaded

    const zone = yield call(waitForZone);

    yield call(waitForConfig);



    // In case of reloading matching, set section order & order mode correctly

    const state = yield select();



    // Notify QtSide about the SplashImage

    if (window.qtside) {

      try {

        const ad = zone.advertisement.filter(

          (x) => x.adtype === ADD_TYPE_SPLASH

        );



        if (ad.length === 0) {

          window.qtside.bridge.setSplashImage('');

        } else {

          window.qtside.bridge.setSplashImage(

            window.location.origin +

              handle_db_name(

                `/rest/advertisement/${ad[0].adid}/data?hash${ad[0].md5_hash}`

              )

          );

        }

      } catch (e) {

        log.error(e);

        log.error('Not supported to set splash image');

      }

    }



    switch (state.router.location.pathname) {

      case '/matching': {

        yield take(cacheActionTypes.FETCH_PRODUCT_GROUPS_FULFILLED);

        yield put(formulaActions.searchProducts(''));

        yield put(orderActions.setOrderMode(ORDER_MODE_MATCHING));

        break;

      }

      case '/freedispense': {

        yield put(orderActions.setOrderMode(ORDER_MODE_FREE_DISPENSE));

        yield put(orderActions.setOpenSection(FORMULA_INPUT_CARD));

        break;

      }

      case '/localformula': {

        yield take(cacheActionTypes.FETCH_PRODUCT_GROUPS_FULFILLED);

        yield put(formulaActions.searchProducts(''));

        yield put(orderActions.setOrderMode(ORDER_MODE_LOCAL_FORMULA));

        break;

      }

    }



    // Notify busy

    const config_values = yield call(waitForConfigValues);

    yield put(busyActions.setBusy(false));



    // Wait for init_zone bundle to load

    yield call(waitForPriorityInit);



    // Load inventory

    if (config_values.enable_warehousing_v4) {

      yield put(inventoryActions.fetchInventory());

    }



    // Load system groups

    const group_response = yield call(

      WebRequest,

      ConfigurationsAPI.getSystemgroup()

    );



    yield put(

      configActions.setSystemgroups(group_response ? group_response.data : [])

    );



    // Offline time left

    yield put(offlineActions.getOfflineTimeRemaining());



    // Wait till machine colorants is fetched to check for warning batch

    yield take(machineActionTypes.SET_MACHINE_COLORANTS);



    // Check warning batch at the start

    yield put({ type: machineActionTypes.CHECK_WARNING_BATCH });

  } catch (e) {

    // Notify busy

    yield put(busyActions.setBusy(false));

    if (e.response && e.response.status === 403) {

      // Forbidden -->

      // yield put(errorActions.showCriticalError(i18n.t('msg.permissionDenied', 'Permission denied'), e));

      // Redirect to protection page?

      yield put(push('/protection'));

    } else if (e.response && e.response.status === 423) {

      yield put(

        errorActions.showCriticalError(

          i18n.t(

            'msg.ihqConnectionFailed',

            'Connection to Polchem Color Suit HQ has failed! Please verify Polchem Color Suit HQ settings in resource manager.'

          ),

          e

        )

      );

    } else {

      yield put(

        errorActions.showCriticalError(

          i18n.t(

            'msg.unableToInitializeApplication',

            'Unable to initialize application. Check connection to server.'

          ),

          e

        )

      );

      // once per 20 seconds check connection to server again

      yield delay(20000);

      yield put(errorActions.clearError());

      yield put(configActions.initializeApp());

    }

  }

}



/** Reload cached data periodically when at home page.

 * Wait after entering home, unless FORCED_AUTO_RELOAD_INTERVAL has already elapsed.

 */

function* autoReload() {

  const last_load_time = Date.now();

  let elapsed = 0;



  while (true) {

    const { pathname } = yield select(getLocation);

    if (pathname === '/') {

      if (elapsed > FORCED_AUTO_RELOAD_INTERVAL) {

        break;

      }

      const { timeout } = yield race({

        navigation: take(LOCATION_CHANGE),

        timeout: delay(

          Math.max(AUTO_RELOAD_DELAY, AUTO_RELOAD_INTERVAL - elapsed)

        ),

      });

      if (timeout) {

        break;

      }

    } else {

      yield take(LOCATION_CHANGE);

    }

    elapsed = Date.now() - last_load_time;

  }



  yield put(configActions.initializeApp());

}



export function* checkZones(action) {

  try {

    if (action.payload.data.length === 0) {

      // Inform user about no zones defined!

      yield put(

        errorActions.showCriticalError(

          i18n.t(

            'msg.noZonesCheckConfiguration',

            'No zones defined for this site! Please check configuration in Resource Manager.'

          )

        )

      );

      yield delay(10000);

      yield put(loginActions.logOutSite());

    }

  } catch (e) {

    log.error(e);

  }

}



// This function is here to avoid cyclic dependency between Cache and Configuration sagas

export function* waitForPriorityInit() {

  const flag = yield select(cacheSelectors.priority_init_pending);

  if (flag) {

    yield take(cacheActionTypes.TOGGLE_PRIORITY_INIT_PENDING);

  }

}



export default function* saga() {

  yield all([

    takeLatest(actionTypes.INITIALIZE_APP, initApp),

    takeLatest(actionTypes.INITIALIZE_APP, autoReload),

    takeLatest(actionTypes.FETCH_CONFIG, loadConfigurations),

    takeLatest(actionTypes.FETCH_CONFIG, loadPrintLabels),

    takeLatest(actionTypes.FETCH_CONFIG, loadEmailTemplates),

    takeEvery(actionTypes.SAVE_PRINT_LABELS, savePrintLabels),

    takeEvery(actionTypes.SAVE_EMAIL_TEMPLATES, saveEmailTemplates),

    takeLatest(actionTypes.SET_ZONE, setZone),

    takeEvery(actionTypes.SET_CONFIG_VALUE, setConfiguration),

    takeEvery(actionTypes.UNSET_CONFIG_VALUE, unsetConfiguration),

    takeLatest(actionTypes.UPDATE_SHOTFORMATTER, updateShotformatters),

    takeLatest(actionTypes.UPDATE_SITE, saveSiteDetails),

    takeLatest(cacheActionTypes.FETCH_ZONES_FULFILLED, checkZones),

    takeLatest(

      actionTypes.FETCH_MATCHSETTING_NAMES,

      fetchWithZoneid,

      ConfigurationsAPI.matchsettingNames

    ),

  ]);

}


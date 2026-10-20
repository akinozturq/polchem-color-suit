import { call, put, select, takeLatest } from 'redux-saga/effects';
import { actionTypes, selectors } from '../reducers/Customer';
import {
  search_customers,
  load_customer,
  save_customer,
} from '../../api/Order';
import {
  saveWithSiteid,
  waitForConfigValues,
  waitForSite,
} from './Configuration';
import WebRequest, { general_request } from './WebRequest';
import _ from 'lodash';
import { fulfilled, rejected } from '../factories/ApiCall';
import errorActions from '../reducers/Errors';
import i18n from '../../localization/i18n';

export function* fetchCustomers(apifunc, action) {
  try {
    const config_values = yield call(waitForConfigValues);
    const siteid = config_values.customer_search_all_sites
      ? null
      : (yield call(waitForSite)).siteid;
    const params = { ...action.payload, siteid };

    const tmp = yield select(selectors.search_results);

    const { data } = yield call(WebRequest, apifunc(params));
    // Merge arrays of data if page is > 1
    let payload = data;
    if (params.page > 0) {
      payload = {
        ...data,
        customers: _.unionBy(tmp.data.customers, data.customers, 'customerid'),
      };
    }

    yield put({ type: fulfilled(action.type), payload: payload });
  } catch (e) {
    yield put({
      type: rejected(action.type),
      payload: 'Unable to load customer data',
    });
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToLoadCustomers', 'Unable to load customer data'),
        e
      )
    );
  }
}

export default function* saga() {
  yield takeLatest(
    actionTypes.SEARCH_CUSTOMERS,
    fetchCustomers,
    search_customers
  );
  yield takeLatest(actionTypes.LOAD_CUSTOMER, general_request, load_customer);
  yield takeLatest(actionTypes.SAVE_CUSTOMER, saveWithSiteid, save_customer);
}

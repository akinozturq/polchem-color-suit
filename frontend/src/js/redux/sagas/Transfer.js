/**
 * Handles external order recieving and sending
 * for example flink parsing
 */
import { call, put, all, takeEvery } from 'redux-saga/effects';
import i18n from 'js/localization/i18n';

import errorActions from '../reducers/Errors';
import { actionTypes } from '../reducers/Transfer';
import { addOrderFromFlink } from './FlinkInput';

function* addOrder(action) {
  try {
    const { payload } = action;
    if (payload.error) {
      throw payload.error;
    }
    if (payload.format === 'flink') {
      yield call(addOrderFromFlink, payload.data);
    }
  } catch (e) {
    yield put({ type: actionTypes.ADD_ORDER_REJECTED, payload: e });
    yield put(
      errorActions.showError(
        i18n.t('msg.receivedInvalidOrder', 'Received invalid order'),
        e,
        i18n.t('msg.errorInFrmExchange', 'Error in formula exchange')
      )
    );
  }
}

export default function* saga() {
  yield all([takeEvery(actionTypes.ADD_ORDER, addOrder)]);
}

import { call, put, select, takeEvery } from 'redux-saga/effects';
import i18n from 'js/localization/i18n';
import { actionTypes } from '../reducers/Plugins';
import errorActions from '../reducers/Errors';
import { ax_write_file } from 'js/api/Plugins';
import formatAXString from '../selectors/plugins/AXplugin';
import webRequest from './WebRequest';

function* ax_send_formula(action) {
  try {
    const { order, configurations } = yield select();
    const apiparams = formatAXString(order, configurations, action.payload);
    yield call(webRequest, ax_write_file(apiparams));
  } catch (e) {
    yield put(
      errorActions.showCriticalError(
        i18n.t(
          'plugin.ax.msg.errorSending',
          'Error while sending formula to AX'
        ),
        e
      )
    );
  }
}

export default function* saga() {
  yield takeEvery(actionTypes.AX_SEND_FORMULA, ax_send_formula);
}

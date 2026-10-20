import { put, takeLatest } from 'redux-saga/effects';
import { actionTypes } from '../reducers/Statistics';
import { purge, pos_stats } from 'js/api/Statistics';
import { fetchWithSiteid } from './Configuration';
import errorActions from 'js/redux/reducers/Errors';
import i18n from 'js/localization/i18n';
import { rejected } from '../factories/ApiCall';

function* reportError(action) {
  yield put(
    errorActions.showCriticalError(
      i18n.t('msg.unableToLoadStatistics', 'Unable to load statistics data'),
      action.payload?.response?.data
    )
  );
}

export default function* saga() {
  yield takeLatest(actionTypes.FETCH_PURGE, fetchWithSiteid, purge);
  yield takeLatest(actionTypes.FETCH_POS_STATS, fetchWithSiteid, pos_stats);
  yield takeLatest(rejected(actionTypes.FETCH_POS_STATS), reportError);
}

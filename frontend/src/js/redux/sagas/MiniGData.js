import { call, put, select, takeLatest } from 'redux-saga/effects';
import { actionTypes } from '../reducers/MiniGData';

import minigdataAPI from '../../api/MiniGData';
import { selectors as cacheSelectors } from 'js/redux/reducers/Cache';
import errorActions from '../reducers/Errors';
import i18n from '../../localization/i18n';
import { fulfilled, pending, rejected } from '../factories/ApiCall';

export function* generate_mini_gdata(action) {
  try {
    yield put({ type: pending(action.type) });

    const cnts = yield select(cacheSelectors.cnts);

    const tmp = cnts.map((x) => ({
      code: x.cntcode,
      id: x.cntid,
      rgb: x.rgb,
      sg: x.specificgravity,
    }));

    const data = yield call(() => minigdataAPI.generate_minigdata(tmp));
    yield put({ type: fulfilled(action.type), payload: data });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
    yield put(
      errorActions.showCriticalError(
        i18n.t(
          'msg.unableToGenerateMiniGdata',
          'Unable to generate mini gdata.'
        ),
        e.response?.data?.error || e.response || e
      )
    );
  }
}
export function* list_mini_gdata(action) {
  try {
    yield put({ type: pending(action.type) });

    const data = yield call(() => minigdataAPI.list_minigdata());
    yield put({ type: fulfilled(action.type), payload: data });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToListMiniGdata', 'Unable to list mini gdata.'),
        e.response?.data?.error || e.response || e
      )
    );
  }
}
export default function* saga() {
  yield takeLatest(actionTypes.GENERATE_MINI_GDATA, generate_mini_gdata);
  yield takeLatest(actionTypes.LIST_MINI_GDATA, list_mini_gdata);
}

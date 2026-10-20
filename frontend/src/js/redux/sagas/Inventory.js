import { takeLatest, put } from 'redux-saga/effects';
import { actionTypes } from '../reducers/Inventory';
import {
  fetch_cnt_inventory,
  report_cnt_consumption,
  update_cnt_inventory,
} from 'js/api/Inventory';
import { fetchWithSiteid } from './Configuration';
import { fulfilled } from '../factories/ApiCall';

function* update_inventory(data) {
  yield put({ type: fulfilled(actionTypes.FETCH), payload: data.payload });
}

export default function* saga() {
  yield takeLatest(actionTypes.FETCH, fetchWithSiteid, fetch_cnt_inventory);
  yield takeLatest(actionTypes.UPDATE, fetchWithSiteid, update_cnt_inventory);
  yield takeLatest(fulfilled(actionTypes.UPDATE), update_inventory);
  yield takeLatest(actionTypes.REPORT, fetchWithSiteid, report_cnt_consumption);
  yield takeLatest(fulfilled(actionTypes.REPORT), update_inventory);
}

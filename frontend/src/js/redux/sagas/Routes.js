import { LOCATION_CHANGE } from 'connected-react-router';
import { put, takeEvery } from 'redux-saga/effects';
import orderActions from '../reducers/Order';
import formulaActions from '../reducers/Formula';
import barcodeActions from '../reducers/BarcodeAction';
import spectroActions from '../reducers/Spectro';
import log from '../../api/Logger';

function* locationChange(action) {
  const { pathname } = action.payload.location;
  log.info(`at ${pathname}`);
  switch (pathname) {
    case '/': {
      yield put(orderActions.clearOrderState());
      yield put(formulaActions.clearSearches());
      yield put(barcodeActions.clearBarcodeState());
      yield put(spectroActions.clearMeasurement());

      break;
    }
    default:
      break;
  }
}

export default function* saga() {
  yield takeEvery(LOCATION_CHANGE, locationChange);
}

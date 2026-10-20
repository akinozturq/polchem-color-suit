import { takeLatest } from 'redux-saga/effects';
import { actionTypes } from '../reducers/BarcodeSearch';
import { searchBarcodes } from '../../api/BarcodeActions';
import { fetchWithZoneid } from './Configuration';

export default function* saga() {
  yield takeLatest(
    actionTypes.SEARCH_BARCODES,
    fetchWithZoneid,
    searchBarcodes
  );
}

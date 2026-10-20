import { takeLatest } from 'redux-saga/effects';
import { actionTypes } from '../reducers/Backup';
import {
  backup_now,
  backup_settings,
  set_backup_settings,
} from '../../api/Backup';

import { general_request } from '../sagas/WebRequest';

export default function* saga() {
  yield takeLatest(
    actionTypes.BACKUP_SETTINGS,
    general_request,
    backup_settings
  );
  yield takeLatest(
    actionTypes.SAVE_BACKUP_SETTINGS,
    general_request,
    set_backup_settings
  );
  yield takeLatest(actionTypes.BACKUP_NOW, general_request, backup_now);
}

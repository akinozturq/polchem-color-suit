import {

  call,

  put,

  delay,

  takeLatest,

  all,

  select,

  take,

} from 'redux-saga/effects';

import axios from 'axios';

import { actionTypes } from '../reducers/UpdateChecker';

import updateApi from '../../api/SWUpdateApi';

import {

  selectors as protectionSelectors,

  actionTypes as protectionActionTypes,

} from '../reducers/Protection';



import {

  selectors as replicationSelectors,

  actionTypes as replcationActionTypes,

} from 'js/redux/reducers/Replication';

import { fulfilled } from '../factories/ApiCall';

import { randomBetween } from '../../mylib/Utils';

import { CURRENT_VERSION } from '../../../version';

import log from '../../api/Logger';

import { offline_mode } from '../../Constants.js';

import { waitForConfig } from './Configuration.js';



// return selected site, waiting for SET_SITE if necessary

export function* waitForReplication() {

  let details = (yield select(replicationSelectors.details))?.data;

  while (!details) {

    const a = yield take(

      fulfilled(replcationActionTypes.REPLICATION_FETCH_DETAILS)

    );

    details = a.payload;

  }

  return details;

}

/**

 * Saga worker.

 * Note the Axios call might be good to move under API folder...

 */

function* pollSagaWorker() {

  try {

    // Wait 5 seconds before starting the update check

    yield call(waitForConfig);

    yield delay(5000);

    let status = yield select(protectionSelectors.status);

    // Wait for protection status call to respond

    while (!status) {

      const a = yield take(protectionActionTypes.FETCH_STATUS_FULLFILLED);

      status = a.payload;

    }

    while (status.cloud) {

      try {

        const { data } = yield call(() => axios({ url: '/version' }));

        yield put({ type: actionTypes.VERSION, payload: data });

        // Send the versions also to the QT side with complete urls



        let versions = {

          url: window.location.origin + '/',

          front_version_js: CURRENT_VERSION,

          ...data,

        };



        yield call(() => updateApi.check_files(versions));

      } catch (err) {

        log.error(err);

      }

      // once per 200 seconds check the version for production change this to something reasonable!!

      yield delay(200000);

    }

  } catch (e) {

    log.error(e);

  }

}



/**

 * Internet update from my.polchem.com

 * @param action

 */

function* myPolchemCom() {

  try {

    yield call(waitForConfig);

    yield delay(15000);



    let status = yield select(protectionSelectors.status);

    // Wait for protection status call to respond

    while (!status) {

      const a = yield take(protectionActionTypes.FETCH_STATUS_FULLFILLED);

      status = a.payload;

    }

    // Check version from my.polchem.com once at startup and after that randomly in 18 to 24 hour intervals

    while (!status.cloud && !offline_mode) {

      try {

        const { data } = yield call(() => axios({ url: '/version' }));

        yield put({ type: actionTypes.VERSION, payload: data });

        yield put({ type: replcationActionTypes.REPLICATION_FETCH_DETAILS });



        const { has_replication } = yield call(waitForReplication);



        const v_details = {

          ...data,

          has_replication: has_replication,

        };

        yield call(() => updateApi.set_db_versions(v_details));

        yield call(() => updateApi.check_my_polchem_com());

      } catch (e) {

        log.error(e);

      }

      // Random delay for rechecking between 18 to 24 hours from startup

      const wait_time = Math.round(randomBetween(18, 24) * 60);

      log.info(`Update recheck from HQ in ${wait_time} minutes`);

      yield delay(wait_time * 60 * 1000);

    }

  } catch (err) {

    log.error(err);

  }

}



function* approveDownload() {

  try {

    yield call(() => updateApi.approve_download());

  } catch (err) {

    log.error(err);

  }

}



function* startUpdate() {

  try {

    yield call(() => updateApi.start_update());

  } catch (err) {

    log.error(err);

  }

}



/**

 * Saga watcher.

 */

export default function* saga() {

  yield all([

    yield takeLatest(actionTypes.POLL_START, pollSagaWorker),

    yield takeLatest(actionTypes.APPROVE_DOWNLOAD, approveDownload),

    yield takeLatest(actionTypes.START_UPDATE, startUpdate),

    yield takeLatest(actionTypes.POLL_START, myPolchemCom),

  ]);

}


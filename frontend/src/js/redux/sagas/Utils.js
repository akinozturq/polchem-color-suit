import { take } from 'redux-saga/effects';
import _ from 'lodash';

export function* waitForAction(action) {
  let taken;
  do {
    taken = yield take(action.type);
  } while (!_.isEqual(action.payload, taken.payload));
}

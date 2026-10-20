import _ from 'lodash';
import { DB_NAME, DEV_MODE } from '../Constants';

export function globalizeSelectors(selectors, mountPath) {
  const result = {};

  for (const funcName in selectors) {
    const func = selectors[funcName];
    result[funcName] = (state, ...args) =>
      func(_.get(state, mountPath), ...args);
  }
  return result;
}

export function handle_db_name(url) {
  // Adds database name to query URL
  const db_url = DB_NAME ? `/db/${DB_NAME}${url}` : url;
  return DEV_MODE ? `/dev_api${db_url}` : db_url;
}

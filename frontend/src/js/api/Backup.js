import { authenticated } from './WebRequest';
import { omitNil } from 'js/mylib/Utils';

export function backup_settings() {
  return authenticated.get('/server/backup_settings');
}

export function backup_now(parameters) {
  const { ...params } = omitNil(parameters);
  return authenticated.post('/server/backup_now', {
    params,
  });
}

export function set_backup_settings(parameters) {
  const { ...params } = omitNil(parameters);
  return authenticated.post('/server/set_backup_settings', {
    params,
  });
}

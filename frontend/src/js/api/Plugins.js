import { authenticated } from './WebRequest';

export function ax_write_file(params) {
  return authenticated.post('/plugins/ax/write_file', params);
}

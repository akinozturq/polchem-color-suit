import { omitNil } from '../mylib/Utils';
import { authenticated } from './WebRequest';

export default class EmailAPI {
  static send_test_email(parameters) {
    const { ...params } = omitNil(parameters);
    return authenticated.post('/email/send_test_email', { params });
  }

  static send_email(parameters) {
    const { ...params } = omitNil(parameters);
    return authenticated.post('/email/send_email', { params });
  }
}

import { authenticated } from './WebRequest';
import { omitNil } from '../mylib/Utils';

export function fetch_cnt_inventory(parameters) {
  const { siteid } = parameters;
  return authenticated.get(`/site/${siteid}/colorant_inventory/`);
}

export function update_cnt_inventory(parameters) {
  const { siteid, ...params } = omitNil(parameters);
  return authenticated.post(`/site/${siteid}/update_colorant_inventory/`, {
    params,
  });
}

export function report_cnt_consumption(parameters) {
  const { siteid, ...params } = omitNil(parameters);
  return authenticated.post(`/site/${siteid}/report_colorant_consumption/`, {
    params,
  });
}

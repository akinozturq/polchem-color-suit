import { authenticated } from './WebRequest';
import { omitNil } from 'js/mylib/Utils';

export function pos_stats(parameters) {
  const { siteid, ...params } = omitNil(parameters);
  return authenticated.get(`/statistics/site/${siteid}/pos_stats`, { params });
}

export function purge(parameters) {
  const { siteid, ...params } = omitNil(parameters);
  return authenticated.get(`/statistics/site/${siteid}/purge_detail/`, {
    params,
  });
}

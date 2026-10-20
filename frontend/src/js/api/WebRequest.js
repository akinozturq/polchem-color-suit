import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import _ from 'lodash';
import { DB_NAME, OFFLINE_MODE_URL, USERTYPE_SITE } from 'js/Constants';
import TokenApi from './AccessToken';
import { handle_db_name } from '../redux/Utils';
import {
  offline_mode,
  USERTYPE_IST,
  USERTYPE_IST_PRO,
  USERTYPE_WEBSTORE,
} from '../Constants';
import log from './Logger';

axios.defaults.baseURL = handle_db_name('');

const SITE_TOKEN = 'site_token';
const REFRESH_TOKEN = 'refresh_token';
const OFFLINE_TOKEN = 'offline_token';
const USERTYPE = 'login_usertype';

function get_db_token(token, dbname = DB_NAME) {
  return dbname ? `${dbname}/${token}` : token;
}

// Keep local copies of tokens to avoid unnecessary localStorage access
// and possible issues due to corruption of localStorage
const local_tokens = {
  access_token: localStorage.getItem(get_db_token(SITE_TOKEN)),
  refresh_token: localStorage.getItem(get_db_token(REFRESH_TOKEN)),
  offline_token: localStorage.getItem(get_db_token(OFFLINE_TOKEN)),
  usertype: localStorage.getItem(get_db_token(USERTYPE)) || USERTYPE_SITE,
};

export function hasToken() {
  return !!getToken();
}

export function hasOfflineToken() {
  return !!getOfflineToken();
}

export function isSiteUser() {
  return ![USERTYPE_IST, USERTYPE_IST_PRO, USERTYPE_WEBSTORE].includes(
    getUserType()
  );
}

export function getUserType() {
  return local_tokens.usertype;
}

export function setUserType(usertype, dbname = DB_NAME) {
  if (dbname === DB_NAME) {
    local_tokens.usertype = usertype;
  }
  localStorage.setItem(get_db_token(USERTYPE, dbname), usertype);
}

export function getToken() {
  return local_tokens.access_token;
}
export function getRefreshToken() {
  return local_tokens.refresh_token;
}
export function getOfflineToken() {
  return local_tokens.offline_token;
}
export function setOfflineToken(offline) {
  local_tokens.offline_token = offline;
  if (offline) {
    localStorage.setItem(get_db_token(OFFLINE_TOKEN), offline);
  } else {
    localStorage.removeItem(get_db_token(OFFLINE_TOKEN));
  }
}

export function setToken(jwt, refresh, dbname = DB_NAME) {
  if (dbname === DB_NAME) {
    local_tokens.access_token = jwt;
    local_tokens.refresh_token = refresh;
  }
  const { origin } = window.location;
  if (jwt) {
    TokenApi.setToken(jwt, origin);
    localStorage.setItem(get_db_token(SITE_TOKEN, dbname), jwt);
  } else {
    localStorage.removeItem(get_db_token(SITE_TOKEN, dbname));
  }
  if (refresh) {
    TokenApi.setRefreshToken(refresh, origin);
    localStorage.setItem(get_db_token(REFRESH_TOKEN, dbname), refresh);
  } else {
    localStorage.removeItem(get_db_token(REFRESH_TOKEN, dbname));
  }
  authorize(authenticated_axios, jwt);
  authorize(authenticated_cached_axios, jwt);
  authorize(refresh_axios, refresh);
}

// Add/remove authorization header on an axios instance
function authorize(instance, jwt) {
  if (jwt) {
    instance.defaults.headers.common['Authorization'] = 'Bearer ' + jwt;
  } else {
    delete instance.defaults.headers.common['Authorization'];
  }
}

// Create separate axios instances for authenticated requests
// with or without in-memory caching, and unauthenticated requests
const unauthenticated_axios = axios.create();

const local_token = getToken();
const local_refresh_token = getRefreshToken();
if (!local_token || !local_refresh_token) {
  log.warning(`${local_token ? 'Refresh' : 'Access'} token missing in browser`);
}
const authenticated_axios = axios.create();
authorize(authenticated_axios, local_token);
const refresh_axios = axios.create();
authorize(refresh_axios, local_refresh_token);

// Use axios-cache-interceptor for caching
const authenticated_cached_axios = setupCache(axios.create(), {
  ttl: 15 * 60 * 1000, // 15 minutes in ms
  methods: ['get'], // cache only GET requests
  interpretHeader: false, // do not rely on HTTP headers for cache
});
authorize(authenticated_cached_axios, local_token);

// Wrapper to return functions that return corresponding axios promises
function indirect_axios(axios_obj) {
  axios_obj.interceptors.request.use((request) => {
    if (offline_mode) {
      // In case of fallback in place use the fall_back_token
      request.headers.Authorization = 'Bearer ' + getOfflineToken();
      if (!request.url.startsWith(OFFLINE_MODE_URL)) {
        request.url = OFFLINE_MODE_URL + request.url;
      }
    }

    return request;
  });

  axios_obj.interceptors.response.use(undefined, (error) => {
    const { config } = error;
    const data = error.response?.data;
    const msg = typeof data === 'string' ? data : data?.msg;
    log.warning(
      `${error.message}, ${config?.method} ${config?.url}${
        msg ? ` (${msg})` : ''
      }`
    );
    return Promise.reject(error);
  });

  /*// retry on error to fallback backend.
  axios_obj.interceptors.response.use(
    (response) => {
      // Notify UI if fall back engine is in use
      offline_mode = response.headers.fallback;
      if (!offline_mode && window.qtside) {
        // No fall back engine in use
        // TODO: stop only if stopping confirmed by user
        window.qtside.bridge.stop_fall_backend();
      }

      return response;
    },
    /** No automatic fallback engine trial!
    (error) => {
      // Verify and agree which status codes should cause the fallback engine usage
      if (
        window.qtside &&
        error.config &&
        !String(error.config.url).startsWith(OFFLINE_MODE_URL) &&
        (error.response === undefined ||
          (error.response.status !== 401 &&
            error.response.status !== 404 &&
            error.response.status !== 403 &&
            error.response.status !== 409))
      ) {
        // Start fall back engine
        // TODO: Ask about starting and moving to use fallback engine
        // TODO: Implement asking to sagas\WebRequest.js
        //  and then use automatic URL rewrite based on answer
        if (window.qtside) {
          window.qtside.bridge.start_fall_backend();

          let config = {
            ...error.config,
            url: OFFLINE_MODE_URL + error.config.url,
          };
          // Automatic redirect
          return axios_obj.request(config);
        }
      } else {
        return Promise.reject(error);
      }
    } /*
  ); /**/

  function get(...args) {
    const [url, ...rest] = args;
    return () => axios_obj.get(url, ...rest);
  }
  function put(...args) {
    const [url, ...rest] = args;
    return () => axios_obj.put(url, ...rest);
  }
  function post(...args) {
    const [url, ...rest] = args;
    return () => axios_obj.post(url, ...rest);
  }
  function delete_(...args) {
    const [url, ...rest] = args;
    return () => axios_obj.delete(url, ...rest);
  }
  function save(post_url, obj, pk) {
    const pkvalue = obj[pk];
    if (pkvalue == null) {
      return () => axios_obj.post(post_url, _.omit(obj, pk));
    } else {
      const put_url = post_url + pkvalue;
      return () => axios_obj.put(put_url, obj);
    }
  }
  return { get, put, post, delete: delete_, save };
}

// Wrapped axios instances
export const unauthenticated = indirect_axios(unauthenticated_axios);
export const authenticated = indirect_axios(authenticated_axios);
export const authenticated_cached = indirect_axios(authenticated_cached_axios);

export const refresh_token = indirect_axios(refresh_axios);

/*
 * Helper functions for checking HTTP errors
 */

export function isForbidden(error) {
  return _.get(error, 'response.status') === 403;
}

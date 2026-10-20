import { authenticated, unauthenticated } from './WebRequest';

export function fetch_site_users(zoneid) {
  return authenticated.get(`/site_user/zone/${zoneid}/fetch_site_uac`);
}

export function login_site_user(
  zoneid,
  siteid,
  username,
  password,
  started_as_admin
) {
  return authenticated.post(
    `/site_user/zone/${zoneid}/site/${siteid}/login_site_user_v2/`,
    { username, password, started_as_admin }
  );
}

/**
 *
 * @param zoneid currently in use zoneid
 * @param siteid currently in use siteid
 * @param user = {
 *   groups: [4294967292, 4294967293, 4294967294, 4294967295], // Groups which the user belongs to
 *   localuserid: 2, // Localuserid or null
 *   username: "joee",
 *   username: "pass",
 * }
 * @returns {function(): *}
 */
export function save_site_user(zoneid, siteid, user) {
  return authenticated.post(
    `/site_user/zone/${zoneid}/site/${siteid}/save_site_user/`,
    user
  );
}

/**
 *
 * @param siteid currently in use siteid
 * @param localuserid user to delete
 * @returns {function(): *}
 */
export function remove_site_user(siteid, localuserid) {
  return authenticated.post(`/site_user/site/${siteid}/remove_site_user/`, {
    localuserid,
  });
}

export function resetPassword(params) {
  return unauthenticated.post('/lost_password_reset', params);
}

export function sendResetPasswordLink(params) {
  return unauthenticated.post('/send_password_rest_link', params);
}

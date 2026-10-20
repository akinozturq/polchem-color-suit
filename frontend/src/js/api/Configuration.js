import { authenticated, authenticated_cached } from './WebRequest';
import { omitNil } from '../mylib/Utils';

// endpoint root

export default class ConfigurationsAPI {
  static loadConfigurations(zoneid, siteid) {
    return authenticated.get(
      `/query/zone/${zoneid}/site/${siteid}/configuration_v2`
    );
  }

  static loadPrintLabels(zoneid, siteid) {
    return authenticated.get(
      `/query/zone/${zoneid}/site/${siteid}/labels_list`
    );
  }
  static savePrintLabels(siteid, labels) {
    return authenticated.post(`/query/site/${siteid}/set_site_labels_list`, {
      value: labels,
    });
  }

  static loadEmailTemplates(zoneid, siteid) {
    return authenticated.get(
      `/email/zone/${zoneid}/site/${siteid}/email_template_list`
    );
  }

  static saveEmailTemplates(siteid, labels) {
    return authenticated.post(`/email/site/${siteid}/set_email_template_list`, {
      value: labels,
    });
  }

  static matchsettingNames(parameters) {
    const { zoneid } = omitNil(parameters);
    return authenticated_cached.get(
      `/matching/matchsetting_names/zone/${zoneid}`
    );
  }

  static loadSite(clientname, versions) {
    return authenticated.post('/auth/site/v2/', {
      clientname,
      versions,
    });
  }

  static updateSite(site) {
    return authenticated.post('/auth/update_site', site);
  }

  static getSystemgroup() {
    return authenticated.get('/rest/systemgroup/');
  }

  static setSiteConfiguration(zoneid, siteid, key, value) {
    return authenticated.post(
      `/query/zone/${zoneid}/site/${siteid}/set_configuration_v2`,
      { key, value }
    );
  }
  static unsetSiteConfiguration(zoneid, siteid, key) {
    return authenticated.post(
      `/query/zone/${zoneid}/site/${siteid}/unset_configuration_v2`,
      { key }
    );
  }
}

import { authenticated } from './WebRequest';

export default class CacheAPI {
  static loadZones() {
    return authenticated.get('/auth/zone/');
  }

  static loadSites(replicationgroup) {
    return authenticated.get(
      `/rest/site/?replicationgroup=${replicationgroup}`
    );
  }

  static loadInitZoneBundle(zoneid, siteid, systemgroupid) {
    return authenticated.get(
      `/bundle/systemgroup/${systemgroupid}/zone/${zoneid}/site/${siteid}/init_zone`
    );
  }

  static loadProducts(zoneid, siteid, systemgroupid) {
    if (siteid !== undefined) {
      return authenticated.get(
        `/query/systemgroup/${systemgroupid}/zone/${zoneid}/site/${siteid}/products_list`
      );
    }
    return authenticated.get('/query/zone/' + zoneid + '/products_list');
  }

  static loadProductGroups(zoneid) {
    return authenticated.get(`/query/zone/${zoneid}/product_groups`);
  }

  static loadCards(zoneid) {
    return authenticated.get('/query/zone/' + zoneid + '/cards_list');
  }

  static loadCanSizes() {
    return authenticated.get('/rest/cansize/');
  }

  static loadUnits() {
    return authenticated.get('/rest/unit/');
  }

  static loadColorants(zoneid) {
    return authenticated.get('/query/zone/' + zoneid + '/colorants_list/');
  }

  static loadLanguages() {
    return authenticated.get('/translations/languages/');
  }

  static loadCommentsList(zoneid) {
    return authenticated.get(`/query/zone/${zoneid}/comments_list`);
  }
}

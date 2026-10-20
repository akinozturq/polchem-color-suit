import { authenticated } from './WebRequest';

export function orderitem_prices(parameters) {
  const { zoneid, siteid, orderitem } = parameters;
  return authenticated.post(
    `/pricing/zone/${zoneid}/site/${siteid}/orderitem_prices`,
    orderitem
  );
}

/**
 * Price fetching
 */

export function price_bundle(parameters) {
  const { zoneid, siteid } = parameters;
  return authenticated.get(`/bundle/zone/${zoneid}/site/${siteid}/pricing`);
}
export function price_product(parameters) {
  const { zoneid, siteid, productid } = parameters;
  return authenticated.get(
    `/pricing/zone/${zoneid}/site/${siteid}/product/${productid}`
  );
}
export function price_colorants(parameters) {
  const { zoneid, siteid } = parameters;
  return authenticated.get(`/pricing/zone/${zoneid}/site/${siteid}/colorants`);
}

/**
 * Set prices. prarams object to be send is in same format that what get returns.
 */

export function price_common_set(parameters) {
  const { zoneid, siteid, common } = parameters;
  return authenticated.put(
    `/pricing/zone/${zoneid}/site/${siteid}/common`,
    common
  );
}
export function price_cansizes_set(parameters) {
  const { zoneid, siteid, cansizes } = parameters;
  return authenticated.put(
    `/pricing/zone/${zoneid}/site/${siteid}/cansizes`,
    cansizes
  );
}
export function price_product_set(parameters) {
  const { zoneid, siteid, productid, product } = parameters;
  return authenticated.put(
    `/pricing/zone/${zoneid}/site/${siteid}/product/${productid}`,
    product
  );
}
export function price_colorants_set(parameters) {
  const { zoneid, siteid, colorants } = parameters;
  return authenticated.put(
    `/pricing/zone/${zoneid}/site/${siteid}/colorants`,
    colorants
  );
}

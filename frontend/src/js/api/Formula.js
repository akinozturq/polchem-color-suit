import { authenticated, authenticated_cached } from './WebRequest';
import { omitNil } from 'js/mylib/Utils';

export const CHOOSE_PRIMER_LOOK_UP_ONLY = 1;
export const CHOOSE_PRIMER_CALCULATE_ONLY = 2;
export const CHOOSE_PRIMER_LOOK_UP_AND_CALCULATE = 3;

export default class FormulaAPI {
  static colorByCode(colourcode) {
    return authenticated.get('/rest/colour/', {
      params: { colourcode, '.limit': 1 },
    });
  }

  static searchColors(
    zoneid,
    colourcardid,
    search,
    unique_color_codes,
    search_by_both_color_codes
  ) {
    // NOTE: must use omitNil with cached queries
    const params = omitNil({
      search,
      colourcardid,
      unique_color_codes,
      search_by_both_color_codes,
    });
    return authenticated_cached.get('/query/zone/' + zoneid + '/colours/', {
      params,
    });
  }
  static searchColorsForProduct(
    systemgroupid,
    zoneid,
    productid,
    colourcardid,
    search,
    unique_color_codes,
    search_by_both_color_codes
  ) {
    const params = omitNil({
      search,
      colourcardid,
      unique_color_codes,
      search_by_both_color_codes,
    });
    return authenticated_cached.get(
      `/query/systemgroup/${systemgroupid}/zone/${zoneid}/colours_for_product/` +
        (productid || ''),
      { params }
    );
  }
  static cardsForProduct(systemgroupid, zoneid, productid) {
    return authenticated_cached.get(
      `/query/systemgroup/${systemgroupid}/zone/${zoneid}/cards_for_product/` +
        productid
    );
  }
  static searchColorsForMatching(
    systemgroupid,
    zoneid,
    productid,
    colourcardid,
    search,
    unique_color_codes,
    search_by_both_color_codes
  ) {
    const params = omitNil({
      search,
      colourcardid,
      unique_color_codes,
      search_by_both_color_codes,
    });
    return authenticated_cached.get(
      `/query/systemgroup/${systemgroupid}/zone/${zoneid}/colours_for_matching/` +
        productid,
      { params }
    );
  }
  static searchMeasuredColors(
    zoneid,
    colourcardid,
    search,
    unique_color_codes,
    search_by_both_color_codes
  ) {
    const params = omitNil({
      search,
      colourcardid,
      unique_color_codes,
      search_by_both_color_codes,
    });
    return authenticated_cached.get(
      '/query/zone/' + zoneid + '/measured_colours/',
      { params }
    );
  }
  static searchProducts(systemgroupid, zoneid, colourid) {
    // NOTE: must use omitNil with cached queries
    //'/query/zone/<int:zoneid>/products_for_colour/<int:colourid>'
    return authenticated_cached.get(
      `/query/systemgroup/${systemgroupid}/zone/${zoneid}/products_for_colour/` +
        (colourid || '')
    );
  }

  static loadFormula(systemgroupid, payload) {
    return authenticated.get(
      `/query/systemgroup/${systemgroupid}/formula_versions/${payload.colourid}/${payload.productid}`
    );
  }

  static formulaAsOrderitem(
    systemgroupid,
    zoneid,
    colourid,
    productid,
    can,
    siteid = null,
    allow_cansize_change = null,
    unique_color_codes = true
  ) {
    const {
      cansizeid,
      nominalamount,
      gravimetric: gravimetricnominal,
      cansizecode,
    } = can;
    const params = omitNil({
      siteid,
      allow_cansize_change,
      nominalamount,
      gravimetricnominal,
      cansizecode,
      unique_color_codes,
    });
    const query =
      `/query/systemgroup/${systemgroupid}/zone/${zoneid}/formula_as_orderitem/` +
      `${colourid}/${productid}` +
      (cansizeid != null ? `/${cansizeid}` : '');

    return authenticated.get(query, { params });
  }

  static matchingSearchClosest(
    zoneid,
    siteid,
    refl,
    lab,
    productid,
    cansizeid,
    nominalamount,
    gravimetric,
    colourid,
    coldataclass,
    max_de,
    deoption,
    maxresults,
    colourcardid,
    systemgroupid,
    closest_color_preferred_cards_only
  ) {
    return authenticated.post(
      `/matching/systemgroup/${systemgroupid}/zone/${zoneid}/search_closest/`,
      {
        siteid,
        refl,
        lab,
        productid,
        cansizeid,
        nominalamount,
        gravimetric,
        colourid,
        coldataclass,
        max_de,
        deoption,
        maxresults,
        colourcardid,
        closest_color_preferred_cards_only,
      }
    );
  }

  static matchingMatch(
    zoneid,
    systemgroupid,
    siteid,
    refl,
    productid,
    cansizeid,
    nominalamount,
    gravimetric,
    msname,
    baseids,
    cntids,
    maxresults,
    max_de,
    deoption
  ) {
    return authenticated.post(
      `/matching/systemgroup/${systemgroupid}/zone/${zoneid}/match`,
      {
        siteid,
        refl,
        productid,
        cansizeid,
        nominalamount,
        gravimetric,
        msname,
        baseids,
        cntids,
        maxresults,
        max_de,
        deoption,
      }
    );
  }

  static matchingCorrectFormula(
    zoneid,
    systemgroupid,
    siteid,
    productid,
    cansizeid,
    nominalamount,
    gravimetric,
    formula,
    stdrefl,
    batchrefl,
    msname,
    deoption
  ) {
    return authenticated.post(
      `/matching/systemgroup/${systemgroupid}/zone/${zoneid}/correct_formula`,
      {
        siteid,
        productid,
        cansizeid,
        nominalamount,
        gravimetric,
        formula,
        stdrefl,
        batchrefl,
        msname,
        deoption,
      }
    );
  }

  static matchingSynthesizeRgb(zoneid, systemgroupid, productid, formula) {
    return authenticated.post(
      `/matching/systemgroup/${systemgroupid}/zone/${zoneid}/synthesize_rgb`,
      {
        productid,
        formula,
      }
    );
  }

  static fetchColorDetails(zoneid, colourid) {
    return authenticated.get(
      '/query/zone/' + zoneid + '/colour_details/' + colourid
    );
  }

  static searchLocalFormulas(zoneid, siteid, search) {
    const params = omitNil({ search });
    return authenticated.get(
      `/query/zone/${zoneid}/site/${siteid}/local_formulas/`,
      { params }
    );
  }

  static hideLocalFormula(siteid, itemid) {
    return authenticated.post(
      `/query/site/${siteid}/hide_local_formula/item/${itemid}`
    );
  }

  static loadCompatibleLocalFormula(zoneid, itemid, baseid) {
    return authenticated.get(
      `/query/zone/${zoneid}/compatible_local_formula/itemid/${itemid}/baseid/${baseid} `
    );
  }

  static choosePrimer(parameters) {
    const { systemgroupid, zoneid, productid, colourid, formula, primer_mode } =
      omitNil(parameters);

    return authenticated.post(
      `/matching/systemgroup/${systemgroupid}/zone/${zoneid}/choose_primer`,
      {
        productid,
        colourid,
        formula,
        primer_mode,
      }
    );
  }

  static formulaChanges(parameters) {
    const { systemgroupid, zoneid } = omitNil(parameters);

    return authenticated.get('/query/formula_changes/', {
      params: { systemgroupid, zoneid },
    });
  }
}

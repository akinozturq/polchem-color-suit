import _ from 'lodash';

import { selectors as cacheSelectors } from '../reducers/Cache';

import { selectors as configSelectors } from '../reducers/Configuration';

import { ShotFormatter } from 'polchem_base/common/formatters/ShotFormatter';

import { LEVEL_UNITS } from 'js/Constants';

import { equalsIgnoreCase } from '../../mylib/Utils';



/**

 * High order function to create formatters for formula display.

 * @param {*} state Redux root state

 * @returns function that creates ShotFormatter from unit name

 */

export function createShotFormatter(state) {

  const {

    formula_display_unit,

    priceoption_decimal_separator,

    priceoption_trailing_zeros,

  } = configSelectors.config_values(state);



  return (unitname) => {

    const unit = cacheSelectors.getUnit(

      state,

      unitname || formula_display_unit

    );

    return new ShotFormatter(

      unit,

      priceoption_decimal_separator,

      priceoption_trailing_zeros

    );

  };

}



/**

 * High order function to create formatters for canister levels and custom cans.

 * @param {*} state Redux root state

 * @returns function that creates ShotFormatter from unit name

 */

export function createLevelFormatter(state) {

  const { level_display_unit, priceoption_decimal_separator } =

    configSelectors.config_values(state);



  return (unitname) => {

    const u = unitname || level_display_unit;

    const unit =

      _.find(LEVEL_UNITS, (x) => equalsIgnoreCase(x.unitname, u)) ||

      LEVEL_UNITS[0];

    return new ShotFormatter(unit, priceoption_decimal_separator);

  };

}


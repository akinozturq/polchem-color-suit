import React from 'react';
import Select from 'react-select';
import _ from 'lodash';
import { PropTypes } from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  CANISTERS_PANEL_SORT_BY_CANISTERS_ASC,
  CANISTERS_PANEL_SORT_BY_LEVELS_ASC,
  FORMULA_SORT_BY_CNTCODE_ASC,
  FORMULA_SORT_BY_MASS_DESC,
  FORMULA_SORT_BY_VOLUME_DESC,
  LEVEL_UNITS,
  MACHINE_VALIDATE_CIR_MISSING,
  MACHINE_VALIDATE_CNT_MISSING,
  MACHINE_VALIDATE_CNT_MORE_THAN_CANISTER,
  MACHINE_VALIDATE_CRITICAL_LEVEL,
  MACHINE_VALIDATE_OTHER_ERROR,
  MACHINE_VALIDATE_WARNING_LEVEL,
  ORDER_STATUS_PREPARING,
  UNIT_GRAVIMETRIC,
  UNIT_VOLUMETRIC,
} from '../Constants';
import can20000 from 'img/cansizes/20000.svg';
import can250 from 'img/cansizes/250.svg';
import can1000 from 'img/cansizes/1000.svg';
import can4000 from 'img/cansizes/4000.svg';
import can10000 from 'img/cansizes/10000.svg';
import errorRefillIcon from 'img/warnings/error_refill.svg';
import log from '../api/Logger';

/** Random integer from range [min, max)
 * @param {number} min, inclusive
 * @param {number} max, exclusive
 */
export function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

/** Random number from range [min, max)
 * @param {number} min, inclusive
 * @param {number} max, exclusive
 */
export function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function DecimalsTolerance(
  value1,
  value2,
  numbersBehindDecimalSeperator
) {
  return Math.abs(
    value1.toFixed(numbersBehindDecimalSeperator) -
      value2.toFixed(numbersBehindDecimalSeperator)
  ) <= 0.001
    ? 0
    : value1.toFixed(numbersBehindDecimalSeperator) -
        value2.toFixed(numbersBehindDecimalSeperator);
}

/**
 * Compares numbers for approximate equality.
 *
 * @param {number} value1
 * @param {number} value2
 * @param {number} tolerance, default 0.001
 * @return {boolean} true when absolute difference less than tolerance
 */
export function isAlmostEqual(value1, value2, tolerance = 0.001) {
  return Math.abs(value1 - value2) < tolerance;
}

/** Compares two values using === unless both are strings,
 * in which case trims and converts to lower case before comparison.
 */
export function equalsIgnoreCase(a, b) {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }
  return a === b;
}

export function spinner(height) {
  // Spinner icon in center of div
  return (
    <div
      style={{
        height: height || '100%',
        fontSize: '2.5rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
      }}
    >
      <FontAwesomeIcon icon="spinner" spin />
    </div>
  );
}

function toHex(n, minWidth = 0) {
  if (n === null || n === undefined) {
    return '0f0f0f00';
  }
  const s = n.toString(16);
  if (s.length < minWidth) return '0'.repeat(minWidth - s.length) + s;
  return s;
}

export function sortCarret(order) {
  if (order === undefined) {
    return;
  }
  let icon = order === 'asc' ? 'caret-up' : 'caret-down';
  return <FontAwesomeIcon icon={icon} />;
}

export function RGBToBGR(rgb) {
  if (rgb) {
    return ((rgb >> 16) & 0xff) | (rgb & 0xff00) | ((rgb << 16) & 0xff0000);
  } else {
    return 0;
  }
}

export function VBColorToHEX(i) {
  return (
    '#' +
    toHex(i & 0xff, 2) +
    toHex((i >> 8) & 0xff, 2) +
    toHex((i >> 16) & 0xff, 2)
  );
}

export function intToR_G_B(int) {
  try {
    if (int != null) {
      var red = int >> 16;
      var green = (int - (red << 16)) >> 8;
      var blue = int - (red << 16) - (green << 8);
      return [red, green, blue];
    }
    return [];
  } catch {
    return [];
  }
}

export function RGBColorToHex(rgb) {
  if (rgb == null) {
    return '#000000'; // black
  }
  return '#' + toHex(rgb, 6);
}

export function RGBColorToHexOrNull(rgb) {
  if (rgb == null) {
    return null;
  }
  return '#' + toHex(rgb, 6);
}

export function sortByKey(array, key) {
  return array.sort(function (a, b) {
    var x = a[key];
    var y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

export function detectMobile() {
  if (
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
      navigator.userAgent
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
      navigator.userAgent.substr(0, 4)
    )
  ) {
    return true;
  } else {
    return false;
  }
}

export function findObjectByKey(array, key, value) {
  for (var i = 0; i < array.length; i++) {
    if (array[i][key] === value) {
      return { object: array[i], position: i };
    }
  }
  return { object: null, position: -1 };
}

export function dynamicSort(property) {
  var sortOrder = 1;
  if (property[0] === '-') {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    var result =
      a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
    return result * sortOrder;
  };
}

export function isInt(value) {
  let value_int = parseInt(value, 10);
  let value_str = value_int.toString();

  if (value_str !== value) return false;

  return true;
}

/**
 * @param {array} array1
 * @param {array} array2
 * @returns {bool} true if array1 is a subset of array2
 */
export function isSubset(array1, array2) {
  return array1.every((x) => array2.includes(x));
}

export function divmod(value, divisor) {
  let quotient = Math.floor(Math.floor(value) / divisor);
  let remainder = value % divisor;
  return { q: quotient, r: remainder };
}

export class PriceFormatter {
  constructor(zone) {
    /*

    */
    // Init to Eur Fin style
    this.decimals = 2;
    this.format = 3;
    this.symbol = '€';
    this.zone = { currencydecimals: 2, currencyformat: 3, currencysymbol: '€' };
    if (zone) {
      this.decimals = zone.currencydecimals;
      this.format = zone.currencyformat;
      this.symbol = zone.currencysymbol || '';
      this.zone = zone;
    }
    try {
      this.factor = Math.pow(10, this.decimals);
    } catch (e) {
      this.factor = 1;
    }
  }

  getZone() {
    return this.zone;
  }

  getString(num) {
    /*
    0 | ¤n
    1 | n¤
    2 | ¤ n
    3 | n ¤
     */
    try {
      let value = (Math.round(num * this.factor) / this.factor).toFixed(
        this.decimals
      );
      if (this.format === 0) {
        return this.symbol + String(value);
      }
      if (this.format === 1) {
        return String(value) + this.symbol;
      }
      if (this.format === 2) {
        return this.symbol + ' ' + String(value);
      }
      return String(value) + ' ' + this.symbol;
    } catch (e) {
      return String(num);
    }
  }
}
/**
 * Copied from: https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color/35970186
 * @param {Hex color} hex
 */
export function invertColor(hex, bw) {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) {
    return null;
    //throw new Error('Invalid HEX color.');
  }
  var r = parseInt(hex.slice(0, 2), 16),
    g = parseInt(hex.slice(2, 4), 16),
    b = parseInt(hex.slice(4, 6), 16);
  if (bw) {
    // http://stackoverflow.com/a/3943023/112731
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF';
  }
  // invert color components
  r = (255 - r).toString(16);
  g = (255 - g).toString(16);
  b = (255 - b).toString(16);
  // pad each with zeros and return
  return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
  len = len || 2;
  var zeros = new Array(len).join('0');
  return (zeros + str).slice(-len);
}

export const customControlStyles = (base) => ({
  ...base,
  height: 20,
});

export const customControlStylesFreeDispense = (base) => ({
  ...base,
  height: 20,
  minWidth: 200,
});

export const customSelectContainerStyles = (base) => ({
  ...base,
  color: 'black',
  width: '50%',
});
export const mySelect = (options, selected, onchange) => {
  let sel = selected;
  if (!options.includes(selected) && options.length > 0) {
    sel = options[0];
  }

  return (
    <Select
      menuPlacement="auto"
      styles={{
        control: customControlStyles,
        option: (base) => ({ ...base, color: 'black' }),
      }}
      isSearchable={false}
      onChange={onchange}
      options={options.map((opt) => ({ label: opt, value: opt }))}
      defaultValue={{ label: sel, value: sel }}
    />
  );
};

/**
 *
 * @param selected String
 * @param onchange function
 * @param unit_type constant or null
 * @param id String for identifying the selector
 * @returns {JSX.Element}
 */
export const levelUnitSelector = (selected, onchange, unit_type, id) => {
  let options = LEVEL_UNITS;
  if (unit_type === UNIT_GRAVIMETRIC) {
    options = LEVEL_UNITS.filter((unit) => unit.gravimetric);
  }
  if (unit_type === UNIT_VOLUMETRIC) {
    options = LEVEL_UNITS.filter((unit) => !unit.gravimetric);
  }

  let sel = options.filter((x) => x.display_name === selected);
  if (sel.length > 0) {
    sel = sel[0];
  } else {
    if (unit_type === UNIT_GRAVIMETRIC) {
      sel = { display_name: 'g', unitname: 'gr' };
    } else {
      sel = { display_name: 'ml', unitname: 'ml' };
    }
  }

  return (
    <Select
      id={id}
      menuPlacement="auto"
      styles={{
        control: customControlStyles,
        option: (base) => ({ ...base, color: 'black' }),
      }}
      isSearchable={false}
      onChange={onchange}
      options={options.map((unit) => {
        return { label: unit.display_name, value: unit.unitname };
      })}
      defaultValue={{ label: sel?.display_name, value: sel?.unitname }}
    />
  );
};

/**
 *
 * @param {*} obj
 * @param {*} keyArray array of keys in object to search for
 * @returns null or value of the key
 */
export function getObjectKey(obj, keyArray) {
  if (!obj) {
    return null;
  }
  let t = keyArray.shift();
  if (keyArray.length === 0) {
    return String(obj[t]);
  }
  return getObjectKey(obj[t], keyArray);
}

// Omit properties from object if their value is null or undefined.
export function omitNil(obj) {
  return _.omitBy(obj, _.isNil);
}

export function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// Scrollbars custom
export function CustomScrollbars(props) {
  return (
    <div
      id={props.id}
      className={props.className ? props.className + ' scroll' : 'scroll'}
      style={props.style}
      onScroll={props.onScroll}
    >
      {props.children}
    </div>
  );
}

CustomScrollbars.propTypes = {
  children: PropTypes.any,
  id: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  onScroll: PropTypes.func,
};

export function getColorantWarn(level, formula_splitting) {
  switch (level) {
    case MACHINE_VALIDATE_WARNING_LEVEL: {
      return <FontAwesomeIcon icon="tint-slash" color="yellow" />;
    }
    case MACHINE_VALIDATE_CRITICAL_LEVEL: {
      return <FontAwesomeIcon icon="tint-slash" color="red" />;
    }
    case MACHINE_VALIDATE_CNT_MORE_THAN_CANISTER: {
      if (formula_splitting) {
        return (
          <img
            src={errorRefillIcon}
            alt={'E'}
            style={{ marginBottom: '5px' }}
          />
        );
      }
      return <FontAwesomeIcon icon="ban" color="red" />;
    }
    case MACHINE_VALIDATE_CNT_MISSING: {
      return <FontAwesomeIcon icon="ban" color="red" />;
    }
    case MACHINE_VALIDATE_CIR_MISSING: {
      return <FontAwesomeIcon icon="ban" color="red" />;
    }

    default: {
      if (level >= MACHINE_VALIDATE_OTHER_ERROR) {
        return <FontAwesomeIcon icon="exclamation-circle" color="red" />;
      }
      return;
    }
  }
}

/**
 *
 * @param order
 * @param config
 * @param machine
 * @return boolean true / false
 */
export function disabledDuringTinting(order, config, machine) {
  if (order.item.status === ORDER_STATUS_PREPARING) {
    const c = _.get(config, ['machine.lock_ui_during_tinting'], {
      value: true,
      locked: false,
    });
    const m = _.get(machine, 'config.lock_ui_during_tinting', true);
    return c.locked ? c.value : m;
  }
  return false;
}

/**
 * Get can image
 */
let IMAGE_MAP = new Map();
IMAGE_MAP.set(250, can250);
IMAGE_MAP.set(1000, can1000);
IMAGE_MAP.set(4000, can4000);
IMAGE_MAP.set(10000, can10000);
IMAGE_MAP.set(20000, can20000);

export function getCanImage(goal) {
  // Finding closest image based on can nominal amount
  let counts = [250, 1000, 4000, 10000, 20000];
  let closest = 1000;
  if (goal) {
    closest = counts.reduce(function (prev, curr) {
      return Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev;
    });
  }

  return IMAGE_MAP.get(closest) || can20000;
}

/**
 * @return {null}
 */
export function ArrayFindOneOrNull(arr, field, value) {
  let rs = arr.filter((x) => x[field] === value);
  if (rs.length === 1) {
    return rs[0];
  }
  return null;
}

/**
 * Sorts the formula according the 'formula_sort_by' config setting
 * @param config configurations
 * @param frm list of colorants [{cntcode, volume, specificgravity},...]
 */
export function sortFormula(config, frm) {
  const sort_by = _.get(
    config,
    'config_values.formula_sort_by',
    FORMULA_SORT_BY_CNTCODE_ASC
  );

  if (sort_by === FORMULA_SORT_BY_CNTCODE_ASC) {
    return _.orderBy(frm, ['cntcode'], ['asc']);
  }
  if (sort_by === FORMULA_SORT_BY_VOLUME_DESC) {
    return _.orderBy(frm, ['volume'], ['desc']);
  }
  if (sort_by === FORMULA_SORT_BY_MASS_DESC) {
    return _.orderBy(
      frm,
      [
        (cnt) => {
          return cnt.volume * cnt.specificgravity;
        },
      ],
      ['desc']
    );
  }
}

/**
 * Sorts machine canisters according the 'canisters_panel_sort_by' config setting
 * @param config_values configuration values
 * @param canisters list of machine canisters
 */
export function sortCanistersPanel(config_values, canisters) {
  const sort_by = _.get(
    config_values,
    'canisters_panel_sort_by',
    CANISTERS_PANEL_SORT_BY_CANISTERS_ASC
  );

  if (sort_by === CANISTERS_PANEL_SORT_BY_LEVELS_ASC) {
    return _.orderBy(canisters, ['currLevel', 'code'], ['asc', 'asc']);
  }

  return _.orderBy(canisters, ['id', 'code'], ['asc', 'asc']);
}

export function convertUTCDateToLocalDate(date) {
  if (date instanceof Date && !isNaN(date.valueOf())) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  } else {
    return '';
  }
}

export function currency_formatter(value, zone) {
  /**  Returns position of the monetary symbol in the positive currency mode.
      Value    Meaning
      0    Prefix, no separation, for example, $1.1
      1    Suffix, no separation, for example, 1.1$
      2    Prefix, 1-character separation, for example, $ 1.1
      3    Suffix, 1-character separation, for example, 1.1 $
  */
  if (!value) {
    return '';
  }
  try {
    const symbol = zone?.currencysymbol || '';
    const decimals = zone?.currencydecimals || 2;

    if (zone?.currencyformat === 0) {
      return symbol + String(value.toFixed(decimals));
    }
    if (zone?.currencyformat === 1) {
      return String(value.toFixed(decimals)) + symbol;
    }

    if (zone?.currencyformat === 2) {
      return symbol + ' ' + String(value.toFixed(decimals));
    }
    if (zone?.currencyformat === 3) {
      return String(value.toFixed(decimals)) + ' ' + symbol;
    }
    return value.toFixed(decimals);
  } catch (e) {
    log.error(e);
    return value;
  }
}

/**
 * Currency list to array
 * @param data: "($,1.324,2);(£,2,2);(€,1,2)" String of currencies
 * @return [list of currecies]
 */

export function currencies2list(data) {
  if (!data) {
    return [];
  }

  return data.split(';').map((x, i) => {
    try {
      const d = x.substr(1, x.length - 2).split(',');
      const v = d[1];
      const g = d[2];
      return {
        index: i,
        symbol: d[0],
        rate: parseFloat(v),
        decimals: parseInt(g),
      };
    } catch (e) {
      return { index: i, symbol: '', rate: 1, decimals: 2 };
    }
  });
}

export function findMatchLimit(matchLimits, dE) {
  if (!matchLimits.length) return null;

  let limit = matchLimits.find((limit) => limit.matchlimit >= dE);
  // if dE > available limits then take the last limit
  return limit || matchLimits[matchLimits.length - 1];
}

//for the languages which are read from right to left.
export const rightToLeft = () => {
  const a = document.querySelector('html');
  if (a.getAttribute('dir') === 'rtl') {
    return true;
  } else {
    return false;
  }
};

export const getFirstElementBorderRadius = () => {
  if (rightToLeft()) {
    return { borderRadius: '0 5px 5px 0' };
  }
  return { borderRadius: '5px 0 0 5px' };
};

export const getLastElementBorderRadius = () => {
  if (rightToLeft()) {
    return { borderRadius: '5px 0 0 5px' };
  }
  return { borderRadius: '0 5px 5px 0' };
};

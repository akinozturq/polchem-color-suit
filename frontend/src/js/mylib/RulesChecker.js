import 'lodash.combinations';
import _ from 'lodash';
import { FIXED_ABASEAMOUNT } from '../Constants';
import log from '../api/Logger';

// violations
export const TOO_MUCH_CNT = 'TOO_MUCH_CNT';
export const TOO_LITTLE_CNT = 'TOO_LITTLE_CNT';
export const NOT_IN_SYSTEM = 'NOT_IN_SYSTEM';
export const BAD_COMBINATION = 'BAD_COMBINATION';
export const TOO_MUCH_VOC = 'TOO_MUCH_VOC';
export const BAD_CNT = 'BAD_CNT';
export const BAD_BASE = 'BAD_BASE';
export const EMPTY_FORMULA = 'EMPTY_FORMULA'; // in blended base

// These constants are used to adjust rules to allow for rounding error
const GT1 = 1.0000000001;
const LT1 = 0.9999999999;

export function CheckRules(
  product,
  base,
  formula,
  enable_overfill_checking = true
) {
  /**
         * Checks formula and returns detailed results in dict:

        {'cnt_violations': {cntid: set of violation codes where colorant is to blame,
                            ...},
         'violations': set of violation codes where whole formula is to blame,
         'warnings': set of allowed violations (TOO_MUCH_CNT when overfill enabled),
         'voc': VOC level of formula (float, g/l)
         'fill': fill level of formula, volumetric or gravimetric,
             relative to nominal fill (float)
        }*/

  let result = {
    cnt_violations: [],
    violations: [],
    warnings: [],
    voc: null,
    fill: null,
  };

  for (const { cntid, abaseid } of formula.cntinformula) {
    // Check cnts in system
    if (product.cntinsystem.length && !product.cntinsystem.includes(cntid)) {
      result.cnt_violations.push({ cntid, rule: NOT_IN_SYSTEM });
    }
    // Check blended base colorants
    if (
      abaseid != null &&
      !product.basecnts.some((x) => x.abaseid === abaseid)
    ) {
      result.cnt_violations.push({ cntid, rule: BAD_CNT });
    }
  }

  // Check combinations
  const cntids = formula.cntinformula.map((x) => x.cntid);
  _.combinations(cntids, 2).forEach((x) => {
    if (
      product.deniedcntpairs.some(
        (p) =>
          (p[0] === x[0] && p[1] === x[1]) || (p[0] === x[1] && p[1] === x[0])
      )
    ) {
      result.cnt_violations.push({ cntid: x[0], rule: BAD_COMBINATION });
      result.cnt_violations.push({ cntid: x[1], rule: BAD_COMBINATION });
    }
  });

  if (product.blendedbase != null) {
    return CheckBlended(
      product,
      base,
      formula,
      result,
      enable_overfill_checking
    );
  }

  // Fill calculation
  const cntsum = CntSum(formula.cntinformula, base) * base.coefficient;
  const fill =
    cntsum /
    (FIXED_ABASEAMOUNT * (base.gravimetricfill ? base.specificgravity : 1));

  if (base.minfill && fill < base.minfill * LT1) {
    result.violations.push(TOO_LITTLE_CNT);
  }
  if (enable_overfill_checking && base.maxfill && fill > base.maxfill * GT1) {
    if (product.overfill) {
      result.warnings.push(TOO_MUCH_CNT);
    } else {
      result.violations.push(TOO_MUCH_CNT);
    }
  }

  result.fill = fill;

  // Voc calculation
  if (product.voclimit && base.voc) {
    let cntvoc = 0;
    try {
      cntvoc = _.sum(formula.cntinformula.map((x) => x.volume * x.voc));
    } catch (e) {
      log.error(e);
    }
    const voc =
      (FIXED_ABASEAMOUNT * base.voc + base.coefficient * cntvoc) /
      (FIXED_ABASEAMOUNT +
        base.coefficient * _.sum(formula.cntinformula.map((x) => x.volume)));
    if (voc > product.voclimit * GT1) {
      result['violations'].push(TOO_MUCH_VOC);
    }
    result['voc'] = voc;
  }

  // Basecnt rule checking
  if (base.basecntrule) {
    const valid_rules = base.basecntrule.filter((x) =>
      cntids.includes(x.cntid)
    );
    for (let rule of valid_rules) {
      const vol =
        _.sum(
          formula.cntinformula
            .filter((c) => c.cntid === rule.cntid)
            .map((x) => x.volume * (x.wetvolume ?? 1))
        ) * base.coefficient;

      if (
        rule.minamount &&
        vol < (rule.minamount * LT1 * FIXED_ABASEAMOUNT) / 100
      ) {
        result.cnt_violations.push({
          cntid: rule.cntid,
          rule: TOO_LITTLE_CNT,
        });
      }
      if (
        rule.maxamount != null &&
        vol > (rule.maxamount * GT1 * FIXED_ABASEAMOUNT) / 100
      ) {
        result.cnt_violations.push({ cntid: rule.cntid, rule: TOO_MUCH_CNT });
      }
    }
  }

  return result;
}

/** Check fill rules etc. for a blended product */
function CheckBlended(
  product,
  base,
  formula,
  result,
  enable_overfill_checking
) {
  const cntcnts = formula.cntinformula.filter((x) => x.abaseid == null);
  const basecnts = formula.cntinformula.filter((x) => x.abaseid != null);

  const cntsum = CntSum(cntcnts, base);
  const basecntsum = CntSum(basecnts, base);
  const totalcntsum = cntsum + basecntsum;
  const totalvolume = _.sum(formula.cntinformula.map((x) => x.volume));

  // Check empty formula
  if (totalcntsum === 0) {
    result.violations.push(EMPTY_FORMULA);
    return result;
  }

  // Check fill
  const fill = cntsum / (basecntsum + cntsum);
  if (base.minfill && fill < base.minfill * LT1) {
    result.violations.push(TOO_LITTLE_CNT);
  }
  if (enable_overfill_checking && base.maxfill && fill > base.maxfill * GT1) {
    if (product.overfill) {
      result.warnings.push(TOO_MUCH_CNT);
    } else {
      result.violations.push(TOO_MUCH_CNT);
    }
  }

  result.fill = fill;

  // Voc calculation
  if (product.voclimit) {
    const voc =
      _.sum(formula.cntinformula.map((x) => x.volume * (x.voc || 0))) /
      totalvolume;
    if (voc > product.voclimit * GT1) {
      result.violations.push(TOO_MUCH_VOC);
    }
    result.voc = voc;
  }

  // Basecnt rule checking
  if (base.basecntrule) {
    for (const rule of base.basecntrule) {
      const cntid = rule.cntid;
      const cnt = formula.cntinformula.find((x) => x.cntid === cntid);
      if (cnt) {
        const vol = (cnt.volume * (cnt.wetvolume ?? 1)) / totalvolume;
        if (rule.minamount && vol < (rule.minamount * LT1) / 100) {
          result.cnt_violations.push({ cntid, rule: TOO_LITTLE_CNT });
        }
        if (rule.maxamount != null && vol > (rule.maxamount * GT1) / 100) {
          result.cnt_violations.push({ cntid, rule: TOO_MUCH_CNT });
        }
      }
    }
  }

  return result;
}

function CntSum(cnts, base) {
  /**
   * Calculate the sum of colorants in a formula, before applying base coefficient.
   * @param {Array} cnts - Array of colorants with volume, wet volume and specific gravity.
   * @param {Object} base - Base object with gravimetric fill flag.
   * @returns {number} - The total amount of colorants.
   */
  return _.sum(
    cnts.map(
      (x) =>
        x.volume *
        (base.gravimetricfill ? x.specificgravity : (x.wetvolume ?? 1))
    )
  );
}

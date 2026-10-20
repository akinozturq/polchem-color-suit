import _ from 'lodash';
import {
  FIXED_ABASEAMOUNT,
  EXTENDER_DEFAULT_MIN_PERCENT,
  ZERO_VOLUME_THRESHOLD_ML,
} from '../Constants';
import { get_cnt_for_product } from './Product';

/*
 * Functions for manipulation of formulas
 */

export function basevolume_of_can(base, can, cansize) {
  const { nominalamount, gravimetric } = cansize || can;
  const baseamount = nominalamount * (can.fill || base.nominalfill);
  if (gravimetric) return baseamount / base.specificgravity;
  else return baseamount;
}

export function can_scaling_factor(base, can) {
  const basevolume = can.basevolume || basevolume_of_can(base, can);
  return (basevolume / FIXED_ABASEAMOUNT) * base.coefficient;
}

export function scale_to_can(cntinformula, base, can) {
  let scaling = can_scaling_factor(base, can);
  if (base.isblendedbase && base.gravimetricfill) {
    // Special case for gravimetric blended base
    const total = _.sum(cntinformula.map((x) => x.volume * x.specificgravity));
    const baseamount = can.nominalamount * (can.fill || base.nominalfill);
    scaling = total > ZERO_VOLUME_THRESHOLD_ML ? baseamount / total : 1;
  }
  return cntinformula.map((x) => ({ ...x, volume: x.volume * scaling }));
}

export function normalize_volumes(cnts, base, can, freeDispense = false) {
  if (!freeDispense) {
    const scaling = can_scaling_factor(base, can);
    if (scaling) return cnts.map((x) => ({ ...x, volume: x.volume / scaling }));
    return null;
  } else return cnts.map((x) => ({ ...x, volume: x.volume }));
}

export function normalize_blended(cntinformula) {
  // Normalize blended cntinformula to base amount
  const total = _.sum(cntinformula.map((x) => x.volume));
  if (total < ZERO_VOLUME_THRESHOLD_ML) {
    // fail silently
    return cntinformula;
  }
  const scaling = FIXED_ABASEAMOUNT / total;
  return cntinformula.map((x) => ({ ...x, volume: x.volume * scaling }));
}

export function update_extender_volume_from_redux(cnts, root) {
  const { order, cache } = root;
  const {
    base,
    can,
    product,
    item: { additionOnly },
  } = order;
  if (additionOnly || product?.extenderid == null) return cnts;
  return update_extender_volume(
    cnts,
    get_cnt_for_product(product.extenderid, cache.cntmap, product),
    base,
    can?.basevolume
  );
}
export function update_extender_volume(cnts, extender, base, basevolume) {
  if (!extender || !base || !basevolume) return cnts;

  const without_extender = remove_extender(cnts, extender);

  let ext_vol;
  if (base.gravimetricfill) {
    const ext_mass =
      base.maxfill * basevolume * base.specificgravity -
      _.sum(without_extender.map((x) => x.volume * x.specificgravity));
    ext_vol = ext_mass / extender.specificgravity;
  } else {
    ext_vol =
      base.maxfill * basevolume - _.sum(without_extender.map((x) => x.volume));
  }

  // apply min/max rule
  const rule = base.basecntrule.find((x) => x.cntid === extender.cntid);
  if (rule?.maxamount != null) {
    ext_vol = Math.min(ext_vol, (basevolume * rule.maxamount) / 100);
  }
  const minamount =
    rule?.minamount == null ? EXTENDER_DEFAULT_MIN_PERCENT : rule.minamount;
  if (ext_vol < (basevolume * minamount) / 100) {
    ext_vol = 0;
  }

  const result = without_extender;
  if (ext_vol > 0) {
    result.push({ ...extender, volume: ext_vol });
  }
  return result;
}

export function remove_extender(cnts, extender) {
  return extender ? cnts.filter((x) => x.cntid !== extender.cntid) : cnts;
}

/**
 * Combine edited and original formulas and calculate addition.
 *
 * @param {array} cnts Array of {cntid, volume, ...}
 * @param {array} original_cnts Array of {cntid, volume}
 * @param {number} addition_scaling_factor > 1 in correction with base addition
 *
 * @return {array} Array of {cntid, volume, originalvolume, additionvolume, ...}
 */
export function merge_original_volumes(
  cnts,
  initial_cnts,
  original_cnts,
  addition_scaling_factor = 1
) {
  const originals = _.fromPairs(
    original_cnts.map((cnt) => [surrogate_id(cnt), cnt])
  );
  const initials = _.fromPairs(
    initial_cnts.map((cnt) => [surrogate_id(cnt), cnt])
  );

  const r = [];
  for (const c of cnts) {
    const id = surrogate_id(c);
    const original = originals[id];
    if (original) {
      delete originals[id];
    }
    const originalvolume = original ? original.volume : 0;
    const initialvolume = initials[id]?.volume || 0;

    const additionvolume = c.volume * addition_scaling_factor - originalvolume;
    r.push({ ...c, initialvolume, originalvolume, additionvolume });
  }
  // If some of original_cnts have been removed from cnts they remain now in originals
  for (const original of Object.values(originals)) {
    if (original.volume)
      r.push({
        ...original,
        volume: 0,
        initialvolume: initials[surrogate_id(original)]?.volume || 0,
        originalvolume: original.volume,
        additionvolume: -original.volume,
      });
  }
  return r;
}

function surrogate_id(cnt) {
  return cnt.cntid == null ? `code=${cnt.cntcode}` : `id=${cnt.cntid}`;
}

export function base_addition_scaling_factor(cnts, original_cnts) {
  const originalVolumes = _.fromPairs(
    original_cnts.filter((x) => x.cntid != null).map((x) => [x.cntid, x.volume])
  );
  const factors = cnts.map((x) => {
    const original = originalVolumes[x.cntid] || 0;
    delete originalVolumes[x.cntid];
    return original / x.volume;
  });
  if (_.isEmpty(originalVolumes)) {
    return Math.max(1, ...factors);
  }
  // new formula is missing colorants:
  return Infinity;
}

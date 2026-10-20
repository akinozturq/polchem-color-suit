export function get_cnt_for_product(cntid, cntmap, product) {
  // Get colorant from colorant map and adjust for the product if necessary
  const cnt = cntmap.get(cntid);
  if (!cnt) return null;

  // Adjust the colorant for the product if necessary
  return adjust_cnt_for_product(cnt, product);
}

export function adjust_cnt_for_product(cnt, product) {
  // If the colorant is a base colorant in the product, merge it
  if (cnt.abaseid != null && product?.blendedbase != null) {
    const basecnt = product.basecnts.find((x) => x.abaseid === cnt.abaseid);
    if (basecnt) {
      return { ...cnt, ...basecnt };
    }
  }
  // Otherwise, return the original colorant
  return cnt;
}

export function is_cnt_in_product(cnt, product) {
  // Check colorant in system unless empty system
  if (
    product?.cntinsystem?.length &&
    !product.cntinsystem.includes(cnt.cntid)
  ) {
    return false;
  }

  // Check blended base
  return (
    cnt.abaseid == null || // Non-base colorants are always included
    (product?.blendedbase != null &&
      product.basecnts.some((x) => x.abaseid === cnt.abaseid))
  );
}

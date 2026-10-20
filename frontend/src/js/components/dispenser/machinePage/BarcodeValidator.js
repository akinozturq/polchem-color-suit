export function validate_machine_barcode(
  colorant_barcode,
  canister_barcode,
  confirmation_cnt,
  barcode_canister_action,
  config_values,
  cache,
  machine,
  t,
  canister
) {
  const db_cnt = cache.cntmap.get(canister.cntid);

  const confirmation_cntcode = confirmation_cnt
    ? cache.cntmap.get(confirmation_cnt.cntid)?.cntcode
    : null;

  const cansize =
    confirmation_cnt &&
    cache.cansizes.find((c) => c.cansizeid === confirmation_cnt.cansizeid);
  const to_add =
    (cansize?.nominalamount || 0) * (config_values.refill_factor || 1);

  const require_canister_barcode =
    machine?.config?.canister_barcode_confirmation;
  const require_colorant_barcode =
    machine?.config?.colorant_barcode_confirmation;
  const errors = [];
  let barcode_validation_ok = true;

  if (confirmation_cnt) {
    if (canister.cntid !== confirmation_cnt.cntid) {
      barcode_validation_ok = false;
      errors.push(
        t(
          'msg.canisterCannotContainCnt',
          'Canister {{machine_cnt.id}} cannot contain {{db_cnt.cntcode}} colorant.\n' +
            'Please choose a compatible colorant.',
          { machine_cnt: canister, db_cnt: { cntcode: confirmation_cntcode } }
        )
      );
    } else if (canister.currLevel + to_add > canister.maxLevel) {
      barcode_validation_ok = false;
      errors.push(
        t(
          'msg.canisterCannotContainVolume',
          'Canister {{machine_cnt.id}} cannot contain the volume of the chosen {{db_cnt.cntcode}} colorant.',
          { machine_cnt: canister, db_cnt }
        )
      );
    }
  }
  if (!cansize && colorant_barcode) {
    barcode_validation_ok = false;
    errors.push(t('msg.unknownColorantBarcode', 'Unknown colorant barcode'));
  }
  if (canister_barcode && canister_barcode !== canister.barcode) {
    barcode_validation_ok = false;
    // check if barcode is assigned to another canister
    const machine_cnt = machine.colorants.find(
      (c) => c.barcode === canister_barcode
    );
    if (machine_cnt) {
      errors.push(
        t(
          'msg.canisterBarcodeValidInvalidCanisterCnt',
          'Barcode assigned to canister id {{selectedCnt.id}}({{selectedCnt.code}}) does not the read code {{machine_cnt.id}}({{machine_cnt.code}})',
          { selectedCnt: canister, machine_cnt }
        )
      );
    } else {
      errors.push(t('msg.unknownCanisterBarcode', 'Unknown canister barcode'));
    }
  }

  // cases where required barcodes are not assigned
  if (require_canister_barcode && !canister.barcode) {
    errors.push(
      t(
        'msg.canisterBarcodeNotAssignedCode',
        'Barcode not assigned to Canister id {{machine_cnt.id}}({{machine_cnt.code}})',
        { machine_cnt: canister }
      )
    );
  }
  if (
    require_colorant_barcode &&
    db_cnt &&
    !db_cnt.cntcans.find((ccan) => ccan.barcodes.length > 0)
  ) {
    errors.push(
      t(
        'msg.colorantBarcodeNotAssigned',
        'No barcode defined for colorant in database. Report to database manager that colorant {{db_cnt.cntcode}} is missing barcodes',
        { db_cnt }
      )
    );
  }

  const missing_barcode = require_colorant_barcode
    ? !colorant_barcode || (require_canister_barcode && !canister_barcode)
    : false;
  // alt_canisters available if started from colorant barcode
  const { alt_canisters } = canister;

  let valid_style = '';
  let info_1st_line = '';
  let info_txt = [];

  if (errors.length) {
    valid_style = 'alert-danger';
    info_1st_line = t('lbl.error', 'Error');
    info_txt = errors;
  } else if (
    alt_canisters &&
    alt_canisters.length > 1 &&
    !barcode_canister_action
  ) {
    info_1st_line = t('lbl.warning', 'Warning');
    valid_style = 'alert-warning';
    info_txt.push(
      t('msg.cntInMultipleCanisters', 'This colorant is in multiple canisters')
    );
    if (alt_canisters.every((c) => c.barcode)) {
      info_txt.push(
        t('msg.readCanisterBarcode', 'Please read a canister barcode')
      );
      barcode_validation_ok = false;
    }
  } else if (missing_barcode) {
    barcode_validation_ok = false;
    if (require_canister_barcode) {
      info_txt.push(
        t(
          'msg.readColorantOrCanisterBarcode',
          'Please read (or manually input) a colorant or canister barcode'
        )
      );
    } else {
      info_txt.push(
        t(
          'msg.readColorantBarcode',
          'Please read (or manually input) a colorant barcode'
        )
      );
    }
  } else {
    valid_style = 'alert-success';
    info_1st_line = t(
      'msg.compatibilityCheckSuccess',
      'Compatibility check successfully passed'
    );
    info_txt.push(
      t(
        'msg.confirmRefillCanister',
        'You have chosen to refill your canister {{machine_cnt.id}} with colorant {{db_cnt.cntcode}}.',
        { machine_cnt: canister, db_cnt }
      )
    );
  }

  return {
    valid_style,
    info_1st_line,
    info_txt,
    barcode_validation_ok,
    cansize,
  };
}

import _ from 'lodash';

import { EI_VARIABLES_EXC_INC_TAX } from 'polchem_base/common/EIVariables';



export const EXTRA_INFO_TRANS_MAP = () => {

  return _.fromPairs(EI_VARIABLES_EXC_INC_TAX().map((x) => [x.code, x.name]));

};



export function protectionStatusTranslations(t) {

  return {

    0: t('protectionStatus.0', 'Undetermined license state'),

    1: t('protectionStatus.1', 'Active license'),

    2: t('protectionStatus.2', 'Active trial'),

    3: t('protectionStatus.3', 'Online concurrent license'),

    4: t('protectionStatus.4', 'Daemon network license'),

    5: t('protectionStatus.5', 'Daemon long term license'),



    '-1': t('protectionStatus.-1', 'License expired'),

    '-2': t('protectionStatus.-2', 'System time tampering'),

    '-3': t('protectionStatus.-3', 'Product not authorized'),

    '-4': t('protectionStatus.-4', 'Product not found'),

    '-5': t('protectionStatus.-5', 'Invalid license'),

    '-6': t('protectionStatus.-6', 'License returned to server'),

    '-7': t('protectionStatus.-7', 'Invalid system date'),

    '-8': t('protectionStatus.-8', 'Product in invalid state'),

    '-50': t('protectionStatus.-50', 'No available licenses'),

    '-110': t('protectionStatus.-110', 'Product inactive (server return)'),

    '-111': t('protectionStatus.-111', 'Invalid trial period (server return)'),

    '-112': t(

      'protectionStatus.-112',

      'ComputerID activated too many times (server return)'

    ),

    '-113': t('protectionStatus.-113', 'Trial has expired (server return)'),

    '-114': t(

      'protectionStatus.-114',

      'License number inactive (server return)'

    ),

    '-115': t(

      'protectionStatus.-115',

      'Number of allowed activations exceeded (server return)'

    ),

    '-116': t('protectionStatus.-116', 'Trial has expired'),

    '-117': t('protectionStatus.-117', 'Duplicate device id'),

    '-200': t('protectionStatus.-200', 'Too many heartbeats missed'),

  };

}



// DO NOT REMOVE, needed to build translations

export function translationsToBeScanned(t) {

  return [

    t('extraInfo.canCode', 'Can code'),

    t('extraInfo.baseAdjusted', 'Base price adjust'),

    t('extraInfo.baseOffset', 'Base price offset'),

    t('extraInfo.hardenerAdjusted', 'Hardener price adjust'),

    t('extraInfo.hardenerOffset', 'Hardener price offset'),

    t('extraInfo.cntAdjusted', 'Colorant price adjust'),

    t('extraInfo.cntOffset', 'Colorant price offset'),



    t('extraInfo.priceGroupBarcode', 'Price group barcode'),

    t('extraInfo.hardenerName', 'Hardener name'),

    t('extraInfo.cntCostPerLiter', 'Colorant cost / liter'),

    t('extraInfo.cntPricePerLiter', 'Colorant price / liter'),

    t('frm.BAD_BASE', 'Incorrect basepaint'),

    t('frm.BAD_CNT', 'Incorrect colorant'),

    t('frm.BAD_COMBINATION', 'Denied colorant combination'),

    t('frm.EMPTY_FORMULA', 'Empty formula'),

    t('frm.NOT_IN_SYSTEM', 'Colorant not in system'),

    t('frm.TOO_LITTLE_CNT', 'Too little colorant'),

    t('frm.TOO_MUCH_CNT', 'Too much colorant'),

    t('frm.TOO_MUCH_VOC', 'Over VOC limit'),

    t('cfg.h_offline', 'Offline'),

    t('cfg.h_standalone2cloud', 'Order synchronization'),

    t('cfg.mandatory_customer_companyname', 'Mandatory customer company name'),

    t('cfg.mandatory_customer_email', 'Mandatory customer email'),

    t('cfg.mandatory_customer_phone', 'Mandatory customer phone number'),

    t('cfg.mandatory_customer_address1', 'Mandatory customer address'),

    t('cfg.mandatory_customer_address2', 'Mandatory customer city'),

    t('cfg.mandatory_customer_postcode', 'Mandatory customer zip code'),

    t('cfg.mandatory_customer_country', 'Mandatory customer country'),

    t('cfg.host', 'Database host'),

    t('cfg.port', 'Port'),

    t('cfg.user', 'User'),

    t('cfg.password', 'Password'),

    t('fn.listDatabases', 'List databases'),

    t('cfg.database', 'Database'),

    t('cfg.site', 'Site'),

    t('fn.choose', 'Choose...'),

    t('cfg.outputFile', 'Output file'),

    t('cfg.uploadUrl', 'Upload URL'),

    t('cfg.authorizationToken', 'Authorization token'),

    t('fn.startSync', 'Start synchronization'),

    t('msg.waiting', 'Waiting for action...'),

    t('cfg.h_customer_data', 'Customer'),

    t('cfg.h_formula_changes', 'Formula changes'),

    t('cfg.hide_match_alternative_formulas', 'Hide match alternative formulas'),

    t('format.time', 'HH:mm'),

    t('format.date', 'MM/DD/YYYY'),

    t('format.datetime', 'YYYY/MM/DD HH:mm'),

  ];

}


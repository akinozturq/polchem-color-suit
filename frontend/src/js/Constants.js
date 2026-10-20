import _ from 'lodash';



import { isInt } from './mylib/Utils';



let vers = 1;

try {

  let url = window.location.pathname.split('/');

  for (let i = 0; i < url.length; i++) {

    let t = url[i].replace('v', '');

    if (isInt(t)) {

      vers = parseInt(t, 10);

      break;

    }

  }

} catch (e) {

  console.log(e);

}



function extractDbName(url) {

  // Split the URL by '/' to get an array of segments

  const segments = url.split('/');



  // Find the index of "db" in the segments

  const dbIndex = segments.indexOf('db');



  if (dbIndex !== -1 && dbIndex + 1 < segments.length) {

    return segments[dbIndex + 1];

  } else {

    return null; // Return null if "db" is not found or [dbname] is not found

  }

}



export const OFFLINE_MODE_URL = 'http://localhost:43521';



// Detect offline mode if window origin matches the offline origin

export const offline_mode = window.location.origin === OFFLINE_MODE_URL;



// Accessing import.meta.env from a function during initialization can fail.

// Use this constant instead.

export const DEV_MODE = import.meta.env.DEV;



export const DB_NAME = extractDbName(window.location.pathname);

console.log('Database name:', DB_NAME);



export const HTML_COLOR_RED = '#BB0516';

export const HTML_COLOR_YELLOW = '#F6DB78';

export const HTML_COLOR_BLUE = '#458dd5';

export const HTML_COLOR_DARK_BLUE = '#0d2738';



export const COLORCODE_MAX_LENGTH = 48;

export const COLORNAME_MAX_LENGTH = 40;

export const BASECODE_MAX_LENGTH = 12;

export const CANSIZECODE_MAX_LENGTH = 12;



export const LICENSE_TYPE_NALPEIRON = 'N';

export const LICENSE_TYPE_OWN = 'O';



/**

 * Features to check

 */

export const FEATURE_POS_MATCHING = 'LABMA';

export const FEATURE_IST_PRO = 'IST_PRO';

export const FEATURE_REPLICATION = 'REPL';



export const FEATURE_PRO = 'PRO';

export const FEATURE_IT4 = 'IT4';



/**

 * Replication states

 */



export const NO_REPLICATION = 'NO_REPLICATION';



export const REP_STATE_RECIEV = 'RE';

export const REP_STATE_SEND = 'SE';

export const REP_STATE_ASK = 'AS';

export const REP_STATE_SLEEP = 'SL';

export const REP_STATE_FULLSYNC_NOW = 'FN';

export const REP_STATE_FULLSYNC_AT = 'FT';

export const REP_STATE_FULLSYNC_AT_MISSED = 'MI';

export const REP_STATE_FULLSYNC_AT_NEXT_NIGHT = 'NN';

export const REP_STATE_FULLSYNC_AT_PROGRESS = 'FP';

export const REP_STATE_FULLSYNC_GENERATED = 'FG';

export const REP_STATE_FULLSYNC_WAITING = 'FW';



export const REP_STATE_MAP = {

  [REP_STATE_RECIEV]: 'Receiving data',

  [REP_STATE_SEND]: 'Sending data',

  [REP_STATE_ASK]:

    "Received formula database full synchronization. Do you want to start the synchronization process now? \nNOTE: Polchem Color Suit can't be used for tinting before the process is finished ",

  [REP_STATE_FULLSYNC_NOW]: 'Do full synchronization now',

  [REP_STATE_SLEEP]: 'Sleeping',

  [REP_STATE_FULLSYNC_AT]: 'Run full synchronization during next night',

  [REP_STATE_FULLSYNC_AT_MISSED]:

    "Full synchronization missed. Do you want to start the synchronization process now? \nNOTE: Polchem Color Suit can't be used for tinting before the process is finished ",

  [REP_STATE_FULLSYNC_AT_PROGRESS]: 'Synchronizing the database',

  [REP_STATE_FULLSYNC_GENERATED]: 'Synchronizing message generated',

  [REP_STATE_FULLSYNC_WAITING]:

    'Waiting for replication to start synchronization message generation',

};



/**

 * UAC auto log out options

 * 0 = Never, 1 = After idle timeout, 2 = After order creation, 3 = After card removal

 */

export const UAC_AUTO_LOGOUT_NEVER = 0;

export const UAC_AUTO_LOGOUT_AFTER_IDLE = 1;

export const UAC_AUTO_LOGOUT_AFTER_ORDER = 2;

export const UAC_AUTO_LOGOUT_AFTER_CARD_REMOVAL = 3;



export const UAC_AUTO_LOGOUT_INTERVAL_MINIMUM = 10; // minimum idle timeout in seconds



/** Orderitem colourcodetype values: */

export const COLOR_CODE_UNIQUE = 'C';

export const COLOR_CODE_ALTERNATIVE = 'A';



/**

 * Orderitem source values:

 */

export const SOURCE_USER = 'U'; // formula created by user i.e. custom formula

export const SOURCE_EXTERNAL = 'E'; // formula from external application

export const SOURCE_EXTERNAL_ERROR = 'D'; // formula from external application that contained some error

export const SOURCE_IMPORT = 'I'; // imported history item

// Additional possible values for OrderItem.source

export const SOURCE_MAIN = 'M'; // formula from main db

export const SOURCE_ADDITION = 'A'; // addition formula

export const SOURCE_PURGE = 'P'; // purge

export const SOURCE_FREE_DISPENSE = 'F'; // free dispense



export const COLDATACLASS_SPHERE = 'SP';

export const COLDATACLASS_45 = '45';



export const FRONT_END_VERSION = vers;



export const ORDER_MODE_NORMAL = 'ORDER_MODE/NORMAL';

export const ORDER_MODE_FREE_DISPENSE = 'ORDER_MODE/FREE_DISPENSE';

export const ORDER_MODE_MATCHING = 'ORDER_MODE/MATCHING';

export const ORDER_MODE_FORMULA_CORRECTION = 'ORDER_MODE/FORMULA_CORRECTION';

export const ORDER_MODE_LOCAL_FORMULA = 'ORDER_MODE/LOCAL_FORMULA';



export const COLOR_SEARCH_CARD = 'COLOR_SEARCH_CARD';

export const PRODUCT_SEARCH_CARD = 'PRODUCT_SEARCH_CARD';

export const ARTICLE_SEARCH_CARD = 'ARTICLE_SEARCH_CARD';

export const MATCH_SEARCH_CARD = 'MATCH_SEARCH_CARD';

export const FORMULA_SEARCH_CARD = 'FORMULA_SEARCH_CARD'; // closest colors and matching results

export const FORMULA_INPUT_CARD = 'FORMULA_INPUT_CARD';

export const AMOUNT_CARD = 'AMOUNT_CARD'; // can sizes

export const INFO_CARD = 'INFO_CARD'; // order ready

export const PRIMER_CARD = 'PRIMER_CARD'; // primer recommendation



export const COLOR_SEARCH = 'COLOR_SEARCH';

export const CARD_SEARCH = 'CARD_SEARCH';

export const MATCH_SEARCH = 'MATCH_SEARCH';



export const PRODUCT_SEARCH_MODE_LIST = 'PRODUCT_LIST';

export const PRODUCT_SEARCH_MODE_TREE = 'PRODUCT_TREE';

export const PRODUCT_SEARCH_MODE_MATCH = 'PRODUCT_MATCH';



export const FORMULA_CORRECTION_TYPE_ADD_CNT = 'addcnt';

export const FORMULA_CORRECTION_TYPE_REFORMULATE = 'reformulate';

export const FORMULA_CORRECTION_TYPE_ADD_BASE = 'addbase';



export const MACHINECATEGORY_AUTOMATIC = 'A';

export const MACHINECATEGORY_MANUAL = 'M';

export const MACHINECATEGORY_FLINK = 'F';

export const MACHINECATEGORY_NONE = 'N';



export const MACHINE_PROGRESS_PURGE_AUTOMATIC_PREPARE =

  'purge_automatic_prepare';

export const MACHINE_PROGRESS_PURGE = 'purge';

export const MACHINE_PROGRESS_PURGE_ALL = 'purge_all';

export const MACHINE_PROGRESS_PURGE_AUTOMATIC = 'purge_automatic';

export const MACHINE_PROGRESS_TINT = 'tint';



export const MACHINE_STATE_DISPENSE = 'DISPENSE';

export const MACHINE_STATE_GRAVIMETRIC_DISPENSING =

  'START_GRAVIMETRIC_DISPENSING';

export const MACHINE_STATE_FORMULA_DISPENSED_GRAVIMETRICALLY =

  'FORMULA_DISPENSED_GRAVIMETRICALLY';

export const MACHINE_STATE_FORMULA_PARTIALLY_DISPENSED_GRAVIMETRICALLY =

  'FORMULA_PARTIALLY_DISPENSED_GRAVIMETRICALLY';

export const MACHINE_STATE_CAN_READY = 'CAN_READY';

export const MACHINE_STATE_WAIT_FOR_BARCODE_VALIDATION =

  'WAIT_FOR_BARCODE_VALIDATION';

export const MACHINE_STATE_WAIT_FOR_CAN_IN = 'WAIT_FOR_CAN_IN';

export const MACHINE_STATE_CAN_INSERTED = 'CAN_INSERTED';

export const MACHINE_STATE_WAIT_FOR_CAN_REMOVAL = 'WAIT_FOR_CAN_REMOVAL';

export const MACHINE_STATE_IDLE = 'IDLE';

export const MACHINE_STATE_SPLIT_FORMULA_OPEN_REFILL =

  'SPLIT_FORMULA_OPEN_REFILL';

export const MACHINE_STATE_ERROR = 'ERROR';



export const WAIT_FOR_SPLIT_FORMULA_REFILL_DONE =

  'WAIT_FOR_SPLIT_FORMULA_REFILL_DONE';



export const MACHINE_ACTION_CANCEL = 'cancel';

export const MACHINE_ACTION_CONTINUE = 'continue';

export const MACHINE_ACTION_OK = 'ok';

export const MACHINE_ACTION_RETRY = 'retry';

export const MACHINE_ACTION_CAN_CONFIRM = 'can_confirmation';

export const MACHINE_ACTION_BARCODE_CONFIRMATION = 'barcode_confirmation';



// Machine formula validation results

export const MACHINE_VALIDATE_OK = 0;

export const MACHINE_VALIDATE_WARNING_LEVEL = 1;

export const MACHINE_VALIDATE_CRITICAL_LEVEL = 2;

export const MACHINE_VALIDATE_CNT_MORE_THAN_CANISTER = 3;

export const MACHINE_VALIDATE_CNT_MISSING = 4;

export const MACHINE_VALIDATE_CIR_MISSING = 5;

export const MACHINE_VALIDATE_OTHER_ERROR = 6;



export const MACHINE_MSG_ID_FILL_UP_CANISTERS = 10;

export const MACHINE_MSG_ID_DISPENSING_ERROR_DETAIL_NEW = 56;

export const MACHINE_MSG_ID_CAN_READY = 200;

export const MACHINE_MSG_ID_CAN_TINTED = 205;

export const MACHINE_FLUID_MSG_ID_REMOVE_CAN = 200000002;

export const MACHINE_MSG_ID_BARCODE_VALIDATION = 202;

export const MACHINE_MSG_ID_OPEN_REFILL_PANEL = 203;

export const MACHINE_MSG_ID_HOPPER_CLEAN_WARNING = 102774307;

export const MACHINE_MSG_ID_DISPENSER_CLEAN_WARNING = 102774306;



export const MACHINE_HIDE_MESSAGES = [

  MACHINE_MSG_ID_CAN_READY,

  MACHINE_MSG_ID_OPEN_REFILL_PANEL,

  MACHINE_MSG_ID_BARCODE_VALIDATION,

  MACHINE_MSG_ID_CAN_TINTED,

];



export const MACHINE_WARNING_MSG_ICON = 2;



export const MACHINE_ERROR_ABORT = 5;



// Machine Cap Action

export const MACHINE_CAP_OPEN = 1;

export const MACHINE_CAP_CLOSE = 0;



// Reserved dispID value for F-Link

export const DISPID_FLINK_DISPENSER = 'DISPID_FLINK_DISPENSER';



export const SERVICE_STATUS_OPEN = 'O';

export const SERVICE_STATUS_IN_PROGRESS = 'I';

export const SERVICE_STATUS_CLOSED = 'C';



export const FIXED_ABASEAMOUNT = 1000.0;

export const ADD_TYPE_MAIN = 'M';

export const ADD_TYPE_BANNER = 'A';

export const ADD_TYPE_SPLASH = 'S';



// From dbconsts.py: smallest volume of extender to add, % of base

export const EXTENDER_DEFAULT_MIN_PERCENT = 0.1;



export const MIN_LOCAL_FORMULA_CODE_LENGTH = 1;



export const MIN_PERCENTAGE_THRESHOLD_BATCH_WARNING = 0.1;

export const ZERO_VOLUME_THRESHOLD_ML = 0.0001;



// Machine License status

export const MACHINE_LICENSE_REG_SUCCESS = 0;

export const MACHINE_LICENSE_REG_FAILED = 1;

export const MACHINE_LICENSE_REG_OVER = 2;

export const MACHINE_LICENSE_DATE_ERROR = 3;



/* Key Code list by http://www.javascriptkeycode.com */

export const KEY_CODES = [

  { id: 8, name: 'Backspace' },

  { id: 9, name: 'Tab' },

  { id: 13, name: 'Enter' },

  { id: 16, name: 'Shift' },

  { id: 17, name: 'Ctrl' },

  { id: 18, name: 'Alt' },

  { id: 19, name: 'Pause/Break' },

  { id: 20, name: 'Caps Lock' },

  { id: 27, name: 'Escape' },

  { id: 33, name: 'Page Up' },

  { id: 34, name: 'Page Down' },

  { id: 35, name: 'End' },

  { id: 36, name: 'Home' },

  { id: 37, name: '←' },

  { id: 38, name: '↑' },

  { id: 39, name: '→' },

  { id: 40, name: '↓' },

  { id: 45, name: 'Insert' },

  { id: 46, name: 'Delete' },

  { id: 48, name: '0' },

  { id: 49, name: '1' },

  { id: 50, name: '2' },

  { id: 51, name: '3' },

  { id: 52, name: '4' },

  { id: 53, name: '5' },

  { id: 54, name: '6' },

  { id: 55, name: '7' },

  { id: 56, name: '8' },

  { id: 57, name: '9' },

  { id: 63, name: 'ß' },

  { id: 64, name: '@' },

  { id: 65, name: 'A' },

  { id: 66, name: 'B' },

  { id: 67, name: 'C' },

  { id: 68, name: 'D' },

  { id: 69, name: 'E' },

  { id: 70, name: 'F' },

  { id: 71, name: 'G' },

  { id: 72, name: 'H' },

  { id: 73, name: 'I' },

  { id: 74, name: 'J' },

  { id: 75, name: 'K' },

  { id: 76, name: 'L' },

  { id: 77, name: 'M' },

  { id: 78, name: 'N' },

  { id: 79, name: 'O' },

  { id: 80, name: 'P' },

  { id: 81, name: 'Q' },

  { id: 82, name: 'R' },

  { id: 83, name: 'S' },

  { id: 84, name: 'T' },

  { id: 85, name: 'U' },

  { id: 86, name: 'V' },

  { id: 87, name: 'W' },

  { id: 88, name: 'X' },

  { id: 89, name: 'Y' },

  { id: 90, name: 'Z' },

  { id: 91, name: 'Left WinKey' },

  { id: 92, name: 'Right WinKey' },

  { id: 93, name: 'Select' },

  { id: 96, name: 'NumPad 0' },

  { id: 97, name: 'NumPad 1' },

  { id: 98, name: 'NumPad 2' },

  { id: 99, name: 'NumPad 3' },

  { id: 100, name: 'NumPad 4' },

  { id: 101, name: 'NumPad 5' },

  { id: 102, name: 'NumPad 6' },

  { id: 103, name: 'NumPad 7' },

  { id: 104, name: 'NumPad 8' },

  { id: 105, name: 'NumPad 9' },

  { id: 106, name: 'NumPad *' },

  { id: 107, name: 'NumPad +' },

  { id: 109, name: 'NumPad -' },

  { id: 110, name: 'NumPad .' },

  { id: 111, name: 'NumPad /' },

  { id: 112, name: 'F1' },

  { id: 113, name: 'F2' },

  { id: 114, name: 'F3' },

  { id: 115, name: 'F4' },

  { id: 116, name: 'F5' },

  { id: 117, name: 'F6' },

  { id: 118, name: 'F7' },

  { id: 119, name: 'F8' },

  { id: 120, name: 'F9' },

  { id: 121, name: 'F10' },

  { id: 122, name: 'F11' },

  { id: 123, name: 'F12' },

  { id: 144, name: 'Num Lock' },

  { id: 145, name: 'Scroll Lock' },

  { id: 186, name: ';' },

  { id: 187, name: '=' },

  { id: 188, name: ',' },

  { id: 189, name: '-' },

  { id: 190, name: '.' },

  { id: 191, name: '/' },

  { id: 192, name: '`' },

  { id: 219, name: '[' },

  { id: 220, name: '\\' },

  { id: 221, name: ']' },

  { id: 222, name: "'" },

];



// barcode action commands

export const BARCODE_PRODUCT = 'product';

export const BARCODE_COLOR = 'color';

export const BARCODE_FORMULA = 'formula';

export const BARCODE_COLORANT = 'colorant';

export const BARCODE_CANISTER = 'canister';

export const BARCODE_PREFIXCOLOURCODE = 'prefixColourCode';

export const BARCODE_PREFIXORDERLOADBYITEM = 'prefixOrderLoadByItem';

export const BARCODE_PREFIXORDERLOAD = 'prefixOrderLoad';



// Barcode action modes

export const BARCODE_MODE_NORMAL = 'Normal';

// Used when in dispensing view to prevent unwanted actions

export const BARCODE_MODE_DISPENSE = 'Dispense';



export const BARCODE_ACTIONS_IN_MODE = {

  [BARCODE_MODE_NORMAL]: [

    'actionRetry',

    'actionOk',

    'actionSkip',

    'actionCancel',

    'actionContinue',

    'actionCreateNew',

    'actionDispense',

    'actionSave',

    'actionSaveAndDispense',

  ],

  [BARCODE_MODE_DISPENSE]: [

    'actionRetry',

    'actionOk',

    'actionSkip',

    'actionCancel',

    'actionContinue',

  ],

};



// Barcode validation states

export const BARCODE_VALIDATION_SCAN = 'BARCODE_VALIDATION_SCAN'; // Prompt user to scan barcode

export const BARCODE_VALIDATION_ERROR = 'BARCODE_VALIDATION_ERROR'; // Incorrect barcode scanned

export const BARCODE_VALIDATION_CONFIRM = 'BARCODE_VALIDATION_CONFIRM'; // Barcode is valid, user to confirm

export const BARCODE_VALIDATION_OK = 'BARCODE_VALIDATION_OK'; // Barcode is valid

export const BARCODE_VALIDATION_NONE = 'BARCODE_VALIDATION_NONE'; // No validation needed



// Punch logic

export const PUNCH_LOGIC_LIST = {

  0: 'Punch never',

  1: 'Ask if to punch',

  2: 'Punch always',

  3: 'Use default logic (from DB)',

};



// Flink type



//Flink types

export const FLINK_TYPE_STANDARD = 'standard';

export const FLINK_TYPE_STANDARD_GRAVIMETRIC = 'standard_gravimetric';

export const FLINK_TYPE_TDF = 'tdf';

export const FLINK_TYPE_TDF_GRAVIMETRIC = 'tdf_gravimetric';

export const FLINK_TYPE_CC9 = 'cc9';



export const FLINK_TYPES_LIST = [

  FLINK_TYPE_STANDARD,

  FLINK_TYPE_STANDARD_GRAVIMETRIC,

  FLINK_TYPE_TDF,

  FLINK_TYPE_TDF_GRAVIMETRIC,

  FLINK_TYPE_CC9,

];



export const USERTYPE_SITE = 'S';

export const USERTYPE_SITE_MATCHING = 'B';

export const USERTYPE_IST = 'I';

export const USERTYPE_IST_PRO = 'P';

export const USERTYPE_WEBSTORE = 'W';



//

export const ORDER_STATUS_UNCONFIRMED = 'ORDER_STATUS_UNCONFIRMED';

export const ORDER_STATUS_EDITING = 'ORDER_STATUS_EDITING';

export const ORDER_STATUS_WAITING = 'ORDER_STATUS_WAITING';

export const ORDER_STATUS_PREPARING = 'ORDER_STATUS_PREPARING';

export const ORDER_STATUS_DONE = 'ORDER_STATUS_DONE';



// maps to int values for db

export const NUMERIC_ORDER_STATUS = {

  ORDER_STATUS_UNCONFIRMED: 0,

  ORDER_STATUS_EDITING: 1,

  ORDER_STATUS_WAITING: 2,

  ORDER_STATUS_PREPARING: 3,

  ORDER_STATUS_DONE: 4,

};



// maps int values from db

export const STRING_ORDER_STATUS = _.invert(NUMERIC_ORDER_STATUS);



export const MANUAL_LOGOUT = 'MANUAL_LOGOUT';



export const BOX_LEFT_STYLE = {

  backgroundColor: '#112E40',

  marginLeft: '1.5em',

  padding: '0',

  borderRadius: '0.5rem',

};



export const RTL_BOX_LEFT_STYLE = {

  backgroundColor: '#112E40',

  marginRight: '1.5em',

  padding: '0',

  borderRadius: '5%',

};



export const HTTP_ERROR_401 = 401;



export const HTTP_ERROR_422 = 422; // Unauthoritized



// Error types

export const ERROR_CRITICAL = 'ERROR_CRITICAL';

export const ERROR_WARNING = 'ERROR_WARNING';

export const ERROR_TINTING_MACHINE = 'ERROR_TINTING_MACHINE';



// Extra info numeric types



export const EXTRA_INFO_INT_KEYS = ['priceGroup'];

export const EXTRA_INFO_DOUBLE_KEYS = ['cntVolume'];

export const EXTRA_INFO_PERCENTAGE_KEYS = [

  'cntTaxRate',

  'taxRate',

  'baseTaxRate',

  'discountrate',

];



// Extra info apply discount to

export const EXTRA_INFO_APPLY_DISCOUNT = [

  'price',

  'pricePerKilogram',

  'pricePerLitre',

];



export const EXTRA_INFO_DISCOUNT = 'discount';

export const EXTRA_INFO_DISCOUNT_EDITOR = 'discount_editor';

export const EXTRA_INFO_BASE_ADJUSTMENT = 'baseAdjusted';

export const EXTRA_INFO_BASE_ADJUSTMENT_EDITOR = 'baseAdjusted_editor';

export const EXTRA_INFO_CNT_ADJUSTMENT = 'cntAdjusted';

export const EXTRA_INFO_CNT_ADJUSTMENT_EDITOR = 'cntAdjusted_editor';

export const EXTRA_INFO_PRICEGROUP = 'priceGroup';



export const MAX_REQUEST_TRIALS = 3;



export const PRINTING_TASK = 'PRINTING_TASK';

export const PRINTING_LABEL = 'PRINTING_LABEL';

export const EMAIL_TEMPLATE = 'EMAIL_TEMPLATE';



export const INITIAL_EP_LAYOUT = {

  items: {}, // to map items ids to items

  itemids: [], // to maintain order of items

  itemTypeCounts: {}, // counts each item type to help generate names

  nextid: 0, // unused id for next item to be created

  width: { pixel: 340, mm: 90 }, // width

  height: { pixel: 250, mm: 29 }, // height

  marginTop: 0, // editor page margins in mm

  marginBottom: 0,

  marginLeft: 0,

  marginRight: 0,

  orientation: 'landscape',

};



export const EMPTY_PRINT_TASK = {

  name: 'NEW',

  after_error: false,

  after_tint: false,

  all_before_tint: false,

  before_tint: false,

  conditions: [],

  deletable: false,

  logical_conjunction: 'OR',

  num_labels: 1,

  on_request: false,

  show_preview: false,

  stop_after_task_done: false,

  template: null,

};



export const DEFAULT_PRINTER = 'DEFAULT_PRINTER';



export const NUMBERFORMATTER = 'numberFormatter';

export const PERCENTAGEFORMATTER = 'percentageFormatter';

export const SHOTFORMATTER = 'shotFormatter';

export const CURRENCYFORMATTER = 'currencyFormatter';



export const UNIT_GRAVIMETRIC = 'gravimetric';

export const UNIT_VOLUMETRIC = 'volumetric';



export const LEVEL_UNITS = [

  {

    unitname: 'ml',

    display_name: 'ml',

    mainunit: 1.0,

    decimals: 0,

    div1: 1,

    gravimetric: false,

  },

  {

    display_name: 'l',

    unitname: 'lt',

    mainunit: 1000.0,

    decimals: 2,

    div1: 1,

    gravimetric: false,

  },

  {

    display_name: 'g',

    unitname: 'gr',

    mainunit: 1.0,

    decimals: 0,

    div1: 1,

    gravimetric: true,

  },

  {

    display_name: 'kg',

    unitname: 'kg',

    mainunit: 1000.0,

    decimals: 2,

    div1: 1,

    gravimetric: true,

  },

  {

    display_name: 'US gal',

    unitname: 'U.S. gal',

    mainunit: 3785.41,

    decimals: 2,

    div1: 1,

    gravimetric: false,

  },

  {

    display_name: 'US qt',

    unitname: 'U.S. quarts',

    mainunit: 946.353,

    decimals: 2,

    div1: 1,

    gravimetric: false,

  },

  {

    display_name: 'Imp. gal',

    unitname: 'Imp. gal',

    mainunit: 4546.09,

    decimals: 2,

    div1: 1,

    gravimetric: false,

  },

  {

    display_name: 'lb',

    unitname: 'lb',

    mainunit: 453.592,

    decimals: 2,

    div1: 1,

    gravimetric: true,

  },

  {

    display_name: 'U.S. fl. oz.',

    unitname: 'U.S. fl. oz.',

    mainunit: 29.5735,

    decimals: 2,

    div1: 1,

    gravimetric: false,

  },

  {

    display_name: 'Imp. fl. oz.',

    unitname: 'Imp. fl. oz.',

    mainunit: 28.4131,

    decimals: 2,

    div1: 1,

    gravimetric: false,

  },

];



export const FORMULA_VERSION_HISTORY = 'H';

export const FORMULA_VERSION_ALTERNATIVE = 'A';



// Update states



export const STATE_NO_UPDATE = 'STATE_NO_UPDATE';

export const STATE_CHECKING_UPDATES = 'STATE_CHECKING_UPDATES';

export const STATE_UPDATES_AVAILABLE = 'STATE_UPDATES_AVAILABLE';

export const STATE_DOWNLOADING_UPDATE = 'STATE_DOWNLOADING_UPDATE';

export const STATE_READY_TO_UPDATE = 'STATE_READY_TO_UPDATE';



// Formula sort by options



export const FORMULA_SORT_BY_CNTCODE_ASC = 'cntcode_asc';
export const FORMULA_SORT_BY_VOLUME_DESC = 'volume_desc';
export const FORMULA_SORT_BY_MASS_DESC = 'mass_desc';
export const CANISTERS_PANEL_SORT_BY_CANISTERS_ASC = 0;
export const CANISTERS_PANEL_SORT_BY_LEVELS_ASC = 1;

// Print task default printer


export const PRINT_TASK_DEFAULT = 'Default';



// Right to left languages

/**

ar	Arabic

arc	Aramaic

dv	Divehi

fa	Persian

ha	Hausa

he	Hebrew

khw	Khowar

ks	Kashmiri

ku	Kurdish

ps	Pashto

ur	Urdu

yi	Yiddish

 */

export const RIGHT_TO_LEFT_LANGUAGES = [

  'ar',

  'arc',

  'dv',

  'fa',

  'ha',

  'he',

  'khw',

  'ks',

  'ku',

  'ps',

  'ur',

  'yi',

];



export const SEGOE_UI_LANGUAGES = ['ar']; // Languages that use Segoe UI font

export const SEGOE_UI = 'Segoe UI, Segoe UI light, sans-serif';

export const DEFAULT_FONT = 'Noto Sans, sans-serif'; // Default font for all other languages



export const MINIMUM_BATCH_NUMBER_LENGHT = 4;



export const DEFAULT_LOGIN_USERNAME = 'StandAlone';

export const DEFAULT_LOGIN_PASSWORD = 'LeaveMeAlone';



export const MIN_PASSWORD_LENGTH = 4;



export const ERROR_THEME = {

  main: 'line-height:1.3;color:#66d9ef;background:#272822;overflow:unset;',

  key: 'color:#f92672;',

  string: 'color:#fd971f;',

  value: 'color:#a6e22e;',

  boolean: 'color:#ac81fe;',

};



export const COLORS = [

  [222, 61, 105],

  [73, 204, 97],

  [160, 55, 180],

  [106, 183, 53],

  [148, 85, 211],

  [179, 196, 46],

  [54, 89, 203],

  [201, 181, 48],

  [117, 115, 239],

  [59, 152, 42],

  [205, 107, 227],

  [154, 206, 87],

  [114, 79, 190],

  [145, 168, 36],

  [220, 79, 187],

  [94, 183, 100],

  [197, 51, 146],

  [68, 205, 161],

  [227, 62, 137],

  [47, 146, 86],

  [159, 63, 158],

  [69, 126, 39],

  [218, 127, 218],

  [136, 172, 77],

  [94, 129, 234],

  [233, 148, 53],

  [74, 146, 235],

  [230, 105, 43],

  [91, 89, 184],

  [218, 173, 68],

  [115, 71, 158],

  [115, 137, 39],

  [171, 130, 229],

  [159, 138, 37],

  [46, 108, 180],

  [197, 54, 22],

  [72, 202, 211],

  [209, 37, 71],

  [46, 165, 155],

  [234, 87, 65],

  [87, 181, 227],

  [179, 46, 39],

  [125, 195, 142],

  [171, 49, 108],

  [49, 114, 48],

  [228, 111, 179],

  [68, 90, 6],

  [138, 100, 179],

  [180, 183, 93],

  [87, 86, 160],

  [192, 125, 34],

  [53, 87, 153],

  [194, 87, 43],

  [80, 146, 201],

  [223, 79, 81],

  [65, 154, 120],

  [236, 110, 149],

  [48, 106, 60],

  [231, 150, 214],

  [94, 114, 34],

  [120, 67, 137],

  [120, 114, 26],

  [149, 155, 224],

  [177, 97, 35],

  [115, 121, 188],

  [147, 105, 32],

  [204, 166, 231],

  [91, 91, 16],

  [164, 83, 152],

  [101, 148, 88],

  [232, 100, 106],

  [32, 110, 84],

  [185, 79, 104],

  [65, 90, 31],

  [173, 128, 190],

  [89, 114, 54],

  [154, 72, 118],

  [169, 181, 119],

  [74, 85, 137],

  [239, 143, 101],

  [109, 99, 157],

  [185, 135, 65],

  [140, 84, 127],

  [212, 177, 114],

  [146, 70, 95],

  [146, 134, 70],

  [205, 131, 174],

  [82, 86, 32],

  [225, 137, 152],

  [107, 110, 55],

  [168, 71, 71],

  [111, 93, 29],

  [221, 126, 111],

  [118, 81, 19],

  [150, 72, 81],

  [215, 155, 109],

  [159, 71, 44],

  [143, 105, 62],

  [129, 74, 40],

  [162, 101, 55],

];



export const PRIVILEGE_MATCHING = 'order_matching';


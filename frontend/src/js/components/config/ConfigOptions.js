import { EXTRA_INFO_TRANS_MAP } from 'js/SharedTranslations';
import {
  CANISTERS_PANEL_SORT_BY_CANISTERS_ASC,
  CANISTERS_PANEL_SORT_BY_LEVELS_ASC,
  EMAIL_TEMPLATE,
  FLINK_TYPE_TDF,
  FLINK_TYPE_TDF_GRAVIMETRIC,
  FLINK_TYPES_LIST,
  FORMULA_SORT_BY_CNTCODE_ASC,
  FORMULA_SORT_BY_MASS_DESC,
  FORMULA_SORT_BY_VOLUME_DESC,
  KEY_CODES,
  LEVEL_UNITS,
  PRINTING_LABEL,
  PRINTING_TASK,
} from 'js/Constants';
import i18n from 'js/localization/i18n';
import _ from 'lodash';
import { EI_VARIABLES_EXC_INC_TAX } from 'polchem_base/common/EIVariables';
import { IST_CONFIG_TREE } from './ISTConfigOptions';
import log from '../../api/Logger';
import { UAC_AUTO_LOGOUT_INTERVAL_MINIMUM } from '../../Constants';

const CONFIG_TREE = (is_cloud, is_pro, config) => {
  return [
    {
      h_options: [
        {
          h_preferences: [
            {
              h_site_information: [
                'siteInfo.address1',
                'siteInfo.address2',
                'siteInfo.companyName',
                'siteInfo.country',
                'siteInfo.email',
                'siteInfo.latitude',
                'siteInfo.longitude',
                'siteInfo.phone',
                'siteInfo.postCode',
                'siteInfo.siteDescription',
                'siteInfo.website',
              ],
            },
            {
              h_general_settings: [
                'language',
                'formula_display_unit',
                'level_display_unit',
                'fullscreen',
                'window_maximized',
                'default_can_size',
                'ask_on_sw_exit',
                //'simple_ui',
                'default_export_dir',
                'formula_sort_by',
                'automatic_error_reporting',
                'enable_warehousing_v4',
                'hide_banner',
                'automatic_updates_silent_installation',
                'automatic_updates_logic',
              ],
            },
            window.qtside && {
              h_formula_exchange: ['flink_reception_mode', 'flink_input'],
            },

            /* No themes
        {'h_theme_settings': ['theme_config.theme',
          'theme_config.launcherShowCopyRight',
        ]},
        */

            {
              h_startup_and_security_settings: [
                'autostart_at_boot',
                'shutdown_pc_at_end',
                'lock_pc',
              ],
            },
            {
              h_license: ['protection'],
            },
            /*
          Not to be configured at the moment
        {'h_software_updates': ['automatic_updates_logic',
          'automatic_updates_silent_installation',
        ]},
        */
          ],
        },

        {
          h_program_settings: [
            //{ h_formula_history_management: ['history_frms_available'] },
            {
              h_order_creation: [
                // 'create_new_on_tinting_enabled', Not possible at the moment
                'home_buttons',
                'enable_custom_cansize',
                'enable_custom_cansize_volumetric_visible',
                'enable_custom_cansize_volumetric_nominal',
                'enable_custom_cansize_volumetric_base',
                'enable_custom_cansize_volumetric_cnt',
                'enable_custom_cansize_volumetric_total',
                'enable_custom_cansize_gravimetric_visible',
                'enable_custom_cansize_gravimetric_nominal',
                'enable_custom_cansize_gravimetric_base',
                'enable_custom_cansize_gravimetric_cnt',
                'enable_custom_cansize_gravimetric_total',
                'enable_custom_cansize_formula_unit_visible',
                'enable_custom_cansize_formula_unit_nominal',
                'enable_custom_cansize_formula_unit_base',
                'enable_custom_cansize_formula_unit_cnt',
                'enable_custom_cansize_formula_unit_total',

                // 'custom_cansize_nominal_amount_only',
                // 'color_product_swap', Not possible
                // 'notes_extra_info_swap', Not possible
                // 'remove_incompatible_list_element', Automatically removed
                // 'cards_only_colors', On by default
                // 'exclude_disabled_products',
                // 'use_tags',
                'fix_formula',
                'fix_formula_measure_target',
                // 'rescale_formula_start_at_zero',
                'enable_overfill_checking',
                // 'block_colconc_over',
                'prevent_formulas_breaking_rules',
                'prevent_tinting_below_minshot',
                'prevent_color_code_copying',
                'show_formula_note_in_popup',
                {
                  h_customer_data: [
                    'enable_customer_data',
                    'force_customer_data',
                    'mandatory_customer_companyname',
                    'mandatory_customer_email',
                    'mandatory_customer_phone',
                    'mandatory_customer_address1',
                    'mandatory_customer_address2',
                    'mandatory_customer_postcode',
                    'mandatory_customer_country',
                  ],
                },
                'enable_gdpr',
                'rescale_formula',
                'color_code_name_swap',
                // 'show_incompatible_messages',
                // 'auto_color_code_naming',
                // 'preferred_items_first',
                // 'most_used_color',
                // 'most_used_product',
                // 'most_used_items_num',

                'custom_formula_available_only',
                'custom_formula_comp_only',
                'custom_formula_clear_color_name',
                'max_cans_in_order_item',
                'multiple_items_in_order',
                'multiple_items_in_order_num',
                'hide_extra_info_panel',
                'hide_notes_panel',
                'hide_formula_volumes',
                'hide_match_alternative_formulas',
                'history_frms_available',
                'enable_primer',
                'primer_use_matching_engine',
                'hide_print_label',
              ],
            },

            /* {'h_shortcut_options': ['shortcut_clear',
          'shortcut_print',
          'shortcut_email',
          'shortcut_custom_formula',
          'shortcut_free_dispense',
          'shortcut_matching',
        ]},
         */

            {
              h_search_options: [
                'color_search_list',
                // 'color_search_list_local_formulas',
                //  'color_search_list_detail',
                'color_search_tree',
                // 'color_search_tree_list',
                // 'color_search_tree_table',
                // 'color_search_matching',
                // 'color_search_matching_matching',
                // 'color_search_matching_harmony',
                'product_search_list',
                // 'product_search_custom_formula',
                //  'product_search_tree',
                // 'product_search_free_dispense',
                'product_search_table',
              ],
            },

            /*{
              h_program_settings_2: [
                 'multiple_items_in_order',
                'multiple_items_in_order_num',
                'use_as_a_template',
                'fix_formula_order_hiding',
                'retint_order',
                'enable_order_feedback',
                'enable_order_priority',
                'enable_warehousing_v4',
                'order_list_display_value',
                'enable_primer',
                'primer_use_matching_engine',
                'custom_products',
                'hide_formula_volumes',
                'hide_selected_card',
                'check_for_db_updates',
                'banners_idle_interval',

                'custom_can_gravimetric_unit',
                'custom_can_volumetric_unit',


              ],
            }
            */

            {
              h_orders_list: [
                'max_waiting_order',
                'auto_delete_waiting_orders',
                'open_queue_after_tinting',
              ],
            },

            {
              h_extra_info_settings: [
                'priceoption_lot',
                'priceoption_exctax',
                'priceoption_discount',
                'enabled_pricetypes',
                'currencies_list',
                'priceoption_volume_unit',
                'priceoption_mass_unit',
              ],
            },

            { h_history: ['allow_hiding_orders'] },
          ],
        },
        {
          h_user_account_control: [
            'uac_login_using',
            'uac_auto_logout',
            'uac_auto_logout_interval',
            'uac_force_login',
            { h_users: ['uac_local_users'] },
          ],
        },
      ],
    },

    {
      h_color_matching_header: [
        /* { h_harmonies: ['harmonies_card_type', 'harmonies_number'] },
         */
        {
          h_closest_color: [
            'closest_color_preferred_cards_only',
            'closest_color_max_de',
            'closest_color_max_results',
            // 'closest_color_max_de_autoselection',
            'closest_color_show_prices',
          ],
        },

        {
          h_color_matching: [
            'color_match_max_de',
            'color_match_max_results',
            // 'color_match_max_de_autoselection', // TODO: enable if matching template selection is needed
            // 'default_matching_template',
            'color_match_show_prices',
            // 'allowed_matching_templates',
          ],
        },
      ],
    },

    //{ h_color_correction: ['color_correction'] },

    {
      h_external_devices: [
        { spectro_setup: ['spectro_config'] },
        { h_labels: ['print_labels'] },
        { h_printing: ['print_tasks'] },
        // { h_printers: ['print_tasks_printer'] },
        is_cloud && { h_email: ['email_templates'] },
        is_cloud && {
          h_email_engine: [
            'email_config.from_email',
            'email_config.from_name',
            'email_config.autosend_email',
            //'email_config.order_done_enable',
            //'email_config.order_done_subject',
            'email_config.order_done_template',
            /*{
              h_email_stock: [
                'stockemailing_subject',
                'stockemailing_enabled',
                'stockemailing_include_site_details',
                'stockemailing_recepient_email',
              ],
            },*/
          ],
        },

        is_pro && {
          h_barcode: [
            'barcode_action_enable',
            'barcode_formula_auto_tint',
            'barcode_can_check_before_dispensing',
            'barcode_can_check_before_dispensing_confirmation',
            //'barcode_refill_move_to_fill_position',
            // 'barcode_queue_order_selection',
            'barcode_first_char',
            'barcode_last_char',
          ],
        },
      ],
    },

    {
      h_pricing: [
        { h_common_data_pricing: [] },
        { h_colorants_pricing: ['colorants_pricing'] },
        { h_cansize_pricing: ['cansizes_pricing'] },
        { h_products_pricing: ['product_pricing'] },
      ],
    },
    // {
    //   h_statistics: [
    //     { h_colorants_stats: ['colorants_stats'] },
    //     { h_colors_stats: ['colours_stats'] }, //SCAN: t('cfg.h_colors_stats', 'Colors')
    //     { h_products_stats: ['product_stats'] },
    //     { h_weekdays_stats: ['weekday_stats'] },
    //   ],
    // },

    /*{
      h_history: [
        'customer_editor_custom_frms_only',
        'customer_editor_formulas_opened',
        'customer_editor_local_only',
      ],
    },*/

    //Basic option
    {
      h_machine_configuration: [
        'enable_automatic_dispensers',
        'enable_flink_simple_dispensers',
        'flink_dispenser_path',
        'flink_dispenser_type',
        [FLINK_TYPE_TDF, FLINK_TYPE_TDF_GRAVIMETRIC].includes(
          config.flink_dispenser_type?.value
        ) && 'flink_tdf_ask_if_prefilled',
        'refill_factor',
        'refill_custom_refill_amount',
        'hide_purge_actions',
        'enable_base_dosing',
        'canisters_panel_sort_by',
        //a.    Order of Dispenser options: Enable automatic dispensers / Enable manual dispensers / Enable flink dispensers / Enable flink simple dispensers
        /*{
          h_dispenser_general_information: [
            'enable_automatic_dispensers',
            'enable_manual_dispensers',
            'enable_flink_simple_dispensers',
            'refill_factor',
            'refill_custom_refill_amount',
          ],
        },*/
        // {
        //   h_can_handling: [
        //     'machine.auto_can_in', //: false, // Machine tab, Configuration, Can sensor handling, Automatically start tinting after can placement
        //     'machine.auto_can_in_delay', //: 1.0, // Machine tab, Configuration, Can sensor handling, Automatically start tinting after can placement delay [seconds]
        //     'machine.auto_can_removal', //: false, // Machine tab, Configuration, Can sensor handling, Automatically finish tinting after can removal
        //     'machine.can_removal_control', //: false, // Machine tab, Configuration, Can sensor handling, Enable check on can change
        //     'machine.check_can_before_tinting', //: true, // Machine tab, Configuration, Can sensor handling, Check can before tinting
        //   ],
        // },
        // {
        //   h_controller_options: [
        //     'machine.auto_reset_on_error', //: false, // Machine tab, Configuration, Controller options, Automatically reset on dispenser error
        //     'machine.show_warning_level_message', //: false, // Machine tab, Configuration, Controller options, Show warning level message
        //     'machine.auto_close_driver_messages', //: false, // Machine tab, Configuration, Controller options, Automatically close driver messages
        //     'machine.skip_place_can_message', //: false, // Machine tab, Configuration, Controller options, Skip place can message
        //     'machine.skip_remove_can_message', //: false, // Machine tab, Configuration, Controller options, Skip remove can message
        //     'machine.formula_splitting', //: false, // Machine tab, Configuration, Controller options, Formula splitting
        //     'machine.remove_incompatible_colorants', //: false, // Machine tab, Configuration, Controller options, Remove incompatible colorants
        //     'machine.punch_logic', // Machine tab, Configuration, Controller options, Punching logic, see PUNCH_LOGIC_LIST
        //     'machine.punch_confirmation', // Machine tab, Configuration, Controller options, Show confirmation after punching
        //   ],
        // },
        {
          h_dispenser_options: [
            //  'machine.minimum_dosable_amount', //: 0.0, // Machine tab, Configuration, Dispenser options, Minimum dosable amount
            'machine.lock_ui_during_tinting', //: false, // Machine tab, Configuration, Dispenser options, Lock user interface during tinting
            // TODO: Enable this when support implemented
            // 'machine.batch_refill', //: false, // Machine tab, Configuration, Dispenser options, Colorant batch number saving
            // 'machine.flink_path', //: null, // Machine tab, Configuration, Dispenser options, Flink path for statistics
            // 'machine.flink_type', //: 'standard', // Machine tab, Configuration, Dispenser options, Flink type, see FLINK_TYPES_LIST
            // 'machine.override_local_configuration',
            'machine.auto_dispenser',
          ],
        },
        //Purge settings
        // {
        //   h_purge_options: [
        //     'machine.purge_at_program_startup', //:: true, // Machine tab, Purge options, Automatic purge options, At program startup

        //     'machine.purge_at_enabled', //:: false, // Machine tab, Purge options, Automatic purge options, At
        //     'machine.purge_at_time', //:: '12:00', // Machine tab, Purge options, Automatic purge options, At time
        //     'machine.purge_every_enabled', //:: false, // Machine tab, Purge options, Automatic purge options, Every
        //     'machine.purge_every_time', //:: 1440, // Machine tab, Purge options, Automatic purge options, Every minute [minutes] | 1440 => 1 day
        //     'machine.purge_sequential', //:: false, // Machine tab, Purge options, Automatic purge options, Sequential
        //     'machine.purge_is_skippable',
        //   ],
        // }, //:: true, // Machine tab, Purge options, Automatic purge options, Is skippable
      ],
    },

    //machine.purge_skip_empty_canisters: true,

    /*{'h_product_info':[
      'product_info_open_pdf_in_new_window']},

  /*
  {'h_lab_only_configuration_options': ['control_screen_saver',
    'banners_default_delay',
    'update_pos_group',
    'update_language_pack_group',
    'search_by_both_color_codes',
    'unique_color_codes',
    'priceoption_decimal_separator',
    'priceoption_grouping_separator',
    'priceoption_volume_decimals',
    'priceoption_mass_decimals',
    'priceoption_area_decimals',
    'priceoption_percentage_decimals',
    'priceoption_can_amount_decimals',
    'priceoption_trailing_zeros',
    'force_card_list_view',
    'reset_order_note',
  ]},
  */
    { h_about: [] },
    { h_formula_changes: [] },
    window.qtside && { run_remote_support: [] },
  ];
};
/**
 * Defining item type
 * @param config
 * @param itm
 * @returns {string}
 * @private
 */
function _define_type(config, itm) {
  if (['refill_factor'].indexOf(config) >= 0) {
    return 'percentage';
  }
  if (['email_config.smtp_server_password'].indexOf(config) >= 0) {
    return 'password';
  }

  // multi select (for example extra info)
  if (['enabled_pricetypes', 'home_buttons'].indexOf(config) >= 0) {
    return 'multi_select';
  }

  // Agreed to force this to be boolean
  if (['enable_primer'].indexOf(config) >= 0) {
    return 'checkbox';
  }

  // switch on type defined server-side
  switch (itm?.datatype) {
    case 'bool':
      return 'checkbox';
    case 'int':
    case 'float':
      return 'number';
    case 'select':
      return 'select';
    default:
      return 'text';
  }
}

/**
 * Item translations
 * @param key
 * @returns {{retint: *, product: *, color: *, localformula: *, freedispense: *, history: *, matching: *, customer: *}}
 * @private
 */
function _get_trans_map(key) {
  if (key === 'enabled_pricetypes') {
    return EXTRA_INFO_TRANS_MAP();
  }

  if (key === 'home_buttons') {
    return {
      color: i18n.t('lbl.color', 'Color'),
      product: i18n.t('lbl.product', 'Product'),
      retint: i18n.t('fn.retint', 'Re-tint'),
      history: i18n.t('fn.history', 'History'),
      matching: i18n.t('fn.matching', 'Matching'),
      localformula: i18n.t('lbl.localFormula', 'Local formula'),
      customer: i18n.t('lbl.customer', 'Customer'),
      freedispense: i18n.t('fn.freeDispense', 'Free dispense'),
      article: i18n.t('lbl.article', 'Article'),
    };
  }
}

/**
 * Options for config key
 * @param key
 * @param cache
 * @returns {{label: *, value: *}[]|null|*[]|*}
 * @private
 */
function _options_for_key(key, cache, config) {
  if (key === 'enabled_pricetypes') {
    const vars = EI_VARIABLES_EXC_INC_TAX();
    vars.sort((a, b) => a.name.localeCompare(b.name));
    return vars.map((x) => x.code);
  }

  if (key === 'priceoption_volume_unit') {
    return [
      'l',
      'ml',
      'U.S. gal',
      'U.S. quarts',
      'Imp. gal',
      'U.S. fl. oz.',
      'Imp. fl. oz.',
    ].map((v) => ({ label: v, value: v }));
  }

  if (key == 'priceoption_mass_unit') {
    return ['g', 'kg', 'lb'].map((v) => ({ label: v, value: v }));
  }

  if (key === 'home_buttons') {
    return [
      'color',
      'product',
      'retint',
      'history',
      'matching',
      'localformula',
      'customer',
      'freedispense',
      'article',
    ];
  }

  if (key === 'machine.punch_logic') {
    return [0, 1, 2, 3].map((i) => ({
      value: i,
      label: i18n.t('opt.cfg.machine.punch_logic.' + i),
    }));
  }

  if (key === 'uac_auto_logout') {
    // # 0 = Never, 1 = After idle timeout, 2 = After order creation, 3 = After card removal
    return [0, 1, 2, 3].map((i) => ({
      value: i,
      label: i18n.t('opt.cfg.uac_auto_logout.' + i),
    }));
  }

  if (key === 'auto_delete_waiting_orders') {
    return [..._.range(16), ..._.range(20, 100, 10)].map((value) =>
      value
        ? {
            value,
            label: i18n.t(
              'opt.auto_delete_waiting_orders.yes',
              'Delete older than {{value}} days',
              { value }
            ),
          }
        : {
            value,
            label: i18n.t(
              'opt.auto_delete_waiting_orders.no',
              'No automatic deletion'
            ),
          }
    );
  }

  if (key === 'automatic_error_reporting') {
    // # 0 = No, 1 = Ask, 2 = Send silently
    return [
      {
        label: i18n.t('opt.automatic_error_reporting.no', 'No'),
        value: 0,
      },
      {
        label: i18n.t('opt.automatic_error_reporting.ask', 'Ask'),
        value: 1,
      },
      {
        label: i18n.t('opt.automatic_error_reporting.silent', 'Send silently'),
        value: 2,
      },
    ];
  }

  if (key === 'automatic_updates_logic') {
    return [
      {
        label: i18n.t(
          'opt.automatic_updates_logic.disabled',
          'Disable checking completely'
        ),
        value: 0,
      },

      /*{
        label: i18n.t(
          'opt.automatic_updates_logic.disable_automatic_checking',
          'Disable automatic update checking'
        ),
        value: 1,
      }*/ {
        label: i18n.t(
          'opt.automatic_updates_logic.automatic_checking',
          'Automatic update checking'
        ),
        value: 2,
      },
      {
        label: i18n.t(
          'opt.automatic_updates_logic.auto_download',
          'Automatically download updates'
        ),
        value: 3,
      },
      {
        label: i18n.t(
          'opt.automatic_updates_logic.auto_download_install',
          'Automatically download and install updates'
        ),
        value: 4,
      },
    ];
  }

  if (key === 'uac_login_using') {
    //# 0 = Username, 1 = Username and scard, 2 = Scard
    return [0, 1, 2].map((i) => ({
      value: i,
      label: i18n.t('opt.cfg.uac_login_using.' + i),
    }));
  }

  // Predefined languages
  if (key === 'language') {
    return cache.languages;
  }
  if (key === 'flink_dispenser_type') {
    return FLINK_TYPES_LIST.map((value) => ({
      value,
      label: i18n.t('opt.flink.' + value),
    }));
  }

  // Using store cache to get the units available
  if (key === 'formula_display_unit') {
    return cache.units.map((unit) => {
      return { label: unit.unitname, value: unit.unitname };
    });
  }
  if (key === 'formula_sort_by') {
    return [
      {
        label: i18n.t('opt.formula_sort_by.cntcode_asc', 'Colorant code'),
        value: FORMULA_SORT_BY_CNTCODE_ASC,
      },
      {
        label: i18n.t('opt.formula_sort_by.volume_desc', 'Colorant volume'),
        value: FORMULA_SORT_BY_VOLUME_DESC,
      },
      {
        label: i18n.t('opt.formula_sort_by.mass_desc', 'Colorant mass'),
        value: FORMULA_SORT_BY_MASS_DESC,
      },
    ];
  }
  if (key === 'canisters_panel_sort_by') {
    return [
      {
        label: i18n.t(
          'opt.canisters_panel_sort_by.canisters_asc',
          'Canisters ascending'
        ),
        value: CANISTERS_PANEL_SORT_BY_CANISTERS_ASC,
      },
      {
        label: i18n.t(
          'opt.canisters_panel_sort_by.levels_asc',
          'Levels ascending'
        ),
        value: CANISTERS_PANEL_SORT_BY_LEVELS_ASC,
      },
    ];
  }

  if (key === 'level_display_unit') {
    return LEVEL_UNITS.map((unit) => {
      return { label: unit.display_name, value: unit.unitname };
    });
  }

  // Default can size
  if (key === 'default_can_size') {
    return cache.cansizes.map((unit) => {
      return { label: unit.cansizecode, value: unit.cansizecode };
    });
  }

  // Default can size
  if (key === 'barcode_first_char' || key === 'barcode_last_char') {
    return KEY_CODES.map((k) => {
      return { label: k.name, value: k.id };
    });
  }

  // history_frms_available
  if (key === 'history_frms_available') {
    const history_frms_available_list = [
      { value: -1, label: i18n.t('All', 'All') },
      { value: 0, label: i18n.t('Disabled', 'Disabled') },
    ];
    for (let i = 1; i < 100; i++) {
      // 1-99
      history_frms_available_list.push({ value: i, label: i });
    }
    return history_frms_available_list;
  }

  return null;
}

/**
 * Minimum value for config key
 * @param key
 * @returns {number}
 */
function defineMin(key) {
  if (['max_waiting_order', 'refill_factor'].indexOf(key) >= 0) {
    return 0;
  }
  if (key === 'uac_auto_logout_interval') {
    return UAC_AUTO_LOGOUT_INTERVAL_MINIMUM;
  }
}

/**
 * Maximum value for config key
 * @param key
 */
function defineMax(key) {
  if (['refill_factor'].indexOf(key) >= 0) {
    return 100;
  }
}

/**
 * Suffix for config key
 * @param key
 * @returns {string}
 */
function defineSuffix(key) {
  if (key === 'refill_custom_refill_amount') {
    return i18n.t('symbol.ml');
  }
  if (key === 'uac_auto_logout_interval') {
    return i18n.t('symbol.s', 's');
  }
}

function _rec_create(
  sec,
  config_items,
  print_labels,
  t,
  cache,
  user,
  machine,
  is_pro = false,
  email_templates = []
) {
  let childs = [];
  let config = [];

  const translate = (key) => t('cfg.' + key);

  for (let i = 0; i < sec.length; i++) {
    let itm = sec[i];

    if (typeof itm === 'string') {
      if (itm === 'uac_local_users') {
        try {
          childs = user.users
            .filter((u) => !u.stduser)
            .map((u) => {
              return {
                code: `user_${u.username}_${
                  u.localuserid
                    ? 'localuserid_' + u.localuserid
                    : u.posuserid
                      ? 'posuserid_' + u.posuserid
                      : ''
                }`,
                toggled: true,
                name: u.username,
                type: 'uac_local_users',
                config: u,
              };
            });
        } catch (e) {
          log.error(e);
        }
      }
      if (itm === 'machine.auto_dispenser') {
        try {
          if (
            window.qtside &&
            config_items.enable_automatic_dispensers.value &&
            machine.driver_config
          ) {
            childs = [
              {
                code: 'cfg.h_automatic_dispensers',
                toggled: true,
                name: 'Automatic dispensers',
                config: [
                  { name: 'alfa' },
                  { name: 'e4g' },
                  { name: 'corob legacy' },
                  { name: 'e5g' },
                  { name: 'hero' },
                  { name: 'idd' },
                  { name: 'idd us' },
                  { name: 'italtinto' },
                  { name: 'lld' },
                  { name: 'santint' },
                  { name: 'slave' },
                  { name: 'udcp' },
                ],
                type: 'machine.auto_dispenser',
              },
            ];
          }
          if (machine.driver_config?.idd_gravimetricDispensing) {
            childs.push({
              code: 'cfg.h_gravimetric_dispensing',
              toggled: true,
              name: t('cfg.h_gravimetric_dispensing', 'Gravimetric Dispensing'),
              config: [
                {
                  code: 'machine.gravimetric.target_gravimetric',
                  name: t(
                    'cfg.machine.gravimetric.target_gravimetric',
                    'Target'
                  ),
                  islocked: false,
                  value: machine.driver_config.idd_target_gravimetric
                    ? 'true'
                    : 'false',
                  type: 'select',
                  options: [
                    {
                      value: 'false',
                      label: t('opt.target_gravimetric.false', 'Volumetric'),
                    },
                    {
                      value: 'true',
                      label: t('opt.target_gravimetric.true', 'Gravimetric'),
                    },
                  ],
                },
                {
                  code: 'machine.gravimetric.dispense_abs_lower',
                  name: t(
                    'cfg.machine.gravimetric.dispense_abs_lower',
                    'Absolute lower tolerance'
                  ),
                  islocked: false,
                  value: machine.driver_config.idd_abs_lower_tolerance,
                  suffix: 'g',
                  type: 'number',
                },
                {
                  code: 'machine.gravimetric.dispense_abs_upper',
                  name: t(
                    'cfg.machine.gravimetric.dispense_abs_upper',
                    'Absolute upper tolerance'
                  ),
                  islocked: false,
                  value: machine.driver_config.idd_abs_upper_tolerance,
                  suffix: 'g',
                  type: 'number',
                },
                {
                  code: 'machine.gravimetric.scale_resolution',
                  name: t(
                    'cfg.machine.gravimetric.scale_resolution',
                    'Scale resolution'
                  ),
                  islocked: false,
                  value: machine.driver_config.idd_scale_resolution,
                  type: 'number',
                },
                {
                  code: 'machine.gravimetric.dispense_rel_upper',
                  name: t(
                    'cfg.machine.gravimetric.dispense_rel_upper',
                    'Relative Upper Tolerance'
                  ),
                  islocked: false,
                  value: machine.driver_config.idd_rel_upper_tolerance,
                  suffix: '%',
                  type: 'number',
                },
                {
                  code: 'machine.gravimetric.dispense_rel_lower',
                  name: t(
                    'cfg.machine.gravimetric.dispense_rel_lower',
                    'Relative Lower Tolerance'
                  ),
                  islocked: false,
                  value: machine.driver_config.idd_rel_lower_tolerance,
                  suffix: '%',
                  type: 'number',
                },
                /**
                 * Commented out as this should come from machine config..
                {
                  code: 'machine.skip_gravimetric_summary',
                  name: 'Skip gravimetric summary after tinting',
                  islocked: false,
                  value:
                    config_items['machine.skip_gravimetric_summary'].value,
                  type: 'checkbox',
                },*/
              ],
            });
          }
        } catch (e) {
          log.error(e);
        }
      }

      if (itm === 'product_pricing') {
        try {
          childs = cache.products.map((product) => {
            return {
              code: `product_${product.productid}`,
              toggled: true,
              name: product.productzname,
              type: 'product_pricing',
              config: product,
            };
          });
        } catch (e) {
          log.error(e);
        }
      }

      if (itm === 'print_tasks') {
        try {
          childs = config_items[itm].value.map((c, index) => ({
            code: 'task_' + c.name + index,
            toggled: true,
            name: c.name,
            type: PRINTING_TASK,
            config: c,
          }));
        } catch (e) {
          log.error(e);
        }
      }
      if (itm === 'print_labels') {
        try {
          childs = print_labels.map((c) => ({
            code: 'label_' + c.name + c.id,
            toggled: true,
            name: c.zoneid ? c.name + ' \uD83C\uDF10' : c.name,
            type: PRINTING_LABEL,
            config: c,
          }));
        } catch (e) {
          log.error(e);
        }
      } else if (itm === 'email_templates') {
        try {
          childs = email_templates.map((c) => ({
            code: 'template_' + c.name + c.id,
            toggled: true,
            name: c.zoneid ? c.name + ' \uD83C\uDF10' : c.name,
            type: EMAIL_TEMPLATE,
            config: c,
          }));
        } catch (e) {
          log.error(e);
        }
      } else {
        config.push({
          //id:itm,
          code: itm,
          name: translate(itm),
          type: _define_type(itm, config_items[itm]),
          options: _options_for_key(itm, cache, config_items[itm]),
          trans: _get_trans_map(itm),
          min: defineMin(itm),
          max: defineMax(itm),
          suffix: defineSuffix(itm),

          ...config_items[itm],
        });
      }
    }
    // Assume dict
    else {
      for (const k in itm) {
        let c = _rec_create(
          itm[k],
          config_items,
          print_labels,
          t,
          cache,
          user,
          machine,
          is_pro,
          email_templates
        );
        if (
          k === 'h_user_account_control' &&
          !user.current_user.privileges.includes('user_access_control')
        ) {
          return {
            children: childs,
            config: config,
          };
        }
        if (k === 'h_external_devices' && !is_pro) {
          c.children.shift();
        }
        if (c.children.length > 0) {
          childs.push({
            //id:k,
            code: k,
            toggled: true,
            name: translate(k),
            ...c,
          });
        } else {
          childs.push({
            //id:k,
            code: k,
            toggled: true,
            name: translate(k),
            config: c.config,
          });
        }
      }
    }
  }
  //log.error(childs);
  return {
    children: childs,
    config: config,
  };
}

/**
 *
 * @param config
 * @param t
 * @param cache
 * @param user
 * @param machine
 * @param has_replication
 * @param is_cloud
 * @param is_pro
 * @returns data in format for the react treebeard
 */
export function createTree(
  config,
  print_labels,
  t,
  cache,
  user,
  machine,
  has_replication = true,
  is_cloud = true,
  is_pro = false,
  email_templates = [],
  is_ist = false
) {
  const opts = is_ist
    ? IST_CONFIG_TREE(config)
    : CONFIG_TREE(is_cloud, is_pro, config);

  if (window.qtside) {
    if (is_cloud) {
      opts.push({
        h_offline: [
          'cloud_address',
          'fall_backend_running',
          'is_offline_mode_available',
          'is_online_mode_available',
          'offline_mode',
          'orders_synced',
          'formulas_db_file_path',
          'formulas_data_creation_time',
          'site_db_file',
          'site_data_creation_time',
        ],
      });
    } else if (has_replication) {
      opts.push({
        h_replication: [],
        h_backup_and_reporting: [
          { h_backup_database: ['database_backup_folder'] },
        ],
      });
    } else {
      opts.push({
        h_backup: [{ h_backup_database: ['database_backup_folder'] }],
      });
    }
    opts.push({
      h_standalone2cloud: [],
    });
  }

  return _rec_create(
    opts,
    config,
    print_labels,
    t,
    cache,
    user,
    machine,
    is_pro,
    email_templates
  ).children;
}

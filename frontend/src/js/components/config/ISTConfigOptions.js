export const IST_CONFIG_TREE = (config) => {
  const show_prices = config?.ist_enable_uprice_cnt?.value;
  const show_templates = config?.ist_email_template_handling?.value === 'A';

  const rs = [
    {
      h_options: [
        {
          h_preferences: [
            {
              h_general_settings: [
                'language',
                'formula_display_unit',
                'level_display_unit',
                'default_can_size',
                'formula_sort_by',
                'hide_banner',
              ],
            },
          ],
        },

        {
          h_program_settings: [
            {
              h_order_creation: [
                'home_buttons',
                'enable_custom_cansize',
                'enable_custom_cansize_volumetric_nominal',
                'enable_custom_cansize_volumetric_base',
                'enable_custom_cansize_volumetric_cnt',
                'enable_custom_cansize_volumetric_total',
                'enable_custom_cansize_gravimetric_nominal',
                'enable_custom_cansize_gravimetric_base',
                'enable_custom_cansize_gravimetric_cnt',
                'enable_custom_cansize_gravimetric_total',
                'fix_formula',
                'enable_overfill_checking',
                'prevent_formulas_breaking_rules',
                'enable_customer_data',
                'force_customer_data',
                'enable_gdpr',
                'rescale_formula',
                'color_code_name_swap',
                'custom_formula_available_only',
                'custom_formula_comp_only',
                'max_cans_in_order_item',
                'multiple_items_in_order',
                'multiple_items_in_order_num',
              ],
            },

            {
              h_search_options: [
                'color_search_list',
                'color_search_tree',
                'product_search_list',
                'product_search_table',
              ],
            },
            {
              h_extra_info_settings: [
                'priceoption_lot',
                'priceoption_exctax',
                'priceoption_discount',
                'enabled_pricetypes',
                'currencies_list',
              ],
            },
          ],
        },
      ],
    },
  ];

  if (show_templates) {
    rs.push({ h_email: ['email_templates'] });
  }
  if (show_prices) {
    rs.push({
      h_pricing: [{ h_colorants_pricing: ['colorants_pricing'] }],
    });
  }
  rs.push({ h_about: [] });
  return rs;
};

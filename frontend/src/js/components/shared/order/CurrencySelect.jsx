import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import configActions, {
  selectors as configSelectors,
} from 'js/redux/reducers/Configuration';
import { currencies2list, customControlStyles } from '../../../mylib/Utils';
import Select from 'react-select';

const propTypes = {
  t: PropTypes.func.isRequired,
  setSelectedCurrency: PropTypes.func.isRequired,
  config_values: PropTypes.object,
  zone: PropTypes.object,
  selected_currency: PropTypes.shape({
    symbol: PropTypes.string.isRequired,
  }),
};

function CurrencySelect(props) {
  const { t, selected_currency, zone } = props;

  const defaultCurrency = {
    index: -1,
    symbol: zone.currencysymbol || '',
    rate: 1,
    decimals: zone.currencydecimals,
  };
  const customCurrencies = currencies2list(props.config_values.currencies_list);
  if (!customCurrencies.length) return null;

  const cur_list = [defaultCurrency, ...customCurrencies];
  const dvalue =
    cur_list.find((x) => x.symbol === selected_currency.symbol) || cur_list[0];

  return (
    <tr>
      <td>{t('extraInfo.currency', 'Currency')}</td>
      <td>
        <Select
          id={'currency_selector'}
          menuPlacement="auto"
          styles={{
            control: customControlStyles,
            option: (base) => ({ ...base, color: 'black' }),
          }}
          isSearchable={false}
          onChange={(cu) => props.setSelectedCurrency(cu.value)}
          options={cur_list.map((x) => ({ label: x.symbol, value: x }))}
          defaultValue={{ label: dvalue.symbol, value: dvalue }}
        />
      </td>
    </tr>
  );
}

CurrencySelect.propTypes = propTypes;

function mapStateToProps(store) {
  return {
    config_values: store.configurations.config_values,
    zone: store.configurations.zone,
    selected_currency: configSelectors.selected_currency(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setSelectedCurrency: configActions.setSelectedCurrency,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(CurrencySelect)
);

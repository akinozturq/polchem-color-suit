import _ from 'lodash';
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Table, InputGroup, InputGroupAddon, InputGroupText } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import EIValues from 'js/redux/selectors/EIValues';
import { EI_VARIABLES_EXC_INC_TAX } from 'polchem_base/common/EIVariables';
import orderActions from 'js/redux/reducers/Order';
import {
  EXTRA_INFO_BASE_ADJUSTMENT,
  EXTRA_INFO_BASE_ADJUSTMENT_EDITOR,
  EXTRA_INFO_CNT_ADJUSTMENT,
  EXTRA_INFO_CNT_ADJUSTMENT_EDITOR,
  EXTRA_INFO_DISCOUNT,
  EXTRA_INFO_DISCOUNT_EDITOR,
} from '../../../Constants';
import CurrencySelect from './CurrencySelect';
import NumberInput from '../../../mylib/NumberInput';
import { rightToLeft } from '../../../mylib/Utils';
import log from '../../../api/Logger';

const propTypes = {
  t: PropTypes.func.isRequired,
  configurations: PropTypes.object,
  config_values: PropTypes.object,
  order: PropTypes.object,
  setDiscount: PropTypes.func.isRequired,
  forcePriceoptionLot: PropTypes.bool,
  setBasePriceAdjustment: PropTypes.func.isRequired,
  setCntPriceAdjustment: PropTypes.func.isRequired,
};

function ExtrainfoTable(props) {
  const { configurations, config_values, order, t, forcePriceoptionLot } =
    props;

  if (order.price_pending) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <FontAwesomeIcon icon="spinner" spin style={{ fontSize: '4rem' }} />
      </div>
    );
  }

  const { enabled_pricetypes } = config_values;
  if (!enabled_pricetypes) {
    return null;
  }

  const names = _.fromPairs(
    EI_VARIABLES_EXC_INC_TAX().map((x) => [x.code, x.name])
  );
  const values = EIValues(order, configurations, true, forcePriceoptionLot);

  const alternative_values =
    order.item.alternative_price &&
    EIValues(
      {
        ...order,
        item: { ...order.item, price: order.item.alternative_price },
      },
      configurations,
      true,
      forcePriceoptionLot
    );
  try {
    let codes = enabled_pricetypes
      .split(';')
      .filter((x) => Object.prototype.hasOwnProperty.call(names, x));

    const getEditor = (value, onChange, id, label, minValue = 0) => {
      if (config_values.priceoption_discount) {
        // Add discount input field

        return (
          <tr style={{ textAlign: rightToLeft() ? 'right' : '' }}>
            <td>{label}</td>
            <td colSpan={100}>
              <InputGroup style={{ minWidth: '80px' }}>
                <NumberInput
                  className="height-1-75rem discount-input form-control"
                  id={id}
                  value={value * 100}
                  min={minValue}
                  max={100}
                  decimals={2}
                  onChange={(value) => onChange(value / 100)}
                  deferChange
                  style={{
                    borderRadius: rightToLeft() ? '0 8px 8px 0' : '8px 0 0 8px',
                  }}
                />

                <InputGroupAddon addonType="append">
                  <InputGroupText
                    className="height-1-75rem"
                    style={{
                      borderRadius: rightToLeft()
                        ? '8px 0 0 8px'
                        : '0 8px 8px 0',
                    }}
                  >
                    %
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </td>
          </tr>
        );
      }
    };
    const extra_info = codes.map((code) => {
      return (
        <React.Fragment key={code}>
          {code === EXTRA_INFO_DISCOUNT &&
            getEditor(
              props.order.item.discount,
              props.setDiscount,
              EXTRA_INFO_DISCOUNT_EDITOR,
              t('extraInfo.discount', 'Discount')
            )}
          {code === EXTRA_INFO_BASE_ADJUSTMENT &&
            getEditor(
              props.order.item.basepriceadjustment,
              props.setBasePriceAdjustment,
              EXTRA_INFO_BASE_ADJUSTMENT_EDITOR,
              t('extraInfo.baseAdjusted', 'Base price adjust'),
              -100
            )}
          {code === EXTRA_INFO_CNT_ADJUSTMENT &&
            getEditor(
              props.order.item.cntpriceadjustment,
              props.setCntPriceAdjustment,
              EXTRA_INFO_CNT_ADJUSTMENT_EDITOR,
              t('extraInfo.cntAdjusted', 'Colorant price adjust'),
              -100
            )}
          <tr style={{ textAlign: rightToLeft() ? 'right' : '' }}>
            <td>{names[code]}</td>
            <td data-testid={code + '_value'}>{values[code]}</td>
            {alternative_values && (
              <td data-testid={code + '_alt_value'}>
                {alternative_values[code]}
              </td>
            )}
          </tr>
        </React.Fragment>
      );
    });

    return (
      <Table
        className="table table-ready-grey"
        style={{
          width: '95%',
          margin: 'auto',
          whiteSpace: 'pre-wrap',
        }}
      >
        <tbody>
          <CurrencySelect />

          {extra_info}
        </tbody>
      </Table>
    );
  } catch (e) {
    log.error(e);
    return <div>Error</div>;
  }
}

ExtrainfoTable.propTypes = propTypes;

function mapStateToProps(store) {
  return {
    order: store.order,
    configurations: store.configurations,
    config_values: store.configurations.config_values,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setDiscount: orderActions.setDiscount,
      setBasePriceAdjustment: orderActions.setBasePriceAdjustment,
      setCntPriceAdjustment: orderActions.setCntPriceAdjustment,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(ExtrainfoTable)
);

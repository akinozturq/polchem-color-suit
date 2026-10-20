import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import errorIcon from '../../../../img/warnings/error.svg';
import warningIcon from '../../../../img/warnings/warning.svg';
import ColorThumbnail from '../ColorThumbnail';
import { Card, Table, UncontrolledTooltip } from 'reactstrap';
import {
  CustomScrollbars,
  getColorantWarn,
  sortFormula,
} from '../../../mylib/Utils';
import { bindActionCreators } from 'redux';
import { propType as orderType } from '../../../redux/reducers/Order';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { selectors as machineSelectors } from 'js/redux/reducers/Machine';
import {
  ORDER_MODE_FREE_DISPENSE,
  ORDER_MODE_NORMAL,
  SOURCE_MAIN,
  ZERO_VOLUME_THRESHOLD_ML,
} from '../../../Constants';
import {
  BAD_COMBINATION,
  TOO_LITTLE_CNT,
  TOO_MUCH_CNT,
} from '../../../mylib/RulesChecker';
import { isSiteUser } from '../../../api/WebRequest';

class FormulaTable extends Component {
  getFormulaRow(cnt, cnt_violations) {
    const { t, largefrm, order, machine, configurations } = this.props;

    const show_formula_amounts = !(
      configurations.config.hide_formula_volumes?.value &&
      order.order_mode === ORDER_MODE_NORMAL
    );

    const cnt_in_machine =
      !machine || // no machine -> no warning
      machine.colorants?.map((y) => y.code).includes(cnt.cntcode);

    const small_dose_warn =
      (machine?.config?.minimum_dosable_amount || 0) >
      (order.item.additionOnly ? cnt.additionvolume : cnt.volume);
    let size = largefrm ? '1.875rem' : '1rem';
    const click =
      machine && this.props.openMachinePopup
        ? () => this.props.openMachinePopup(cnt)
        : null;

    const pointer = largefrm ? 'pointer-cursor' : null;
    const icon_style_large = {
      position: 'absolute',
      marginTop: '1.2rem',
      marginLeft: '1.3rem',
    };
    const icon_style_small = {
      position: 'absolute',
      marginTop: '0.5rem',
      marginLeft: '0.5rem',
    };
    const element_id =
      'formula_cnt_violation_' + String(cnt.cntid) + (largefrm ? '_L' : '_S');

    const formula_splitting = _.get(machine, 'config.formula_splitting', false);

    return (
      <tr key={cnt.cntid + cnt.cntcode}>
        <td
          id={element_id}
          width={size}
          className={pointer}
          style={{
            padding: '0px',
            paddingLeft: '5px',
            position: 'relative',
            borderBottom: cnt_violations?.length > 0 && '4px solid red',
          }}
          onClick={click}
        >
          {isSiteUser() && (cnt_violations?.length > 0 || !cnt_in_machine) && (
            <img
              src={errorIcon}
              alt={'E'}
              height={largefrm ? 14 : 10}
              style={largefrm ? icon_style_large : icon_style_small}
            />
          )}
          {isSiteUser() && small_dose_warn && (
            <img
              src={warningIcon}
              alt={'E'}
              height={largefrm ? 14 : 10}
              style={largefrm ? icon_style_large : icon_style_small}
            />
          )}

          <ColorThumbnail hideIfNull rgb={cnt.rgb} size={size} />
        </td>

        {isSiteUser() &&
          (cnt_violations?.length > 0 ||
            small_dose_warn ||
            !cnt_in_machine) && (
            <UncontrolledTooltip placement="top" target={element_id}>
              {cnt_violations?.length > 0 && (
                <p>
                  {cnt_violations.map((v) => t('frm.' + v.rule)).join(', ')}
                </p>
              )}
              {small_dose_warn && (
                <p>
                  {t(
                    'lbl.machine.small_dose_warning',
                    'Colorant volume below small dose limit'
                  )}
                </p>
              )}
              {!cnt_in_machine && (
                <p>
                  {t('lbl.machine.colorant_not_in', 'Colorant not in machine')}
                </p>
              )}
            </UncontrolledTooltip>
          )}

        <td
          className={pointer}
          onClick={click}
          style={{
            borderBottom: cnt_violations?.length > 0 && '4px solid red',
          }}
        >
          <span style={{ paddingRight: '9px' }}>{cnt.cntcode}</span>
          {isSiteUser() && getColorantWarn(cnt.warn, formula_splitting)}
        </td>
        {order.item.additionOnly && (
          <td
            style={{
              paddingLeft: '0px',
              cursor: 'default',
              borderBottom: cnt_violations?.length > 0 && '4px solid red',
            }}
            id={'formula_cnt_addition' + cnt.cntid}
          >
            {cnt.additionvolume > ZERO_VOLUME_THRESHOLD_ML &&
              this.props.shotFormatter?.format({
                volume: cnt.additionvolume,
                specificgravity: cnt.specificgravity,
              })}
          </td>
        )}
        <td
          style={{
            paddingLeft: '0px',
            cursor: 'default',
            borderBottom: cnt_violations?.length > 0 && '4px solid red',
          }}
          id={'formula_cnt_' + cnt.cntid}
        >
          {order.item.additionOnly ? (
            <span>({this.props.shotFormatter?.format(cnt)})</span>
          ) : (
            <>
              <span
                style={{
                  marginRight: '0.5rem',
                }}
              >
                {show_formula_amounts && this.props.shotFormatter?.format(cnt)}
              </span>
              {Math.abs(cnt.additionvolume) > ZERO_VOLUME_THRESHOLD_ML &&
                show_formula_amounts && (
                  <span style={{ color: 'red' }}>
                    {cnt.additionvolume > 0 && '+'}
                    {show_formula_amounts &&
                      this.props.shotFormatter?.format({
                        volume: cnt.additionvolume,
                        specificgravity: cnt.specificgravity,
                      })}
                  </span>
                )}
            </>
          )}

          {show_formula_amounts && (
            <UncontrolledTooltip
              placement="right"
              target={'formula_cnt_' + cnt.cntid}
              flip={false}
            >
              <p>{this.props.shotFormatter?.getUnitName()}</p>
            </UncontrolledTooltip>
          )}
        </td>
      </tr>
    );
  }

  getBaseRow(baseCnt) {
    const { t, largefrm, machine, order } = this.props;

    const cnt_in_machine = baseCnt;

    const small_dose_warn =
      (machine?.config?.minimum_dosable_amount || 0) > baseCnt.volume;
    let size = largefrm ? '1.875rem' : '1rem';
    const click = this.props.openMachinePopup
      ? () => this.props.openMachinePopup(baseCnt)
      : null;

    const pointer = largefrm ? 'pointer-cursor' : null;
    const icon_style_large = {
      position: 'absolute',
      marginTop: '1.2rem',
      marginLeft: '1.3rem',
    };
    const icon_style_small = {
      position: 'absolute',
      marginTop: '0.5rem',
      marginLeft: '0.5rem',
    };
    const element_id =
      'formula_base_violation_' + String(baseCnt.id) + (largefrm ? '_L' : '_S');

    const formula_splitting = _.get(machine, 'config.formula_splitting', false);

    return (
      <tr key={baseCnt.id + baseCnt.code}>
        <td
          id={element_id}
          width={size}
          className={pointer}
          style={{
            padding: '0px',
            paddingLeft: '5px',
            position: 'relative',
          }}
          onClick={click}
        >
          {!cnt_in_machine && (
            <img
              src={errorIcon}
              alt={'E'}
              height={largefrm ? 14 : 10}
              style={largefrm ? icon_style_large : icon_style_small}
            />
          )}
          {small_dose_warn && (
            <img
              src={warningIcon}
              alt={'E'}
              height={largefrm ? 14 : 10}
              style={largefrm ? icon_style_large : icon_style_small}
            />
          )}

          <ColorThumbnail hideIfNull rgb={baseCnt.rgb} size={size} />
        </td>

        {small_dose_warn ||
          (!cnt_in_machine && (
            <UncontrolledTooltip placement="top" target={element_id}>
              {small_dose_warn && (
                <p>
                  {t(
                    'lbl.machine.small_dose_warning',
                    'Colorant volume below small dose limit'
                  )}
                </p>
              )}
              {!cnt_in_machine && (
                <p>
                  {t('lbl.machine.colorant_not_in', 'Colorant not in machine')}
                </p>
              )}
            </UncontrolledTooltip>
          ))}

        <td className={pointer} onClick={click}>
          <span style={{ paddingRight: '9px' }}>{baseCnt.code}</span>
          {getColorantWarn(order.base_check?.warn, formula_splitting)}
        </td>

        <td
          style={{
            paddingLeft: '0px',
            cursor: 'default',
          }}
          id={'base_cnt_' + baseCnt.id}
        >
          <span
            style={{
              marginRight: '0.2rem',
            }}
          >
            {this.props.shotFormatter?.format({
              volume: order.can.basevolume,
              specificgravity: baseCnt.specificgravity,
            })}
          </span>

          <UncontrolledTooltip
            placement="right"
            target={'base_cnt_' + baseCnt.id}
            flip={false}
          >
            <p>{this.props.shotFormatter?.getUnitName()}</p>
          </UncontrolledTooltip>
        </td>
      </tr>
    );
  }

  getFormula() {
    const { t, order, configurations, formula, emptyMessage } = this.props;
    if (!formula?.cntinformula && !order.formula && !order.item.cnts) {
      return (
        <tr>
          <td>{emptyMessage || t('lbl.noFormula', 'No formula')}</td>
        </tr>
      );
    } else if (
      (formula?.cntinformula || []).length === 0 &&
      (order?.item?.cnts || []).length === 0
    ) {
      return (
        <tr>
          <td>{t('lbl.noColorantsInFormula', 'No colorants in formula')}</td>
        </tr>
      );
    }
    if (order.can == null) {
      return (
        <tr>
          <td>{t('msg.invalidCan', 'Invalid can')}</td>
        </tr>
      );
    }

    const cnts = formula
      ? formula?.cntinformula
      : order.engine_check || order.item.cnts;

    const frm =
      cnts &&
      cnts.map((cnt) => {
        return {
          ...cnt,
          volume: cnt.volume,
          additionvolume: !formula ? cnt.additionvolume : 0,
        };
      });

    return (
      frm &&
      sortFormula(configurations, frm).map((cnt) => {
        const f = formula || order.formula;
        let cnt_violations = f?.rules?.cnt_violations || [];
        cnt_violations = cnt_violations.filter((x) => x.cntid === cnt.cntid);
        if (order.item.source === SOURCE_MAIN) {
          cnt_violations = cnt_violations.filter(
            (x) =>
              ![TOO_LITTLE_CNT, TOO_MUCH_CNT, BAD_COMBINATION].includes(x.rule)
          );
        }
        return this.getFormulaRow(cnt, cnt_violations);
      })
    );
  }

  getBase() {
    const { t, order, machine } = this.props;
    const baseCnt = machine?.colorants.find(
      (colorant) => colorant.code === order.base?.basecode
    );

    if (!order.base) {
      return (
        <tr>
          <td>{t('lbl.noBase', 'No base paint')}</td>
        </tr>
      );
    } else if (!baseCnt) {
      return (
        <tr>
          <td>{t('lbl.noBaseInMachine', 'No base in machine')}</td>
        </tr>
      );
    }
    if (order.can == null && order.order_mode !== ORDER_MODE_FREE_DISPENSE) {
      return (
        <tr>
          <td>{t('msg.invalidCan', 'Invalid can')}</td>
        </tr>
      );
    }

    return this.getBaseRow(baseCnt);
  }

  render() {
    const {
      largefrm,
      onlyTable,
      configurations: { config },
      order,
    } = this.props;
    if (largefrm) {
      return (
        <CustomScrollbars>
          <Table
            className="table table-ready-grey"
            style={{ width: '95%', margin: 'auto' }}
          >
            <tbody>{this.getFormula()}</tbody>

            {config.enable_base_dosing?.value &&
              order.order_mode !== ORDER_MODE_FREE_DISPENSE && (
                <tbody>{this.getBase()}</tbody>
              )}
          </Table>
        </CustomScrollbars>
      );
    }
    if (onlyTable) {
      return (
        <>
          <Table className="table table-ready-grey">
            <tbody>{this.getFormula()}</tbody>
            {config.enable_base_dosing?.value &&
              order.order_mode !== ORDER_MODE_FREE_DISPENSE && (
                <tbody>{this.getBase()}</tbody>
              )}
          </Table>
        </>
      );
    }
    return (
      <Card
        className="br-8 bordered ready-grey scroll"
        style={{ height: '22vh' }}
      >
        <Table className="table table-ready-grey">
          <tbody>{this.getFormula()}</tbody>
          {config.enable_base_dosing?.value &&
            order.order_mode !== ORDER_MODE_FREE_DISPENSE && (
              <tbody>{this.getBase()}</tbody>
            )}
        </Table>
      </Card>
    );
  }
}

FormulaTable.propTypes = {
  order: orderType.isRequired,
  openMachinePopup: PropTypes.func,
  t: PropTypes.func.isRequired,
  largefrm: PropTypes.bool,
  onlyTable: PropTypes.bool,
  machine: PropTypes.shape(),
  configurations: PropTypes.shape({
    config: PropTypes.shape(),
  }),
  dispID: PropTypes.string,
  shotFormatter: PropTypes.shape({
    getUnitName: PropTypes.func,
    format: PropTypes.func,
  }).isRequired,
  emptyMessage: PropTypes.string,
  formula: PropTypes.shape({
    cntinformula: PropTypes.array,
    rules: PropTypes.shape({
      cnt_violations: PropTypes.array,
    }),
  }),
};

function mapStateToProps(store, ownProps) {
  return {
    machine: machineSelectors.machine(store, ownProps.dispID),
    order: store.order,
    cache: store.cache,
    configurations: store.configurations,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({}, dispatch);
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(FormulaTable)
);

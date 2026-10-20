/**
 * This will display the formula selected in correct can size and unit
 */

import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import {
  Card,
  UncontrolledTooltip,
  Label,
  FormGroup,
  CustomInput,
  Row,
  Col,
} from 'reactstrap';
import orderActions, {
  propType as orderType,
  selectors as orderSelectors,
} from 'js/redux/reducers/Order';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { selectors as machineSelectors } from 'js/redux/reducers/Machine';
import MachineColorants from 'js/components/dispenser/machinePage/canisters/MachineColorants';
import SlidingPane from 'react-sliding-pane';
import {
  customControlStyles,
  customSelectContainerStyles,
  rightToLeft,
} from 'js/mylib/Utils';
import errorIcon from 'img/warnings/error.svg';
import warningIcon from 'img/warnings/warning.svg';
import Select from 'react-select';
import { TOO_LITTLE_CNT, TOO_MUCH_CNT } from '../../../mylib/RulesChecker';
import {
  INFO_CARD,
  ORDER_MODE_FORMULA_CORRECTION,
  FORMULA_CORRECTION_TYPE_ADD_BASE,
  SOURCE_MAIN,
  ORDER_MODE_NORMAL,
} from '../../../Constants';
import {
  createShotFormatter,
  createLevelFormatter,
} from 'js/redux/selectors/Formatters';
import { selectors as userSelectors } from 'js/redux/reducers/User';
import { isSiteUser } from '../../../api/WebRequest';
import FormulaTable from './FormulaTable';
import { getCanImage } from '../../../mylib/Utils';

const propTypes = {
  machine: PropTypes.shape(),
  classes: PropTypes.object,
  units: PropTypes.arrayOf(
    PropTypes.shape({
      unitid: PropTypes.number,
      unitname: PropTypes.string,
    })
  ),
  order: orderType.isRequired,
  allowAdditionOnly: PropTypes.bool,
  formula: PropTypes.object,
  config_values: PropTypes.object,
  t: PropTypes.func.isRequired,
  setCan: PropTypes.func.isRequired,
  setAdditionOnly: PropTypes.func,
  createLevelFormatter: PropTypes.func,
  createShotFormatter: PropTypes.func,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  dispID: PropTypes.string,
  largefrm: PropTypes.bool,
  current_user: PropTypes.object,

  setSelectedUnit: PropTypes.func.isRequired,
  refills_list: PropTypes.array,
  refills_batch_list: PropTypes.array,
};

const defaultProps = {
  largefrm: true,
};

export class Formula extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      popup_visible: false,
      selected_cnt: null,
      show_error_popover: false,
      noAddition: false,
    };
  }

  shotFormatterForRender() {
    return this.props.createShotFormatter(this.props.order.selected_unit);
  }

  setUnit = (unit) => {
    this.props.setSelectedUnit(unit.value);
  };

  openMachinePopup = (cnt) => {
    isSiteUser() &&
      this.setState((state) => ({
        popup_visible: !state.popup_visible,
        selected_cnt: cnt,
      }));
  };

  handleAdditionCheckbox = () => {
    const { order } = this.props;
    this.props.setAdditionOnly(!order.item.additionOnly);
  };

  getBaseAddition = () => {
    const {
      order,
      config_values: { enable_base_dosing },
    } = this.props;
    const shotFormatter = this.shotFormatterForRender();
    if (order.item.formulaCorrectionType === FORMULA_CORRECTION_TYPE_ADD_BASE) {
      const scaledBaseAmount =
        order.item.formulaCorrectionScalingFactor * order.can.basevolume;
      const diff = scaledBaseAmount - order.can.basevolume;
      const borderBottomColor =
        !enable_base_dosing && diff > 0 ? 'red' : '#dee2e6';
      return (
        <Row
          style={{
            padding: '0.5rem',
            width: '95%',
            margin: 'auto',
            borderBottomStyle: 'solid',
            borderBottomWidth: '0.1rem',
            borderBottomColor,
          }}
        >
          <Col
            xs={'2'}
            style={{
              padding: 'px',
              paddingLeft: '5px',
            }}
          >
            <img
              width="22rem"
              alt="cansize"
              src={getCanImage(this.props.order?.can?.nominalamount)}
            />
          </Col>
          <Col
            xs={'2'}
            style={{
              padding: '0px',
            }}
          >
            <span style={{ paddingRight: '9px' }}>{order.base.basecode}</span>
          </Col>
          <Col
            xs={'4'}
            style={{
              paddingLeft: '1rem',
            }}
          >
            {order.item.additionOnly ? (
              <span>
                {' '}
                {diff > 0
                  ? shotFormatter.format({
                      volume: diff,
                      specificgravity: order.base.specificgravity,
                    })
                  : ''}
              </span>
            ) : (
              <>
                <span style={{ marginRight: '0.5rem' }}>
                  {shotFormatter.format({
                    volume: order.can.basevolume,
                    specificgravity: order.base.specificgravity,
                  })}
                </span>

                <span style={{ color: 'red' }}>
                  +
                  {shotFormatter.format({
                    volume: diff,
                    specificgravity: order.base.specificgravity,
                  })}
                </span>
              </>
            )}
          </Col>
          <Col
            xs={'3'}
            style={{
              padding: '0px',
            }}
          >
            {order.item.additionOnly && (
              <>
                {' '}
                (
                {shotFormatter.format({
                  volume: diff + order.can.basevolume,
                  specificgravity: order.base.specificgravity,
                })}
                )
              </>
            )}
          </Col>
        </Row>
      );
    } else return null;
  };

  render() {
    // const {classes} = this.props;
    const { t, machine, order, units, config_values } = this.props;
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    const show_formula_amounts = !(
      config_values?.hide_formula_volumes &&
      order.order_mode === ORDER_MODE_NORMAL
    );

    const cnts = _.cloneDeep(order.engine_check || order.item.cnts);
    const baseCnt = _.find(
      machine?.colorants,
      (colorant) => colorant.code === order.base?.basecode
    );
    if (baseCnt && order.base_check)
      cnts?.push({ ...order.base_check, ...baseCnt });

    const shotFormatter = this.shotFormatterForRender();
    const error_overfill =
      order.formula &&
      order.formula.rules &&
      _.includes(order.formula.rules.violations, TOO_MUCH_CNT);
    const warn_overfill =
      order.formula &&
      order.formula.rules &&
      _.includes(order.formula.rules.warnings, TOO_MUCH_CNT);
    const warn_underfill =
      order.formula?.rules?.violations?.includes(TOO_LITTLE_CNT);
    const unit_options = units.map((unit) => ({
      label: unit.unitname,
      value: unit.unitname,
    }));

    const show_addtion_only =
      !_.isEmpty(order.item?.cnts?.filter((c) => c.additionvolume > 0)) ||
      order.order_mode === ORDER_MODE_FORMULA_CORRECTION;

    if (this.props.largefrm) {
      return (
        <>
          <Card
            className="br-8 bordered card-body"
            style={{
              height: '100%',
              color: 'white',
              paddingTop: '0',
              paddingBottom: '10px',
            }}
          >
            <div
              id="formula_card_header"
              className="ready-grey card-header"
              style={{
                borderRadius: '0.5rem 0.5rem 0px 0px',
                marginBottom: '1px',
                borderBottom: '1px solid color-white',
                backgroundColor: '#15374d',
              }}
            >
              {(error_overfill ||
                warn_overfill ||
                (warn_underfill && order.item.source !== SOURCE_MAIN)) && (
                <>
                  <img
                    id="frm_warn_icon"
                    src={error_overfill ? errorIcon : warningIcon}
                    alt="!"
                    style={{
                      position: 'absolute',
                      left: '0.2rem',
                      top: '-2px',
                      height: '1.75rem',
                    }}
                  />

                  <UncontrolledTooltip placement="top" target="frm_warn_icon">
                    <p>
                      {error_overfill || warn_overfill
                        ? t('msg.overfill', 'Overfill detected')
                        : t('msg.underfill', 'Underfill detected')}
                    </p>
                  </UncontrolledTooltip>
                </>
              )}

              <h5 className="mb-0 w-100">
                <div
                  className="collapsed bold-size-1 color-white"
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                  }}
                >
                  <p
                    style={{
                      margin: isRtl ? '0 0 0 1em' : '0 1em 0 0',
                      textAlign: isRtl ? 'right' : 'left',
                    }}
                    className="uppercase"
                  >
                    {t('lbl.formula', 'Formula')}
                  </p>
                  {show_formula_amounts && (
                    <div
                      style={{
                        width: '10rem',
                        textAlign: isRtl ? 'right' : 'left',
                        direction,
                        zIndex: 2,
                      }}
                    >
                      <Select
                        menuPlacement="auto"
                        isRtl={isRtl}
                        styles={{
                          control: customControlStyles,
                          container: (base) => ({
                            ...customSelectContainerStyles(base),
                            width: '100%',
                          }),
                          option: (base) => ({
                            ...base,
                            color: 'black',
                          }),
                          valueContainer: (base) => ({
                            ...base,
                          }),
                        }}
                        isSearchable={false}
                        onChange={(value) => this.setUnit(value)}
                        options={unit_options}
                        value={{
                          label: shotFormatter.getUnitName(),
                          value: shotFormatter.getUnitName(),
                        }}
                      />
                    </div>
                  )}
                </div>
              </h5>
            </div>
            {order.order_mode === ORDER_MODE_FORMULA_CORRECTION &&
              this.getBaseAddition()}
            <FormulaTable
              dispID={this.props.dispID}
              largefrm={true}
              openMachinePopup={this.openMachinePopup}
              shotFormatter={shotFormatter}
            />

            {isSiteUser() && show_addtion_only && (
              <FormGroup row style={{ margin: '0.5rem' }}>
                <Label
                  style={{
                    margin: '0 1rem 0 0.5rem',
                  }}
                >
                  {t('lbl.additionOnly', 'Addition Only')}
                </Label>

                <CustomInput
                  type="checkbox"
                  checked={order.item.additionOnly}
                  id="additionCheckbox"
                  onChange={this.handleAdditionCheckbox}
                  disabled={!this.props.allowAdditionOnly}
                />
              </FormGroup>
            )}
          </Card>
          {this.props.dispID != null && isSiteUser() && (
            <SlidingPane
              className="ml-16 mr-16"
              closeIcon={<FontAwesomeIcon icon="times" color="red" />}
              isOpen={this.state.popup_visible}
              title={t('lbl.machineColorants', 'Machine colorants')}
              from="bottom"
              width="calc(100%-2rem)"
              onRequestClose={() => {
                this.setState({ popup_visible: false });
                this.props.setCan(this.props.order.can);
              }}
            >
              <MachineColorants
                t={t}
                machine={machine}
                selectedCnt={this.state.selected_cnt?.cntcode}
                dispID={this.props.dispID}
                formula={cnts}
                base_check={order.base_check}
                needFetchMachineColorants={
                  this.props.order.open_section !== INFO_CARD
                }
              />
            </SlidingPane>
          )}
        </>
      );
    } else {
      return (
        <>
          {order.order_mode === ORDER_MODE_FORMULA_CORRECTION &&
            this.getBaseAddition()}
          <FormulaTable
            dispID={this.props.dispID}
            largefrm={false}
            shotFormatter={shotFormatter}
          />
        </>
      );
    }
  }
}

Formula.propTypes = propTypes;
Formula.defaultProps = defaultProps;

function mapStateToProps(store, ownProps) {
  return {
    machine: machineSelectors.machine(store, ownProps.dispID),
    order: store.order,
    allowAdditionOnly: orderSelectors.allowAdditionOnly(store),
    units: store.cache.units,
    config_values: store.configurations.config_values,
    privileges: store.user.current_user.privileges,
    formula: store.formula,
    createShotFormatter: createShotFormatter(store),
    createLevelFormatter: createLevelFormatter(store),
    refills_list: machineSelectors.refills_list(store, ownProps.dispID),
    current_user: userSelectors.current_user(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setCan: orderActions.setCan,
      setSelectedUnit: orderActions.setSelectedUnit,
      setAdditionOnly: orderActions.setAdditionOnly,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(Formula)
);

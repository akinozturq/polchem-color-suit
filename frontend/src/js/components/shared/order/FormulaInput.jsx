import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  CustomInput,
  Label,
  Row,
  UncontrolledTooltip,
} from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withTranslation } from 'react-i18next';
import {
  customControlStyles,
  customControlStylesFreeDispense,
  CustomScrollbars,
  rightToLeft,
  sortByKey,
} from 'js/mylib/Utils';
import { can_scaling_factor } from 'js/mylib/Formula';
import ColorThumbnail from 'js/components/shared/ColorThumbnail';
import orderActions, {
  propType as OrderType,
  selectors as orderSelectors,
} from 'js/redux/reducers/Order';
import { selectors as machineSelectors } from 'js/redux/reducers/Machine';

import {
  INFO_CARD,
  ORDER_MODE_FORMULA_CORRECTION,
  ORDER_MODE_MATCHING,
  SOURCE_FREE_DISPENSE,
} from '../../../Constants';
import Select from 'react-select';
import AmountInput from '../AmountInput';
import _ from 'lodash';
import errorIcon from '../../../../img/warnings/error.svg';
import { createShotFormatter } from '../../../redux/selectors/Formatters';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SliderWithValue } from '../Slider';
import CustomModal from './CustomModal';
import { is_cnt_in_product } from '../../../mylib/Product';
import { normalize_blended } from '../../../mylib/Formula';
import { CheckRules } from '../../../mylib/RulesChecker';

const propTypes = {
  t: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  setFormula: PropTypes.func.isRequired,
  setCan: PropTypes.func.isRequired,
  setProduct: PropTypes.func.isRequired,
  setBase: PropTypes.func.isRequired,
  setColor: PropTypes.func.isRequired,
  setColorCode: PropTypes.func.isRequired,
  setColorName: PropTypes.func.isRequired,
  classes: PropTypes.object,
  freeDispense: PropTypes.bool.isRequired,

  setScaledBy: PropTypes.func,
  moveToNextSection: PropTypes.func.isRequired,
  setOpenSection: PropTypes.func.isRequired,
  setOrderitemSource: PropTypes.func.isRequired,
  fetchOrderItemPrice: PropTypes.func,
  setColourCodeAfterFormulaEdit: PropTypes.func,
  setAdditionOnly: PropTypes.func,
  clearColorMeasurement: PropTypes.func,
  current_machine: PropTypes.object,
  order: OrderType,
  allowAdditionOnly: PropTypes.bool,
  cache: PropTypes.shape({
    cnts: PropTypes.arrayOf(
      PropTypes.shape({
        cntid: PropTypes.number,
        cntcode: PropTypes.string,
      })
    ),
    units: PropTypes.arrayOf(
      PropTypes.shape({
        unitid: PropTypes.number,
        unitname: PropTypes.string,
      })
    ),
    products: PropTypes.arrayOf(PropTypes.object),
  }),
  configurations: PropTypes.shape({
    config: PropTypes.object,
    config_values: PropTypes.object,
  }),
  setItemEdited: PropTypes.func.isRequired,
  restoreOrderState: PropTypes.func.isRequired,
  popOrderState: PropTypes.func.isRequired,
  createShotFormatter: PropTypes.func.isRequired,
};

const defaultProps = {};

class FormulaInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scale_frm: true,
      factorError: null,
      unit_name: null,
      custom_formula_comp_only: false,
      custom_formula_available_only: false,
      free_dispense_comp_only: false,
      show_options: false,
      hide_unavailable_colorants: false, // colorants not available in machine
      slider: 0,
      formula: null,
      prev_order: props.order,
      prev_show: false,
      custom_modal_open: false,
    };
    this.debounced_update_formula = _.debounce(this.update_formula, 300);
  }

  static getDerivedStateFromProps(props, state) {
    if (props.show !== state.prev_show) {
      if (props.show) {
        return {
          slider: 100 * props.order.item.scaledby - 100 || 0,
          prev_order: props.order,
          prev_show: true,
          formula: props.order.formula,
        };
      } else {
        return { prev_show: false };
      }
    }
    return null;
  }

  componentDidMount() {
    // Default custom_formula_comp_only, custom_formula_available_only, free_dispense_comp_only settings
    this.setState({
      custom_formula_comp_only:
        this.props.configurations.config_values.custom_formula_comp_only,
      custom_formula_available_only:
        this.props.configurations.config_values.custom_formula_available_only,
      free_dispense_comp_only:
        this.props.configurations.config_values.free_dispense_comp_only,
    });
  }

  setBase = (base) => {
    this.setState((state) => ({
      formula: { ...state.formula, baseid: base?.baseid },
    }));
    this.props.setBase(base);
  };

  moveToNext = () => {
    this.debounced_update_formula.flush();
    const { t, order } = this.props;
    this.props.popOrderState();
    // setting formula
    if (this.props.freeDispense) {
      this.props.setOrderitemSource(SOURCE_FREE_DISPENSE);
      this.props.setColor({
        colourcode: t('fn.freeDispense', 'Free dispense'),
      });
      this.props.setProduct({
        productzname: t('fn.freeDispense', 'Free dispense'),
      });
      this.props.setFormula(this.state.formula);
      this.props.setCan({ nominalamount: 1000, cansizecode: '-' });
      // Move to dispense page
      this.props.moveToNextSection();
    } else {
      let { formula } = this.state;
      if (order.product?.blendedbase != null) {
        // Normalize blended formula to full can
        formula = {
          ...formula,
          cntinformula: normalize_blended(formula.cntinformula),
        };
      }
      this.props.setFormula(formula);
      this.props.setOpenSection(INFO_CARD);
      this.props.fetchOrderItemPrice();
      // At this point set the formula
      const scaledby = (100 + this.state.slider) / 100;
      this.props.setScaledBy(scaledby);
      this.props.setCan(order.can);
    }
  };

  cancel = () => {
    this.debounced_update_formula.cancel();
    this.props.restoreOrderState();
  };

  reset = () => {
    this.debounced_update_formula.cancel();
    const { order } = this.props;
    const { prev_order } = this.state;
    this.props.setColorCode(prev_order.item.colourcode);
    this.props.setColorName(prev_order.item.colourname);
    this.props.setBase(prev_order.base);
    this.props.setCan(order.can);
    const frm = prev_order.formula;
    this.setState(
      {
        slider: 100 * prev_order.item.scaledby - 100 || 0,
        formula: frm,
      },
      this.update_formula
    );
  };

  onAmountChange = (volume, cnt) => {
    const { order } = this.props;

    let frm = _.cloneDeep(this.state.formula);
    const factor =
      order.can && order.base ? can_scaling_factor(order.base, order.can) : 1;

    if (!factor) {
      // the can or base is badly configured if we get here
      this.setState({
        factorError: true,
      });
    }
    if (!frm || _.isEmpty(frm)) {
      frm = {
        baseid: order.base?.baseid,
        cntinformula: [],
        fcomment: null,
        islocal: true,
        itemnotes: null,
        original: true,
        productid: order.product ? order.product.productid : null,
      };
    }
    // Colorant to update
    const indx = frm.cntinformula.findIndex((x) => x.cntid === cnt.cntid);
    if (volume === 0 || isNaN(volume)) {
      frm.cntinformula = frm.cntinformula.filter((x) => x.cntid !== cnt.cntid);
    } else if (indx === -1) {
      frm.cntinformula.push({ ...cnt, volume: volume / factor });
    } else {
      if (order.item.additionOnly) {
        const original = order.original_formula.cntinformula.find(
          (can) => can.cntid === cnt.cntid
        );

        frm.cntinformula[indx].volume =
          (original?.volume || 0) + volume / factor;
      } else {
        frm.cntinformula[indx].volume = volume / factor;
      }
    }

    this.setState({ formula: frm }, this.update_formula);
  };

  getCNT = (cnt, disabled, shotFormatter, rules) => {
    const { product } = this.props.order;
    const { formula } = this.state;
    let denied_pair = false;
    let cnt_violations = [];
    if (product && formula && formula.cntinformula && product.deniedcntpairs) {
      formula.cntinformula.forEach((c) => {
        if (
          product.deniedcntpairs.filter(
            (p) =>
              (p[0] === c.cntid && p[1] === cnt.cntid) ||
              (p[0] === cnt.cntid && p[1] === c.cntid)
          ).length > 0
        ) {
          denied_pair = true;
        }
      });
      if (rules) {
        cnt_violations = rules.cnt_violations.filter(
          (x) => x.cntid === cnt.cntid
        );
      }
    }

    const icon_style_large = {
      position: 'absolute',
      marginTop: '-0.5rem',
      marginLeft: '0.9rem',
    };

    const block_input =
      disabled ||
      (!cnt.volume && denied_pair) ||
      product?.extenderid === cnt.cntid;

    const element_id = 'formula_cnt_violation_' + String(cnt.cntid) + '_input';
    return (
      <Row className={'mr-0 mt-4 mb-4 pl-0 pr-4 pt-4 pb-4'}>
        <Col
          style={{ maxWidth: '1.75rem', paddingTop: '0.25rem' }}
          id={element_id}
        >
          <ColorThumbnail hideIfNull rgb={cnt.rgb} size="1.5rem" />

          {cnt_violations.length > 0 && (
            <>
              <img
                src={errorIcon}
                alt={'E'}
                height={14}
                style={icon_style_large}
              />
              <UncontrolledTooltip placement="top" target={element_id}>
                <p>
                  {cnt_violations
                    .map((v) => this.props.t('frm.' + v.rule))
                    .join(', ')}
                </p>
              </UncontrolledTooltip>
            </>
          )}
        </Col>
        <Col style={{ margin: 'auto 0', minWidth: '80px' }}>{cnt.cntcode}</Col>
        <Col xs={6} className={'p-0'}>
          <AmountInput
            className={
              block_input
                ? 'amount-input-blocked'
                : cnt.volume
                  ? 'amount-input'
                  : 'amount-input-zero'
            }
            shotFormatter={shotFormatter}
            cnt={cnt}
            value={cnt.volume}
            onChange={(volume) =>
              volume != null && this.onAmountChange(volume, cnt)
            }
            disabled={block_input}
            style={
              cnt_violations.length > 0 ? { border: '2px solid red' } : null
            }
          />
        </Col>
      </Row>
    );
  };

  setCanSize = (can) => {
    const { order } = this.props;
    // Scale according the cansize change
    if (can.show_custom) {
      this.setState({ custom_modal_open: true });
    } else {
      let frm = _.cloneDeep(this.state.formula);
      if (!this.state.scale_frm && order.can) {
        const factor = order.can.nominalamount / can.nominalamount;

        if (frm) {
          frm.cntinformula = frm.cntinformula.map((c) => ({
            ...c,
            volume: c.volume * factor,
          }));
          this.setState({ formula: frm });
        }
      }

      this.props.setCan(can);
      this.update_formula(frm);
    }
  };

  /**
   * This should speed up the rendering as it blocks update on the components which are not visible!
   *
   */
  shouldComponentUpdate(nextProps) {
    return nextProps.show || this.props.show;
  }

  handleSliderChange = (value) => {
    let scaledFormula = _.cloneDeep(this.state.prev_order.formula);

    const scaledby = (100 + value) / 100;

    if (scaledFormula) {
      scaledFormula.cntinformula = scaledFormula.cntinformula.map((cnt) => ({
        ...cnt,
        volume:
          (cnt.volume * scaledby) / (this.state.prev_order.item.scaledby || 1),
      }));
    }
    this.setState(
      { formula: scaledFormula, slider: value },
      this.debounced_update_formula
    );
  };

  update_formula = (frm = undefined) => {
    if (
      ![ORDER_MODE_FORMULA_CORRECTION, ORDER_MODE_MATCHING].includes(
        this.props.order.order_mode
      )
    ) {
      // When not in one of the matching modes, assume user is
      // editing the formula to change to a different color.
      this.props.clearColorMeasurement();
    }
    this.props.setColourCodeAfterFormulaEdit({
      frm: frm || this.state.formula,
      shotFormatter: this.props.createShotFormatter(this.state.unit_name),
      scaledby: (100 + this.state.slider) / 100,
    });
    this.props.setItemEdited(true);
  };

  toggleOptions = () => {
    this.setState((s) => ({ show_options: !s.show_options }));
  };

  getOptionsPanel = () => {
    const { order, t, freeDispense, configurations } = this.props;
    const hide_cnt_by_rules =
      _.get(configurations, 'config.custom_formula_comp_only.ishidden') ===
      true;
    const hide_unavailable_cnt =
      _.get(configurations, 'config.custom_formula_available_only.ishidden') ===
      true;

    return (
      <>
        <Button
          data-testid="options-btn"
          className="pointer-cursor formula_input_options_btn"
          onClick={this.toggleOptions}
        >
          <FontAwesomeIcon icon="ellipsis-h" style={{ fontSize: 'x-large' }} />
        </Button>
        {this.state.show_options && (
          <div className="formula_input_options">
            <div
              className="formula_input_options_triangle"
              onClick={this.toggleOptions}
            />
            <Card>
              <CardHeader
                onClick={this.toggleOptions}
                className="pointer-cursor"
              >
                {t('lbl.options', 'Options')}{' '}
                <FontAwesomeIcon
                  className="fa-pull-right"
                  icon="times"
                  color="red"
                />
              </CardHeader>
              <CardBody style={{ backgroundColor: 'inherit' }}>
                {!freeDispense && (
                  <Label
                    check
                    style={{ display: 'flex', gap: '0.5rem' }}
                    className="m-2"
                  >
                    <CustomInput
                      id="scaleFormula"
                      type="checkbox"
                      checked={this.state.scale_frm}
                      onChange={() =>
                        this.setState((s) => ({
                          scale_frm: !s.scale_frm,
                        }))
                      }
                    />
                    {t('fn.scaleFormula2canSize', 'Scale formula to can size')}
                  </Label>
                )}
                {order.base && (
                  <>
                    <Label
                      check
                      style={{
                        display: hide_cnt_by_rules ? 'none' : 'flex',
                        gap: '0.5rem',
                      }}
                      className="m-2"
                    >
                      <CustomInput
                        id="_hideColorantsByRules"
                        type="checkbox"
                        checked={this.state.custom_formula_comp_only}
                        onChange={() =>
                          this.setState((s) => ({
                            custom_formula_comp_only:
                              !s.custom_formula_comp_only,
                          }))
                        }
                      />
                      {t('fn.hideColorantsByRules', 'Hide colorants by rules')}
                    </Label>
                  </>
                )}
                {freeDispense ? (
                  <Label
                    check
                    style={{
                      display: hide_unavailable_cnt ? 'none' : 'flex',
                      gap: '0.5rem',
                    }}
                    className="m-2"
                  >
                    <CustomInput
                      id="_hideUnavailableColorantsFeeDispense"
                      type="checkbox"
                      checked={this.state.free_dispense_comp_only}
                      onChange={() =>
                        this.setState((s) => ({
                          free_dispense_comp_only: !s.free_dispense_comp_only,
                        }))
                      }
                    />
                    {t(
                      'fn.hideUnavailableColorants',
                      'Hide unavailable colorants'
                    )}
                  </Label>
                ) : (
                  <Label
                    check
                    style={{
                      display: hide_unavailable_cnt ? 'none' : 'flex',
                      gap: '0.5rem',
                    }}
                    className="m-2"
                  >
                    <CustomInput
                      id="_hideUnavailableColorants"
                      type="checkbox"
                      checked={this.state.custom_formula_available_only}
                      onChange={() =>
                        this.setState((s) => ({
                          custom_formula_available_only:
                            !s.custom_formula_available_only,
                        }))
                      }
                    />
                    {t(
                      'fn.hideUnavailableColorants',
                      'Hide unavailable colorants'
                    )}
                  </Label>
                )}

                {!freeDispense && this.props.allowAdditionOnly && (
                  <Label
                    for="addition"
                    check
                    style={{ display: 'flex', gap: '0.5rem' }}
                    className="m-2"
                  >
                    <CustomInput
                      data-testid={'additionOnly'}
                      id="addition"
                      type="checkbox"
                      checked={order.item.additionOnly}
                      onChange={() =>
                        this.props.setAdditionOnly(!order.item.additionOnly)
                      }
                      disabled={!this.props.allowAdditionOnly}
                    />
                    {t('fn.additionOnly', 'Addition Only')}
                  </Label>
                )}
                {!freeDispense && !order.item.additionOnly && (
                  <SliderWithValue
                    value={this.state.slider}
                    setValue={this.handleSliderChange}
                  />
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </>
    );
  };

  render() {
    const { order, cache, t, freeDispense, current_machine, configurations } =
      this.props;
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction,
    };
    const fieldLabelStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction,
      marginBottom: '0.35rem',
    };
    const { original_formula } = order;
    const has_saved_state = !!order.saved_state;
    const { formula } = this.state;
    const shotFormatter = this.props.createShotFormatter(this.state.unit_name);

    const ok_to_move_next = formula && formula.cntinformula?.length > 0;

    const disable_cnt_input = freeDispense
      ? false
      : order.can == null || this.state.factorError;

    const boxStyle = {
      height: 'calc(100vh - 6.375rem - 4.5rem - 14vw - 4.6rem)',
      backgroundColor: '#112e40',
      color: 'white',
    };

    let cnts = cache.cnts;
    if (order.product) {
      cnts = cnts.filter((cnt) => is_cnt_in_product(cnt, order.product));
    }

    if (this.state.custom_formula_comp_only && order.base?.basecntrule) {
      cnts = cnts.filter((cnt) => {
        const rule = order.base?.basecntrule.find((c) => c.cntid === cnt.cntid);
        return !(rule?.maxamount === 0);
      });
    }

    if (
      freeDispense
        ? this.state.free_dispense_comp_only
        : this.state.custom_formula_available_only
    ) {
      cnts = cnts.filter((cnt) =>
        current_machine?.colorants.find(
          (colorant) => colorant.code === cnt.cntcode && colorant.enabled
        )
      );
    }

    // Ensure colorants already in formula are included
    if (formula && formula.cntinformula) {
      cnts = [
        ...cnts,
        ...formula.cntinformula.filter(
          (c) => !cnts.some((x) => x.cntid === c.cntid)
        ),
      ];
    }

    let key = cnts.length ? (cnts[0].cntcode ? 'cntcode' : 'code') : null;
    if (key) cnts = sortByKey(cnts, key);

    // cnts for addtion only.

    // updating volumes from order formula

    const factor =
      order.can && order.base ? can_scaling_factor(order.base, order.can) : 1;
    if (formula && !order.item.additionOnly) {
      cnts = cnts.map((c) => ({
        ...c,
        volume:
          (formula.cntinformula?.find((z) => z.cntid === c.cntid)?.volume ||
            0) * factor,
      }));
    } else if (formula && order.item.additionOnly) {
      const newClrs = _.differenceWith(
        formula.cntinformula,
        original_formula.cntinformula,
        _.isEqual
      );
      const addtionClrs =
        newClrs &&
        newClrs.map((clr) => {
          const original = original_formula.cntinformula.find(
            (colorant) => colorant.cntid === clr.cntid
          );
          if (original) {
            return {
              ...clr,
              volume: clr.volume - original.volume,
            };
          } else {
            return { ...clr, volume: clr.volume };
          }
        });
      cnts = cnts.map((c) => {
        const fc = _.find(addtionClrs, ['cntid', c.cntid]) || {};
        return { ...c, volume: _.get(fc, 'volume') * factor };
      });
    } else {
      cnts = cnts.map((c) => ({ ...c, volume: 0 }));
    }

    const rules =
      formula && order.product && order.base?.baseid
        ? CheckRules(
            order.product,
            order.base,
            formula,
            configurations.config_values.enable_overfill_checking
          )
        : null;
    let arr = [];
    let startsAt = 0;
    let endsAt = 4;
    for (let r = 0; r < Math.ceil(cnts.length / 4); r++) {
      let row = [];
      let smallCntsArray = cnts.slice(
        startsAt,
        endsAt > cnts.length ? cnts.length : endsAt
      );
      for (let c = 0; c < smallCntsArray.length; c++) {
        row.push(
          <Col
            className="formula_input_cell"
            key={smallCntsArray[c] && smallCntsArray[c].cntid}
          >
            {this.getCNT(
              smallCntsArray[c],
              disable_cnt_input,
              shotFormatter,
              rules
            )}
          </Col>
        );
      }
      let j = 0;

      while (true) {
        if (j + smallCntsArray.length < 4) {
          row.push(<Col key={'_add_' + j} className="formula_input_cell" />);
          j += 1;
        } else {
          break;
        }
      }
      startsAt = endsAt;
      endsAt += 4;

      arr.push(<Row key={r}>{row}</Row>);
    }

    const base_options =
      order.product && !freeDispense && order.product.basepaints
        ? order.product.basepaints.map((base) => ({
            label: base.basecode,
            value: base,
          }))
        : [];

    const can_options =
      order.base && !freeDispense
        ? order.base.cans.map((can) => ({ label: can.cansizecode, value: can }))
        : [];
    if (configurations.config_values.enable_custom_cansize) {
      can_options.push({
        label: t('lbl.custom_can', 'Custom'),
        value: { show_custom: true },
      });
    }

    const unit_options = cache.units.map((unit) => ({
      label: unit.unitname,
      value: unit.unitname,
    }));

    return (
      <>
        <CustomModal
          isOpen={this.state.custom_modal_open}
          onSubmit={this.setCanSize}
          onClose={() => this.setState({ custom_modal_open: false })}
        />

        <Col
          style={{
            display: this.props.show ? '' : 'none',
          }}
        >
          <Card style={boxStyle}>
            <CardBody
              className="formula_input_card"
              dir={direction}
              style={alignStyle}
            >
              <Row
                className="m-8 pb-8"
                style={{
                  borderBottom: '.125rem dashed #e7eff5',
                  marginBottom: '0.25rem !important',
                  ...alignStyle,
                }}
              >
                {freeDispense ? (
                  <Col xs={4} />
                ) : (
                  !order.item.additionOnly && (
                    <>
                      <Col className="m-1" style={alignStyle}>
                        <h5 style={fieldLabelStyle}>
                          {t('lbl.basepaint', 'Basepaint')}
                        </h5>
                        <Select
                          id="base_select"
                          menuPlacement="auto"
                          isRtl={isRtl}
                          styles={{
                            control: customControlStyles,
                            option: (base) => ({
                              ...base,
                              color: 'black',
                            }),
                          }}
                          isSearchable={false}
                          onChange={(option) => {
                            this.setBase(option.value);
                          }}
                          options={base_options}
                          value={{
                            label: order.base ? order.base.basecode : null,
                            value: order.base,
                          }}
                        />
                      </Col>

                      <Col className="m-1" style={alignStyle}>
                        <h5 style={fieldLabelStyle}>{t('lbl.canSize')}</h5>
                        <Select
                          id="can_select"
                          menuPlacement="auto"
                          isRtl={isRtl}
                          styles={{
                            control: customControlStyles,
                            option: (base) => ({
                              ...base,
                              color: 'black',
                            }),
                          }}
                          isSearchable={false}
                          onChange={(option) => this.setCanSize(option?.value)}
                          options={can_options}
                          value={{
                            label: order.can ? order.can.cansizecode : null,
                            value: order.can,
                          }}
                        />
                      </Col>
                    </>
                  )
                )}

                <Col
                  className="m-1"
                  style={{
                    alignItems: freeDispense ? 'center' : '',
                    display: freeDispense ? 'flex' : '',
                    flexDirection:
                      freeDispense && isRtl ? 'row-reverse' : undefined,
                    ...alignStyle,
                  }}
                >
                  <h5
                    style={{
                      margin: freeDispense ? '0' : '',
                      marginRight: freeDispense ? '6px' : '',
                      marginLeft: freeDispense && isRtl ? '6px' : '',
                      ...fieldLabelStyle,
                    }}
                  >
                    {t('lbl.unit_volumeOrMass', 'Unit')}
                  </h5>
                  <Select
                    id={'formula_unit_selector'}
                    menuPlacement="auto"
                    isRtl={isRtl}
                    styles={{
                      control: freeDispense
                        ? customControlStylesFreeDispense
                        : customControlStyles,
                      option: (base) => ({ ...base, color: 'black' }),
                    }}
                    isSearchable={false}
                    onChange={(option) => {
                      this.setState({ unit_name: option.value });
                    }}
                    options={unit_options}
                    value={{
                      label: shotFormatter.getUnitName(),
                      value: shotFormatter.getUnitName(),
                    }}
                  />
                </Col>

                <Col xs={1} className="m-auto align-text-center">
                  {this.getOptionsPanel()}
                </Col>

                <Col
                  xs={3}
                  className="m-auto align-text-center"
                  style={{ display: 'flex' }}
                >
                  {has_saved_state ? (
                    <Button
                      color="warning"
                      className="m-1"
                      data-testid="amount_cancel"
                      onClick={this.cancel}
                    >
                      {t('fn.cancel')}
                    </Button>
                  ) : (
                    <Button
                      className="m-1"
                      data-testid="amount_reset"
                      onClick={this.reset}
                    >
                      {t('fn.reset')}
                    </Button>
                  )}
                  <Button
                    className="m-1"
                    data-testid="amount_OK"
                    onClick={this.moveToNext}
                    disabled={!ok_to_move_next}
                  >
                    {t('fn.ok', 'OK')}
                  </Button>
                </Col>
              </Row>
              {/** List colorants here with input fields */}
              <CustomScrollbars
                style={{
                  height:
                    'calc(100vh - 6.375rem - 4.5rem - 14vw - 4.6rem - 8rem)',
                }}
              >
                <div onClick={() => this.setState({ show_options: false })}>
                  {arr}
                </div>
              </CustomScrollbars>
            </CardBody>
          </Card>
        </Col>
      </>
    );
  }
}

FormulaInput.propTypes = propTypes;
FormulaInput.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    order: store.order,
    allowAdditionOnly: orderSelectors.allowAdditionOnly(store),
    cache: store.cache,
    configurations: store.configurations,
    createShotFormatter: createShotFormatter(store),

    current_machine: machineSelectors.current_machine(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      moveToNextSection: orderActions.moveToNextSection,
      setFormula: orderActions.setFormula,
      setCan: orderActions.setCan,
      setBase: orderActions.setBase,
      setProduct: orderActions.setProduct,
      setColor: orderActions.setColor,
      setColorCode: orderActions.setColorCode,
      setColorName: orderActions.setColorName,
      setAdditionOnly: orderActions.setAdditionOnly,
      setOrderitemSource: orderActions.setOrderitemSource,
      setOpenSection: orderActions.setOpenSection,
      fetchOrderItemPrice: orderActions.fetchOrderItemPrice,
      setColourCodeAfterFormulaEdit: orderActions.setColourCodeAfterFormulaEdit,
      clearColorMeasurement: orderActions.clearColorMeasurement,
      setScaledBy: orderActions.setScaledBy,
      setItemEdited: orderActions.setItemEdited,
      restoreOrderState: orderActions.restoreState,
      popOrderState: orderActions.popState,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(FormulaInput)
);

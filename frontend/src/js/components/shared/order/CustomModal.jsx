import React, { Component } from 'react';
import { ShotFormatter } from 'polchem_base/common/formatters/ShotFormatter';
import { FIXED_ABASEAMOUNT, LEVEL_UNITS } from 'js/Constants';
import {
  Col,
  Row,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import AmountInput from 'js/components/shared/AmountInput';
import { connect } from 'react-redux';
import {
  customControlStyles,
  equalsIgnoreCase,
  levelUnitSelector,
  rightToLeft,
} from '../../../mylib/Utils';
import { UNIT_GRAVIMETRIC, UNIT_VOLUMETRIC } from '../../../Constants';
import Select from 'react-select';
import log from '../../../api/Logger';

function custom_can_edit(section, amount, props, formatter) {
  const { base, formula } = props.order;
  const base_sg = base?.specificgravity || 1;
  const nominalfill = base?.nominalfill || 1;
  try {
    let formula_volume = 0,
      formula_mass = 0;
    if (formula?.cntinformula.length > 0) {
      formula_volume = formula.cntinformula
        .map((cnt) => cnt.volume)
        .reduce((partial_sum, a) => partial_sum + a);
      formula_mass = formula.cntinformula
        .map((cnt) => cnt.volume * cnt.specificgravity)
        .reduce((partial_sum, a) => partial_sum + a);
    }
    let base_volume = FIXED_ABASEAMOUNT;

    // calculate sections to base amount and then setting the state based on that.
    if (section === 'cnt_volume') {
      base_volume = FIXED_ABASEAMOUNT * (amount / (formula_volume || 1));
    } else if (section === 'cnt_mass') {
      base_volume = FIXED_ABASEAMOUNT * (amount / (formula_mass || 1));
    } else if (section === 'base_volume') {
      base_volume = amount;
    } else if (section === 'base_mass') {
      base_volume = amount / base_sg;
    } else if (section === 'nominal_volume') {
      base_volume = amount * nominalfill;
    } else if (section === 'nominal_mass') {
      base_volume = (amount / base_sg) * nominalfill;
    } else if (section === 'total_volume') {
      base_volume = amount / (1 + formula_volume / FIXED_ABASEAMOUNT);
    } else if (section === 'total_mass') {
      base_volume = amount / (base_sg + formula_mass / FIXED_ABASEAMOUNT);
    }

    const factor = base_volume / FIXED_ABASEAMOUNT;
    const nominal_volume = base_volume / nominalfill;
    const can_code =
      formatter.format({
        volume: nominal_volume,
        specificgravity: base_sg,
      }) +
      ' ' +
      formatter.getUnitName();

    return {
      nominal_volume,
      base_volume: base_volume,
      cnt_volume: formula_volume * factor,
      total_volume: formula_volume * factor + base_volume,

      nominal_mass: (base_volume * base_sg) / nominalfill,
      base_mass: base_volume * base_sg,
      cnt_mass: formula_mass * factor,
      total_mass: base_volume * base_sg + formula_mass * factor,

      [section]: amount, // Ensure that the value changes even when having rounding issues!

      can_code,
      gravimetric: formatter.isGravimetric(),
    };
  } catch (e) {
    log.error(e);
  }
}

class CustomModal extends Component {
  state = {
    pre_open: false,
    volShotFormatter: new ShotFormatter(),
    graviShotFormatter: new ShotFormatter(),
    formulaShotFormatter: new ShotFormatter(),
  };

  static getDerivedStateFromProps(props, state) {
    if (state.pre_open !== props.isOpen) {
      if (state.pre_open) {
        return { pre_open: false };
      }
      const { config_values } = props;
      const volShotFormatter = new ShotFormatter(
        LEVEL_UNITS.find((x) =>
          equalsIgnoreCase(x.unitname, config_values.custom_can_volumetric_unit)
        ) || LEVEL_UNITS.filter((unit) => !unit.gravimetric)[0]
      );
      const graviShotFormatter = new ShotFormatter(
        LEVEL_UNITS.find((x) =>
          equalsIgnoreCase(
            x.unitname,
            config_values.custom_can_gravimetric_unit
          )
        ) || LEVEL_UNITS.filter((unit) => unit.gravimetric)[0]
      );
      const formulaShotFormatter = new ShotFormatter(
        props.cache.units.find((x) =>
          equalsIgnoreCase(x.unitname, config_values.formula_display_unit)
        ) || props.cache.units[0]
      );

      // Update formatters based on unit

      const { can } = props.order;
      const custom_can = custom_can_edit(
        can?.gravimetric ? 'nominal_mass' : 'nominal_volume',
        can?.nominalamount || 1000,
        props,
        can?.gravimetric ? graviShotFormatter : volShotFormatter
      );

      return {
        ...custom_can,
        pre_open: props.isOpen,
        volShotFormatter,
        graviShotFormatter,
        formulaShotFormatter,
      };
    }
    return null;
  }

  handleSubmit = () => {
    const { base } = this.props.order;
    const { can_code, gravimetric, nominal_mass, nominal_volume } = this.state;

    const custom = {
      baseid: base?.baseid,
      basevolume: base ? this.state.base_volume : null,
      canid: null,
      canshapeid: null,
      cansizecode: can_code.substring(0, 12),
      cansizeid: null,
      defbarcode: null,
      fill: null,
      gravimetric,
      imageid: null,
      nominalamount: gravimetric ? nominal_mass : nominal_volume,
    };
    this.props.onSubmit(custom);
    this.props.onClose();
  };

  setUnit = (unit, gravimetric) => {
    const tmp = LEVEL_UNITS.find((u) => u.unitname === unit.value);
    if (gravimetric) {
      this.setState({
        graviShotFormatter: new ShotFormatter(tmp),
      });
    } else {
      this.setState({
        volShotFormatter: new ShotFormatter(tmp),
      });
    }
  };

  customCanEdited(section, amount, formatter) {
    this.setState(custom_can_edit(section, amount, this.props, formatter));
  }

  get_volume_row = (style, nominal_only) => {
    const { t, config_values } = this.props;
    const isRtl = rightToLeft();
    const rowTextStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction: isRtl ? 'rtl' : 'ltr',
    };
    const vol_nominal =
      nominal_only || config_values.enable_custom_cansize_volumetric_nominal;
    const vol_base = config_values.enable_custom_cansize_volumetric_base;
    const vol_cnt = config_values.enable_custom_cansize_volumetric_cnt;
    const vol_total = config_values.enable_custom_cansize_volumetric_total;

    return (
      <>
        <Row style={rowTextStyle}>
          {/** VOLUMETRIC UNITS */}
          <Col className="p-8 col-2">{t('lbl.unit_volumeOrMass', 'Unit')}</Col>
          <Col className="p-8 col-3 text-break">
            {t('lbl.nominalAmount', 'Nominal Amount')}
          </Col>

          <Col className="p-8 col-3 text-break">
            {t('lbl.baseAmount', 'Base amount')}
          </Col>
          <Col className="p-8 col-2">{t('lbl.colorant', 'Colorant')}</Col>
          <Col className="p-8 col-2">{t('lbl.total', 'Total')}</Col>
        </Row>
        <Row style={rowTextStyle}>
          {/** VOLUMETRIC UNITS */}
          <Col className="p-8 col-2">
            {levelUnitSelector(
              this.state.volShotFormatter.getUnitName(),
              (value) => this.setUnit(value, false),
              UNIT_VOLUMETRIC,
              'custom_can_volumetric'
            )}
          </Col>
          <Col className="p-8 col-3">
            <AmountInput
              cnt={{ cntcode: 'nominal_volume' }}
              disabled={!vol_nominal}
              className="br-8 amount-input"
              style={style}
              shotFormatter={this.state.volShotFormatter}
              onChange={(value) =>
                this.customCanEdited(
                  'nominal_volume',
                  value,
                  this.state.volShotFormatter
                )
              }
              value={this.state.nominal_volume}
            />
          </Col>
          {!nominal_only && (
            <>
              <Col className="p-8 col-3">
                <AmountInput
                  disabled={!vol_base}
                  className="br-8 amount-input"
                  style={style}
                  shotFormatter={this.state.volShotFormatter}
                  onChange={(value) =>
                    this.customCanEdited(
                      'base_volume',
                      value,
                      this.state.volShotFormatter
                    )
                  }
                  value={this.state.base_volume}
                />
              </Col>
              <Col className="p-8 col-2">
                <AmountInput
                  disabled={!(vol_cnt && this.state.cnt_volume)}
                  className="br-8 amount-input"
                  style={style}
                  shotFormatter={this.state.volShotFormatter}
                  onChange={(value) =>
                    this.customCanEdited(
                      'cnt_volume',
                      value,
                      this.state.volShotFormatter
                    )
                  }
                  value={this.state.cnt_volume}
                />
              </Col>
              <Col className="p-8 col-2">
                <AmountInput
                  disabled={!vol_total}
                  className="br-8 amount-input"
                  style={style}
                  shotFormatter={this.state.volShotFormatter}
                  onChange={(value) =>
                    this.customCanEdited(
                      'total_volume',
                      value,
                      this.state.volShotFormatter
                    )
                  }
                  value={this.state.total_volume}
                />
              </Col>
            </>
          )}
        </Row>
      </>
    );
  };

  get_gravimetric_row = (style, nominal_only) => {
    const { t, config_values } = this.props;
    const isRtl = rightToLeft();
    const rowTextStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction: isRtl ? 'rtl' : 'ltr',
    };

    const gra_nominal =
      nominal_only || config_values.enable_custom_cansize_gravimetric_nominal;
    const gra_base = config_values.enable_custom_cansize_gravimetric_base;
    const gra_cnt = config_values.enable_custom_cansize_gravimetric_cnt;
    const gra_total = config_values.enable_custom_cansize_gravimetric_total;

    return (
      <>
        <Row style={{ borderTop: ' 2px black solid', ...rowTextStyle }}>
          {/** GRAVIMETRIC UNITS */}
          <Col className="p-8 col-2">{t('lbl.unit_volumeOrMass', 'Unit')}</Col>
          <Col className="p-8 col-3 text-break">
            {t('lbl.nominalAmount', 'Nominal Amount')}
          </Col>

          <Col className="p-8 col-3 text-break">
            {t('lbl.baseAmount', 'Base amount')}
          </Col>
          <Col className="p-8 col-2">{t('lbl.colorant', 'Colorant')}</Col>
          <Col className="p-8 col-2">{t('lbl.total', 'Total')}</Col>
        </Row>
        <Row style={rowTextStyle}>
          {/** GRAVIMETRIC UNITS */}
          <Col className="p-8 col-2">
            {levelUnitSelector(
              this.state.graviShotFormatter.getUnitName(),
              (value) => this.setUnit(value, true),
              UNIT_GRAVIMETRIC,
              'custom_can_gravimetric'
            )}
          </Col>
          <Col className="p-8 col-3">
            <AmountInput
              cnt={{ cntcode: 'nominal_mass' }}
              className="br-8 amount-input"
              disabled={!gra_nominal}
              style={style}
              shotFormatter={this.state.graviShotFormatter}
              onChange={(value) =>
                this.customCanEdited(
                  'nominal_mass',
                  value,
                  this.state.graviShotFormatter
                )
              }
              value={this.state.nominal_mass}
            />
          </Col>
          {!nominal_only && (
            <>
              <Col className="p-8 col-3">
                <AmountInput
                  className="br-8 amount-input"
                  disabled={!gra_base}
                  style={style}
                  shotFormatter={this.state.graviShotFormatter}
                  onChange={(value) =>
                    this.customCanEdited(
                      'base_mass',
                      value,
                      this.state.graviShotFormatter
                    )
                  }
                  value={this.state.base_mass}
                />
              </Col>
              <Col className="p-8 col-2">
                <AmountInput
                  className="br-8 amount-input"
                  disabled={!(gra_cnt && this.state.cnt_mass)}
                  style={style}
                  shotFormatter={this.state.graviShotFormatter}
                  onChange={(value) =>
                    this.customCanEdited(
                      'cnt_mass',
                      value,
                      this.state.graviShotFormatter
                    )
                  }
                  value={this.state.cnt_mass}
                />
              </Col>
              <Col className="p-8 col-2">
                <AmountInput
                  className="br-8 amount-input"
                  disabled={!gra_total}
                  style={style}
                  shotFormatter={this.state.graviShotFormatter}
                  onChange={(value) =>
                    this.customCanEdited(
                      'total_mass',
                      value,
                      this.state.graviShotFormatter
                    )
                  }
                  value={this.state.total_mass}
                />
              </Col>
            </>
          )}
        </Row>
      </>
    );
  };

  get_formula_row = (nominal_only) => {
    const { t, config_values, cache } = this.props;
    const isRtl = rightToLeft();
    const rowTextStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction: isRtl ? 'rtl' : 'ltr',
    };

    const frm_nominal =
      nominal_only || config_values.enable_custom_cansize_formula_unit_nominal;
    const frm_base = config_values.enable_custom_cansize_formula_unit_base;
    const frm_cnt = config_values.enable_custom_cansize_formula_unit_cnt;
    const frm_total = config_values.enable_custom_cansize_formula_unit_total;

    const sel = this.props.cache.units.find(
      (x) => x.unitname === this.state.formulaShotFormatter.getUnitName()
    );

    const style = {
      width: '100%',
      textAlign: isRtl ? 'right' : 'left',
      direction: isRtl ? 'rtl' : 'ltr',
    };

    const setFrmUnit = (x) => {
      const tmp = cache.units.find((u) => u.unitid === x.value);
      this.setState({
        formulaShotFormatter: new ShotFormatter(tmp),
      });
    };

    const is_g = this.state.formulaShotFormatter.isGravimetric();

    return (
      <>
        <Row style={{ borderTop: ' 2px black solid', ...rowTextStyle }}>
          <Col className="p-8 col-2">{t('lbl.unit_volumeOrMass', 'Unit')}</Col>
          <Col className="p-8 col-3 text-break">
            {t('lbl.nominalAmount', 'Nominal Amount')}
          </Col>

          <Col className="p-8 col-3 text-break">
            {t('lbl.baseAmount', 'Base amount')}
          </Col>
          <Col className="p-8 col-2">{t('lbl.colorant', 'Colorant')}</Col>
          <Col className="p-8 col-2">{t('lbl.total', 'Total')}</Col>
        </Row>
        <Row style={rowTextStyle}>
          <Col className="p-8 col-2">
            <Select
              id={'frm_unit_selector'}
              menuPlacement="auto"
              styles={{
                control: customControlStyles,
                option: (base) => ({ ...base, color: 'black' }),
              }}
              isSearchable={false}
              onChange={setFrmUnit}
              options={cache.units.map((unit) => {
                return { label: unit.unitname, value: unit.unitid };
              })}
              defaultValue={{ label: sel?.unitname, value: sel?.unitid }}
            />
          </Col>
          <Col className="p-8 col-3">
            <AmountInput
              cnt={{ cntcode: 'nominal_amount_frm' }}
              className="br-8 amount-input"
              disabled={!frm_nominal}
              style={style}
              shotFormatter={this.state.formulaShotFormatter}
              onChange={(value) =>
                this.customCanEdited(
                  is_g ? 'nominal_mass' : 'nominal_volume',
                  value,
                  this.state.formulaShotFormatter
                )
              }
              value={is_g ? this.state.nominal_mass : this.state.nominal_volume}
            />
          </Col>
          {!nominal_only && (
            <>
              <Col className="p-8 col-3">
                <AmountInput
                  className="br-8 amount-input"
                  disabled={!frm_base}
                  style={style}
                  shotFormatter={this.state.formulaShotFormatter}
                  onChange={(value) =>
                    this.customCanEdited(
                      is_g ? 'base_mass' : 'base_volume',
                      value,
                      this.state.formulaShotFormatter
                    )
                  }
                  value={is_g ? this.state.base_mass : this.state.base_volume}
                />
              </Col>
              <Col className="p-8 col-2">
                <AmountInput
                  className="br-8 amount-input"
                  disabled={!(frm_cnt && this.state.cnt_volume)}
                  style={style}
                  shotFormatter={this.state.formulaShotFormatter}
                  onChange={(value) =>
                    this.customCanEdited(
                      is_g ? 'cnt_mass' : 'cnt_volume',
                      value,
                      this.state.formulaShotFormatter
                    )
                  }
                  value={is_g ? this.state.cnt_mass : this.state.cnt_volume}
                />
              </Col>
              <Col className="p-8 col-2">
                <AmountInput
                  className="br-8 amount-input"
                  disabled={!frm_total}
                  style={style}
                  shotFormatter={this.state.formulaShotFormatter}
                  onChange={(value) =>
                    this.customCanEdited(
                      is_g ? 'total_mass' : 'total_volume',
                      value,
                      this.state.formulaShotFormatter
                    )
                  }
                  value={is_g ? this.state.total_mass : this.state.total_volume}
                />
              </Col>
            </>
          )}
        </Row>
      </>
    );
  };

  render() {
    const { t, config_values, order, isOpen } = this.props;
    const isRtl = rightToLeft();
    const modalTextStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction: isRtl ? 'rtl' : 'ltr',
    };

    const vol_visible = config_values.enable_custom_cansize_volumetric_visible;
    const gra_visible = config_values.enable_custom_cansize_gravimetric_visible;
    const frm_visible =
      config_values.enable_custom_cansize_formula_unit_visible;

    const nominal_only = !order.base;

    const style = { display: 'block', ...modalTextStyle };
    return (
      <>
        <Modal centered isOpen={isOpen} toggle={this.props.onClose} size="xl">
          <ModalHeader style={modalTextStyle}>
            {' '}
            {t('lbl.customCanSize', 'Custom can size')}
          </ModalHeader>
          <ModalBody style={modalTextStyle}>
            {vol_visible && this.get_volume_row(style, nominal_only)}
            {gra_visible && this.get_gravimetric_row(style, nominal_only)}
            {frm_visible && this.get_formula_row(nominal_only)}
          </ModalBody>
          <ModalFooter style={modalTextStyle}>
            <Button
              data-testid="btn_custom_can_use"
              onClick={this.handleSubmit}
            >
              {t('fn.use', 'Use')}
            </Button>

            <Button
              data-testid="btn_custom_can_cancel"
              onClick={this.props.onClose}
            >
              {t('fn.cancel', 'Cancel')}
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

CustomModal.propTypes = {
  t: PropTypes.func,
  isOpen: PropTypes.bool.isRequired,
  config_values: PropTypes.object,
  order: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  cache: PropTypes.shape({
    units: PropTypes.arrayOf(
      PropTypes.shape({
        unitid: PropTypes.number,
        unitname: PropTypes.string,
        gravimetric: PropTypes.bool,
        mainunit: PropTypes.number,
        div1: PropTypes.number,
        sym1: PropTypes.string,
        div2: PropTypes.number,
        sym2: PropTypes.string,
        div3: PropTypes.number,
        sym3: PropTypes.string,
        decimals: PropTypes.number,
        minwidth: PropTypes.number,
      })
    ),
  }),
};

function mapStateToProps(store) {
  return {
    order: store.order,
    cache: store.cache,
    config_values: store.configurations.config_values,
    formula: store.formula,
  };
}

export default withTranslation('translations')(
  connect(mapStateToProps)(CustomModal)
);

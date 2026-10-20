import React from 'react';
import {
  Row,
  Col,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Button,
} from 'reactstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withTranslation } from 'react-i18next';
import { RGBColorToHexOrNull, rightToLeft } from 'js/mylib/Utils';
import orderActions, {
  RETINT_TYPE_CORRECTION,
  propType as orderType,
} from '../../redux/reducers/Order';
import { propType as formulaType } from '../../redux/reducers/Formula';
import { makeFormatters } from '../../redux/selectors/EIValues';
import {
  scale_to_can,
  base_addition_scaling_factor,
} from '../../mylib/Formula';
import { selectors as cacheSelectors } from '../../redux/reducers/Cache';
import { selectors as spectroSelectors } from '../../redux/reducers/Spectro';
import {
  FORMULA_CORRECTION_TYPE_ADD_BASE,
  FORMULA_CORRECTION_TYPE_ADD_CNT,
  FORMULA_CORRECTION_TYPE_REFORMULATE,
  MATCH_SEARCH_CARD,
} from '../../Constants';
import { findMatchLimit, sortFormula } from '../../mylib/Utils';
import { array_to_lab } from 'polchem_base/common/color_calc/color_conv';
import { color_diff } from 'polchem_base/common/color_calc/color_diff';
import { handle_db_name } from '../../redux/Utils';
import { get_cnt_for_product } from '../../mylib/Product';
import ColorThumbnail from '../shared/ColorThumbnail';

const propTypes = {
  t: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  cache: PropTypes.shape({
    cntmap: PropTypes.instanceOf(Map),
  }),
  order: orderType,
  configurations: PropTypes.object,
  formula: formulaType,
  moveToNextSection: PropTypes.func,
  moveToPrevSection: PropTypes.func,
  matchLimits: PropTypes.array,
  setOpenSection: PropTypes.func,
  setNotes: PropTypes.func.isRequired,
  setOrderNotes: PropTypes.func.isRequired,
  reTintOrder: PropTypes.func.isRequired,
  spectro_measurement_target: PropTypes.object,
  spectro_measurement_paint: PropTypes.object,
  busy: PropTypes.object,
  setFormulaAfterCorrection: PropTypes.func,
  setFormulaCorrectionScalingFactor: PropTypes.func,
};

const defaultProps = {};

const ADD_CNT = FORMULA_CORRECTION_TYPE_ADD_CNT;
const REFORMULATE = FORMULA_CORRECTION_TYPE_REFORMULATE;
const ADD_BASE = FORMULA_CORRECTION_TYPE_ADD_BASE;
const ORIGINAL_FORMULA = 'originalformula';

class CorrectionResults extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      viewFormulas: ADD_CNT,
    };
  }

  createFormula = (correctionType) => {
    const correctionData = correctionType
      ? this.props.formula.correct_rs[correctionType]
      : null;

    if (correctionData) {
      this.props.setFormulaAfterCorrection(correctionType, correctionData);
    }
    this.props.moveToNextSection();
    this.props.reTintOrder(RETINT_TYPE_CORRECTION);
  };

  setView = (viewFormulas) => {
    this.setState({
      viewFormulas: viewFormulas,
    });
  };

  formatFormula = (cntinformula, product, base, can) => {
    if (cntinformula && base && can) {
      const cntmap = this.props.cache.cntmap;
      const augmented = cntinformula.map((cnt) => ({
        ...cnt,
        ...get_cnt_for_product(cnt.cntid, cntmap, product),
      }));
      return scale_to_can(augmented, base, can);
    }
    return null;
  };

  /** Get formula from order.item.cnts and sort it according to configurations.
   * This is "before correction" formula which is called "original formula" in the UI,
   * not to be confused with order.original_formula.
   */
  getFormula = () => {
    const { order, configurations } = this.props;

    const cnts = order.item.cnts;

    const frm =
      cnts &&
      cnts.map((cnt) => {
        return {
          ...cnt,
          volume: cnt.volume,
          additionvolume: 0,
        };
      });

    return frm && sortFormula(configurations, frm);
  };

  backHandler = () => {
    this.props.setOpenSection(MATCH_SEARCH_CARD);
  };

  getFormulaCorrectionButtons = (correctionType) => {
    const { t } = this.props;
    const isRtl = rightToLeft();
    const startFloat = isRtl ? 'right' : 'left';
    const endFloat = isRtl ? 'left' : 'right';
    return (
      <Row className={'pt-3'}>
        <Col xs={6} className="text-center">
          <Button
            style={{ width: '50%', float: startFloat }}
            color="warning"
            id="formula_correct_cancel"
            onClick={this.backHandler}
          >
            {t('fn.back', 'Back')}
          </Button>
        </Col>
        <Col xs={6} className="text-center">
          <Button
            style={{ width: '50%', float: endFloat }}
            id="formula_correction_create"
            onClick={() => {
              this.createFormula(correctionType);
            }}
          >
            {t('fn.createOrder', 'Create order')}
          </Button>
        </Col>
      </Row>
    );
  };

  getFormulaNotImprovedMessage = () => {
    const { t } = this.props;
    return (
      <div
        className={'text-center'}
        style={{
          height: '100%',
        }}
      >
        {' '}
        <p
          style={{
            fontSize: '2rem',
          }}
        >
          {t('lbl.no_formula_correction_result', 'Formula cannot be improved')}
        </p>
        <Button
          style={{
            width: '25%',
            display: 'block',
            margin: 'auto',
            marginTop: '8rem',
          }}
          color="warning"
          id="formula_correct_cancel"
          onClick={this.backHandler}
        >
          {t('fn.back', 'Back')}
        </Button>
      </div>
    );
  };

  getCorrectionData = (key) => {
    const { order, configurations, formula } = this.props;
    const responseData = formula.correct_rs[key];

    const base = order.product?.basepaints.find(
      (paint) => paint.baseid === responseData?.formula.baseid
    );

    return (
      responseData &&
      base && {
        rgb: responseData.rgb,
        cost: makeFormatters(configurations).EI_TYPE_CURRENCY.default.format(
          responseData.cost
        ),
        canSize: order.item.cansizecode,
        baseCode: base?.basecode,
        delta: {
          L: responseData.delta.lab[0],
          A: responseData.delta.lab[1],
          B: responseData.delta.lab[2],
          E: responseData.delta.de,
        },
        lab: responseData.lab,
        xyz: responseData.xyz,
        cntformula: {
          baseid: responseData.formula.baseid,
          cntinformula: this.formatFormula(
            responseData.formula.cntinformula,
            order.product,
            base,
            order.can
          ),
        },
      }
    );
  };

  getResultTabContent = (key) => {
    const {
      formula,
      order,
      configurations,
      t,
      spectro_measurement_target,
      spectro_measurement_paint,
      busy,
      matchLimits,
    } = this.props;
    const { shotFormatter } = configurations;

    if (busy.busy) {
      return null;
    }
    const data = this.getCorrectionData(key);
    if (!data) {
      return this.getFormulaNotImprovedMessage();
    }

    const desired_color = spectro_measurement_target || order.color;
    const matchLimit = findMatchLimit(matchLimits, data.delta.E);
    const originalScaledFormula = this.getFormula();

    if (data.cntformula.cntinformula.length !== originalScaledFormula?.length)
      return null; //TODO: allow new colorants

    const scalingFactor =
      key === ADD_BASE
        ? base_addition_scaling_factor(
            formula.correct_rs[key].formula.cntinformula, // formula in normalized form
            order.formula.cntinformula
          )
        : 1;

    const getRow = (cnt, index) => {
      const originalColorant = originalScaledFormula[index];
      const originalAmount = shotFormatter.format({
        volume: originalColorant.volume,
        specificgravity: originalColorant.specificgravity,
      });

      const diff = shotFormatter.format(
        {
          volume: cnt.volume * scalingFactor - originalColorant.volume,
          specificgravity: cnt.specificgravity,
        },
        true
      );
      return (
        <>
          <Col xs={6}>
            <div className="matching-colorant-row">
              <ColorThumbnail hideIfNull rgb={cnt.rgb} size="1rem" />
              <span>
                {cnt.cntcode}
                {' - '}
                {originalAmount}
              </span>
            </div>
          </Col>
          <Col xs={6}>{diff}</Col>
        </>
      );
    };
    const scaledBaseAmount = scalingFactor * order.can.basevolume;
    return (
      originalScaledFormula && (
        <>
          <Row>
            <Col xs={'4'}>
              <div className="card__infos">
                {key !== ADD_BASE && (
                  <Row>
                    <Col xs={6}>{data.baseCode}</Col>
                    <Col xs={6}>
                      {' '}
                      {Math.round(order.can.basevolume)} {' ml'}{' '}
                    </Col>
                  </Row>
                )}

                <Row className="pt-3">
                  <Col xs={6}>{t('lbl.original_amounts', 'Original')}</Col>
                  <Col xs={6}>{t('lbl.change_in_amounts', 'Change')}</Col>
                </Row>

                {key === ADD_BASE && (
                  <Row>
                    <Col xs={6}>
                      {`${data.baseCode} - ${Math.round(order.can.basevolume)} ml`}
                    </Col>
                    <Col xs={6}>
                      {Math.round(scaledBaseAmount - order.can.basevolume)}
                    </Col>
                  </Row>
                )}

                {data.cntformula &&
                  sortFormula(configurations, data.cntformula.cntinformula).map(
                    (cnt, index) => (
                      <Row
                        className="pt-1"
                        key={index}
                        data-testid={ADD_CNT + '_frm' + index}
                      >
                        {getRow(cnt, index)}
                      </Row>
                    )
                  )}
                <Row className="pt-3">
                  <Col xs={6}>{t('extraInfo.cost')}</Col>
                  <Col xs={6}>{data.cost}</Col>
                </Row>
              </div>
            </Col>
            <Col xs={'4'}>
              {data && (
                <div className="card__infos">
                  <p>
                    {' '}
                    {t(
                      'lbl.colorDifferenceAfterCorrection',
                      'Color difference after correction'
                    )}
                  </p>
                  {Object.keys(data.delta).map((delKey, i) => (
                    <p key={i} className="card__infos">
                      d{delKey} :{' '}
                      {data.delta[delKey] === '-0'
                        ? '0'
                        : makeFormatters(configurations).EI_TYPE_NUMBER.format(
                            data.delta[delKey]
                          )}
                    </p>
                  ))}

                  {matchLimit?.imageid && (
                    <div style={{ display: 'inline-block' }}>
                      <img
                        style={{
                          maxHeight: 'calc(100% - 8rem)',
                          maxWidth: 'calc(100% - 2rem)',
                        }}
                        alt="limit"
                        src={handle_db_name(
                          `/rest/image/${matchLimit.imageid}/data?hash=${matchLimit.md5_hash}`
                        )}
                      />
                    </div>
                  )}

                  <div data-testid={`matchLimitComment_${key}`}>
                    {matchLimit?.commenttext}
                  </div>
                </div>
              )}
            </Col>
            <Col xs={'4'}>
              <Row style={{ height: '100%' }}>
                <Col
                  style={{
                    backgroundColor: RGBColorToHexOrNull(desired_color?.rgb),
                  }}
                >
                  {' '}
                </Col>
                <Col>
                  <Row style={{ height: '50%' }}>
                    <Col
                      style={{
                        backgroundColor: RGBColorToHexOrNull(data.rgb),
                      }}
                    >
                      {' '}
                    </Col>
                  </Row>
                  <Row style={{ height: '50%' }}>
                    <Col
                      style={{
                        backgroundColor: RGBColorToHexOrNull(
                          spectro_measurement_paint?.rgb
                        ),
                      }}
                    >
                      {' '}
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
          </Row>
          {this.getFormulaCorrectionButtons(key)}
        </>
      )
    );
  };

  getOriginalFormulaTabContent = (key) => {
    const {
      order,
      configurations: { shotFormatter, config_values },
      t,
      spectro_measurement_target,
      spectro_measurement_paint,
      matchLimits,
    } = this.props;
    const getRow = (cnt, index) => {
      const originalColorant = originalFormula[index];
      const originalAmount = shotFormatter.format({
        volume: originalColorant.volume,
        specificgravity: originalColorant.specificgravity,
      });

      const diff = shotFormatter.format(
        {
          volume: 0,
          specificgravity: cnt.specificgravity,
        },
        true
      );
      return (
        <>
          <Col xs={6}>
            <div className="matching-colorant-row">
              <ColorThumbnail hideIfNull rgb={cnt.rgb} size="1rem" />
              <span>
                {cnt.cntcode}
                {' - '}
                {originalAmount}
              </span>
            </div>
          </Col>
          <Col xs={6}>{diff}</Col>
        </>
      );
    };

    const originalFormula = order.item.cnts;
    const desired_color = spectro_measurement_target || order.color;
    const desired_lab = desired_color?.lab
      ? array_to_lab(desired_color.lab)
      : null;

    const measured_lab = this.props.spectro_measurement_paint
      ? array_to_lab(spectro_measurement_paint.lab)
      : null;

    let simpleColorDifference,
      delta_e,
      matchLimit = null;

    if (desired_lab && measured_lab) {
      simpleColorDifference = Object.keys(desired_lab).reduce((a, k) => {
        a[k] = measured_lab[k] - desired_lab[k];
        return a;
      }, {});
      delta_e = color_diff(
        measured_lab,
        desired_lab,
        config_values.de_function_index_v4
      );

      matchLimit = findMatchLimit(matchLimits, delta_e);
    }

    return (
      originalFormula && (
        <>
          <Row>
            <Col xs={'4'}>
              <div className="card__infos">
                <Row>
                  <Col xs={6}>{order.base?.basecode}</Col>
                  <Col xs={6}>
                    {' '}
                    {Math.round(order.can.basevolume)} {' ml'}{' '}
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col xs={6}>{t('lbl.original_amounts', 'Original')}</Col>
                  <Col xs={6}>{t('lbl.change_in_amounts', 'Change')}</Col>
                </Row>

                {order.formula &&
                  sortFormula(this.props.configurations, originalFormula).map(
                    (cnt, index) => (
                      <Row
                        className="pt-1"
                        key={index}
                        data-testid={ORIGINAL_FORMULA + '_frm' + index}
                      >
                        {getRow(cnt, index)}
                      </Row>
                    )
                  )}
                {/* TODO: Cost needs to known here 
                  (
                    <Row className="pt-3">
                      <Col xs={6}>{t('extraInfo.cost')}</Col>
                      <Col xs={6}>{'formula.cost'}</Col>
                    </Row>
                  )
                  */}
              </div>
            </Col>
            <Col xs={'4'}>
              {simpleColorDifference && (
                <div className="card__infos">
                  <p> {t('lbl.colorDifference', 'Color difference')}</p>
                  {Object.keys(simpleColorDifference)
                    .slice(0, 3)
                    .map((delKey, i) => (
                      <p key={i} className="card__infos">
                        d{delKey.toUpperCase()} :{' '}
                        {simpleColorDifference[delKey] === '-0'
                          ? '0'
                          : makeFormatters(
                              this.props.configurations
                            ).EI_TYPE_NUMBER.format(
                              simpleColorDifference[delKey]
                            )}
                      </p>
                    ))}
                  <p>
                    dE:{' '}
                    {makeFormatters(
                      this.props.configurations
                    ).EI_TYPE_NUMBER.format(delta_e)}
                  </p>

                  {matchLimit?.imageid && (
                    <div style={{ display: 'inline-block' }}>
                      <img
                        style={{
                          maxHeight: 'calc(100% - 8rem)',
                          maxWidth: 'calc(100% - 2rem)',
                        }}
                        alt="limit"
                        src={handle_db_name(
                          `/rest/image/${matchLimit.imageid}/data?hash=${matchLimit.md5_hash}`
                        )}
                      />
                    </div>
                  )}

                  {matchLimit &&
                    t(matchLimit.commentcode, matchLimit.commenttext)}
                </div>
              )}
            </Col>
            <Col xs={'4'}>
              <Row style={{ height: '100%' }}>
                <Col
                  style={{
                    backgroundColor: RGBColorToHexOrNull(desired_color?.rgb),
                  }}
                >
                  {' '}
                </Col>
                <Col>
                  <Row style={{ height: '50%' }}>
                    <Col
                      style={{
                        backgroundColor: RGBColorToHexOrNull(
                          spectro_measurement_paint?.rgb
                        ),
                      }}
                    >
                      {' '}
                    </Col>
                  </Row>
                  <Row style={{ height: '50%' }}>
                    <Col
                      style={{
                        backgroundColor: RGBColorToHexOrNull(
                          spectro_measurement_paint?.rgb
                        ),
                      }}
                    >
                      {' '}
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
          </Row>
          {this.getFormulaCorrectionButtons(key)}
        </>
      )
    );
  };

  render() {
    const { t, show } = this.props;
    if (!show) {
      return null;
    }
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    return (
      <div className="matching-corrections" dir={direction}>
        <Row
          style={{
            color: 'white',
            height: '360px',
          }}
        >
          <Col md="12">
            <div
              style={{
                backgroundColor: '#112E40',
                borderRadius: '10px',
                height: '100%',
              }}
            >
              <Nav className="tab-header" tabs>
                <NavItem className="tab-item">
                  <NavLink
                    data-testid={ADD_CNT}
                    className="tab-link"
                    active={this.state.viewFormulas === ADD_CNT}
                    onClick={() => this.setView(ADD_CNT)}
                  >
                    {t('lbl.additive_formulaCorrection', 'Additive')}
                  </NavLink>
                </NavItem>
                <NavItem className="tab-item">
                  <NavLink
                    data-testid={REFORMULATE}
                    className="tab-link"
                    active={this.state.viewFormulas === REFORMULATE}
                    onClick={() => this.setView(REFORMULATE)}
                  >
                    {t('lbl.allowNewCan', 'Allow new can')}
                  </NavLink>
                </NavItem>
                <NavItem className="tab-item">
                  <NavLink
                    data-testid={ADD_BASE}
                    className="tab-link"
                    active={this.state.viewFormulas === ADD_BASE}
                    onClick={() => this.setView(ADD_BASE)}
                  >
                    {t(
                      'lbl.allowBasePaintAddition',
                      'Allow base paint addition'
                    )}
                  </NavLink>
                </NavItem>
                <NavItem className="tab-item">
                  <NavLink
                    data-testid="original-formula"
                    className="tab-link"
                    active={this.state.viewFormulas === ORIGINAL_FORMULA}
                    onClick={() => this.setView(ORIGINAL_FORMULA)}
                  >
                    {t('lbl.originalFormula', 'Original Formula')}
                  </NavLink>
                </NavItem>
              </Nav>

              <div>
                <TabContent activeTab={this.state.viewFormulas}>
                  <TabPane tabId={ADD_CNT}>
                    <Row>
                      <Col>{this.getResultTabContent(ADD_CNT)}</Col>
                    </Row>
                  </TabPane>
                  <TabPane tabId={REFORMULATE}>
                    <Row>
                      <Col>{this.getResultTabContent(REFORMULATE)}</Col>
                    </Row>
                  </TabPane>
                  <TabPane tabId={ADD_BASE}>
                    <Row>
                      <Col>{this.getResultTabContent(ADD_BASE)}</Col>
                    </Row>
                  </TabPane>
                  <TabPane tabId={ORIGINAL_FORMULA}>
                    <Row>
                      <Col>
                        {this.getOriginalFormulaTabContent(ORIGINAL_FORMULA)}
                      </Col>
                    </Row>
                  </TabPane>
                </TabContent>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  }
}

CorrectionResults.propTypes = propTypes;
CorrectionResults.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    order: store.order,
    formula: store.formula,
    cache: store.cache,
    configurations: store.configurations,
    matchLimits: cacheSelectors.matchLimits(store),
    spectro_measurement_target: spectroSelectors.measurement_target(store),
    spectro_measurement_paint: spectroSelectors.measurement_paint(store),
    busy: store.busy,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      moveToNextSection: orderActions.moveToNextSection,
      moveToPrevSection: orderActions.moveToPrevSection,
      setOpenSection: orderActions.setOpenSection,
      setNotes: orderActions.setItemNotes,
      setOrderNotes: orderActions.setOrderNotes,
      reTintOrder: orderActions.reTintOrder,
      setFormulaAfterCorrection: orderActions.setFormulaAfterCorrection,
      setFormulaCorrectionScalingFactor:
        orderActions.setFormulaCorrectionScalingFactor,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(CorrectionResults)
);

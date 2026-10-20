import PropTypes from 'prop-types';
import { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Card, CardHeader, Col, Row } from 'reactstrap';
import { bindActionCreators } from 'redux';

import { selectors as configSelectors } from 'js/redux/reducers/Configuration';
import { selectors as protectionSelectors } from 'js/redux/reducers/Protection';
import {
  COLOR_SEARCH_CARD,
  INFO_CARD,
  ORDER_MODE_FORMULA_CORRECTION,
  ORDER_MODE_NORMAL,
} from '../../../Constants';
import { rightToLeft } from '../../../mylib/Utils';
import formulaActions from '../../../redux/reducers/Formula';
import orderActions, {
  selectors as orderSelectors,
} from '../../../redux/reducers/Order';
import { selectors } from '../../../redux/reducers/Spectro';

import { CorrectionColorPanel, MatchingColorPanel } from './ColorPanels';
import MeasureTabs from './MeasureTabs';
import './styles.scss';

class Measure extends Component {
  continueHandler = (colourcode) => {
    const { lab, rgb, xyz, refl, coldataclass, wlInterval } =
      this.props.spectro_measurement_target;
    const reflectance = {
      rinf: refl,
      wl0: 400, // TODO: Spectro to return start wl?
      wlstep: wlInterval,
    };
    const color = {
      colourcode,
      lab,
      rgb,
      xyz,
      reflectance,
    };
    this.props.setColor(color);
    this.props.setColorDetails({
      ...color,
      coldataclass,
    });
    this.props.moveToNextSection();
  };

  correctFormula = () => {
    this.props.correctFormula();
    this.props.moveToNextSection();
  };

  backHandler = () => {
    // Back to orderpage
    window.history.back();
    this.setOrderSections();
  };

  setOrderSections = () => {
    this.props.setOrderMode(ORDER_MODE_NORMAL, COLOR_SEARCH_CARD);
    this.props.setOpenSection(INFO_CARD);
  };

  render() {
    const {
      t,
      show,
      config_values,
      spectro_busy,
      spectro_measurement_target,
      spectro_measurement_paint,
      allow_matching,
      order_mode,
      color,
    } = this.props;

    const isCorrection = order_mode === ORDER_MODE_FORMULA_CORRECTION;
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction,
    };
    const rightPanelStyle = {
      height: '100%',
      paddingLeft: isRtl ? 0 : '1.5rem',
      paddingRight: isRtl ? '1.5rem' : 0,
    };

    return (
      show && (
        <div className="measure__container" dir={direction}>
          <Row className="color-search-container">
            <Col className="color-search-panel height-100" md="6">
              <MeasureTabs
                showPaint={isCorrection}
                showTarget={
                  !isCorrection || config_values.fix_formula_measure_target
                }
              />
            </Col>
            <Col md="6" style={rightPanelStyle}>
              <Card className="height-100">
                <CardHeader
                  style={{ padding: '0.4rem 1.25rem', ...alignStyle }}
                >
                  {t('lbl.colorDetails')}
                </CardHeader>
                {!isCorrection ? (
                  <MatchingColorPanel
                    t={t}
                    isRtl={isRtl}
                    alignStyle={alignStyle}
                    direction={direction}
                    spectro_measurement_target={spectro_measurement_target}
                    allow_matching={allow_matching}
                    continueHandler={this.continueHandler}
                  />
                ) : (
                  <CorrectionColorPanel
                    t={t}
                    isRtl={isRtl}
                    alignStyle={alignStyle}
                    color={color}
                    spectro_measurement_target={spectro_measurement_target}
                    spectro_measurement_paint={spectro_measurement_paint}
                    spectro_busy={spectro_busy}
                    backHandler={this.backHandler}
                    correctFormula={this.correctFormula}
                  />
                )}
              </Card>
            </Col>
          </Row>
        </div>
      )
    );
  }
}

Measure.propTypes = {
  t: PropTypes.func.isRequired,
  show: PropTypes.bool,
  config_values: PropTypes.object,
  spectro_busy: PropTypes.bool.isRequired,
  spectro_measurement_target: PropTypes.object,
  spectro_measurement_paint: PropTypes.object,
  setColorDetails: PropTypes.func.isRequired,
  setColor: PropTypes.func.isRequired,
  correctFormula: PropTypes.func.isRequired,
  open_section: PropTypes.string,
  order_mode: PropTypes.string,
  moveToNextSection: PropTypes.func.isRequired,
  allow_matching: PropTypes.bool.isRequired,
  setOrderMode: PropTypes.func,
  setOpenSection: PropTypes.func,
  color: PropTypes.object,
};

const mapStateToProps = (state) => ({
  spectro_measurement_target: selectors.measurement_target(state),
  spectro_measurement_paint: selectors.measurement_paint(state),
  spectro_busy: selectors.busy(state),
  open_section: orderSelectors.open_section(state),
  order_mode: orderSelectors.order_mode(state),
  config_values: configSelectors.config_values(state),
  color: orderSelectors.color(state),
  allow_matching: protectionSelectors.allow_matching(state),
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      setColorDetails: formulaActions.setColorDetails,
      correctFormula: formulaActions.correctFormula,
      setColor: orderActions.setColor,
      moveToNextSection: orderActions.moveToNextSection,
      setOrderMode: orderActions.setOrderMode,
      setOpenSection: orderActions.setOpenSection,
    },
    dispatch
  );
};

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(Measure)
);

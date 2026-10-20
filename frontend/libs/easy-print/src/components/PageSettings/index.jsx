import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './styles.css';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import actions, {
  ORIENTATION_LANDSCAPE,
  ORIENTATION_PORTRAIT,
} from '../../redux/reducers/Layout';
import CustomInput from '../CustomInput';
import { mmToPixel, pixelToMm } from '../../containers/Utils';

import { withTranslation } from 'react-i18next';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Row } from '../../mylib/layouts/Row';
import { Col } from '../../mylib/layouts/Col';
import { Button } from '../../mylib/Button';

class PageSettings extends Component {
  shouldComponentUpdate(nextProps) {
    const {
      width,
      height,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      orientation,
    } = this.props.layout;
    if (
      width !== nextProps.layout.width ||
      height !== nextProps.layout.height ||
      marginTop !== nextProps.layout.marginTop ||
      marginBottom !== nextProps.layout.marginBottom ||
      marginLeft !== nextProps.layout.marginLeft ||
      marginRight !== nextProps.layout.marginRight ||
      orientation !== nextProps.layout.orientation
    ) {
      return true;
    }
    return false;
  }
  customWidth = (e) => {
    let num = Number(e.target.value);
    if (!isNaN(num)) {
      num = { pixel: mmToPixel(num), mm: num };
      const value = { ...this.props.layout, width: num };
      this.props.updatePage(value);
    }
  };

  customHeight = (e) => {
    let num = Number(e.target.value);
    if (!isNaN(num)) {
      num = { pixel: mmToPixel(num), mm: num };
      const value = { ...this.props.layout, height: num };
      this.props.updatePage(value);
    }
  };

  customMarginTop = (e) => {
    let num = Number(e.target.value);
    if (!isNaN(num)) {
      num = mmToPixel(num);
      const value = { ...this.props.layout, marginTop: num };
      this.props.updatePage(value);
    }
  };

  customMarginBottom = (e) => {
    let num = Number(e.target.value);
    if (!isNaN(num)) {
      num = mmToPixel(num);
      const value = { ...this.props.layout.width, marginBottom: num };
      this.props.updatePage(value);
    }
  };

  customMarginLeft = (e) => {
    let num = Number(e.target.value);
    if (!isNaN(num)) {
      num = mmToPixel(num);
      const value = { ...this.props.layout.width, marginLeft: num };
      this.props.updatePage(value);
    }
  };

  customMarginRight = (e) => {
    let num = Number(e.target.value);
    if (!isNaN(num)) {
      num = mmToPixel(num);
      const value = { ...this.props.layout.width, marginRight: num };
      this.props.updatePage(value);
    }
  };

  setOrientation = (value) => {
    switch (value) {
      case ORIENTATION_LANDSCAPE:
        this.props.setOrientation(ORIENTATION_LANDSCAPE);
        break;
      case ORIENTATION_PORTRAIT:
        this.props.setOrientation(ORIENTATION_PORTRAIT);
        break;
      default:
        break;
    }
  };

  render() {
    const { t } = this.props;
    const { width, height, marginTop, marginBottom, marginLeft, marginRight } =
      this.props.layout;
    return (
      <React.Fragment>
        <p className="pageSettings__title margin-0">
          {t('lbl.pageSettings', 'Page settings')}
        </p>
        <div className="pageSettings__items">
          <div className="pageSettings__size">
            <div>
              <p className="margin-0">{t('lbl.sizes.colon', 'Sizes:')}</p>
              <CustomInput
                type="number"
                min="0"
                value={
                  pixelToMm(width.pixel) === 0 ? '' : pixelToMm(width.pixel)
                }
                labelText={`${t('lbl.width', 'Width')} [mm]`}
                onChange={this.customWidth}
                plainText
              />
              <CustomInput
                type="number"
                min="0"
                value={
                  pixelToMm(height.pixel) === 0 ? '' : pixelToMm(height.pixel)
                }
                labelText={`${t('lbl.height', 'Height')} [mm]`}
                onChange={this.customHeight}
                plainText
              />
            </div>
          </div>
          <div className="pageSettings__margin">
            <p className="margin-0">{t('lbl.margins.colon', 'Margins:')}</p>
            <div>
              <div>
                <CustomInput
                  type="number"
                  min="0"
                  value={pixelToMm(marginTop) === 0 ? '' : pixelToMm(marginTop)}
                  placeholder={0}
                  labelText={`${t('lbl.topMargin', 'Top')} [mm]`}
                  onChange={this.customMarginTop}
                  plainText
                />
                <CustomInput
                  type="number"
                  min="0"
                  placeholder={0}
                  value={
                    pixelToMm(marginLeft) === 0 ? '' : pixelToMm(marginLeft)
                  }
                  labelText={`${t('lbl.leftMargin', 'Left')} [mm]`}
                  onChange={this.customMarginLeft}
                  plainText
                />
              </div>
              <div>
                <CustomInput
                  type="number"
                  min="0"
                  placeholder={0}
                  value={
                    pixelToMm(marginBottom) === 0 ? '' : pixelToMm(marginBottom)
                  }
                  labelText={`${t('lbl.bottomMargin', 'Bottom')} [mm]`}
                  onChange={this.customMarginBottom}
                  plainText
                />
                <CustomInput
                  type="number"
                  min="0"
                  placeholder={0}
                  value={
                    pixelToMm(marginRight) === 0 ? '' : pixelToMm(marginRight)
                  }
                  labelText={`${t('lbl.rightMargin', 'Right')} [mm]`}
                  onChange={this.customMarginRight}
                  plainText
                />
              </div>
            </div>
          </div>
          <div>
            <Row style={{ margin: 0 }}>
              <Col>
                <p className="margin-0">
                  {t('lbl.orientation.colon', 'Orientation:')}
                </p>
              </Col>
            </Row>
            <Row style={{ margin: 0 }}>
              <Col
                style={{
                  padding: 0,
                  display: 'flex',
                  justifyContent: 'space-around',
                }}
              >
                <Button
                  onClick={() => this.setOrientation(ORIENTATION_LANDSCAPE)}
                  primary={
                    this.props.layout.orientation === ORIENTATION_LANDSCAPE
                  }
                >
                  <FontAwesomeIcon icon={'image'} />
                </Button>
                <Button
                  onClick={() => this.setOrientation(ORIENTATION_PORTRAIT)}
                  primary={
                    this.props.layout.orientation === ORIENTATION_PORTRAIT
                  }
                >
                  <FontAwesomeIcon icon={'image-portrait'} />
                </Button>
              </Col>
            </Row>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

PageSettings.propTypes = {
  t: PropTypes.func.isRequired,
  layout: PropTypes.object,
  updatePage: PropTypes.func,
  setOrientation: PropTypes.func,
  classes: PropTypes.object,
};

const mapStateToProps = (state) => {
  return {
    layout: state.layout,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      updatePage: actions.updatePage,
      setOrientation: actions.setOrientation,
    },
    dispatch
  );
};

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(PageSettings)
);

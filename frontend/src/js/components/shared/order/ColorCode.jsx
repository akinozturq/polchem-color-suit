import React, { Component } from 'react';
import { Row, Col, UncontrolledTooltip } from 'reactstrap';
import ColorThumbnail from 'js/components/shared/ColorThumbnail';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import hoverActions from 'js/redux/reducers/HoverColor';
import { selectors as cacheSelectors } from 'js/redux/reducers/Cache';

import noProduct from 'img/no-product.png';
import { withTranslation } from 'react-i18next';
import { rightToLeft } from '../../../mylib/Utils';

class ColorCode extends Component {
  mapToList = (itm) => {
    if (!itm) {
      return '';
    }
    return itm.map((name, index) => (
      <li
        key={'key' + index}
        data-cy={`colorName_${name}`}
        style={{ border: 'none' }}
        onClick={() => this.props.setSelectedName(name)}
        className={'colorName'}
      >
        {name}
      </li>
    ));
  };

  mouseOver = () => {
    this.props.setHoverColor(this.props.colorData);
  };
  mouseOut = () => {
    this.props.setHoverColor(null);
  };

  getFirstColumn = (colorData) => {
    return colorData.colourcode;
  };

  getSecondColumn = (colorData) => {
    return colorData.productname
      ? colorData.productname
      : this.mapToList(colorData.colournames);
  };

  render() {
    const { colorData, isLocalFormula, t } = this.props;
    const cardStyle = {
      width: '100%',
      padding: 0,
      cursor: 'pointer',
    };
    const labelStyle = {
      fontSize: 20,
      paddingLeft: rightToLeft() ? 0 : 6,
      paddingRight: rightToLeft() ? 6 : 0,
      margin: 0,
      display: 'table-cell',
      verticalAlign: 'top',
    };

    let first_row = colorData.colourcode;
    let second_row = '';
    if (isLocalFormula) {
      second_row = colorData.productname;
      if (colorData.colourname) {
        first_row = first_row + ', ' + colorData.colourname;
      }
    } else {
      first_row = this.getFirstColumn(colorData);
      second_row = this.getSecondColumn(colorData);
    }
    let isProductAvailable = true;
    if (isLocalFormula) {
      isProductAvailable = this.props.cacheProducts.find(
        (product) => product.productid === colorData.productid
      );
    }

    return (
      <Row
        id={'colorid_' + (colorData.colourid || colorData.itemid)}
        style={cardStyle}
        onMouseEnter={this.mouseOver}
        onMouseLeave={this.mouseOut}
      >
        <Col md="12" className="pl-1">
          <div style={{ display: 'table-cell', width: '30px' }}>
            {isProductAvailable ? (
              <ColorThumbnail rgb={colorData.rgb} size="30px" showNA />
            ) : (
              <>
                <img
                  src={noProduct}
                  alt="no-product"
                  style={{ width: ' 100%' }}
                  id="no-product"
                />

                <UncontrolledTooltip target="no-product">
                  {t(
                    'lbl.localFrmProductNotFound',
                    'Dispense can be made, but the product and can size can not be changed as the product is not available in the main database'
                  )}
                </UncontrolledTooltip>
              </>
            )}
          </div>
          <p
            data-testid={`colorCode_${colorData.colourid || colorData.itemid}`}
            style={labelStyle}
          >
            {first_row}
          </p>
        </Col>

        <Col
          md="9"
          data-testid="colorNames"
          style={{
            margin: '0 auto',
            padding: 0,
            textAlign: rightToLeft() ? 'right' : 'left',
          }}
        >
          {second_row}
        </Col>
      </Row>
    );
  }
}

ColorCode.propTypes = {
  t: PropTypes.func.isRequired,
  setHoverColor: PropTypes.func.isRequired,
  setSelectedName: PropTypes.func.isRequired,
  colorData: PropTypes.shape({
    rgb: PropTypes.number,
    colourcode: PropTypes.string,
    colournames: PropTypes.arrayOf(PropTypes.string),
    productname: PropTypes.string,
    colourid: PropTypes.number,
    itemid: PropTypes.number,
    colourname: PropTypes.string,
    productid: PropTypes.number,
  }),
  isLocalFormula: PropTypes.bool,
  cacheProducts: PropTypes.array,
};

function mapStateToProps(state) {
  return {
    cacheProducts: cacheSelectors.products(state),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setHoverColor: hoverActions.setHoverColor,
      setSelectedName: hoverActions.setSelectedName,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(ColorCode)
);

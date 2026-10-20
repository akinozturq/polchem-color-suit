import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import hoverActions from 'js/redux/reducers/HoverProduct';
import { rightToLeft } from '../../../mylib/Utils';

class ProductName extends Component {
  mouseOver = () => {
    this.props.setHoverProduct(this.props.productData);
  };
  mouseOut = () => {
    this.props.setHoverProduct(null);
  };

  mouseClick = () => {
    this.props.setProduct(this.props.productData);
  };

  render() {
    const isRtl = rightToLeft();
    const { products_having_formula } = this.props;
    const product_with_formula = products_having_formula?.find(
      (item) => item.productid === this.props.productData?.productid
    );

    return (
      <div
        className="product-item"
        style={{
          ...this.props.style,
          backgroundColor: this.props.selected && 'lightblue',
          direction: isRtl ? 'rtl' : 'ltr',
          textAlign: isRtl ? 'right' : 'left',
        }}
        onMouseEnter={this.mouseOver}
        onMouseUp={this.mouseClick}
        onMouseLeave={this.mouseOut}
        data-testid={
          this.props.productData && this.props.productData.productzname
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isRtl ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: isRtl ? 'right' : 'left',
            }}
          >
            {this.props.productData && this.props.productData.productzname}
          </span>
          <span
            style={{
              flex: 0,
              textAlign: isRtl ? 'left' : 'right',
            }}
          >
            {this.props.productData && product_with_formula?.basecode}
          </span>
        </div>
      </div>
    );
  }
}

ProductName.propTypes = {
  productData: PropTypes.object.isRequired,
  products_having_formula: PropTypes.array,
  setProduct: PropTypes.func.isRequired,
  setHoverProduct: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
  style: PropTypes.shape(),
};

function mapStateToProps(store) {
  return {
    products_having_formula: store.formula.products_having_formula,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setHoverProduct: hoverActions.setHoverProduct,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(ProductName);

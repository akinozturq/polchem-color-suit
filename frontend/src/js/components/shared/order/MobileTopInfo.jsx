import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import orderActions, { propType as orderType } from 'js/redux/reducers/Order';
import ColorThumbnail from '../ColorThumbnail';

import {
  COLOR_SEARCH_CARD,
  PRODUCT_SEARCH_CARD,
  AMOUNT_CARD,
} from 'js/Constants';

class MobileTopInfo extends Component {
  render() {
    const { order } = this.props;

    //element for color circle and color text
    const color_item = (
      <li
        style={{
          color: 'white',
          display: 'flex',
          marginBottom: '1vh',
          width: 'fit-content',
        }}
        /**if click this, directs the user to this section */
        onClick={() => this.props.setOpenSection(COLOR_SEARCH_CARD)}
      >
        <ColorThumbnail rgb={order?.item?.rgb} size="3.5vh" />
        <u className="ml-2">{order?.color?.colourcode}</u>
      </li>
    );

    //element for product text
    const product_item = (
      <li
        style={{ color: 'white', marginBottom: '1vh', width: 'fit-content' }}
        onClick={() => this.props.setOpenSection(PRODUCT_SEARCH_CARD)}
      >
        <u>
          {order?.product?.productzname} - {order?.base?.basecode}
        </u>
      </li>
    );

    //element for can size text
    const canSize_item = (
      <li
        style={{ color: 'white', width: 'fit-content' }}
        onClick={() => this.props.setOpenSection(AMOUNT_CARD)}
      >
        <u>{order?.can?.cansizecode}</u>
      </li>
    );

    return (
      <ul
        style={{
          listStyleType: 'none',
          fontSize: '2.5vh',
          margin: '0px',
          padding: '0',
        }}
      >
        {/*checks if user wants to use first color or product and renders the order based on it.  */}
        {order.order_start_section === COLOR_SEARCH_CARD ? (
          //if color is found then renders it.
          <>
            {order.color && color_item} {order.product && product_item}
          </>
        ) : (
          <>
            {order.product && product_item} {order.color && color_item}
          </>
        )}

        {order.can && canSize_item}
      </ul>
    );
  }
}

//need to define types for props
MobileTopInfo.propTypes = {
  t: PropTypes.func.isRequired,
  setOpenSection: PropTypes.func.isRequired,
  order: orderType,
};

//take the necessary props from the store
function mapStateToProps(store) {
  return {
    order: store.order,
  };
}

//give the necessary actions for props.
function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setOpenSection: orderActions.setOpenSection,
    },
    dispatch
  );
}

//take translations into account and connect those two functions to this class
export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MobileTopInfo)
);

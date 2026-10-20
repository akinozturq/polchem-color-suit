import React, { Component } from 'react';
import { Button, Row, Col } from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import orderActions, { propType as orderType } from 'js/redux/reducers/Order';

class MobileCanAmount extends Component {
  render() {
    const { order, config_values } = this.props;
    const { max_cans_in_order_item } = config_values;

    return (
      order.can && (
        <Row style={{ marginBottom: '0.5rem' }}>
          <Col
            xs="4"
            style={{
              textAlign: 'center',
              padding: '0.5vh',
            }}
          >
            <Button
              className="ready-circle"
              onClick={() => this.props.setNumberOfCans(order.item.ncans - 1)}
              style={{ fontSize: '3vh' }}
              disabled={order.item.ncans <= 1}
            >
              -
            </Button>
          </Col>
          <Col
            xs="4"
            style={{
              textAlign: 'center',
            }}
          >
            <p
              style={{
                color: 'white',
                fontSize: '6vh',
                marginBottom: '0',
              }}
            >
              X {order?.item?.ncans}
            </p>
          </Col>
          <Col
            xs="4"
            style={{
              textAlign: 'center',
              padding: '0.5vh',
            }}
          >
            <Button
              className="ready-circle"
              onClick={() => this.props.setNumberOfCans(order.item.ncans + 1)}
              style={{ fontSize: '3vh' }}
              disabled={
                max_cans_in_order_item &&
                order.item.ncans >= max_cans_in_order_item
              }
            >
              +
            </Button>
          </Col>
        </Row>
      )
    );
  }
}

//need to define types for props
MobileCanAmount.propTypes = {
  t: PropTypes.func.isRequired,
  setNumberOfCans: PropTypes.func.isRequired,
  order: orderType,
  config_values: PropTypes.object,
};

//take the necessary props from the store
function mapStateToProps(store) {
  return {
    order: store.order,
    config_values: store.configurations.config_values,
  };
}

//give the necessary actions for props.
function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setNumberOfCans: orderActions.setNumberOfCans,
    },
    dispatch
  );
}

//take translations into account and connect those two functions to this class
export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MobileCanAmount)
);

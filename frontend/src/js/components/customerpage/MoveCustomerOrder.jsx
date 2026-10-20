import React from 'react';

import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import PropTypes from 'prop-types';
import {
  selectors as customerSelectors,
  propType as customerType,
} from 'js/redux/reducers/Customer';
import historyActions, {
  propType as historyType,
  selectors as historySelectors,
} from 'js/redux/reducers/History';

import { t } from 'i18next';

import CustomerInfo from './CustomerInfo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { bindActionCreators } from 'redux';
import CustomerHistoryTable from './CustomerHistoryTable';
import CustomerSelect from '../shared/CustomerSelect';
import { rightToLeft } from '../../mylib/Utils';

const propTypes = {
  setShowMoveOrders: PropTypes.func.isRequired,
  selected_customer: PropTypes.object.isRequired,
  ordersHistory: historyType.isRequired,
  customers: customerType,
  moveOrdersToCustomer: PropTypes.func.isRequired,
};

class MoveCustomerOrder extends React.Component {
  initial_state = {
    moving_orders: [],
    customer: null,
  };

  constructor(props) {
    super(props);
    this.timeout = 0;
    this.state = this.initial_state;
  }

  resetState = () => {
    this.setState(this.initial_state);
  };

  goBack = () => {
    this.props.setShowMoveOrders(false);
  };

  getScrollStyle() {
    return {
      height: '40vh',
      background: '#112E40',
      color: 'white',
    };
  }

  selectOrder = (order, isSelected) => {
    this.setState({
      moving_orders: isSelected
        ? [...this.state.moving_orders, order.orderid]
        : this.state.moving_orders.filter(
            (orderid) => orderid !== order.orderid
          ),
    });
  };

  selectAllOrders = (isSelected, orders) => {
    this.setState({
      moving_orders: isSelected ? orders.map((order) => order.orderid) : [],
    });
  };

  handleChange = (newCustomer) => {
    this.setState({ customer: newCustomer || {} });
  };

  handleMoveSelectedOrdersTo = () => {
    this.props.moveOrdersToCustomer(
      this.state.moving_orders,
      this.props.selected_customer.customerid,
      this.state.customer.customerid
    );
    this.resetState();
    this.props.setShowMoveOrders(false);
  };

  render() {
    const { selected_customer } = this.props;
    const isRtl = rightToLeft();
    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction: isRtl ? 'rtl' : 'ltr',
    };

    return (
      <>
        <div
          style={{
            color: 'white',
            wordWrap: 'break-word',
            display: 'grid',
            rowGap: '0.5rem',
            ...alignStyle,
          }}
        >
          <CustomerInfo customer={selected_customer} goBack={this.goBack} />
          <div style={{ margin: '0 1rem', height: '40vh' }}>
            <CustomerHistoryTable
              multiSelect
              onSelect={this.selectOrder}
              onSelectAll={this.selectAllOrders}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexDirection: isRtl ? 'row-reverse' : 'row',
              margin: '0 1rem',
              marginTop: '1rem',
            }}
          >
            <div style={{ width: '40%' }} className="color-dark">
              <CustomerSelect onChange={this.handleChange} />
            </div>
            <div style={{ width: '40%' }}>
              {' '}
              <button
                type="button"
                data-testid="move-selected-orders"
                onClick={this.handleMoveSelectedOrdersTo}
                className="btn btn-primary"
                disabled={
                  !this.state.customer ||
                  this.state.customer?.customerid ===
                    selected_customer.customerid ||
                  this.state.moving_orders.length === 0
                }
              >
                {t('fn.moveSelectedOrdersTo', 'Move selected orders to')}{' '}
                <FontAwesomeIcon icon={isRtl ? 'arrow-down' : 'arrow-down'} />
              </button>
            </div>
          </div>

          {this.state.customer && (
            <CustomerInfo customer={this.state.customer} />
          )}
        </div>
      </>
    );
  }
}

MoveCustomerOrder.propTypes = propTypes;

function mapStateToProps(state) {
  return {
    move_pending: historySelectors.move_pending(state), //TODO: show something while pending
    ordersHistory: state.history,
    selected_customer: customerSelectors.selected_customer(state),
    customers: state.customer,
  };
}
function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      moveOrdersToCustomer: historyActions.moveOrdersToCustomer,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MoveCustomerOrder)
);

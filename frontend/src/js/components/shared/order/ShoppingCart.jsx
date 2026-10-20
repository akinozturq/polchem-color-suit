import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import orderActions from '../../../redux/reducers/Order';
import formulaActions from '../../../redux/reducers/Formula';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { TopBar, TopBarLeft } from '../../layout/Containers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Card, CardBody, Col, Container, Row } from 'reactstrap';

import OrderTree from '../OrderTree';
import _ from 'lodash';
import { selectors as orderQueueSelectors } from '../../../redux/reducers/OrderQueue';
import { push } from 'connected-react-router';

import PropTypes from 'prop-types';
import { selectors as configurationSelectors } from '../../../redux/reducers/Configuration';
import HomePageButtons from '../../homepage/HomePageButton';
import { ClearModal } from '../ClearModal';

class ShoppingCart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checked_orders: [],
      checked_items: [],
      clearOrderModal: false,
    };
  }

  componentDidMount() {
    // Clear searches when entering the shopping cart
    this.props.clearSearches();
  }

  orderInQueue = () => {
    const { local_queue, orderid } = this.props;
    return _.find(local_queue, ['orderid', orderid]);
  };

  toggleClearOrderModal = () => {
    this.setState((prevState) => {
      return {
        clearOrderModal: !prevState.clearOrderModal,
      };
    });
  };

  item_toggled = (checked_orderids, checked_itemids) => {
    this.setState({
      checked_orders: checked_orderids,
      checked_items: checked_itemids,
    });
  };

  goBack() {
    window.history.back();
  }

  deleteItems = () => {
    // Call delete actions
    const { checked_items } = this.state;
    const order = this.orderInQueue();
    this.toggleClearOrderModal();
    if (checked_items.length > 0 && order) {
      const close = _.intersection(
        checked_items,
        order.orderitems.map((x) => x.itemid)
      );
      if (order.orderitems.length === close.length) {
        // No items left --> Back to home
        this.props.push('/');
      }
      this.props.closeOrderItems(close);
    }
  };

  render() {
    const { t, config_values } = this.props;
    const { color_code_name_swap } = config_values;
    const addingItems =
      this.props.historyRouter.location.state?.source === 'add-item-btn';

    const order = this.orderInQueue();

    return (
      <div className={'zoom-in'}>
        <TopBar>
          <TopBarLeft>
            <h2
              className="clickable-text directly-over-bg mt-8"
              onClick={this.goBack}
              data-testid="back_btn"
            >
              <FontAwesomeIcon
                icon="arrow-left"
                style={{ fontSize: '1.7rem' }}
              />{' '}
              {t('lbl.ShoppingCart', 'Shopping cart')}
            </h2>
          </TopBarLeft>
        </TopBar>

        {addingItems && (
          <div className="add_item_container" style={{ maxHeight: '250px' }}>
            <h1 className="text-center start-header directly-over-bg">
              {t('lbl.createANewItem', 'Create a new item')}
            </h1>
            <HomePageButtons addingItems={addingItems} />
          </div>
        )}
        {!this.props.busy.busy && (
          <Container
            className="justify-content-center"
            style={{
              height: addingItems
                ? 'calc(100vh - 240px - 10rem)'
                : 'calc(100vh - 102px - 5rem)',
            }}
          >
            <Card className="h-100">
              <CardBody className="br-8">
                <div
                  style={
                    addingItems
                      ? { height: 'calc(100vh - 310px - 10rem)' }
                      : { height: 'calc(100vh - 110px - 10rem)' }
                  }
                  className="p-16"
                >
                  <OrderTree
                    color_code_name_swap={color_code_name_swap}
                    expanded={true}
                    local_orders={order ? [order] : []}
                    checked_orderids={this.state.checked_orders}
                    checked_itemids={this.state.checked_items}
                    onCheck={this.item_toggled}
                    select_order_item={this.props.fetchOrderitem}
                  />
                </div>
                <Row>
                  <Col className="check-column" />
                  <Col xs={3}>
                    <Button
                      disabled={this.state.checked_items.length === 0}
                      className="btn btn-secondary"
                      onClick={this.toggleClearOrderModal}
                    >
                      {t('fn.deleteItems', 'Delete item(s)')}
                    </Button>
                  </Col>
                  <Col />
                </Row>
              </CardBody>
            </Card>
          </Container>
        )}

        <ClearModal
          show={this.state.clearOrderModal}
          toggle={this.toggleClearOrderModal}
          onOk={this.deleteItems}
          header={t('lbl.deleteItems', 'Delete item(s)')}
          message={t(
            'msg.deleteItems',
            'Do you want to delete the selected item(s)?'
          )}
        />
      </div>
    );
  }
}

ShoppingCart.propTypes = {
  t: PropTypes.func.isRequired,
  className: PropTypes.string,
  orderid: PropTypes.number,
  local_queue: PropTypes.array,
  clearSearches: PropTypes.func.isRequired,
  fetchOrderitem: PropTypes.func.isRequired,
  closeOrderItems: PropTypes.func.isRequired,
  push: PropTypes.func.isRequired,
  config_values: PropTypes.shape({ color_code_name_swap: PropTypes.bool }),
  historyRouter: PropTypes.object,
  busy: PropTypes.object,
};

function mapStateToProps(store) {
  return {
    orderid: store.order.orderid,
    local_queue: orderQueueSelectors.local_queue(store),
    config_values: configurationSelectors.config_values(store),
    historyRouter: store.router,
    busy: store.busy,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      clearSearches: formulaActions.clearSearches,
      fetchOrderitem: orderActions.fetchOrderitem,
      closeOrderItems: orderActions.closeOrderItems,
      push: push,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(ShoppingCart)
);

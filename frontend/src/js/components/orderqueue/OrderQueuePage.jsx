import React from 'react';
import PropTypes, { array } from 'prop-types';
import orderActions from 'js/redux/reducers/Order';

import { push } from 'connected-react-router';

import { TopBar, TopBarLeft } from 'js/components/layout/Containers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Row,
  Col,
  InputGroupAddon,
  InputGroup,
  CardBody,
  Card,
  Button,
  CustomInput,
  TabPane,
  TabContent,
  Nav,
  NavItem,
  NavLink,
} from 'reactstrap';

import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import orderQueueActions, {
  selectors as orderQueueSelectors,
} from 'js/redux/reducers/OrderQueue';
import _ from 'lodash';
import BootstrapTable from 'react-bootstrap-table-next';
import SearchInput from '../shared/SearchInput';
import OrderTree from '../shared/OrderTree';
import { selectors as configurationSelectors } from '../../redux/reducers/Configuration';
import { hasPrivilege } from '../../mylib/Privileges';
import { selectors as protectionSelectors } from '../../redux/reducers/Protection';

const propTypes = {
  t: PropTypes.func.isRequired,
  fetchOrderitem: PropTypes.func.isRequired,
  closeOrderItems: PropTypes.func.isRequired,
  moveOrdersToPool: PropTypes.func.isRequired,
  moveOrdersToLocal: PropTypes.func.isRequired,
  navigateTo: PropTypes.func.isRequired,
  has_order_pool: PropTypes.bool,
  queue_change_pending: PropTypes.bool,
  local_queue: array.isRequired,
  pool_queue: array,
  protection_status: PropTypes.shape({
    cloud: PropTypes.bool,
  }),
  is_ist_pro: PropTypes.bool,
  config_values: PropTypes.shape({ color_code_name_swap: PropTypes.bool }),
};

const defaultProps = {};

const TAB_QUEUE = '1';
const TAB_SUMMARY = '2';
const TAB_POOL = '3';

function order_filter(order, txt) {
  return (
    String(order.orderid).toLowerCase().includes(txt) ||
    String(order.customer?.customername || '')
      .toLowerCase()
      .includes(txt) ||
    String(order.ordernotes || '')
      .toLowerCase()
      .includes(txt) ||
    order.orderitems.some(
      (item) =>
        String(item.productname).toLowerCase().includes(txt) ||
        String(item.colourcode).toLowerCase().includes(txt)
    )
  );
}

function filter_orders(txt, orders) {
  return orders.filter((x) => order_filter(x, txt.toLowerCase()));
}

function itemids_from_orders(orders) {
  return orders.flatMap((order) => order.orderitems.map((item) => item.itemid));
}

class OrderQueuePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      queue_search: '',
      pool_search: '',
      prevOrders: null,
      data: [],
      showPool: false,
      queue_checked_orders: [],
      queue_checked_items: [],
      pool_checked_orders: [],
      active_tab: TAB_QUEUE,
    };
  }

  goHome = () => {
    this.props.navigateTo('/');
  };

  pool_item_toggled = (checked_orderids) => {
    this.setState({ pool_checked_orders: checked_orderids });
  };

  selectAllPool = (select) => {
    const { pool_queue } = this.props;

    const filtered = filter_orders(this.state.pool_search, pool_queue);
    let orders = [];

    if (select) {
      orders = filtered.map((x) => x.orderid);
    }
    this.setState({
      pool_checked_orders: orders,
    });
  };

  moveToLocal = () => {
    const { pool_queue } = this.props;
    const filtered = filter_orders(this.state.pool_search, pool_queue);
    const move = _.intersection(
      this.state.pool_checked_orders,
      filtered.map((x) => x.orderid)
    );
    this.props.moveOrdersToLocal(move);
    this.setState({
      pool_checked_orders: [],
    });
  };

  getOrderPool = () => {
    const { t, pool_queue, queue_change_pending, config_values } = this.props;
    const { color_code_name_swap } = config_values;

    const pool_orders = filter_orders(this.state.pool_search, pool_queue);

    return (
      <>
        <Row className="mb-8">
          <Col className="check-column">
            <CustomInput
              className="mt-8"
              id="pool_select_all"
              type="checkbox"
              onClick={(event) => this.selectAllPool(event.target.checked)}
            />
          </Col>
          <Col>
            <InputGroup className="p-0 pr-16">
              <InputGroupAddon addonType="prepend">
                <span className="input-small-text">
                  <FontAwesomeIcon icon="search" />
                </span>
              </InputGroupAddon>

              <SearchInput
                id="poolSearch"
                className="form-control input-small"
                use_default_style={false}
                onChange={(e) => this.setState({ pool_search: e.target.value })}
                nbrButtons={0}
                debounceTimeout={100}
                placeholder={t('prompt.search', 'Search')}
              />
            </InputGroup>
          </Col>
          <Col />
        </Row>
        <Row>
          <Col style={{ height: 'calc(100vh - 110px - 16rem)' }}>
            {queue_change_pending ? (
              this.getSpinner()
            ) : (
              <OrderTree
                color_code_name_swap={color_code_name_swap}
                expanded={false}
                local_orders={pool_orders}
                checked_orderids={this.state.pool_checked_orders}
                checked_itemids={[]}
                onCheck={this.pool_item_toggled}
                item_checkable={false}
                cyprefix={'pool'}
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col>
            <Button
              disabled={
                this.state.pool_checked_orders.length === 0 ||
                queue_change_pending ||
                !hasPrivilege('pool_move_order')
              }
              data-denied={!hasPrivilege('pool_move_order')}
              className="btn btn-secondary"
              onClick={this.moveToLocal}
              data-testid={'move_to_local'}
            >
              {t('fn.moveOrdersToQueue', 'Move order(s) to the queue')}
            </Button>
          </Col>
          <Col xs={7} />
        </Row>
      </>
    );
  };

  getStatistics = () => {
    const { t, local_queue } = this.props;

    const orders = local_queue;

    let data = [];
    orders.map((order) => {
      order.orderitems.map((item) => {
        let row = data.filter(
          (x) =>
            x.basecode === item.basecode &&
            x.productname === item.productname &&
            x.cansizecode === item.cansizecode
        );
        if (row.length === 0) {
          // Add the row to data
          data.push({
            productname: item.productname,
            basecode: item.basecode,
            cansizecode: item.cansizecode,
            nbr: item.ncans - item.ncans_tinted,
            key: data.length,
          });
        } else {
          row[0].nbr += item.ncans - item.ncans_tinted;
        }
        return null;
      });
      return null;
    });

    data = _.orderBy(data, ['productname'], ['asc']);
    const columns = [
      {
        dataField: 'productname',
        text: t('lbl.productName', 'Product name'),
      },
      {
        dataField: 'basecode',
        text: t('lbl.base', 'Base'),
      },
      {
        dataField: 'cansizecode',
        text: t('lbl.canSize'),
      },
      {
        dataField: 'nbr',
        text: t('lbl.cans', 'Cans'),
      },
    ];

    return (
      <div className="scroll">
        <BootstrapTable
          keyField="key"
          hover
          data={data}
          columns={columns}
          noDataIndication={() => t('lbl.noOrders', 'No orders')}
        />
      </div>
    );
  };

  closeItems = () => {
    // Call delete actions
    const { local_queue } = this.props;
    const { queue_checked_items, queue_search } = this.state;

    if (queue_checked_items.length) {
      const filtered = filter_orders(queue_search, local_queue);
      const items = itemids_from_orders(filtered);
      const close = _.intersection(queue_checked_items, items);
      if (close.length) {
        this.props.closeOrderItems(close);
      }
    }
    this.setState({
      queue_checked_orders: [],
      queue_checked_items: [],
    });
  };

  queue_item_toggled = (checked_orderids, checked_itemids) => {
    this.setState({
      queue_checked_orders: checked_orderids,
      queue_checked_items: checked_itemids,
    });
  };

  selectAllQueue = (select) => {
    const { local_queue } = this.props;
    const filtered = filter_orders(this.state.queue_search, local_queue);
    let items = [];
    let orders = [];

    if (select) {
      orders = filtered.map((x) => x.orderid);
      items = itemids_from_orders(filtered);
    }
    this.setState({
      queue_checked_orders: orders,
      queue_checked_items: items,
    });
  };

  getSpinner = () => {
    return (
      <div style={{ textAlign: 'center' }}>
        <FontAwesomeIcon
          icon="spinner"
          style={{ color: 'white', fontSize: '10rem' }}
          spin
        />
      </div>
    );
  };

  moveToPool = () => {
    const { local_queue } = this.props;
    const filtered = filter_orders(this.state.queue_search, local_queue);

    const move = _.intersection(
      this.state.queue_checked_orders,
      filtered.map((x) => x.orderid)
    );
    this.props.moveOrdersToPool(move);
    this.setState({
      queue_checked_orders: [],
      queue_checked_items: [],
    });
  };

  getOrderQueue = () => {
    const {
      t,
      local_queue,
      queue_change_pending,
      protection_status,
      has_order_pool,
      config_values,
    } = this.props;
    const { color_code_name_swap } = config_values;

    const order_queue = filter_orders(this.state.queue_search, local_queue);
    return (
      <>
        <Row className="mb-8">
          <Col className="check-column">
            <CustomInput
              className="mt-8"
              id="queue_select_all"
              type="checkbox"
              onClick={(event) => this.selectAllQueue(event.target.checked)}
            />
          </Col>
          <Col>
            <InputGroup className="p-0 pr-16">
              <InputGroupAddon addonType="prepend">
                <span className="input-small-text">
                  <FontAwesomeIcon icon="search" />
                </span>
              </InputGroupAddon>

              <SearchInput
                id="queueSearch"
                className="form-control input-small"
                use_default_style={false}
                onChange={(e) =>
                  this.setState({ queue_search: e.target.value })
                }
                nbrButtons={0}
                debounceTimeout={100}
                placeholder={t('prompt.search', 'Search')}
              />
            </InputGroup>
          </Col>
          <Col />
        </Row>
        <Row>
          <Col style={{ height: 'calc(100vh - 110px - 16rem)' }}>
            {queue_change_pending ? (
              this.getSpinner()
            ) : (
              <OrderTree
                color_code_name_swap={color_code_name_swap}
                expanded={local_queue.length < 4}
                local_orders={order_queue}
                checked_orderids={this.state.queue_checked_orders}
                checked_itemids={this.state.queue_checked_items}
                onCheck={this.queue_item_toggled}
                select_order_item={this.props.fetchOrderitem}
                cyprefix={'local'}
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col>
            <Button
              disabled={
                (this.state.queue_checked_items.length === 0 &&
                  this.state.queue_checked_orders.length === 0) ||
                !hasPrivilege('order_delete')
              }
              data-denied={!hasPrivilege('order_delete')}
              className="btn btn-secondary"
              onClick={this.closeItems}
              data-testid={'close_items'}
            >
              {t('fn.deleteOrders', 'Delete order(s)')}
            </Button>
          </Col>
          <Col xs={2} />
          <Col>
            {protection_status?.cloud && has_order_pool && (
              <Button
                disabled={
                  this.state.queue_checked_orders.length === 0 ||
                  queue_change_pending ||
                  !hasPrivilege('pool_move_order')
                }
                data-denied={!hasPrivilege('pool_move_order')}
                className="btn btn-secondary"
                onClick={this.moveToPool}
                data-testid={'move_to_pool'}
              >
                {t('fn.moveOrdersToPool', 'Move order(s) to the pool')}
              </Button>
            )}
          </Col>
        </Row>
      </>
    );
  };

  render() {
    const { t, pool_queue, protection_status, has_order_pool, is_ist_pro } =
      this.props;

    const pool_order_count = pool_queue.length;

    return (
      <div className={'zoom-in'}>
        <TopBar className="ml-16">
          <TopBarLeft>
            <h2 className={'pt-1'}>
              <span
                onClick={this.goHome}
                data-testid={'home'}
                className="clickable-text directly-over-bg mt-8 pl-5 pb-2 pt-0 thin-right-border"
              >
                <FontAwesomeIcon
                  icon="home"
                  style={{
                    fontSize: '1.7rem',
                  }}
                />{' '}
              </span>

              <span
                className="color-white directly-over-bg mt-8"
                style={{ paddingLeft: '1rem' }}
              >
                {is_ist_pro
                  ? t('lbl.poolQueue', 'Pool queue')
                  : t('lbl.orderQueue', 'Order queue')}
              </span>
            </h2>
          </TopBarLeft>
        </TopBar>
        <Card
          className="ml-16 mr-16 mb-16 p-0"
          style={{ height: 'calc(100vh - 110px - 4rem)' }}
        >
          <CardBody className="p-0 br-8">
            <Nav className="tab-header" tabs>
              <NavItem className="tab-item">
                <NavLink
                  className="tab-link"
                  data-testid="order_queue_tab"
                  active={this.state.active_tab === TAB_QUEUE}
                  onClick={() => this.setState({ active_tab: TAB_QUEUE })}
                >
                  {is_ist_pro
                    ? t('lbl.poolQueue', 'Pool queue')
                    : t('lbl.orderQueue', 'Order queue')}
                </NavLink>
              </NavItem>
              <NavItem className="tab-item">
                <NavLink
                  className="tab-link"
                  data-testid="order_summary"
                  active={this.state.active_tab === TAB_SUMMARY}
                  onClick={() => this.setState({ active_tab: TAB_SUMMARY })}
                >
                  {t('fn.summary', 'Summary')}
                </NavLink>
              </NavItem>
              {protection_status?.cloud && has_order_pool && (
                <NavItem className="tab-item">
                  <NavLink
                    className="tab-link"
                    data-testid="order_pool"
                    active={this.state.active_tab === TAB_POOL}
                    onClick={() => this.setState({ active_tab: TAB_POOL })}
                  >
                    <div className="pl-16" style={{ position: 'absolute' }}>
                      ({pool_order_count})
                    </div>
                    {t('fn.order_pool', 'Pool')}
                  </NavLink>
                </NavItem>
              )}
            </Nav>

            <TabContent
              activeTab={this.state.active_tab}
              className="pl-16 pr-16"
            >
              <TabPane tabId={TAB_QUEUE}>{this.getOrderQueue()}</TabPane>
              <TabPane tabId={TAB_SUMMARY}>{this.getStatistics()}</TabPane>
              <TabPane tabId={TAB_POOL}>{this.getOrderPool()}</TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </div>
    );
  }
}

OrderQueuePage.propTypes = propTypes;
OrderQueuePage.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    local_queue: orderQueueSelectors.local_queue(store),
    pool_queue: orderQueueSelectors.pool_queue(store),
    queue_change_pending: orderQueueSelectors.queue_change_pending(store),
    protection_status: store.protection.status,
    has_order_pool: configurationSelectors.has_order_pool(store),
    is_ist_pro: protectionSelectors.is_ist_pro(store),
    config_values: configurationSelectors.config_values(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchOrderitem: orderActions.fetchOrderitem,
      closeOrderItems: orderActions.closeOrderItems,
      moveOrdersToPool: orderQueueActions.moveOrdersToPool,
      moveOrdersToLocal: orderQueueActions.moveOrdersToLocal,
      navigateTo: push,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(OrderQueuePage)
);

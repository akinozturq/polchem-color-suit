import React, { Component } from 'react';
import { Col, Button, Badge } from 'reactstrap';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import orderActions from 'js/redux/reducers/Order';
import _ from 'lodash';
import { push } from 'connected-react-router';
import { selectors as configurationSelectors } from '../../redux/reducers/Configuration';
import { selectors as orderQueueSelectors } from 'js/redux/reducers/OrderQueue';
import { hasPrivilege } from '../../mylib/Privileges';
import { isSiteUser } from '../../api/WebRequest';
import { selectors as protectionSelectors } from '../../redux/reducers/Protection';
import { rightToLeft } from '../../mylib/Utils';

const defaultProps = {};

class OrderQueue extends Component {
  showOrderQueue = () => {
    const { local_queue, has_order_pool } = this.props;

    if (
      local_queue.length === 1 &&
      local_queue[0].orderitems.length === 1 &&
      !has_order_pool
    ) {
      const { zoneid, orderitems } = local_queue[0];

      const { itemid } = orderitems[0];

      this.props.fetchOrderitem(itemid, false, zoneid);
    } else {
      this.props.navigateTo('/order-queue');
    }
  };

  _hasPrivilege = (privilege) => {
    const { privileges } = this.props;
    return _.includes(privileges, privilege);
  };

  render() {
    const {
      config,
      local_queue,
      pool_queue,
      queue_change_pending,
      protection_status,
      has_order_pool,
      is_ist_pro,
    } = this.props;

    const max_orders = _.get(config, 'max_waiting_order.value', 20);
    const max_reached = local_queue.length > max_orders;

    const isRtl = rightToLeft();

    if (!isSiteUser() && !is_ist_pro) {
      return null;
    }

    return (
      (max_orders > 0 || local_queue.length > 0) && (
        <>
          <Col xs={8} />

          <Col
            xs="1"
            style={{
              marginTop: 'auto',
              marginBottom: '0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: isRtl ? 'flex-end' : 'flex-start',
            }}
          >
            <Button
              disabled={!this._hasPrivilege('order_queue')}
              style={{ position: 'relative' }}
              data-testid="btn-orderqueue"
              data-denied={!hasPrivilege('order_queue')}
              className="btn-primary btn-right btn-top float-right btn-cart"
              onClick={this.showOrderQueue}
            >
              <FontAwesomeIcon
                icon="shopping-cart"
                color={max_reached ? '#FF0000' : null}
              />
              {!queue_change_pending && (
                <Badge
                  data-testid="local_queue_padge"
                  color="primary"
                  className="shopping-badge"
                >
                  {local_queue.length}
                </Badge>
              )}
              {!queue_change_pending &&
                protection_status?.cloud &&
                has_order_pool && (
                  <Badge
                    style={{ top: '50%' }}
                    color="info"
                    className="shopping-badge"
                  >
                    {pool_queue.length}
                  </Badge>
                )}
            </Button>
          </Col>
        </>
      )
    );
  }
}

OrderQueue.propTypes = {
  local_queue: PropTypes.array.isRequired,
  pool_queue: PropTypes.array,
  queue_change_pending: PropTypes.bool,
  fetchOrderitem: PropTypes.func.isRequired,
  config: PropTypes.shape().isRequired,
  navigateTo: PropTypes.func.isRequired,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  protection_status: PropTypes.shape({ cloud: PropTypes.bool }),
  has_order_pool: PropTypes.bool,
  is_ist_pro: PropTypes.bool,
};

OrderQueue.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    local_queue: orderQueueSelectors.local_queue(store),
    pool_queue: orderQueueSelectors.pool_queue(store),
    queue_change_pending: orderQueueSelectors.queue_change_pending(store),

    config: store.configurations.config,
    privileges: store.user.current_user.privileges,
    protection_status: store.protection.status,
    has_order_pool: configurationSelectors.has_order_pool(store),
    is_ist_pro: protectionSelectors.is_ist_pro(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchOrderitem: orderActions.fetchOrderitem,
      navigateTo: push,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(OrderQueue);

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Col, Container, CustomInput, Row } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ColorThumbnail from './ColorThumbnail';
import { withTranslation } from 'react-i18next';

class LocalOrder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: true,
      pre_expanded: true,
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.expanded !== state.pre_expanded) {
      return {
        expanded: props.expanded,
        pre_expanded: props.expanded,
      };
    }
    return null;
  }

  orderItem = (order, item, checkbox, idx) => {
    const {
      onOrderItemToggle,
      checked_itemids,
      select_order_item,
      color_code_name_swap,
    } = this.props;
    const select = () => select_order_item(item.itemid, false, order.zoneid);
    return (
      <Row key={item.itemid} style={{ marginLeft: '-1.5rem' }}>
        <Col className="order-item-row">
          {checkbox && item.ncans_tinted !== item.ncans ? (
            <CustomInput
              type="checkbox"
              checked={checked_itemids.includes(item.itemid)}
              id={'item_check_' + item.itemid}
              data-testid={'item_check_' + idx}
              onChange={(e) => onOrderItemToggle(order, item, e.target.checked)}
            />
          ) : (
            <div style={{ width: '1.5rem' }} />
          )}
          <ColorThumbnail rgb={item.rgb} size="1.5rem" />
        </Col>
        <Col>
          <Row>
            <Col
              tabIndex="0"
              className="pointer-cursor"
              onClick={select}
              data-testid={'item_' + idx}
            >
              {item.productname}
            </Col>
            <Col className="pointer-cursor" onClick={select} xs={2}>
              {item.basecode}
            </Col>
            <Col className="pointer-cursor" onClick={select} xs={1}>
              {item.cansizecode}
            </Col>
            <Col
              className="pointer-cursor"
              onClick={select}
              data-testid={'item_colorcode_' + idx}
            >
              {color_code_name_swap && item.colourname
                ? item.colourname
                : item.colourcode}
            </Col>
            <Col
              className="pointer-cursor"
              onClick={select}
              xs={2}
              data-testid={'item_tinted_' + idx}
            >
              ({item.ncans_tinted} / {item.ncans})
            </Col>
          </Row>
          <Row>
            <Col className="pointer-cursor" onClick={select}>
              <span data-testid={'item_notes_' + idx} className="text-muted">
                {item.itemnotes}
              </span>
            </Col>
          </Row>
        </Col>
      </Row>
    );
  };

  render() {
    const { order, onOrderToggle, item_checkable, checked_orderids, index } =
      this.props;

    const show_item_checkbox = item_checkable
      ? order.orderitems.length > 1
      : false;

    return (
      <Row className="order-row" data-testid={'order_' + index}>
        {/** Local order data */}
        <Col className="check-column order-col">
          <CustomInput
            data-testid={this.props.cyprefix + '_select_order_' + index}
            type="checkbox"
            checked={checked_orderids.includes(order.orderid)}
            id={'order_check_' + order.orderid}
            onChange={(e) => onOrderToggle(order, e.target.checked)}
          />
        </Col>
        <Col className="arrow-column">
          {order?.orderitems.length > 1 && (
            <FontAwesomeIcon
              data-testid={'expand_order_' + index}
              className="pointer-cursor"
              icon="play"
              onClick={() =>
                this.setState((old) => ({
                  expanded: !old.expanded,
                }))
              }
              rotation={this.state.expanded ? 90 : 0}
            />
          )}
        </Col>
        <Col className="order-items-customer-column p-0" xs={9}>
          <Row>
            <Col>
              {order.orderid} {order.customer?.customername && '/'}{' '}
              {order.customer?.customername}
            </Col>
          </Row>
          {/** Order item data */}
          {(this.state.expanded || order.orderitems.length < 2) &&
            order.orderitems.map((item, item_index) =>
              this.orderItem(
                order,
                item,
                show_item_checkbox,
                `${index}_${item_index}`
              )
            )}
        </Col>
        <Col>{order.ordernotes}</Col>
      </Row>
    );
  }
}

LocalOrder.propTypes = {
  order: PropTypes.shape({
    orderid: PropTypes.number.isRequired,
    orderitems: PropTypes.arrayOf(
      PropTypes.shape({
        itemid: PropTypes.number.isRequired,
      })
    ).isRequired,
    checked: PropTypes.bool,
    customer: PropTypes.shape({
      customername: PropTypes.string,
    }),
    ordernotes: PropTypes.string,
  }).isRequired,
  checked_orderids: PropTypes.arrayOf(PropTypes.number).isRequired,
  checked_itemids: PropTypes.arrayOf(PropTypes.number).isRequired,
  onOrderToggle: PropTypes.func.isRequired,
  onOrderItemToggle: PropTypes.func.isRequired,
  select_order_item: PropTypes.func,
  expanded: PropTypes.bool,
  item_checkable: PropTypes.bool,
  index: PropTypes.number,
  cyprefix: PropTypes.string,
  color_code_name_swap: PropTypes.bool.isRequired,
};
LocalOrder.defaultProps = {
  item_checkable: true,
  cyprefix: 'local',
};

class OrderTree extends Component {
  order_toggled = (order, checked) => {
    const { checked_itemids, checked_orderids, onCheck } = this.props;
    const itemids = order.orderitems.map((item) => item.itemid);
    if (checked) {
      onCheck(
        [...checked_orderids, order.orderid],
        // check all items of the order
        [...checked_itemids, ...itemids]
      );
    } else {
      onCheck(
        checked_orderids.filter((orderid) => orderid !== order.orderid),
        // uncheck all items of the order
        checked_itemids.filter((itemid) => !itemids.includes(itemid))
      );
    }
  };

  item_toggled = (order, item, checked) => {
    let { checked_orderids, checked_itemids } = this.props;
    if (checked) {
      checked_itemids = [...checked_itemids, item.itemid];
      // ensure order is also checked
      checked_orderids = [...checked_orderids, order.orderid];
    } else {
      checked_itemids = checked_itemids.filter(
        (itemid) => itemid !== item.itemid
      );
      // uncheck order if all items unchecked
      const itemids = order.orderitems.map((item) => item.itemid);
      const any_checked = checked_itemids.some((itemid) =>
        itemids.includes(itemid)
      );
      if (!any_checked) {
        checked_orderids = checked_orderids.filter(
          (orderid) => orderid !== order.orderid
        );
      }
    }
    this.props.onCheck(checked_orderids, checked_itemids);
  };

  render() {
    const {
      t,
      local_orders,
      checked_orderids,
      checked_itemids,
      select_order_item,
      item_checkable,
      cyprefix,
      color_code_name_swap,
    } = this.props;

    return (
      <Container
        className="scroll pb-16 order-tree-container"
        style={{ height: '100%' }}
      >
        <Row className="order-row">
          <Col className="check-column" style={{ marginLeft: '-2rem' }} />
          <Col className="arrow-column" />

          <Col xs={9} className="p-0">
            {t('lbl.orderId/customer', 'Order ID / Customer')}
          </Col>
          <Col>{t('lbl.orderNotes', 'Order notes')}</Col>
        </Row>
        {local_orders &&
          local_orders.map((item, index) => (
            <LocalOrder
              color_code_name_swap={color_code_name_swap}
              index={index}
              expanded={this.props.expanded}
              key={item.orderid}
              order={item}
              checked_orderids={checked_orderids}
              checked_itemids={checked_itemids}
              onOrderToggle={this.order_toggled}
              onOrderItemToggle={this.item_toggled}
              select_order_item={select_order_item}
              item_checkable={item_checkable}
              cyprefix={cyprefix}
            />
          ))}
      </Container>
    );
  }
}

OrderTree.propTypes = {
  color_code_name_swap: PropTypes.bool.isRequired,
  t: PropTypes.func.isRequired,
  checked_orderids: PropTypes.arrayOf(PropTypes.number).isRequired,
  checked_itemids: PropTypes.arrayOf(PropTypes.number).isRequired,
  onCheck: PropTypes.func.isRequired,
  select_order_item: PropTypes.func,
  local_orders: PropTypes.array,
  expanded: PropTypes.bool,
  cyprefix: PropTypes.string,
  item_checkable: PropTypes.bool,
  order: PropTypes.shape({
    checked: PropTypes.bool,
    customer: PropTypes.shape({
      customername: PropTypes.string,
    }),
    ordernotes: PropTypes.string,
  }),
};

export default withTranslation('translations')(OrderTree);

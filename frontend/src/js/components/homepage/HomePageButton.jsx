import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { Col, Row, Tooltip } from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import orderActions, { propType as orderType } from 'js/redux/reducers/Order';
import historyActions, {
  propType as historyType,
} from 'js/redux/reducers/History';
import { push } from 'connected-react-router';
import { selectors as orderQueueSelectors } from 'js/redux/reducers/OrderQueue';
import { selectors as protectionSelectors } from 'js/redux/reducers/Protection';
import {
  COLOR_SEARCH_CARD,
  PRODUCT_SEARCH_CARD,
  FORMULA_INPUT_CARD,
  ORDER_MODE_FREE_DISPENSE,
  ORDER_MODE_NORMAL,
  ORDER_MODE_MATCHING,
  ORDER_MODE_LOCAL_FORMULA,
  PRODUCT_SEARCH_MODE_LIST,
  ARTICLE_SEARCH_CARD,
  offline_mode,
} from '../../Constants';

import _ from 'lodash';

import PropTypes from 'prop-types';
import {
  StartButton,
  StartButtonContainer,
} from 'js/components/layout/StartButton';
import ColorThumbnail from 'js/components/shared/ColorThumbnail';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isSiteUser } from '../../api/WebRequest';
import { hasPrivilege } from '../../mylib/Privileges';
import maintenanceActions from '../../redux/reducers/Maintenance';
import { RETINT_TYPE_ORDER } from '../../redux/reducers/Order';
import TextFit from '../shared/TextFit';

class HomePageButtons extends Component {
  constructor(props) {
    super(props);

    this.setProductFirst = this.setProductFirst.bind(this);
    this.setColorFirst = this.setColorFirst.bind(this);
    this.setMatchingSections = this.setMatchingSections.bind(this);
    this.setLocalFormulaSections = this.setLocalFormulaSections.bind(this);
    this.setFreeDispenseSections = this.setFreeDispenseSections.bind(this);
    this.reTintOrder = this.reTintOrder.bind(this);
    this.getLastOrder = this.getLastOrder.bind(this);
    this.state = {
      tooltip_target: null,
    };
  }

  componentDidMount() {
    // Fire fetch last order here
    this.props.loadLastOrder();
    if (offline_mode) {
      // Not supported / needed in offline mode
      this.props.fetchUnseen();
    }
  }

  setColorFirst() {
    this.props.setOrderMode(ORDER_MODE_NORMAL, COLOR_SEARCH_CARD);
    this.props.setProductSearchMode(PRODUCT_SEARCH_MODE_LIST);
    this.props.setOpenSection(COLOR_SEARCH_CARD);
  }

  setProductFirst() {
    this.props.setOrderMode(ORDER_MODE_NORMAL, PRODUCT_SEARCH_CARD);
    this.props.setProductSearchMode(PRODUCT_SEARCH_MODE_LIST);
    this.props.setOpenSection(PRODUCT_SEARCH_CARD);
  }

  setMatchingSections() {
    this.props.setOrderMode(ORDER_MODE_MATCHING);
    this.props.setOpenSection(COLOR_SEARCH_CARD);
  }

  setLocalFormulaSections() {
    this.props.setOrderMode(ORDER_MODE_LOCAL_FORMULA);
    this.props.setOpenSection(COLOR_SEARCH_CARD);
  }

  setFreeDispenseSections() {
    this.props.setOrderMode(ORDER_MODE_FREE_DISPENSE);
    this.props.setOpenSection(FORMULA_INPUT_CARD);
  }

  reTintOrder(order) {
    this.props.fetchOrderitem(order.itemid, RETINT_TYPE_ORDER, order.zoneid);
  }

  setArticleSections() {
    this.props.setOrderMode(ORDER_MODE_NORMAL, ARTICLE_SEARCH_CARD);
    this.props.setProductSearchMode(PRODUCT_SEARCH_MODE_LIST);
    this.props.setOpenSection(ARTICLE_SEARCH_CARD);
  }

  getLastOrder(order) {
    const { config } = this.props;

    return (
      <div>
        <div style={{ position: 'absolute', left: '1rem', top: '1.2rem' }}>
          <ColorThumbnail hideIfNull rgb={order.rgb} size="24px" />
        </div>
        <div
          data-testid="lastOrderCode"
          className="fill-available ml-3"
          style={{
            fontSize: '12px',
          }}
        >
          {_.get(config, 'color_code_name_swap.value') && order.colourname
            ? order.colourname
            : order.colourcode}
        </div>
      </div>
    );
  }

  _maxOrdersReached = () => {
    const { config, local_orders_in_queue } = this.props;
    return (
      local_orders_in_queue >
      Math.max(_.get(config, 'max_waiting_order.value', 20), 0)
    );
  };

  _maxOrdersTooltip = (target) => {
    const { t } = this.props;

    return (
      this._maxOrdersReached() && (
        <Tooltip
          isOpen={this.state.tooltip_target === target}
          placement="bottom"
          target={target}
          toggle={() => this.setState({ tooltip_target: null })}
        >
          {t(
            'lbl.notPossibleToCreate',
            'The waiting list for orders is full. It is not possible to create new orders.'
          )}
        </Tooltip>
      )
    );
  };

  _ColorButton = (big) => {
    const { t } = this.props;
    return (
      <div
        onMouseEnter={() =>
          this.setState({ tooltip_target: 'actionCreateNew' })
        }
      >
        <StartButton
          data-testid="colorButton"
          big={big}
          id="actionCreateNew"
          disabled={this._maxOrdersReached() || !hasPrivilege('order_new')}
          data-denied={!hasPrivilege('order_new')}
          data-tr={'fn.color'}
          onClick={() => {
            this.props.navigateTo('/orderpage');
            this.setColorFirst();
          }}
        >
          {t('fn.color', 'Color')}
        </StartButton>
        {this._maxOrdersTooltip('actionCreateNew')}
      </div>
    );
  };

  _ProductButton = (big) => {
    const { t } = this.props;
    return (
      <div
        onMouseEnter={() => this.setState({ tooltip_target: 'productButton' })}
      >
        <StartButton
          data-testid="productButton"
          big={big}
          id={'productButton'}
          disabled={this._maxOrdersReached() || !hasPrivilege('order_new')}
          data-denied={!hasPrivilege('order_new')}
          data-tr={'fn.product'}
          onClick={() => {
            this.props.navigateTo('/orderpage');
            this.setProductFirst();
          }}
        >
          {t('fn.product', 'Product')}
        </StartButton>
        {this._maxOrdersTooltip('productButton')}
      </div>
    );
  };

  _ReTintButton = (big) => {
    const { t } = this.props;

    const last_order = this.props.history.lastorder.data[0] || {};

    return (
      <div
        onMouseEnter={() =>
          this.setState({ tooltip_target: 'actionCreateNew' })
        }
      >
        <StartButton
          data-testid="retintButton"
          id="retint-button"
          big={big}
          disabled={
            this._maxOrdersReached() ||
            !hasPrivilege('order_retint') ||
            last_order.itemid === undefined ||
            offline_mode
          }
          data-denied={!hasPrivilege('order_retint') || offline_mode}
          data-tr={'fn.retint'}
          onClick={() => {
            this.reTintOrder(last_order);
          }}
        >
          <TextFit
            containerId="retint-button"
            style={{
              marginLeft: '1.2rem',
            }}
            text={t('fn.retint', 'Re-tint')}
          />

          {this.getLastOrder(last_order)}
        </StartButton>

        {this._maxOrdersTooltip('retint-button')}
      </div>
    );
  };

  _HistoryButton = (big) => {
    const { t } = this.props;

    return (
      <StartButton
        data-testid="historyButton"
        big={big}
        disabled={!hasPrivilege('history_items')}
        data-denied={!hasPrivilege('history_items')}
        data-tr={'fn.history'}
        onClick={() => {
          this.props.navigateTo('/history');
        }}
      >
        {t('fn.history', 'History')}
      </StartButton>
    );
  };

  _MatchingButton = (big) => {
    const { t } = this.props;
    return (
      <div
        onMouseEnter={() => this.setState({ tooltip_target: 'matchingButton' })}
      >
        <StartButton
          data-testid="matchingButton"
          id={'matchingButton'}
          big={big}
          disabled={
            this._maxOrdersReached() ||
            !(
              hasPrivilege('order_matching') ||
              hasPrivilege('order_search_closest')
            ) ||
            offline_mode
          }
          data-denied={
            !(
              hasPrivilege('order_matching') ||
              hasPrivilege('order_search_closest')
            ) || offline_mode
          }
          data-tr={'fn.matching'}
          onClick={() => {
            this.props.navigateTo('/matching');
            this.setMatchingSections();
          }}
        >
          {t('fn.matching', 'Matching')}
        </StartButton>

        {this._maxOrdersTooltip('matchingButton')}
      </div>
    );
  };

  _LocalFormulaButton = (big) => {
    const { t } = this.props;
    return (
      <div
        onMouseEnter={() =>
          this.setState({ tooltip_target: 'localFormulaButton' })
        }
      >
        <StartButton
          data-testid="localFormulaButton"
          id="localFormulaButton"
          big={big}
          disabled={
            this._maxOrdersReached() ||
            !hasPrivilege('order_local_formula') ||
            offline_mode
          }
          data-denied={!hasPrivilege('order_local_formula') || offline_mode}
          data-tr={'fn.localFormula'}
          onClick={() => {
            this.props.navigateTo('/localformula');
            this.setLocalFormulaSections();
          }}
        >
          {t('fn.localFormula', 'Local formula')}
        </StartButton>

        {this._maxOrdersTooltip('localFormulaButton')}
      </div>
    );
  };

  _CustomerButton = (big) => {
    const { t, config } = this.props;

    const customer_data = _.get(config, 'enable_customer_data.value', true);
    return (
      customer_data && (
        <StartButton
          data-testid="customerButton"
          big={big}
          disabled={!hasPrivilege('history_view_customer')}
          data-denied={!hasPrivilege('history_view_customer')}
          data-tr={'fn.customer'}
          onClick={() => {
            this.props.navigateTo('/customers');
          }}
        >
          {t('fn.customer', 'Customer')}
        </StartButton>
      )
    );
  };

  _FreeDispenseButton = (big) => {
    const { t } = this.props;
    return (
      <div
        onMouseEnter={() =>
          this.setState({ tooltip_target: 'freeDispenseButton' })
        }
      >
        <StartButton
          data-testid="freeDispenseButton"
          id="freeDispenseButton"
          big={big}
          disabled={
            this._maxOrdersReached() || !hasPrivilege('order_free_dispense')
          }
          data-denied={!hasPrivilege('order_free_dispense')}
          data-tr={'fn.freeDispense'}
          onClick={() => {
            this.props.navigateTo('/freedispense');
            this.setFreeDispenseSections();
          }}
        >
          {t('fn.freeDispense', 'Free dispense')}
        </StartButton>

        {this._maxOrdersTooltip('freeDispenseButton')}
      </div>
    );
  };

  _ArticleButton = (big) => {
    const { t } = this.props;
    return (
      <StartButton
        data-testid="articleButton"
        big={big}
        disabled={!hasPrivilege('order_article_number')}
        data-denied={!hasPrivilege('order_article_number')}
        data-tr={'fn.article'}
        onClick={() => {
          this.props.navigateTo('/orderpage');
          this.setArticleSections();
        }}
      >
        {t('fn.article', 'Article')}
      </StartButton>
    );
  };

  getButtons = (code, big) => {
    if (code === 'color') return this._ColorButton(big);
    if (code === 'product') return this._ProductButton(big);
    if (code === 'history') return this._HistoryButton(big);
    if (code === 'retint') return this._ReTintButton(big);
    if (code === 'matching') return this._MatchingButton(big);
    if (code === 'localformula') return this._LocalFormulaButton(big);
    if (code === 'customer') return this._CustomerButton(big);
    if (code === 'freedispense') return this._FreeDispenseButton(big);
    if (code === 'article') return this._ArticleButton(big);
  };

  getFirstRow = (btns) => {
    const cols = btns.slice(0, 2).map((btn) => (
      <Col md={6} key={btn}>
        {this.getButtons(btn, true)}
      </Col>
    ));
    return <Row>{cols}</Row>;
  };

  getSecondRow = (btns) => {
    let cols;
    if (btns.length < 7) {
      let tmp = btns.slice(2, 4);
      cols = tmp.map((btn) => (
        <Col md={6} key={btn}>
          {this.getButtons(btn, false)}
        </Col>
      ));
    } else {
      let tmp = btns.slice(2, 5);
      cols = tmp.map((btn) => (
        <Col md={4} key={btn}>
          {this.getButtons(btn, false)}
        </Col>
      ));
    }
    return <Row>{cols}</Row>;
  };

  getThirdRow = (btns) => {
    let cols;
    if (btns.length < 7) {
      let tmp = btns.slice(4, 6);
      cols = tmp.map((btn) => (
        <Col md={6} key={btn}>
          {this.getButtons(btn, false)}
        </Col>
      ));
    } else {
      let tmp = btns.slice(5, 8);
      cols = tmp.map((btn) => (
        <Col md={4} key={btn}>
          {this.getButtons(btn, false)}
        </Col>
      ));
    }
    return <Row>{cols}</Row>;
  };

  getFourthRow = (btns) => {
    let cols;

    let tmp = btns.slice(8, 9);
    cols = tmp.map((btn) => (
      <Col md={4} key={btn}>
        {this.getButtons(btn, false)}
      </Col>
    ));

    return <Row>{cols}</Row>;
  };

  render() {
    const { config, is_pro, addingItems } = this.props;

    let { home_buttons } = config;

    home_buttons =
      home_buttons === undefined ? [] : home_buttons.value.split(';');

    if (!is_pro) {
      home_buttons = home_buttons.filter(
        (x) => !['matching', 'customer', 'article'].includes(x)
      );
    }

    if (addingItems) {
      const excludeButtons = ['retint', 'history', 'customer', 'freedispense'];
      //order.customer && _.remove(excludeButtons, (_btn) => _btn === 'history');
      home_buttons = home_buttons.filter((x) => !excludeButtons.includes(x));
    }

    if (!isSiteUser()) {
      home_buttons = home_buttons.filter((x) =>
        ['color', 'product'].includes(x)
      );
    }

    return (
      <>
        <StartButtonContainer>
          {home_buttons.length === 0 && (
            <div style={{ textAlign: 'center' }}>
              <FontAwesomeIcon
                icon="spinner"
                style={{ color: 'white', fontSize: '10rem' }}
                spin
              />
            </div>
          )}
          {home_buttons && this.getFirstRow(home_buttons)}
          {home_buttons && this.getSecondRow(home_buttons)}
          {home_buttons && this.getThirdRow(home_buttons)}
          {home_buttons && this.getFourthRow(home_buttons)}
        </StartButtonContainer>
      </>
    );
  }
}

HomePageButtons.propTypes = {
  setOpenSection: PropTypes.func.isRequired,
  clearOrder: PropTypes.func.isRequired,
  fetchOrderitem: PropTypes.func.isRequired,
  setOrderMode: PropTypes.func.isRequired,
  setProductSearchMode: PropTypes.func.isRequired,
  loadLastOrder: PropTypes.func.isRequired,
  navigateTo: PropTypes.func.isRequired,
  local_orders_in_queue: PropTypes.number.isRequired,
  order: orderType,
  history: historyType,
  t: PropTypes.func.isRequired,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  config: PropTypes.shape({
    home_buttons: PropTypes.object,
  }),
  user: PropTypes.object,
  is_pro: PropTypes.bool,
  fetchUnseen: PropTypes.func.isRequired,
  addingItems: PropTypes.bool,
};

function mapStateToProps(store) {
  return {
    user: store.user,
    buttons: store.buttons,
    order: store.order,
    local_orders_in_queue: orderQueueSelectors.local_queue(store).length,
    history: store.history,
    config: store.configurations.config,
    privileges: store.user.current_user.privileges,
    local_frms: store.formula.local_frms,
    is_pro: protectionSelectors.is_pro(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setOpenSection: orderActions.setOpenSection,
      setOrderMode: orderActions.setOrderMode,
      setProductSearchMode: orderActions.setProductSearchMode,
      fetchOrderitem: orderActions.fetchOrderitem,
      clearOrder: orderActions.clearOrder,
      loadLastOrder: historyActions.loadLastOrder,
      navigateTo: push,
      fetchUnseen: maintenanceActions.fetchUnseen,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(HomePageButtons)
);

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import orderActions, { propType as orderType } from 'js/redux/reducers/Order';
import formulaActions from 'js/redux/reducers/Formula';
import { Badge, Button, UncontrolledTooltip } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { selectors as protectionSelectors } from 'js/redux/reducers/Protection';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { push } from 'connected-react-router';
import CustomerModal from './CustomerModal';
import ErrorBoundary from '../shared/ErrorBoundaryModal';
import {
  TopBar,
  TopBarLeft,
  TopBarRight,
} from 'js/components/layout/Containers';
import { pluginActionButtons } from '../plugins';
import printActions from '../../redux/reducers/PrintPreview';
import { detectMobile, disabledDuringTinting } from '../../mylib/Utils';
import { selectors as machineSelectors } from '../../redux/reducers/Machine';
import { selectors as orderQueueSelectors } from 'js/redux/reducers/OrderQueue';
import _ from 'lodash';
import {
  AMOUNT_CARD,
  COLDATACLASS_SPHERE,
  FORMULA_VERSION_ALTERNATIVE,
  FORMULA_VERSION_HISTORY,
  INFO_CARD,
  NUMERIC_ORDER_STATUS,
  ORDER_MODE_FREE_DISPENSE,
  ORDER_MODE_MATCHING,
  ORDER_MODE_NORMAL,
  ORDER_STATUS_DONE,
  ORDER_STATUS_PREPARING,
  ORDER_STATUS_UNCONFIRMED,
} from '../../Constants';
import { isSiteUser } from '../../api/WebRequest';
import buyerIcon from '../../../img/buyer-icon.png';
import { hasPrivilege } from '../../mylib/Privileges';
import barcodeActions from '../../redux/reducers/BarcodeAction';
import EmailPreviewModal from './EmailPreviewModal';
import alternative_match from 'img/matchType/alternative_match.svg';
import { ClearModal } from './ClearModal';

class TopActionButtons extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clearOrderModal: false,
      showEmailModal: false,
    };
  }

  showCustomerModal = () => {
    this.props.setCustomerModalOpen(!this.props.order.customer_modal_open);
  };

  handleSaveCustomer = (customer) => {
    this.props.setDiscount(customer.discountrate);
    this.props.setCustomer(customer);
    this.props.saveCustomer();
  };

  toggleClearOrderModal = () => {
    this.setState((prevState) => {
      return {
        clearOrderModal: !prevState.clearOrderModal,
      };
    });
  };

  toggleEmailLabelModal = () => {
    this.setState((prevState) => {
      return {
        showEmailModal: !prevState.showEmailModal,
      };
    });
  };

  togglePrintLabelModal = () => {
    this.props.setLayout(null);
    this.props.setOrder(this.props.order, this.props.order.ncans_tinted + 1);
    this.props.setVisible(true);
  };

  clearOrderPressed = () => {
    const { order } = this.props;
    // In case of done order hide it from history
    this.toggleClearOrderModal();
    if (order.item.status === ORDER_STATUS_DONE) {
      this.props.hideItem(order.item.itemid);
      this.props.push('/');
    } else {
      const item_count = this.getitemCount();
      if (item_count === 1 || this.getItemCountOfNonDoneItems() === 1) {
        this.props.closeOrderItems();

        this.props.push('/');
      } else {
        this.props.clearOrderItem();
      }
    }
  };

  onHomeButtonClicked = () => {
    this.props.push('/');
    this.props.setOrderMode(ORDER_MODE_NORMAL);
  };

  getitemCount = () => {
    const { local_queue, order } = this.props;
    let item_count = (
      _.find(local_queue, ['orderid', order.orderid])?.orderitems || []
    ).length;

    if (!order.item.itemid) {
      item_count += 1;
    }
    return item_count;
  };

  getItemCountOfNonDoneItems = () => {
    const { local_queue, order } = this.props;
    const items =
      _.find(local_queue, ['orderid', order.orderid])?.orderitems || [];

    return items.filter(
      (item) => item.status !== NUMERIC_ORDER_STATUS[ORDER_STATUS_DONE]
    ).length;
  };

  alternativeMatchingClicked = () => {
    this.props.saveOrderState();
    this.props.alternativeMatching(true);
    this.props.setOrderMode(ORDER_MODE_MATCHING);
    this.props.push('/matching');
    this.props.setOpenSection(AMOUNT_CARD);
  };

  getButtons = (disable, trash_tooltip) => {
    const {
      t,
      order,
      config_values,
      print_labels,
      email_templates,
      formula: { color_details },
      allow_matching,
    } = this.props;
    const customer_data = config_values.enable_customer_data ?? true;
    const { hide_match_alternative_formulas } = config_values;

    const hide_print_label = isSiteUser()
      ? config_values.hide_print_label
      : config_values.ist_hide_print_label;

    const ist_email_template_handling =
      config_values.ist_email_template_handling ?? 'A';

    const history_frms_available = config_values.history_frms_available !== 0;
    const customerText =
      order.customer && order.customer.customername
        ? order.customer.customername.substring(0, 3) + ' ******* '
        : '';
    let but = [];

    // Home
    but.push(
      <Button
        data-testid="homeBtn"
        key="home"
        id="homeBtn"
        className="btn btn-primary btn-left btn-top"
        disabled={order.item.status === ORDER_STATUS_PREPARING}
        onClick={this.onHomeButtonClicked}
        style={{
          width: detectMobile() ? '2.7rem' : '',
          height: detectMobile() ? '2.7rem' : '',
        }}
      >
        <FontAwesomeIcon icon="home" />
      </Button>,

      <UncontrolledTooltip
        key="home_tooltip"
        placement="bottom"
        target="homeBtn"
      >
        {t('lbl.home', 'Home')}
      </UncontrolledTooltip>
    );

    // Remove
    const showDeleteButton =
      order.item.status !== ORDER_STATUS_DONE ||
      config_values.allow_hiding_orders !== false;
    !detectMobile() &&
      showDeleteButton &&
      but.push(
        <Button
          key="trash"
          id="trashBtn"
          className="btn btn-primary btn-left btn-top"
          disabled={
            !(order.color || order.product) ||
            order.item.status === ORDER_STATUS_PREPARING ||
            !hasPrivilege('order_delete')
          }
          onClick={this.toggleClearOrderModal}
          data-denied={!hasPrivilege('order_delete')}
        >
          <FontAwesomeIcon icon="trash-alt" />
        </Button>,

        <UncontrolledTooltip
          key="trash_tooltip"
          placement="bottom"
          target="trashBtn"
          data-cy="tooltip-clear-order"
        >
          {trash_tooltip}
        </UncontrolledTooltip>
      );

    let enable = order.color && order.product && order.can && !disable;

    // Email
    (isSiteUser() || ist_email_template_handling !== 'H') &&
      email_templates.length > 0 &&
      but.push(
        <Button
          data-testid="emailbutton"
          key="email"
          id="emailBtn"
          className="btn btn-primary btn-left btn-top"
          disabled={
            !enable ||
            !email_templates.length ||
            !hasPrivilege('order_print_label')
          }
          onClick={this.toggleEmailLabelModal}
          style={{
            width: detectMobile() ? '2.7rem' : '',
            height: detectMobile() ? '2.7rem' : '',
          }}
        >
          <FontAwesomeIcon
            icon={ist_email_template_handling === 'P' ? 'print' : 'envelope'}
          />
        </Button>,

        <UncontrolledTooltip
          key="email_tooltip"
          placement="bottom"
          target="emailBtn"
        >
          {ist_email_template_handling === 'P'
            ? t('lbl.print', 'Print order')
            : t('lbl.send_email', 'Send order as email')}
        </UncontrolledTooltip>
      );

    // Print
    !detectMobile() &&
      !hide_print_label &&
      print_labels.length > 0 &&
      but.push(
        <Button
          data-testid="printbutton"
          key="print"
          id="printBtn"
          data-denied={!hasPrivilege('order_print_label')}
          className="btn btn-primary btn-left btn-top"
          disabled={
            !enable ||
            !print_labels.length ||
            !hasPrivilege('order_print_label')
          }
          onClick={this.togglePrintLabelModal}
          style={{
            width: detectMobile() ? '2.7rem' : '',
            height: detectMobile() ? '2.7rem' : '',
          }}
        >
          <FontAwesomeIcon icon="print" />
        </Button>,

        <UncontrolledTooltip
          key="print_tooltip"
          placement="bottom"
          target="printBtn"
        >
          {t('lbl.print_label', 'Print label')}
        </UncontrolledTooltip>
      );

    // Plugins
    for (let b of pluginActionButtons()) {
      but.push(b);
    }

    //customer
    if (
      this.props.is_pro &&
      (isSiteUser() || this.props.is_ist_pro) &&
      customer_data &&
      order.order_mode !== ORDER_MODE_FREE_DISPENSE
      //!detectMobile()
    ) {
      but.push(
        <Button
          id="customerBtn"
          key="customer"
          data-testid="btn-add-customer"
          className="btn btn-primary btn-left btn-top"
          onClick={this.showCustomerModal}
          data-denied={!hasPrivilege('order_customer_edit')}
          disabled={!hasPrivilege('order_customer_edit')}
          style={{
            fontSize: customerText ? '1em' : '',
            width: customerText ? '10rem' : detectMobile() ? '2.7rem' : '',
            height: detectMobile() ? '2.7rem' : '',
          }}
        >
          {!customerText ? (
            <img
              src={buyerIcon}
              style={{ maxWidth: '80%' }}
              alt="customer-icon"
            />
          ) : (
            <span>
              {customerText}
              <FontAwesomeIcon icon="pencil-alt" style={{ color: 'blue' }} />
            </span>
          )}
        </Button>,

        <UncontrolledTooltip
          key="customer_tooltip"
          placement="bottom"
          target="customerBtn"
        >
          {t('lbl.customer_for_order', 'Customer information')}
        </UncontrolledTooltip>
      );
    }

    // History modal
    if (history_frms_available) {
      if (
        order.color &&
        order.product &&
        order.order_mode === ORDER_MODE_NORMAL &&
        order.item.status === ORDER_STATUS_UNCONFIRMED &&
        order.open_section === INFO_CARD &&
        this.props.formula.frms.find((x) => x.ishistory)
      ) {
        but.push(
          <Button
            id="frm_histroryBtn"
            key="frm_history"
            data-testid="btn_frm_history"
            className={
              'btn btn-primary btn-left btn-top' +
              (order?.formula?.ishistory ? ' btn-active' : '')
            }
            onClick={() =>
              this.props.toggleFormulaVersionModal(FORMULA_VERSION_HISTORY)
            }
            style={{
              width: detectMobile() ? '2.7rem' : '',
              height: detectMobile() ? '2.7rem' : '',
            }}
          >
            <FontAwesomeIcon icon="clock-rotate-left" />
            {order.formula_version_modal_type === FORMULA_VERSION_HISTORY && (
              <div className="formula_version_triangle" />
            )}
          </Button>,

          <UncontrolledTooltip
            key="history_tooltip"
            placement="bottom"
            target="frm_histroryBtn"
          >
            {t('lbl.formula_history', 'Formula history')}
          </UncontrolledTooltip>
        );
      }
    }
    // Alternative modal
    if (
      order.color &&
      order.product &&
      order.order_mode === ORDER_MODE_NORMAL &&
      order.item.status === ORDER_STATUS_UNCONFIRMED &&
      order.open_section === INFO_CARD &&
      (isSiteUser()
        ? this.props.formula.frms.find((x) => x.isalternative)
        : this.props.formula.frms.find((x) => x.isalternative || x.isfallback))
    ) {
      but.push(
        <Button
          id="frm_alternativeBtn"
          key="frm_alternative"
          data-testid="btn_frm_alternative"
          className="btn btn-primary btn-left btn-top"
          onClick={() =>
            this.props.toggleFormulaVersionModal(FORMULA_VERSION_ALTERNATIVE)
          }
          style={{
            width: detectMobile() ? '2.7rem' : '',
            height: detectMobile() ? '2.7rem' : '',
          }}
        >
          <FontAwesomeIcon icon="right-left" />
          {order.formula_version_modal_type === FORMULA_VERSION_ALTERNATIVE && (
            <div className="formula_version_triangle" />
          )}
        </Button>,

        <UncontrolledTooltip
          key="frm_alternative_tooltip"
          placement="bottom"
          target="frm_alternativeBtn"
        >
          {t('lbl.alternative_formulas', 'Alternative formulas')}
        </UncontrolledTooltip>
      );
    }
    // redirect to match baseids
    if (
      order.open_section === INFO_CARD &&
      allow_matching &&
      order.product?.has_matching &&
      order.item.status === ORDER_STATUS_UNCONFIRMED &&
      order.can &&
      color_details?.reflectance?.rinf &&
      color_details?.coldataclass === COLDATACLASS_SPHERE &&
      !this.props.formula.frms.find((x) => x.isalternative) &&
      !hide_match_alternative_formulas
    ) {
      but.push(
        <Button
          id="alternativeMatchingBtn"
          key="baseids_matching"
          data-testid="btn_baseids_matching"
          className="btn btn-primary btn-left btn-top"
          onClick={this.alternativeMatchingClicked}
          style={{
            width: detectMobile() ? '2.7rem' : '',
            height: detectMobile() ? '2.7rem' : '',
          }}
        >
          <img
            src={alternative_match}
            width="70%"
            height="70%"
            alt="alt_match"
          />
        </Button>,

        <UncontrolledTooltip
          key="baseids_matching_tooltip"
          placement="bottom"
          target="alternativeMatchingBtn"
        >
          {t('lbl.match_alternative_formulas', 'Match alternative formulas')}
        </UncontrolledTooltip>
      );
    }

    return but;
  };

  render() {
    const { order, config, config_values, machine, local_queue, t } =
      this.props;
    const distint = disabledDuringTinting(order, config, machine);

    const add_item_visible = !!config_values.multiple_items_in_order;

    const items =
      _.find(local_queue, ['orderid', order.orderid])?.orderitems || [];

    let header = t('fn.clearOrder', 'Clear order');

    let message = t(
      'msg.confirmClearOrder',
      'Are you sure to clear the order?'
    );
    if (this.getitemCount() > 1) {
      header = t('fn.clearItem', 'Clear item');
      message = t('msg.confirmClearItem', 'Are you sure to clear the item?');
    }

    if (order.orderid && this.getitemCount() === 1) {
      // If some of the cans are dispensed the text should say "cancel remaining cans and mark as done"
      if (order.ncans_tinted > 0 && order.ncans_tinted < order.item.ncans) {
        header = t(
          'fn.cancelRemainingCans',
          'Cancel remaining cans and mark as done'
        );
        message = t(
          'msg.confirmCancelRemainingCans',
          'Are you sure to cancel the remaining cans and mark as done?'
        );
      } else {
        header = t('lbl.delete_item_from_queue', 'Delete item from queue');
        message = t(
          'msg.confirmDeleteItem',
          'Are you sure to delete the item from queue?'
        );
      }
    }
    if (order.item.status === ORDER_STATUS_DONE) {
      // Show message indicating that the order is already done and will be removed
      header = t('fn.hideOrder', 'Hide order from history');
      message = t(
        'msg.confirmHideDoneOrder',
        'The order is already done and will be hidden from history. Are you sure?'
      );
    }

    return (
      <TopBar className="top-action-buttons">
        <TopBarLeft>{this.getButtons(distint, header)}</TopBarLeft>
        {(this.props.is_pro || items.length > 1) && (
          <TopBarRight>
            {add_item_visible &&
              (!isSiteUser() ? this.props.is_ist_pro : true) && (
                <Button
                  disabled={items.length < 1}
                  data-testid="btn-orderitems"
                  className="btn btn-primary btn-right btn-top"
                  onClick={() => this.props.push('/shopping-cart')}
                  style={{
                    width: detectMobile() ? '2.7rem' : '',
                    height: detectMobile() ? '2.7rem' : '',
                  }}
                >
                  <FontAwesomeIcon icon={'shopping-cart'} />
                  <Badge
                    color="primary"
                    className="shopping-badge"
                    data-testid="badge-orderitems"
                  >
                    {items.length}
                  </Badge>
                </Button>
              )}
          </TopBarRight>
        )}

        <ClearModal
          show={this.state.clearOrderModal}
          toggle={this.toggleClearOrderModal}
          onOk={this.clearOrderPressed}
          header={header}
          message={message}
        />
        <ErrorBoundary>
          <CustomerModal
            show={order.customer_modal_open}
            showOrderNotes={true}
            toggleShow={this.showCustomerModal}
            onSave={this.handleSaveCustomer}
            setOrderNotes={this.props.setOrderNotes}
          />
        </ErrorBoundary>
        <ErrorBoundary>
          <EmailPreviewModal
            isOpen={this.state.showEmailModal}
            toggle={this.toggleEmailLabelModal}
          />
        </ErrorBoundary>
      </TopBar>
    );
  }
}

TopActionButtons.propTypes = {
  closeOrderItems: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  setCustomerModalOpen: PropTypes.func.isRequired,
  saveCustomer: PropTypes.func.isRequired,
  setCustomer: PropTypes.func.isRequired,
  setDiscount: PropTypes.func.isRequired,
  setOrderNotes: PropTypes.func.isRequired,
  setVisible: PropTypes.func.isRequired,
  setLayout: PropTypes.func.isRequired,
  setOrder: PropTypes.func.isRequired,
  setOrderMode: PropTypes.func,
  push: PropTypes.func.isRequired,
  className: PropTypes.object,
  config: PropTypes.shape(),
  config_values: PropTypes.shape(),
  machine: PropTypes.shape(),
  is_pro: PropTypes.bool,
  order: orderType,
  print_labels: PropTypes.array,
  email_templates: PropTypes.array,
  local_queue: PropTypes.array,
  formula: PropTypes.object,
  toggleFormulaVersionModal: PropTypes.func.isRequired,
  clearOrderState: PropTypes.func,
  clearSearches: PropTypes.func,
  clearBarcodeState: PropTypes.func,
  allow_matching: PropTypes.bool.isRequired,
  alternativeMatching: PropTypes.func,
  setOpenSection: PropTypes.func.isRequired,
  is_ist_pro: PropTypes.bool,
  saveOrderState: PropTypes.func.isRequired,
  hideItem: PropTypes.func.isRequired,
  clearOrderItem: PropTypes.func.isRequired,
};

function mapStateToProps(store) {
  return {
    order: store.order,
    formula: store.formula,
    config: store.configurations.config,
    config_values: store.configurations.config_values,
    print_labels: store.configurations.print_labels,
    email_templates: store.configurations.email_templates,
    local_queue: orderQueueSelectors.local_queue(store),
    machine: machineSelectors.current_machine(store),
    is_pro: protectionSelectors.is_pro(store),
    allow_matching: protectionSelectors.allow_matching(store),
    is_ist_pro: protectionSelectors.is_ist_pro(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      hideItem: orderActions.hideItem,
      closeOrderItems: orderActions.closeOrderItems,
      setOrderMode: orderActions.setOrderMode,
      toggleFormulaVersionModal: orderActions.toggleFormulaVersionModal,
      setOpenSection: orderActions.setOpenSection,
      setCustomer: orderActions.setCustomer,
      saveCustomer: orderActions.saveCustomer,
      setDiscount: orderActions.setDiscount,
      setOrderNotes: orderActions.setOrderNotes,
      setCustomerModalOpen: orderActions.setCustomerModalOpen,
      saveOrderState: orderActions.saveState,
      setVisible: printActions.setVisible,
      setLayout: printActions.setLayout,
      setOrder: printActions.setOrder,
      clearOrderState: orderActions.clearOrderState,
      clearOrderItem: orderActions.clearOrderItem,
      clearSearches: formulaActions.clearSearches,
      clearBarcodeState: barcodeActions.clearBarcodeState,
      alternativeMatching: formulaActions.alternativeMatching,
      push: push,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(TopActionButtons)
);

import React, { Component } from 'react';
import {
  Button,
  Card,
  CardBody,
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  UncontrolledTooltip,
} from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import orderActions, { propType as orderType } from 'js/redux/reducers/Order';
import { selectors as machineSelectors } from 'js/redux/reducers/Machine';
import {
  EXTRA_INFO_DISCOUNT_EDITOR,
  FORMULA_INPUT_CARD,
  INFO_CARD,
  MATCH_SEARCH_CARD,
  ORDER_MODE_FORMULA_CORRECTION,
  ORDER_MODE_FREE_DISPENSE,
  ORDER_MODE_LOCAL_FORMULA,
  ORDER_STATUS_DONE,
  ORDER_STATUS_PREPARING,
  ORDER_STATUS_WAITING,
  SOURCE_MAIN,
  SOURCE_USER,
  offline_mode,
  EXTRA_INFO_BASE_ADJUSTMENT_EDITOR,
  EXTRA_INFO_CNT_ADJUSTMENT_EDITOR,
} from '../../../Constants';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Formula from './Formula';
import MachineBanner from '../../dispenser/MachineBanner';
import Extrainfo from './Extrainfo';
import _ from 'lodash';
import { isSiteUser } from '../../../api/WebRequest';
import ColorThumbnail from '../ColorThumbnail';
import { selectors as cacheSelectors } from '../../../redux/reducers/Cache';
import { selectors as protectionSelectors } from '../../../redux/reducers/Protection';
import { selectors as orderQueueSelectors } from 'js/redux/reducers/OrderQueue';
import {
  readyToDispense,
  SHOW_FORMULA_NOTE_MODAL,
  SHOW_IS_PREFILLED_MODAL,
  SHOW_SMALL_DOSE_MODAL,
} from '../../../redux/selectors/OrderReady';
import { hasPrivilege } from '../../../mylib/Privileges';
import { push } from 'connected-react-router';
import { detectMobile, rightToLeft } from '../../../mylib/Utils';
import MobileExtraInfo from './MobileExtraInfo';
import busyActions from '../../../redux/reducers/Busy';
import { cnts_to_tint, RETINT_TYPE_ORDER } from '../../../redux/reducers/Order';
import { FormulaCommentModal } from './FormulaCommentModal';
import { commentnotes } from '../../../redux/selectors/FormulaComments';

class ReadyOrder extends Component {
  state = {
    notes: '',
    original_itemid: null,
    original_notes: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      props.order.item.itemid !== state.original_itemid ||
      props.order.item.notes !== state.original_notes
    ) {
      return {
        notes: props.order.item.notes,
        original_itemid: props.order.item.itemid,
        original_notes: props.order.item.notes,
      };
    }
    return null;
  }

  componentDidMount() {
    this.props.keyFunction(INFO_CARD, this.handleKeyPress);
  }

  handleSetNotes = (value) => {
    this.setState({ notes: value });
  };

  handleKeyPress = (key) => {
    if (this.props.order.item.status === ORDER_STATUS_PREPARING) {
      // Under dispensing
      return;
    }

    if (key === 'Esc') {
      return this.props.moveToPrevSection();
    }
    if (key === 'Enter') {
      // Maybe dispense on enter and save on ?
      return;
    }

    // Do not change can count if extra info discount has focus
    if (
      [
        document.getElementById(EXTRA_INFO_DISCOUNT_EDITOR),
        document.getElementById(EXTRA_INFO_BASE_ADJUSTMENT_EDITOR),
        document.getElementById(EXTRA_INFO_CNT_ADJUSTMENT_EDITOR),
      ].includes(document.activeElement)
    ) {
      return;
    }

    const { ncans } = this.props.order.item;
    const { max_cans_in_order_item } = this.props.config_values;
    if (key === 'up') {
      if (!max_cans_in_order_item || ncans < max_cans_in_order_item) {
        this.props.setNumberOfCans(ncans + 1);
      }
    } else {
      if (ncans > 1) {
        this.props.setNumberOfCans(ncans - 1);
      }
    }
  };

  componentDidUpdate(prevProps) {
    // Focus to dispense button
    if (this.props.show && !prevProps.show) {
      this.props.setPreTintModals([]);
      setTimeout(() => {
        //Focus with timeout to avoid dispensing directly!
        if (this.button) this.button.focus();
      }, 300);
    }
  }

  setMatchingSections = () => {
    this.props.setOrderMode(ORDER_MODE_FORMULA_CORRECTION);
    this.props.setOpenSection(MATCH_SEARCH_CARD);
  };

  nextModal = () => {
    const modalsToShow = this.props.pre_tint_modals.slice(1);
    this.props.setPreTintModals(modalsToShow);
    if (!modalsToShow.length) {
      this.dispenseApproved();
    }
  };

  dispenseApproved = () => {
    this.props.tintOrder(this.props.dispID);
  };

  dispensePrefilled = () => {
    this.props.setPreTintModals([]);
    this.props.tintOrder(this.props.dispID, true);
  };

  dispenseCancelled = () => {
    this.props.setPreTintModals([]);
  };

  newOrderPressed = () => {
    this.props.reTintOrder(RETINT_TYPE_ORDER);
  };

  savePressed = (addItem, orderStatus = ORDER_STATUS_WAITING) => {
    const navigateTo = addItem
      ? {
          pathname: '/shopping-cart',
          state: { source: 'add-item-btn' },
        }
      : '/';
    this.props.saveOrder(orderStatus, addItem, navigateTo);
  };

  getNotes = () => {
    const { t } = this.props;
    /**
     * Get the actual notes
     */
    return (
      <Card
        className="br-8 bordered ready-grey"
        style={{
          height: '100%',
        }}
      >
        <div
          className="card-header bordered ready-grey"
          style={{
            height: '15%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '0.5rem 0.5rem 0px 0px',
            borderBottom: '1px solid color-white',
          }}
        >
          <h5 className="mb-0">
            <div
              className="collapsed uppercase bold-size-1 color-white"
              style={{ textAlign: 'center' }}
            >
              {t('lbl.notes', 'Notes')}
            </div>
          </h5>
        </div>
        <div
          className="card-body br-8"
          style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <div className="p-8">
            <p data-testid="commentnotes">{this.props.commentnotes}</p>
          </div>
          <textarea
            className="notes-comment scroll"
            name="Add comments"
            placeholder={t('lbl.addComments', 'Add comments')}
            value={this.state.notes || ''}
            onChange={(evt) => this.handleSetNotes(evt.target.value)}
            onBlur={() => this.props.setNotes(this.state.notes)}
          />
        </div>
      </Card>
    );
  };

  /**
   * This should speed up the rendering as it blocks update on the components which are not visible!
   *
   */
  shouldComponentUpdate(nextProps) {
    return nextProps.show || this.props.show;
  }

  getModals = () => {
    const { t, order, machine, shotFormatter, pre_tint_modals } = this.props;
    const minimum_dosable_amount = machine?.config?.minimum_dosable_amount || 0;

    const small = cnts_to_tint(order)
      ?.filter((cnt) => cnt.volume < minimum_dosable_amount)
      .map((cnt) => (
        <div
          key={cnt.cntcode}
          style={{ display: 'inline-flex', marginBottom: '0.5rem' }}
        >
          <ColorThumbnail hideIfNull rgb={cnt.rgb} size="1.5rem" />
          <div style={{ paddingLeft: '1rem' }}>{cnt.cntcode} -</div>
          <div>{shotFormatter.format(cnt)}</div>
        </div>
      ));

    return (
      <>
        <FormulaCommentModal
          show={pre_tint_modals[0] === SHOW_FORMULA_NOTE_MODAL}
          onOk={this.nextModal}
          onCancel={this.dispenseCancelled}
        />

        <Modal
          isOpen={pre_tint_modals[0] === SHOW_SMALL_DOSE_MODAL}
          toggle={this.dispenseCancelled}
          centered
        >
          <ModalHeader>
            {t('lbl.small_dose_warning', 'Small dose warning')}
          </ModalHeader>
          <ModalBody>
            <p>
              {t(
                'lbl.warn.small_dose_details',
                'Following colorants in current formula are lower than small dose warning level {{level}} (ml)',
                { level: machine?.config?.minimum_dosable_amount || 0 }
              )}
            </p>
            <div style={{ display: 'inline-grid' }}>{small}</div>
          </ModalBody>
          <ModalFooter>
            <Row className="w-100">
              <Col>
                <Button
                  id="small_dose_cansel"
                  color="secondary"
                  onClick={this.dispenseCancelled}
                >
                  {t('fn.cancel', 'Cancel')}
                </Button>
              </Col>
              <Col />

              <Col>
                <Button
                  id="small_dose_ok"
                  color="warning"
                  onClick={this.nextModal}
                >
                  {t('fn.ok', 'OK')}
                </Button>
              </Col>
            </Row>
          </ModalFooter>
        </Modal>

        <Modal
          isOpen={pre_tint_modals[0] === SHOW_IS_PREFILLED_MODAL}
          toggle={this.dispenseCancelled}
          centered
        >
          <ModalBody>
            {t('msg.isCanPrefilled', 'Is the can prefilled?')}
          </ModalBody>
          <ModalFooter>
            <Button onClick={this.dispensePrefilled}>
              {t('fn.yes', 'Yes')}
            </Button>
            <Button onClick={this.nextModal}>{t('fn.no', 'No')}</Button>
          </ModalFooter>
        </Modal>
      </>
    );
  };

  getButtons = (fix_formula, dispense_text) => {
    const {
      t,
      config_values,
      order,
      is_pro,
      local_queue,
      is_ist_pro,
      allow_dispense,
      allow_save,
      dispense_note,
    } = this.props;

    const save_visible = config_values.max_waiting_order !== 0;
    const add_item_visible = !!config_values.multiple_items_in_order;

    const items =
      _.find(local_queue, ['orderid', order.orderid])?.orderitems || [];

    // If the item has an itemid we know that it's saved already.
    const add_item_enabled =
      (config_values.multiple_items_in_order_num ?? 6) -
        (order.item?.itemid ? 0 : 1) >
      items.length;

    const edit_formula = config_values.fix_formula ?? true;
    const save_custom_formula =
      order.item.ncans === 0 &&
      !order.item.additionOnly &&
      (order.item.itemEdited || order.order_mode === ORDER_MODE_LOCAL_FORMULA);

    return (
      <>
        {order.item.status === ORDER_STATUS_DONE ? (
          <>
            <Button
              data-testid="btn_new_order"
              color="primary"
              onClick={this.newOrderPressed}
              data-denied={!hasPrivilege('order_retint')}
              disabled={!hasPrivilege('order_retint')}
            >
              {t('fn.newOrder', 'New order')}
            </Button>
            {fix_formula && (
              <Button
                color="primary"
                id="actionFixFormula"
                data-testid="btn_fix_formula"
                onClick={() => {
                  this.props.navigateTo('/matching');
                  this.setMatchingSections();
                }}
                disabled={
                  !hasPrivilege('order_fix_formula') ||
                  this.props.order.order_mode === ORDER_MODE_FREE_DISPENSE ||
                  (!this.props.order.color?.lab &&
                    !config_values.fix_formula_measure_target)
                }
                data-denied={!hasPrivilege('order_fix_formula')}
              >
                {t('cfg.fix_formula', 'Fix formula')}
              </Button>
            )}
            <Button
              className="mt-16"
              data-testid="btn_back"
              color="warning"
              onClick={() => window.history.back()}
            >
              {t('fn.back', 'Back')}
            </Button>
          </>
        ) : (
          <>
            {!is_ist_pro && (
              <Button
                className="btn-disabled-tooltips"
                id="actionDispense"
                color="primary"
                innerRef={(input) => {
                  this.button = input;
                }}
                disabled={!allow_dispense}
                data-denied={!hasPrivilege('order_tinting_start')}
                onClick={this.props.initiateTinting}
              >
                {dispense_text}
              </Button>
            )}
            {dispense_note.length > 0 && (
              <UncontrolledTooltip
                placement="top"
                target="actionToolTipWrapper"
              >
                {dispense_note.map((n, i) => (
                  <p key={i} style={{ margin: 0 }}>
                    {n}
                  </p>
                ))}
              </UncontrolledTooltip>
            )}

            {edit_formula && (
              <Button
                color="primary"
                id="actionEditFormula"
                data-testid="btn_edit_formula"
                onClick={() => {
                  this.props.saveOrderState();
                  const { source } = order.item;
                  this.props.setOrderitemSource(SOURCE_USER);
                  this.props.setItemEdited(true);
                  if (
                    source === SOURCE_MAIN &&
                    (config_values.custom_formula_clear_color_name ?? true)
                  ) {
                    this.props.clearColournames();
                  }
                  this.props.setOpenSection(FORMULA_INPUT_CARD);
                }}
                // uses order_fix_formula for lack of specific privilege in it3
                disabled={
                  order.ncans_tinted > 0 ||
                  !hasPrivilege('order_fix_formula') ||
                  order.item.ncans === 0 ||
                  offline_mode
                }
                data-denied={!hasPrivilege('order_fix_formula')}
              >
                {t('fn.editFormula', 'Edit formula')}
              </Button>
            )}

            {this.props.order.order_mode !== ORDER_MODE_FREE_DISPENSE && (
              <>
                {is_pro && save_visible && add_item_visible && (
                  <Button
                    id="actionAddItem"
                    color="secondary"
                    data-denied={!hasPrivilege('order_add_orderitem')}
                    disabled={
                      !allow_save ||
                      !add_item_enabled ||
                      !hasPrivilege('order_add_orderitem') ||
                      order.item.ncans === 0
                    }
                    onClick={() => {
                      this.savePressed(true);
                    }}
                  >
                    {t('fn.add_item', 'Add item')}
                  </Button>
                )}
                {save_custom_formula ? (
                  <Button
                    id="actionSaveCustomFormula"
                    color="secondary"
                    data-denied={!hasPrivilege('order_save')}
                    disabled={!allow_save || !hasPrivilege('order_save')}
                    onClick={() => {
                      this.savePressed(false, ORDER_STATUS_DONE);
                    }}
                  >
                    {t('fn.save_custom_formula', 'Save custom formula')}
                  </Button>
                ) : (
                  save_visible && (
                    <Button
                      id="actionSave"
                      color="secondary"
                      data-denied={!hasPrivilege('order_save')}
                      disabled={!allow_save || !hasPrivilege('order_save')}
                      onClick={() => {
                        this.savePressed(false);
                      }}
                    >
                      {t('fn.save_order', 'Save order')}
                    </Button>
                  )
                )}
              </>
            )}
          </>
        )}
      </>
    );
  };

  //two functions, one for computer, one for mobile, mobile does not need buttons
  normalViewFunction = (fix_formula, dispense_text, show_machine_banner) => {
    const { config_values } = this.props;
    const show_notes_panel = !config_values?.hide_notes_panel;
    const show_extra_info_panel = !config_values?.hide_extra_info_panel;

    return (
      <div
        style={{
          display: show_machine_banner ? 'none' : 'flex',
          height: '22rem',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flexGrow: 3, maxWidth: '50%' }} className="pl-0 pr-16">
          <Formula dispID={this.props.dispID} />
        </div>
        {show_notes_panel && (
          <div style={{ flexGrow: 1, maxWidth: '20%' }} className="pl-0 pr-16">
            {this.getNotes()}
          </div>
        )}

        {show_extra_info_panel && (
          <div
            style={{ height: '100%', flexGrow: 2, minWidth: '25%' }}
            className="pl-0 pr-16"
          >
            <Extrainfo />
          </div>
        )}
        {(isSiteUser() || this.props.is_ist_pro) && (
          <div
            id="actionToolTipWrapper"
            style={{ maxWidth: '25%' }}
            className={`p-4 ${rightToLeft() ? 'pr-16' : ''} `}
          >
            {this.getButtons(fix_formula, dispense_text)}
          </div>
        )}
      </div>
    );
  };

  //customize css for columns
  mobileViewFunction = (fix_formula, dispense_text) => {
    return (
      <>
        <Col style={{ marginBottom: '2rem' }}>
          <Formula dispID={this.props.dispID} />
        </Col>
        <Col style={{ marginBottom: '2rem' }}>{this.getNotes()}</Col>
        <Col style={{ height: '100%' }}>
          <MobileExtraInfo />
        </Col>
        {this.props.is_ist_pro && (
          <Col className="mt-3" id="actionToolTipWrapper">
            {this.getButtons(fix_formula, dispense_text)}
          </Col>
        )}
      </>
    );
  };

  //renders the last page of ordering
  render() {
    const {
      t,
      config,
      order,
      dispID,
      allow_matching,
      show,
      priority_init_pending,
    } = this.props;

    if (!show || priority_init_pending) {
      return null;
    }

    // validate formula

    const dispense_text = window.qtside
      ? t('fn.dispense', 'Dispense')
      : t('fn.simulateDispensing', 'Simulate dispensing');

    const show_machine_banner =
      order.item.status === ORDER_STATUS_PREPARING &&
      order.ncans_tinted < order.item.ncans;

    const fix_formula =
      allow_matching && _.get(config, 'fix_formula.value', true);
    return (
      <Col style={{ display: this.props.show ? '' : 'none' }}>
        {this.getModals()}
        {/*if mobile, it uses different function for render*/}
        {detectMobile()
          ? this.mobileViewFunction(fix_formula, dispense_text)
          : this.normalViewFunction(
              fix_formula,
              dispense_text,
              show_machine_banner
            )}
        {dispID != null && (
          <Card
            className={
              (show_machine_banner ? 'mySlideInTop' : 'mySlideOutTop') +
              ' machine-banner-position'
            }
          >
            <CardBody>
              <Row className="no-gutters m-16">
                <MachineBanner dispID={this.props.dispID} />
              </Row>
            </CardBody>
          </Card>
        )}
      </Col>
    );
  }
}

ReadyOrder.propTypes = {
  formula: PropTypes.object,
  commentnotes: PropTypes.string,
  setNotes: PropTypes.func.isRequired,
  setNumberOfCans: PropTypes.func.isRequired,
  keyFunction: PropTypes.func.isRequired,
  initiateTinting: PropTypes.func.isRequired,
  tintOrder: PropTypes.func.isRequired,
  saveOrder: PropTypes.func.isRequired,
  saveOrderState: PropTypes.func.isRequired,
  clearOrder: PropTypes.func.isRequired,
  clearOrderItem: PropTypes.func.isRequired,
  reTintOrder: PropTypes.func.isRequired,
  order: orderType,
  pre_tint_modals: PropTypes.arrayOf(PropTypes.string),
  setPreTintModals: PropTypes.func,
  dispID: PropTypes.string,
  t: PropTypes.func.isRequired,
  moveToPrevSection: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  priority_init_pending: PropTypes.bool,
  setOpenSection: PropTypes.func.isRequired,
  clearColournames: PropTypes.func.isRequired,
  setItemEdited: PropTypes.func.isRequired,
  setOrderNotes: PropTypes.func.isRequired,
  config: PropTypes.shape().isRequired,
  config_values: PropTypes.object,
  machine: PropTypes.object,
  allow_matching: PropTypes.bool.isRequired,
  is_pro: PropTypes.bool,
  is_ist_pro: PropTypes.bool,
  shotFormatter: PropTypes.object,
  local_queue: PropTypes.array,
  setOrderMode: PropTypes.func,
  navigateTo: PropTypes.func.isRequired,
  setOrderitemSource: PropTypes.func.isRequired,
  setBusy: PropTypes.func.isRequired,
  allow_dispense: PropTypes.bool,
  allow_save: PropTypes.bool,
  dispense_note: PropTypes.arrayOf(PropTypes.string),
};

function mapStateToProps(store) {
  return {
    order: store.order,
    pre_tint_modals: store.order.pre_tint_modals,
    machine: machineSelectors.current_machine(store),
    local_queue: orderQueueSelectors.local_queue(store),
    formula: store.formula,
    commentnotes: commentnotes(store),
    dispID: machineSelectors.current_dispID(store),
    config: store.configurations.config,
    config_values: store.configurations.config_values,
    shotFormatter: store.configurations.shotFormatter,
    priority_init_pending: cacheSelectors.priority_init_pending(store),
    allow_matching: protectionSelectors.allow_matching(store),
    is_pro: protectionSelectors.is_pro(store),
    is_ist_pro: protectionSelectors.is_ist_pro(store),
    ...readyToDispense(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setNotes: orderActions.setItemNotes,
      setPreTintModals: orderActions.setPreTintModals,
      initiateTinting: orderActions.initiateTinting,
      tintOrder: orderActions.tintOrderitem,
      reTintOrder: orderActions.reTintOrder,
      clearOrder: orderActions.clearOrder,
      saveOrder: orderActions.saveOrderitem,
      saveOrderState: orderActions.saveState,
      clearOrderItem: orderActions.clearOrderItem,
      setNumberOfCans: orderActions.setNumberOfCans,
      moveToPrevSection: orderActions.moveToPrevSection,
      setOpenSection: orderActions.setOpenSection,
      clearColournames: orderActions.clearColournames,
      setItemEdited: orderActions.setItemEdited,
      setOrderMode: orderActions.setOrderMode,
      setOrderNotes: orderActions.setOrderNotes,
      setOrderitemSource: orderActions.setOrderitemSource,
      navigateTo: push,
      setBusy: busyActions.setBusy,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(ReadyOrder)
);

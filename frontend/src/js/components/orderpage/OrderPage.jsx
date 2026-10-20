import React, { Component } from 'react';
import { Container } from 'reactstrap';
import ArticleSearch from '../shared/order/ArticleSearch';
import ColorSearch from '../shared/order/ColorSearch';
import ProductSearch from '../shared/order/ProductSearch';
import { configure, GlobalHotKeys } from 'react-hotkeys';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import orderActions, { propType as orderType } from 'js/redux/reducers/Order';
import {
  COLOR_SEARCH_CARD,
  INFO_CARD,
  PRODUCT_SEARCH_CARD,
  AMOUNT_CARD,
  ORDER_STATUS_DONE,
  FORMULA_INPUT_CARD,
  FORMULA_SEARCH_CARD,
  PRODUCT_SEARCH_MODE_MATCH,
  MATCH_SEARCH,
  ORDER_STATUS_PREPARING,
} from 'js/Constants';
import { selectors as formulaSelectors } from 'js/redux/reducers/Formula';

import TopActionButtons from '../shared/TopActions';
import ReadyCircles, {
  ColorCircle,
  CansizeCircle,
  NCansCircle,
  SwitchMachineCircle,
  ProductAndBaseCircle,
} from '../shared/order/ReadyCircles';
import Ready from '../shared/order/Ready';
import PropTypes from 'prop-types';
import Amounts from '../shared/order/Amounts';
import { withTranslation } from 'react-i18next';
import MatchingResults from '../matchingpage/MatchingResults';

import FormulaInput from '../shared/order/FormulaInput';
import { push } from 'connected-react-router';
import { selectors as machineSelectors } from 'js/redux/reducers/Machine';
import {
  ARTICLE_SEARCH_CARD,
  ORDER_MODE_FORMULA_CORRECTION,
  ORDER_MODE_FREE_DISPENSE,
  PRIMER_CARD,
  SOURCE_USER,
} from '../../Constants';
import { detectMobile } from '../../mylib/Utils';
import MobileTopInfo from '../shared/order/MobileTopInfo';
import MobileCanAmount from '../shared/order/MobileCanAmount';
import FormulaVersionModal from '../shared/order/FormulaVersionModal';
import { isSiteUser } from '../../api/WebRequest';
import PrimerColor from '../shared/order/PrimerColor.jsx';

class OrderPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      colorNameEdit: false,
    };
    this.keyEventFunctions = {};

    configure({
      //https://github.com/greena13/react-hotkeys#Configuration
      ignoreTags: ['select', 'textarea'],
    });
  }

  toggleEditMode = () => {
    this.setState((prevState) => ({
      colorNameEdit: !prevState.colorNameEdit,
    }));
  };

  handleChangeEditMode = (value) => {
    this.setState({
      colorNameEdit: value,
    });
  };

  addKeyEventFunction = (key, func) => {
    this.keyEventFunctions[key] = func;
  };

  componentDidMount() {
    this.checkPrivileges();
  }

  keyPressedInOpenSection = (key) => {
    // Ignore in case when customer dialog is open
    const { order, print_preview } = this.props;
    if (order.customer_modal_open || print_preview.visible) return;

    // Calling all keyboard actions from single place
    if (this.keyEventFunctions[order.open_section])
      this.keyEventFunctions[order.open_section](key);
  };

  checkPrivileges = () => {
    const { privileges } = this.props;
    const allowed =
      this.props.order.item.status === ORDER_STATUS_PREPARING
        ? // Case: resume tinting e.g. after page reload
          privileges.includes('order_tinting_process')
        : privileges.includes('order_new') ||
          privileges.includes('order_retint');
    if (!allowed) {
      // Redirect to homepage if user has no privilege to access order page
      this.props.navigateTo('/');
    }
  };

  render() {
    const { order, show_primer } = this.props;
    const open_section = show_primer ? PRIMER_CARD : order.open_section;

    const keyMap = {
      UP: 'ArrowUp',
      DOWN: 'ArrowDown',
      ENTER: 'Enter',
      ESC: 'Esc',
    };

    const handlers = {
      UP: () => this.keyPressedInOpenSection('up'),
      DOWN: () => this.keyPressedInOpenSection('down'),
      ENTER: () => this.keyPressedInOpenSection('Enter'),
      ESC: () => this.keyPressedInOpenSection('Esc'),
    };

    const readOnly =
      order.item.status === ORDER_STATUS_DONE ||
      order.item.status === ORDER_STATUS_PREPARING;
    const moveProductFirst = order.order_start_section === PRODUCT_SEARCH_CARD;

    // checking which should be disabled
    let disable_color =
      order.order_mode === ORDER_MODE_FREE_DISPENSE ||
      open_section === ARTICLE_SEARCH_CARD ||
      order.ncans_tinted > 0 ||
      (moveProductFirst && order.product == null);
    let disable_product =
      order.order_mode === ORDER_MODE_FREE_DISPENSE ||
      (!moveProductFirst && order.color == null) ||
      order.item.source === SOURCE_USER || // user is editing standard formula
      order.ncans_tinted > 0;
    const disable_formula = !order.can || order.ncans_tinted > 0;
    const disable_can =
      order.order_mode === ORDER_MODE_FREE_DISPENSE ||
      !order.product ||
      (order.product_search_mode !== PRODUCT_SEARCH_MODE_MATCH &&
        order.color_search_mode !== MATCH_SEARCH &&
        order.formula == null) ||
      order.item.additionOnly ||
      open_section === FORMULA_INPUT_CARD || // use cansize combobox
      order.ncans_tinted > 0;
    const disable_ncan =
      order.formula == null || order.can == null || order.item.additionOnly;
    const disable_machineSwitching = disable_ncan;
    return (
      <div className={'zoom-in'}>
        <TopActionButtons />
        <div className="d-flex flex-column">
          <Container className="justify-content-center">
            <GlobalHotKeys keyMap={keyMap} handlers={handlers} />
            {this.props.order.formula_version_modal_type ? (
              <FormulaVersionModal dispID={this.props.dispID} />
            ) : (
              <>
                {/**if mobile, shows few elements*/}
                {detectMobile() && <MobileTopInfo />}
                {detectMobile() && <MobileCanAmount />}
                {/*if mobile then won't render readycircles*/}
                {!detectMobile() && (
                  <ReadyCircles
                    colorNameEdit={this.state.colorNameEdit}
                    toggleEditMode={this.toggleEditMode}
                    handleChangeEditMode={this.handleChangeEditMode}
                    moveProductFirst={moveProductFirst}
                    readOnly={readOnly}
                    animationClass="mySlideInLeft"
                  >
                    <ColorCircle
                      disabled={disable_color}
                      colorNameEdit={this.state.colorNameEdit}
                      toggleEditMode={this.toggleEditMode}
                      handleChangeEditMode={this.handleChangeEditMode}
                    />
                    <ProductAndBaseCircle
                      disabledProduct={disable_product}
                      disabledBase={
                        order.product_search_mode ===
                          PRODUCT_SEARCH_MODE_MATCH ||
                        order.color_search_mode === MATCH_SEARCH
                          ? disable_formula
                          : disable_product || order.item.additionOnly
                      }
                      goToSection={
                        (order.product_search_mode ===
                          PRODUCT_SEARCH_MODE_MATCH ||
                          order.color_search_mode === MATCH_SEARCH) &&
                        FORMULA_SEARCH_CARD
                      }
                      flex_grow={2}
                    />

                    <CansizeCircle disabled={disable_can} />
                    <NCansCircle disabled={disable_ncan} />
                    {Object.keys(this.props.machine.machines).length > 2 &&
                      isSiteUser() && (
                        <SwitchMachineCircle
                          disabled={disable_machineSwitching}
                        />
                      )}
                  </ReadyCircles>
                )}
              </>
            )}
            {open_section === COLOR_SEARCH_CARD && (
              <ColorSearch
                keyFunction={this.addKeyEventFunction}
                moveProductFirst={moveProductFirst}
              />
            )}
            {open_section === ARTICLE_SEARCH_CARD && <ArticleSearch />}
            {open_section === PRODUCT_SEARCH_CARD && (
              <ProductSearch
                keyFunction={this.addKeyEventFunction}
                moveProductFirst={moveProductFirst}
              />
            )}
            <FormulaInput
              keyFunction={this.addKeyEventFunction}
              freeDispense={order.order_mode === ORDER_MODE_FREE_DISPENSE}
              show={open_section === FORMULA_INPUT_CARD}
            />
            <Amounts
              keyFunction={this.addKeyEventFunction}
              show={open_section === AMOUNT_CARD}
            />
            <PrimerColor show={open_section === PRIMER_CARD} />
            <MatchingResults
              keyFunction={this.addKeyEventFunction}
              show={
                open_section === FORMULA_SEARCH_CARD &&
                order.order_mode !== ORDER_MODE_FORMULA_CORRECTION
              }
            />
            <Ready
              keyFunction={this.addKeyEventFunction}
              show={open_section === INFO_CARD}
              large={order.orderdate}
            />
          </Container>
        </div>
      </div>
    );
  }
}

OrderPage.propTypes = {
  order: orderType,
  show_primer: PropTypes.bool.isRequired,
  moveToNextSection: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  navigateTo: PropTypes.func.isRequired,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  current_machine: PropTypes.object,
  machine: PropTypes.object,
  dispID: PropTypes.string,
  print_preview: PropTypes.shape({ visible: PropTypes.bool }),
};

function mapStateToProps(store) {
  return {
    print_preview: store.print_preview,
    current_machine: machineSelectors.current_machine(store),
    order: store.order,
    show_primer: formulaSelectors.show_primer(store),

    machine: store.machine,
    privileges: store.user.current_user.privileges,
    dispID: machineSelectors.current_dispID(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      moveToNextSection: orderActions.moveToNextSection,
      navigateTo: push,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(OrderPage)
);

import React, { Component } from 'react';
import { Container } from 'reactstrap';
import ProductSearch from '../shared/order/ProductSearch';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import orderActions, { propType as orderType } from 'js/redux/reducers/Order';
import {
  COLOR_SEARCH_CARD,
  INFO_CARD,
  PRODUCT_SEARCH_CARD,
  AMOUNT_CARD,
  FORMULA_SEARCH_CARD,
  PRODUCT_SEARCH_MODE_MATCH,
  FORMULA_INPUT_CARD,
  MATCH_SEARCH_CARD,
  ORDER_MODE_FORMULA_CORRECTION,
} from '../../Constants';
import { configure, GlobalHotKeys } from 'react-hotkeys';
import { selectors as machineSelectors } from 'js/redux/reducers/Machine';
import { selectors as formulaSelectors } from 'js/redux/reducers/Formula';
import TopActionButtons from '../shared/TopActions';
import Ready from '../shared/order/Ready';
import FormulaInput from '../shared/order/FormulaInput';
import PropTypes from 'prop-types';
import ReadyCircles, {
  ColorCircle,
  ProductCircle,
  BaseCircle,
  CansizeCircle,
  NCansCircle,
  SwitchMachineCircle,
} from '../shared/order/ReadyCircles';
import Amounts from '../shared/order/Amounts';
import Measure from './measure/Measure';
import MatchingResults from './MatchingResults';
import CorrectionResults from './CorrectionResults';
import { isSiteUser } from '../../api/WebRequest';
import { rightToLeft } from 'js/mylib/Utils';

class MatchingPage extends Component {
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

  keyPressedInOpenSection = (key) => {
    // Ignore in case when customer dialog is open
    const { order, print_preview } = this.props;
    if (order.customer_modal_open || print_preview.visible) return;

    // Calling all keyboard actions from single place
    if (this.keyEventFunctions[order.open_section])
      this.keyEventFunctions[order.open_section](key);
  };

  componentDidMount() {
    this.props.setProductSearchMode(PRODUCT_SEARCH_MODE_MATCH);
  }

  render() {
    const keyMap = {
      UP: 'ArrowUp',
      DOWN: 'ArrowDown',
      ENTER: 'Enter',
    };

    const handlers = {
      UP: () => this.keyPressedInOpenSection('up'),
      DOWN: () => this.keyPressedInOpenSection('down'),
      ENTER: () => this.keyPressedInOpenSection('Enter'),
    };

    const { order, alternative_matching } = this.props;
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    return (
      <div className={'zoom-in matching-page'} dir={direction}>
        <TopActionButtons />
        <div className="d-flex flex-column">
          <Container className="justify-content-center">
            <GlobalHotKeys keyMap={keyMap} handlers={handlers} />
            <ReadyCircles
              colorNameEdit={this.state.colorNameEdit}
              toggleEditMode={this.toggleEditMode}
              handleChangeEditMode={this.handleChangeEditMode}
              inMatching
              moveProductFirst={false}
              animationClass="mySlideInLeft"
              dispID={this.props.dispID}
            >
              <ColorCircle disabled={alternative_matching} />
              <ProductCircle
                disabled={
                  !order.color ||
                  order.order_mode === ORDER_MODE_FORMULA_CORRECTION ||
                  alternative_matching
                }
              />
              <CansizeCircle
                disabled={
                  !order.product ||
                  order.order_mode === ORDER_MODE_FORMULA_CORRECTION ||
                  order.open_section === FORMULA_INPUT_CARD
                }
              />
              <BaseCircle
                disabled={
                  !order.can ||
                  order.order_mode === ORDER_MODE_FORMULA_CORRECTION
                }
                goToSection={FORMULA_SEARCH_CARD}
              />
              <NCansCircle
                disabled={
                  !order.formula ||
                  !order.can ||
                  !order.base ||
                  order.order_mode === ORDER_MODE_FORMULA_CORRECTION
                }
              />
              {Object.keys(this.props.machines).length > 2 && isSiteUser() && (
                <SwitchMachineCircle
                  disabled={!order.formula || !order.can || !order.base}
                />
              )}
            </ReadyCircles>

            <Measure
              keyFunction={this.addKeyEventFunction}
              show={
                order.open_section === COLOR_SEARCH_CARD ||
                order.open_section === MATCH_SEARCH_CARD
              }
            />
            {order.open_section === PRODUCT_SEARCH_CARD && (
              <ProductSearch keyFunction={this.addKeyEventFunction} />
            )}
            <Amounts
              keyFunction={this.addKeyEventFunction}
              show={order.open_section === AMOUNT_CARD}
            />
            <MatchingResults
              keyFunction={this.addKeyEventFunction}
              show={
                order.open_section === FORMULA_SEARCH_CARD &&
                order.order_mode !== ORDER_MODE_FORMULA_CORRECTION
              }
            />
            <CorrectionResults
              keyFunction={this.addKeyEventFunction}
              show={
                order.open_section === FORMULA_SEARCH_CARD &&
                order.order_mode === ORDER_MODE_FORMULA_CORRECTION
              }
            />
            <Ready
              keyFunction={this.addKeyEventFunction}
              show={order.open_section === INFO_CARD}
            />
            <FormulaInput
              keyFunction={this.addKeyEventFunction}
              freeDispense={false}
              show={order.open_section === FORMULA_INPUT_CARD}
            />
          </Container>
        </div>
      </div>
    );
  }
}

MatchingPage.propTypes = {
  order: orderType,

  cache: PropTypes.shape({}),

  login: PropTypes.shape({
    site_logged_in: PropTypes.bool,
  }),

  moveToNextSection: PropTypes.func.isRequired,
  setProductSearchMode: PropTypes.func,
  dispID: PropTypes.string,
  machines: PropTypes.object,
  alternative_matching: PropTypes.bool,
  print_preview: PropTypes.shape({ visible: PropTypes.bool }),
};

function mapStateToProps(store) {
  return {
    order: store.order,
    cache: store.cache,
    login: store.login,
    dispID: machineSelectors.current_dispID(store),
    machines: machineSelectors.machines(store),
    alternative_matching: formulaSelectors.alternative_matching(store),
    print_preview: store.print_preview,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      moveToNextSection: orderActions.moveToNextSection,
      setProductSearchMode: orderActions.setProductSearchMode,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(MatchingPage);

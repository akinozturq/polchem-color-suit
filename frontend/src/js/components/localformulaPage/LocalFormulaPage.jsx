import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import orderActions, { propType as orderType } from 'js/redux/reducers/Order';
import {
  AMOUNT_CARD,
  COLOR_SEARCH_CARD,
  PRODUCT_SEARCH_CARD,
  INFO_CARD,
  FORMULA_INPUT_CARD,
  ORDER_STATUS_DONE,
  ORDER_STATUS_PREPARING,
} from '../../Constants';
import { configure, GlobalHotKeys } from 'react-hotkeys';
import { selectors as machineSelectors } from 'js/redux/reducers/Machine';
import TopActionButtons from '../shared/TopActions';
import PropTypes from 'prop-types';
import ProductSearch from 'js/components/shared/order/ProductSearch';
import Ready from 'js/components/shared/order/Ready';
import Amounts from 'js/components/shared/order/Amounts';

import ReadyCircles, {
  ColorCircle,
  CansizeCircle,
  NCansCircle,
  ProductAndBaseCircle,
  SwitchMachineCircle,
} from 'js/components/shared/order/ReadyCircles';
import FormulaInput from '../shared/order/FormulaInput';
import { withTranslation } from 'react-i18next';
import LocalFormulaSearch from './LocalFormulaSearch';
import { isSiteUser } from '../../api/WebRequest';

/**
 * Note this page will also handle free dispense
 */

class LocalFormulaPage extends Component {
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

  render() {
    const is_free_dispense = window.location.hash === '#/freedispense';
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

    const { order } = this.props;

    const readOnly =
      order.item.status === ORDER_STATUS_DONE ||
      order.item.status === ORDER_STATUS_PREPARING;

    return (
      <div className={'zoom-in'}>
        <TopActionButtons />
        <div className="d-flex flex-column">
          <Container className="justify-content-center">
            <GlobalHotKeys keyMap={keyMap} handlers={handlers} />
            <ReadyCircles
              colorNameEdit={this.state.colorNameEdit}
              toggleEditMode={this.toggleEditMode}
              handleChangeEditMode={this.handleChangeEditMode}
              dispID={this.props.dispID}
              readOnly={readOnly}
            >
              <ColorCircle disabled={is_free_dispense} />
              <ProductAndBaseCircle
                disabledProduct={is_free_dispense || !order.color}
                disabledBase={!order.product && !is_free_dispense}
                // goToSection={FORMULA_INPUT_CARD}
                goToSection={AMOUNT_CARD}
                flex_grow={2}
              />
              <CansizeCircle
                disabled={
                  !order.base ||
                  is_free_dispense ||
                  order.open_section === FORMULA_INPUT_CARD
                }
              />
              <NCansCircle
                disabled={
                  !order.can ||
                  (is_free_dispense &&
                    order.open_section === FORMULA_INPUT_CARD)
                }
              />
              {Object.keys(this.props.machines).length > 2 && isSiteUser() && (
                <SwitchMachineCircle
                  disabled={!order.formula || !order.can || !order.base}
                />
              )}
            </ReadyCircles>

            {!is_free_dispense && order.open_section === COLOR_SEARCH_CARD && (
              <LocalFormulaSearch keyFunction={this.addKeyEventFunction} />
            )}
            {order.open_section === PRODUCT_SEARCH_CARD && (
              <ProductSearch
                keyFunction={this.addKeyEventFunction}
                colorNameEdit={this.state.colorNameEdit}
              />
            )}
            <FormulaInput
              keyFunction={this.addKeyEventFunction}
              freeDispense={is_free_dispense}
              show={order.open_section === FORMULA_INPUT_CARD}
            />

            <Amounts
              keyFunction={this.addKeyEventFunction}
              show={order.open_section === AMOUNT_CARD}
            />
            <Ready
              keyFunction={this.addKeyEventFunction}
              show={order.open_section === INFO_CARD}
            />
          </Container>
        </div>
      </div>
    );
  }
}

LocalFormulaPage.propTypes = {
  order: orderType,

  cache: PropTypes.shape({}),

  login: PropTypes.shape({
    site_logged_in: PropTypes.bool,
  }),

  setCan: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  dispID: PropTypes.string,
  machines: PropTypes.object,
  setItemEdited: PropTypes.func.isRequired,
  print_preview: PropTypes.shape({ visible: PropTypes.bool }),
};

function mapStateToProps(store) {
  return {
    print_preview: store.print_preview,
    order: store.order,
    cache: store.cache,
    login: store.login,
    dispID: machineSelectors.current_dispID(store),
    machines: machineSelectors.machines(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setCan: orderActions.setCan,
      setItemEdited: orderActions.setItemEdited,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(LocalFormulaPage)
);

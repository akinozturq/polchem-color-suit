import {
  AMOUNT_CARD,
  COLOR_SEARCH_CARD,
  INFO_CARD,
  ORDER_MODE_FREE_DISPENSE,
  ORDER_STATUS_PREPARING,
  PRODUCT_SEARCH_CARD,
} from 'js/Constants';
import machineActions, {
  propType as machinePropType,
  selectors as machineSelectors,
} from 'js/redux/reducers/Machine';
import orderActions, {
  selectors as orderSelectors,
  propType as orderType,
} from 'js/redux/reducers/Order';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Card, Col, Row } from 'reactstrap';
import { bindActionCreators } from 'redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RGBColorToHexOrNull, rightToLeft } from 'js/mylib/Utils';
import { selectors as protectionSelectors } from 'js/redux/reducers/Protection';
import PropTypes from 'prop-types';
import Extrainfo from './Extrainfo';
import Formula from './Formula';
import ReadyCircle from './ReadyCircle';

import _ from 'lodash';
import { withTranslation } from 'react-i18next';
import SimpleModal from '../SimpleModal';
import {
  GetColorSectionContent,
  getAmountSectionContent,
  getFormulaSectionContent,
  getProductSectionContent,
} from './CircleText';
import ProductInfoPopover from './ProductInfoPopover';
import { handle_db_name } from '../../../redux/Utils';
import { commentnotes } from '../../../redux/selectors/FormulaComments';

//Note: these props mappings are used by multiple components in this module

function mapStateToProps(state) {
  const [prev, next] = orderSelectors.adjacentCans(state);
  return {
    order: state.order,
    formula: state.formula,
    commentnotes: commentnotes(state),
    colorCards: state.cache.cards,
    prev_can: prev,
    next_can: next,
    router: state.router,
    config_values: state.configurations.config_values,
    is_pro: protectionSelectors.is_pro(state),
    dispIDs: machineSelectors.dispIDs(state),
    dispID: machineSelectors.current_dispID(state),
    machine: machineSelectors.current_machine(state),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setOpenSection: orderActions.setOpenSection,
      setNumberOfCans: orderActions.setNumberOfCans,
      setColorName: orderActions.setColorName,
      setCan: orderActions.setCan,
      setColorCode: orderActions.setColorCode,
      setCurrentMachine: machineActions.setCurrentMachine,
      isColourcodeFree: orderActions.isColourcodeFree,
    },
    dispatch
  );
}

class _ColorCircle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      precode: '',
    };
  }

  toggleModal = () => {
    this.setState((old) => ({ open: !old.open }));
  };

  validate = (code) => {
    // If prevent_color_code_copying is on then check from db if ok
    if (
      this.state.precode !== code &&
      this.props.config_values?.prevent_color_code_copying
    ) {
      this.setState({ precode: code });
      this.props.isColourcodeFree(code);
    }

    if (!this.props.config_values?.prevent_color_code_copying) {
      // Allow all codes as prevent_color_code_copying is off
      return true;
    }

    return (
      String(this.props.order.item.originalCode).toLowerCase().trim() !==
      String(code).toLowerCase().trim()
    );
  };

  render() {
    const { t, setColorCode, order } = this.props;
    const func = order.item.itemEdited
      ? this.toggleModal
      : this.props.setOpenSection;
    const displayEdit =
      order.item.itemEdited && order.item.status !== ORDER_STATUS_PREPARING;
    const colourcode = order.item.colourcode || '';

    return (
      <>
        <SimpleModal
          header={t('lbl.colorcode.edit', 'Edit color code')}
          edited={setColorCode}
          prompt={t('lbl.colorcode', 'Color code')}
          save={t('lbl.ok', 'Ok')}
          cancel={t('lbl.cancel', 'Cancel')}
          show={this.state.open}
          hideModal={this.toggleModal}
          value={colourcode}
          validator={this.validate}
          pending={order.isColourcodeFree_pending}
          error={
            !order.isColourcodeFree &&
            this.props.config_values?.prevent_color_code_copying
              ? t(
                  'lbl.colorCodeReservedForStandardColor',
                  'Color code is reserved for standard color'
                )
              : undefined
          }
        />
        <span id="ColorSectionContent">
          <ReadyCircle
            color={RGBColorToHexOrNull(order.item.rgb)}
            colorBeforeEdit={RGBColorToHexOrNull(order.item.rgb_before_edit)}
            disabled={this.props.disabled}
            readOnly={this.props.readOnly}
            text={colourcode}
            dataTestid="colorCircle"
            goTo={func}
            section={COLOR_SEARCH_CARD}
            dispensing={order.item.status === ORDER_STATUS_PREPARING}
            displayEdit={displayEdit}
          />
        </span>

        <GetColorSectionContent
          order={this.props.order}
          formula={this.props.formula}
          colorCards={this.props.colorCards}
          setColorName={this.props.setColorName}
          colorNameEdit={this.props.colorNameEdit}
          toggleEditMode={this.props.toggleEditMode}
          handleChangeEditMode={this.props.handleChangeEditMode}
        />
      </>
    );
  }
}
_ColorCircle.propTypes = {
  readOnly: PropTypes.bool,
  order: orderType,
  disabled: PropTypes.bool,
  setOpenSection: PropTypes.func.isRequired,
  setColorName: PropTypes.func.isRequired,
  colorNameEdit: PropTypes.bool,
  toggleEditMode: PropTypes.func.isRequired,
  handleChangeEditMode: PropTypes.func.isRequired,
  next_can: PropTypes.object,
  t: PropTypes.func.isRequired,
  setColorCode: PropTypes.func.isRequired,
  formula: PropTypes.object,
  colorCards: PropTypes.array,
  isColourcodeFree: PropTypes.func,
  config_values: PropTypes.object,
};

export const ColorCircle = withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(_ColorCircle)
);

// Separate Produt and Base circles are for MatchingPage
export const ProductCircle = connect(
  mapStateToProps,
  mapDispatchToProps
)((props) => (
  <>
    <ReadyCircle
      dataTestid="productCircle"
      text={props.text}
      product={props.order.product}
      disabled={props.disabled}
      readOnly={props.readOnly}
      goTo={props.setOpenSection}
      section={PRODUCT_SEARCH_CARD}
      img={
        props.order.product && props.order.product.prodimageid
          ? handle_db_name(
              '/rest/prodimage/' +
                props.order.product.prodimageid +
                '/data?hash=' +
                props.order.product.prodimage_md5_hash
            )
          : 'no img'
      }
      dispensing={props.order.item.status === ORDER_STATUS_PREPARING}
    />
    {props.order.open_section === PRODUCT_SEARCH_CARD && (
      <div
        style={{
          color: '#206087',
          height: '2rem',
          overflow: 'visible',
          fontSize: '5rem',
          marginTop: '-2.5rem',
          marginBottom: '3.2rem',
        }}
      >
        <FontAwesomeIcon icon="caret-up" />
      </div>
    )}
    {props.order.open_section !== PRODUCT_SEARCH_CARD &&
      props.order.product?.productzname && (
        <ProductInfoPopover
          url={props.order.product.infopage}
          productname={props.order.product.productzname}
          is_pro={props.is_pro}
          order_mode={props.order.order_mode}
        />
      )}
  </>
));

export const BaseCircle = connect(
  mapStateToProps,
  mapDispatchToProps
)((props) => {
  const show_abasecode = props.config_values?.show_abasecode;

  const second_text = show_abasecode
    ? props.order.item && props.order.item.abasecode
    : null;

  return (
    <>
      <ReadyCircle
        dataTestid="baseCircle"
        text={props.order.item.basecode}
        second_text={second_text}
        disabled={
          props.order.order_mode === ORDER_MODE_FREE_DISPENSE
            ? true
            : props.disabled
        }
        readOnly={props.readOnly}
        goTo={props.setOpenSection}
        section={props.goToSection || PRODUCT_SEARCH_CARD}
        dispensing={props.order.item.status === ORDER_STATUS_PREPARING}
      />

      {getFormulaSectionContent(props.order)}
    </>
  );
});

export const ProductAndBaseCircle = connect(
  mapStateToProps,
  mapDispatchToProps
)((props) => {
  const show_abasecode = props.config_values?.show_abasecode;

  const second_text = show_abasecode
    ? props.order.item && props.order.item.abasecode
    : null;

  return (
    <>
      <Row>
        <Col>
          <ReadyCircle
            dataTestid="productCircle"
            type="product"
            text={props.text}
            product={props.order.product}
            disabled={props.disabledProduct}
            readOnly={props.readOnly}
            goTo={props.setOpenSection}
            section={PRODUCT_SEARCH_CARD}
            img={
              props.order.product && props.order.product.prodimageid
                ? handle_db_name(
                    '/rest/prodimage/' +
                      props.order.product.prodimageid +
                      '/data?hash=' +
                      props.order.product.prodimage_md5_hash
                  )
                : null
            }
            dispensing={props.order.item.status === ORDER_STATUS_PREPARING}
          />
        </Col>
        <Col>
          <ReadyCircle
            type="base"
            dataTestid="baseCircle"
            text={props.order.item.basecode}
            second_text={second_text}
            disabled={
              props.order.order_mode === ORDER_MODE_FREE_DISPENSE
                ? true
                : props.disabledBase
            }
            readOnly={props.readOnly}
            goTo={props.setOpenSection}
            section={props.goToSection || PRODUCT_SEARCH_CARD}
            dispensing={props.order.item.status === ORDER_STATUS_PREPARING}
          />
        </Col>
      </Row>
      <Row>
        <Col>{getProductSectionContent(props.order, props.is_pro)}</Col>
      </Row>
    </>
  );
});

class _CansizeCircle extends Component {
  nextCan = () => {
    const { next_can } = this.props;

    if (next_can) {
      this.props.setCan(next_can);
    }
  };

  prevCan = () => {
    const { prev_can } = this.props;

    if (prev_can) {
      this.props.setCan(prev_can);
    }
  };

  render() {
    return (
      <>
        <ReadyCircle
          dataTestid="canSizeCircle"
          readOnly={this.props.readOnly}
          disabled={this.props.disabled}
          text={this.props.order.item.cansizecode || ''}
          goTo={this.props.setOpenSection}
          section={AMOUNT_CARD}
          type="can"
          plus={
            this.props.order.can && this.props.order.can.canid && this.nextCan
          }
          minus={
            this.props.order.can && this.props.order.can.canid && this.prevCan
          }
          dispensing={this.props.order.item.status === ORDER_STATUS_PREPARING}
        />
        {getAmountSectionContent(this.props.order)}
      </>
    );
  }
}
_CansizeCircle.propTypes = {
  readOnly: PropTypes.bool,
  setNumberOfCans: PropTypes.func.isRequired,
  order: orderType,
  disabled: PropTypes.bool,
  setOpenSection: PropTypes.func.isRequired,
  next_can: PropTypes.object,
  prev_can: PropTypes.object,
  setCan: PropTypes.func,
};

export const CansizeCircle = connect(
  mapStateToProps,
  mapDispatchToProps
)(_CansizeCircle);

class _NCansCircle extends Component {
  addCan = () => {
    const num_of_cans = this.props.order.item.ncans + 1;
    const max_ncans = this.maxNCans();
    if (!max_ncans || num_of_cans <= max_ncans) {
      this.props.setNumberOfCans(num_of_cans);
    }
  };

  remCan = () => {
    const num_of_cans = this.props.order.item.ncans - 1;
    if (num_of_cans >= this.minNCans()) {
      this.props.setNumberOfCans(num_of_cans);
    }
  };
  editCan = (num_of_cans) => {
    if (num_of_cans >= 0) {
      this.props.setNumberOfCans(num_of_cans);
    }
  };

  minNCans = () => {
    const { order } = this.props;
    if (order.ncans_tinted) {
      return order.ncans_tinted + 1;
    }
    return order.item.itemEdited ? 0 : 1;
  };

  maxNCans = () => {
    return this.props.config_values.max_cans_in_order_item || undefined;
  };

  render() {
    const { machine, order } = this.props;
    const dispensing = order.item.status === ORDER_STATUS_PREPARING;
    const tinted =
      dispensing && machine.machine_state?.orderItem
        ? machine.machine_state.orderItem.cansTinted
        : order.ncans_tinted;
    if (isNaN(tinted)) {
      console.warn('tinted is NaN', machine.machine_state, order);
    }
    const text =
      dispensing || tinted > 0
        ? Math.min(tinted + 1, order.item.ncans).toString() +
          ' / ' +
          order.item.ncans.toString()
        : order.open_section === INFO_CARD
          ? 'X ' + order.item.ncans.toString()
          : '';

    return (
      <ReadyCircle
        dataTestid="nCansCircle"
        readOnly={this.props.readOnly}
        disabled={this.props.disabled}
        text={text}
        goTo={this.props.setOpenSection}
        section={INFO_CARD}
        type="numberOfCans"
        plus={this.props.order.open_section === INFO_CARD ? this.addCan : null}
        minus={this.props.order.open_section === INFO_CARD ? this.remCan : null}
        edit={this.props.order.open_section === INFO_CARD ? this.editCan : null}
        minNCans={this.minNCans()}
        maxNCans={this.maxNCans()}
        dispensing={dispensing}
      />
    );
  }
}

class _SwitchMachineCircle extends Component {
  incrementsMachinesIndex = () => {
    let idx = _.findIndex(this.props.dispIDs, (id) => id === this.props.dispID);

    if (idx > -1 && idx < this.props.dispIDs.length - 1) {
      this.props.setCurrentMachine(this.props.dispIDs[idx + 1]);
    }
  };

  decrementMachinesIndex = () => {
    let idx = _.findIndex(this.props.dispIDs, (id) => id === this.props.dispID);
    if (idx > 0) {
      this.props.setCurrentMachine(this.props.dispIDs[idx - 1]);
    }
  };

  render() {
    const dispensing = this.props.order.item.status === ORDER_STATUS_PREPARING;
    return (
      <ReadyCircle
        readOnly={this.props.readOnly}
        disabled={this.props.disabled}
        text={this.props.machine?.info?.dispenserName}
        goTo={this.props.setOpenSection}
        section={INFO_CARD}
        type="machineSwitching"
        increment={
          this.props.order.open_section === INFO_CARD
            ? this.incrementsMachinesIndex
            : null
        }
        decrement={
          this.props.order.open_section === INFO_CARD
            ? this.decrementMachinesIndex
            : null
        }
        dispensing={dispensing}
      />
    );
  }
}

_NCansCircle.propTypes = {
  readOnly: PropTypes.bool,
  setNumberOfCans: PropTypes.func.isRequired,
  order: orderType,
  formula: PropTypes.object,
  disabled: PropTypes.bool,
  setOpenSection: PropTypes.func.isRequired,
  machine: machinePropType,
  config_values: PropTypes.object,
};

_SwitchMachineCircle.propTypes = {
  readOnly: PropTypes.bool,
  order: orderType,
  setCurrentMachine: PropTypes.func.isRequired,
  dispIDs: PropTypes.array.isRequired,
  dispID: PropTypes.string.isRequired,
  machine: machinePropType,
  disabled: PropTypes.bool,
  setOpenSection: PropTypes.func.isRequired,
};

export const NCansCircle = connect(
  mapStateToProps,
  mapDispatchToProps
)(_NCansCircle);

export const SwitchMachineCircle = connect(
  mapStateToProps,
  mapDispatchToProps
)(_SwitchMachineCircle);

class ReadyCircles extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show_circles: true,
    };
  }

  getCircles = () => {
    const {
      readOnly,
      animationClass,
      moveProductFirst,
      setColorName,
      colorNameEdit,
      toggleEditMode,
      handleChangeEditMode,
    } = this.props;

    const children = React.Children.toArray(this.props.children);
    if (moveProductFirst) {
      //Assuming children are in order color, product, base, ...
      //change order to product, base, color, ...
      const color = children.shift();
      children.splice(1, 0, color);
    }
    return (
      <>
        {children.map((child, i) => {
          return (
            <Col
              key={i}
              align="center"
              style={{
                padding: 0,
                flexGrow: child.props.flex_grow || 1,
              }}
              className={animationClass}
            >
              {React.cloneElement(child, {
                readOnly,
                setColorName,
                colorNameEdit,
                toggleEditMode,
                handleChangeEditMode,
              })}
            </Col>
          );
        })}
      </>
    );
  };

  getNotes = () => {
    // className={this.state.showOrders?'mySlideInRight':'mySlideOutRight'}>
    return (
      <>
        <Col style={{ height: '22vh' }} className="mb-8 mr-8 mySlideInRight">
          <Formula largefrm={false} dispID={this.props.dispID} />
        </Col>
        <Col
          className="mb-8 ml-8 mr-8 mySlideInRight"
          style={{ height: '22vh' }}
        >
          <Card
            className="p-8 br-8 bordered ready-grey"
            style={{ height: '100%' }}
          >
            <p>{this.props.commentnotes}</p>
          </Card>
        </Col>
        <Col className="mb-8 ml-8 mySlideInRight" style={{ height: '22vh' }}>
          <Extrainfo large={false} />
        </Col>
      </>
    );
  };

  toggleCirlesNotes = () => {
    this.setState((state) => ({
      show_circles: !state.show_circles,
    }));
  };

  render() {
    // { router } = this.props;
    const carret_style = {
      display: 'none',
      maxHeight: '6rem',
      marginTop: '2rem',
    };
    let carret_style_left = { ...carret_style };
    let carret_style_right = { ...carret_style };

    if (this.props.order.item.status === ORDER_STATUS_PREPARING) {
      if (this.state.show_circles) {
        carret_style_right = { ...carret_style_right, display: 'block' };
      } else {
        carret_style_left = { ...carret_style_left, display: 'block' };
      }
    }
    return (
      <div>
        <Row
          className="center-block"
          style={{
            height: 'calc(Min(12vw, 17vh) + 2.75rem)',
            marginBottom: '0.65rem',
          }}
        >
          <Col xs={1}>
            <FontAwesomeIcon
              className="caret"
              icon={rightToLeft() ? 'caret-right' : 'caret-left'}
              style={carret_style_left}
              onClick={this.toggleCirlesNotes}
            />
          </Col>
          {/** Show circles or  formula | Notes | extra info*/}
          {this.state.show_circles ||
          this.props.order.item.status !== ORDER_STATUS_PREPARING
            ? this.getCircles()
            : this.getNotes()}

          <Col xs={1}>
            <FontAwesomeIcon
              className="caret"
              icon={rightToLeft() ? 'caret-left' : 'caret-right'}
              style={carret_style_right}
              onClick={this.toggleCirlesNotes}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

ReadyCircles.propTypes = {
  order: orderType,
  formula: PropTypes.object,
  commentnotes: PropTypes.string,
  readOnly: PropTypes.bool,
  is_pro: PropTypes.bool,
  config_values: PropTypes.object,
  setNumberOfCans: PropTypes.func.isRequired,
  setOpenSection: PropTypes.func.isRequired,
  setColorName: PropTypes.func,
  moveProductFirst: PropTypes.bool.isRequired,
  animationClass: PropTypes.string,
  dispID: PropTypes.string,
  children: PropTypes.any,
  inMatching: PropTypes.bool,
  colorNameEdit: PropTypes.bool,
  toggleEditMode: PropTypes.func,
  handleChangeEditMode: PropTypes.func,
  router: PropTypes.shape({
    location: PropTypes.shape({
      pathname: PropTypes.string,
    }),
  }),
};

ReadyCircles.defaultProps = {
  inMatching: false,
  moveProductFirst: false,
};

export default connect(mapStateToProps, mapDispatchToProps)(ReadyCircles);

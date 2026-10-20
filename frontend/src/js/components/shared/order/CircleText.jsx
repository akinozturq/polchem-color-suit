import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  COLOR_SEARCH_CARD,
  PRODUCT_SEARCH_CARD,
  AMOUNT_CARD,
  FORMULA_SEARCH_CARD,
  FORMULA_INPUT_CARD,
  ORDER_MODE_FREE_DISPENSE,
  ORDER_STATUS_PREPARING,
} from '../../../Constants';
import {
  UncontrolledTooltip,
  Col,
  Input,
  ListGroup,
  ListGroupItem,
} from 'reactstrap';
import ProductInfoPopover from './ProductInfoPopover';
import PropTypes from 'prop-types';
import _ from 'lodash';

class _GetColorSectionContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      colorName: '',
    };
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  componentDidUpdate() {
    if (this.inputRef.current) {
      this.inputRef.current.focus();
    }
  }

  handleClickOutside = (e) => {
    if (
      this.inputRef &&
      this.inputRef.current &&
      !this.inputRef.current.contains(e.target)
    ) {
      this.props.handleChangeEditMode(false);
    }
  };

  render() {
    const { t, order, colorNameEdit, toggleEditMode, formula, colorCards } =
      this.props;
    if (order.open_section === COLOR_SEARCH_CARD) {
      return (
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
          <FontAwesomeIcon icon="caret-up" style={{}} />
        </div>
      );
    }

    let cardNames = [];
    formula.color_details?.colourcardids?.forEach((id) => {
      const card = _.find(colorCards, (card) => id === card.colourcardid);
      if (card) cardNames.push(card.cardname);
    });
    return colorNameEdit &&
      order.item.status !== ORDER_STATUS_PREPARING &&
      order.item.itemEdited ? (
      <Input
        data-testid={'colorNameInput'}
        autoFocus
        innerRef={this.inputRef}
        onChange={(e) => {
          this.props.setColorName(e.target.value);
        }}
        value={order.item.colourname || ''}
        disabled={order.item.ncans === 0}
        maxLength={'40'}
      />
    ) : (
      <>
        <p
          id={'EditColorName'}
          className="directly-over-bg m-0 p-0"
          style={{
            color: 'white',
            overflowWrap: 'break-word',
            lineHeight: order.item.colourname?.length > 30 ? 0.9 : 'inherit',
            minHeight: '24px',
            display: 'flex',
            alignItems: 'center',
          }}
          onClick={toggleEditMode}
        >
          {order.item.colourname ? (
            <span
              className={'m-0 p-0'}
              style={{
                width: 'Min(13.6vw, 17vh)',
                fontSize:
                  order.item.colourname?.length > 30 ? '12px' : 'inherit',
                maxHeight: '48px',
              }}
            >
              {order.item.colourname}
            </span>
          ) : (
            order.item.status !== ORDER_STATUS_PREPARING &&
            order.order_mode !== ORDER_MODE_FREE_DISPENSE &&
            order.item.itemEdited &&
            t('prompt.clickToEditName', 'Click to Edit Name')
          )}
        </p>
        &nbsp;
        {order.color?.colourcode ? (
          <UncontrolledTooltip
            id={'ColorSectionContentTooltip'}
            placement="auto"
            target="ColorSectionContent"
          >
            <ListGroup className={'mb-2'}>
              {cardNames.map((cardName, idx) => (
                <ListGroupItem
                  key={idx}
                  style={
                    cardName === order.item.cardname
                      ? { background: 'white', color: 'black' }
                      : null
                  }
                >
                  {cardName}
                </ListGroupItem>
              ))}
            </ListGroup>

            <p>{order.item.colourcode}</p>
            <p>{order.item.colourname || ''}</p>
            {order.item.primer_color && (
              <p>
                {t('lbl.primer.colon', 'Primer:')}
                {order.item.primer_color?.colourcode || ''}
              </p>
            )}
          </UncontrolledTooltip>
        ) : null}
      </>
    );
  }
}

_GetColorSectionContent.propTypes = {
  t: PropTypes.func,
  handleChangeEditMode: PropTypes.func,
  setColorName: PropTypes.func.isRequired,
  colorNameEdit: PropTypes.bool,
  toggleEditMode: PropTypes.func,
  order: PropTypes.object,
  formula: PropTypes.object,
  colorCards: PropTypes.array,
};

export const GetColorSectionContent = withTranslation()(
  _GetColorSectionContent
);

GetColorSectionContent.propTypes = {
  t: PropTypes.func,
  handleChangeEditMode: PropTypes.func,
  setColorName: PropTypes.func.isRequired,
  colorNameEdit: PropTypes.bool,
  toggleEditMode: PropTypes.func,
  order: PropTypes.object,
};

export function getProductSectionContent(order, is_pro) {
  if (order.open_section === PRODUCT_SEARCH_CARD) {
    return (
      <>
        <Col xs="2" align="center" className="circle-padding">
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
        </Col>
        <Col xs="2" align="center" className="circle-padding" />
      </>
    );
  }
  if (order.open_section === FORMULA_INPUT_CARD) {
    return (
      <>
        {order.product?.productzname && (
          <ProductInfoPopover
            url={order.product.infopage}
            productname={order.product.productzname}
            is_pro={is_pro}
            order_mode={order.order_mode}
          />
        )}
        <Col xs="2" align="center" className="circle-padding"></Col>

        <Col xs="2" align="center" className="circle-padding" />
      </>
    );
  }

  if (order.product) {
    if (order.product.infopage && order.product.productzname) {
      return (
        <ProductInfoPopover
          url={order.product.infopage}
          productname={order.product.productzname}
          is_pro={is_pro}
          order_mode={order.order_mode}
        />
      );
    }
    return (
      <p
        className="directly-over-bg"
        style={{ color: 'white', whiteSpace: 'nowrap' }}
      >
        {order.product.productzname}
      </p>
    );
  } else {
    return <p className="white-nowrap"></p>;
  }
}

export function getAmountSectionContent(order) {
  if (
    order.open_section === AMOUNT_CARD ||
    order.open_section === FORMULA_INPUT_CARD
  ) {
    return (
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
    );
  }
}

export function getFormulaSectionContent(order) {
  if (order.open_section === FORMULA_SEARCH_CARD) {
    return (
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
    );
  }
}

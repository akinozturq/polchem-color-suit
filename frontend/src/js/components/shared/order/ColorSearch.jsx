import React, { Component } from 'react';
import {
  Container,
  Col,
  Row,
  Alert,
  InputGroup,
  InputGroupAddon,
} from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import orderActions, { propType as orderType } from 'js/redux/reducers/Order';
import hoverActions from 'js/redux/reducers/HoverColor';
import { selectors as protectionSelectors } from 'js/redux/reducers/Protection';
import {
  COLOR_SEARCH_CARD,
  COLOR_SEARCH,
  MATCH_SEARCH,
  CARD_SEARCH,
  BOX_LEFT_STYLE,
  INFO_CARD,
  ORDER_MODE_LOCAL_FORMULA,
  RTL_BOX_LEFT_STYLE,
  offline_mode,
} from '../../../Constants';
import card_img from 'img/orderCreation/card.svg';
import card_selected_img from 'img/orderCreation/cardSelected.svg';
import { findObjectByKey, spinner } from 'js/mylib/Utils';
import BootstrapTable from 'react-bootstrap-table-next';
import SearchInput from '../SearchInput';
import ColorCode from './ColorCode';
import ColorPreview from './ColorPreview';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import formulaActions from 'js/redux/reducers/Formula';
import { AutoSizer, List } from 'react-virtualized';
import { detectMobile, rightToLeft } from '../../../mylib/Utils';

class ColorSearch extends Component {
  constructor(props) {
    super(props);
    this.timer = null;
    this.searchField = null;
    this.state = {
      /** Highlighted card in the table */
      selectedCard: null,

      /** Highlighted color in the table */
      selectedColor: null,

      searchString: '',

      filteredCards: [],
    };
  }

  componentDidMount() {
    this.props.keyFunction(COLOR_SEARCH_CARD, this.handleKeyPress);
    this.props.setColor(null);
    this.selectColor(null);

    const { config_values, order } = this.props;
    this.props.fetchCardsForProduct(order.product?.productid);

    const mode =
      config_values.color_search_tree &&
      (!config_values.color_search_list || order.card)
        ? CARD_SEARCH
        : COLOR_SEARCH;
    if (mode === COLOR_SEARCH) {
      this.props.setCard(null);
    }
    this.props.setColorSearchMode(mode);
    this.search('', mode);

    this.timer = setTimeout(this.focusOnSearch, 300);
  }

  isRtl = () => rightToLeft();

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer);
  }

  searchCards = (searchString) => {
    const search = searchString.toLowerCase();
    const filteredCards = this.props.all_cards.filter((card) =>
      card.cardname.toLowerCase().includes(search)
    );
    this.setState({ filteredCards });
  };

  filteredProductCards = () => {
    const { product_cards } = this.props.formula;
    const { filteredCards } = this.state;
    return product_cards == null
      ? filteredCards
      : filteredCards.filter((x) => product_cards.includes(x.colourcardid));
  };

  searchFieldMode = () =>
    this.props.order.color_search_mode === CARD_SEARCH && !this.props.order.card
      ? CARD_SEARCH
      : COLOR_SEARCH;

  handleKeyPress = (key) => {
    if (key === 'Esc') {
      // No can size selected.. Do not move!
      if (this.props.order.card === null && this.props.order.color === null) {
        return this.props.moveToPrevSection();
      }
      if (this.state.selectedColor) {
        return this.selectColor(null);
      }
      if (this.props.order.card) {
        return this.submitCard(null);
      }
    }

    if (key === 'Enter') {
      if (this.searchFieldMode() === CARD_SEARCH) {
        this.submitCard(this.state.selectedCard);
      } else {
        const { selectedColor } = this.state;
        if (selectedColor) {
          this.submitColor(selectedColor);
        } else {
          const { colors } = this.props.formula;
          if (colors.length === 1) {
            this.submitColor(colors[0]);
          }
        }
      }
      return;
    }

    let rs = { position: -1 };
    let new_pos = null;

    if (this.searchFieldMode() === COLOR_SEARCH) {
      // Color search
      const { colors } = this.props.formula;
      const { selectedColor } = this.state;
      if (selectedColor) {
        rs = findObjectByKey(colors, 'colourid', selectedColor.colourid);
      }

      if (key === 'down') {
        new_pos = Math.min(colors.length - 1, rs.position + 1);
      } else {
        new_pos = Math.max(0, rs.position - 1);
      }
      if (new_pos >= 0 && new_pos < colors.length) {
        this.selectColor(colors[new_pos]);
        // Findind based on id and scrolling to that
        const id = 'colorid_' + colors[new_pos].colourid;
        const elm = document.getElementById(id);
        elm.parentElement.scrollIntoView(true);
      } else if (colors.length === 1) {
        this.selectColor(colors[0]);
      }
    } else {
      const cards = this.filteredProductCards();
      // Color card search mode
      let rs = { position: -1 };
      let new_pos = null;
      // move to previous product
      if (this.state.selectedCard) {
        rs = findObjectByKey(
          cards,
          'colourcardid',
          this.state.selectedCard.colourcardid
        );
      }

      if (key === 'down') {
        new_pos = Math.min(cards.length - 1, rs.position + 1);
      } else {
        new_pos = Math.max(0, rs.position - 1);
      }

      if (new_pos >= 0 && new_pos < cards.length) {
        const card = cards[new_pos];
        this.setState({ selectedCard: card });
        const elm = document.getElementById('card_scroll');
        elm.scrollTop = 41 * (new_pos - 1);
        this.list.forceUpdateGrid();
      }
    }
  };

  focusOnSearch = () => {
    if (this.searchField) {
      this.timer = setTimeout(() => this.searchField?.focus(), 300);
    }
  };

  changeSearchMode = (mode) => {
    const prevMode = this.searchFieldMode();

    this.props.setCard(null);
    this.props.setColorSearchMode(mode);
    // Clear search when changing between card and color search
    if (mode === CARD_SEARCH) {
      this.search('', CARD_SEARCH);
    } else if (prevMode === CARD_SEARCH) {
      this.search('', COLOR_SEARCH);
    } else {
      this.search(this.state.searchString, COLOR_SEARCH);
    }
    this.focusOnSearch();
  };

  getModeButtonStyle = (mode) =>
    this.props.order.color_search_mode === mode
      ? 'btn btn-primary btn-selected h-3rem'
      : 'btn btn-secondary h-3rem';

  getCardIcon = () =>
    this.props.order.color_search_mode === CARD_SEARCH
      ? card_selected_img
      : card_img;

  colorCodeFormatter = (cell, row) => {
    return (
      <ColorCode
        isLocalFormula={
          this.props.order.order_mode === ORDER_MODE_LOCAL_FORMULA
        }
        colorData={row}
      />
    );
  };

  selectColor = (color) => {
    this.setState({ selectedColor: color });
    this.props.setHoverColor(color);
  };

  submitColor = (color) => {
    const { order } = this.props;

    this.props.setColor(color);
    if (color == null) {
      return;
    }
    if (order.product && order.prev_section === INFO_CARD) {
      this.props.setColorAfterConfirmation();
    } else {
      if (order.product && color.colourid) {
        this.props.loadFormula(color.colourid, order.product.productid);
      }
      this.props.moveToNextSection();
    }
  };

  //mobiledetecting for styling scrolling, calculating maybe useless?
  getScrollStyle = () => {
    if (detectMobile()) {
      const { order } = this.props;
      let height = '';
      if (order.color) {
        height += ' - 4rem';
      }
      if (order.product) {
        height += ' - 4rem';
      }
      if (order.can) {
        height += ' - 8rem';
      }

      if (this.props.formula.fetch_colors_error) {
        return {
          maxHeight: 'calc(100vh - 19rem ' + height + ')',
          minHeight: '30vh',
        };
      }
      return {
        maxHeight: 'calc(100vh - 16rem ' + height + ')',
        minHeight: '30vh',
      };
    } else {
      if (this.props.formula.fetch_colors_error) {
        return {
          maxHeight: 'calc(100vh - 6.375rem - 4.5rem - 14vw - 17rem)',
          minHeight: '10rem',
        };
      }
      return {
        maxHeight: 'calc(100vh - 6.375rem - 4.5rem - 14vw - 11rem)',
        minHeight: '17rem',
      };
    }
  };

  /**
   * Card search related
   */

  noCardsRenderer = () => {
    const { t } = this.props;
    var prodStyle = {
      borderTop: '1px solid #dce4e9',
      paddingLeft: this.isRtl() ? 0 : '5px',
      paddingRight: this.isRtl() ? '5px' : 0,
      height: '40px',
      backgroundColor: 'lightblue',
      textAlign: this.isRtl() ? 'right' : 'left',
    };
    return (
      <div style={prodStyle}>{t('lbl.noColorCards', 'No color cards')}</div>
    );
  };

  cardRenderer = ({
    key, // Unique key within array of rows
    index, // Index of row within collection
    // isScrolling, // The List is currently being scrolled
    // isVisible, // This row is visible within the List (eg it is not an overscanned row)
    style, // Style object to be applied to row (to position it)
  }) => {
    const cards = this.filteredProductCards();
    const card = cards[index];

    let background = '#112E40';
    let color = 'white';
    if (
      this.state.selectedCard &&
      card.colourcardid === this.state.selectedCard.colourcardid
    ) {
      background = 'lightblue';
      color = 'black';
    }
    const cardStyle = {
      borderTop: '1px solid #dce4e9',
      color: color,
      paddingLeft: this.isRtl() ? 0 : '5px',
      paddingRight: this.isRtl() ? '5px' : 0,
      height: '100%',
      backgroundColor: background,
      cursor: 'pointer',
      textAlign: this.isRtl() ? 'right' : 'left',
      ...style,
    };

    return (
      <div
        key={key}
        style={cardStyle}
        onMouseUp={() => this.submitCard(card)}
        onMouseEnter={() => {
          this.setState({ selectedCard: card }, () => {
            this.list.forceUpdateGrid();
          });
        }}
      >
        {card.cardname}
      </div>
    );
  };

  submitCard = (card) => {
    // Set the card and resert the search field focus to search
    this.setState({ searchString: '' });
    this.props.setCard(card);
    if (card === null) {
      this.searchCards('');
    } else {
      this.props.searchColor();
    }
    this.focusOnSearch();
  };

  handleSearch = (search) => {
    const searchString = search || '';
    this.search(searchString, this.searchFieldMode());
  };

  search = (searchString, searchFieldMode) => {
    this.setState({ searchString });
    if (searchFieldMode === CARD_SEARCH) {
      this.searchCards(searchString);
    } else {
      this.props.searchColor(searchString);
    }
  };

  getCardList = () => {
    if (this.props.formula.product_cards_start) {
      return spinner();
    }

    const cards = this.filteredProductCards();

    return (
      <div
        className="bordered br-8"
        dir={this.isRtl() ? 'rtl' : 'ltr'}
        style={{
          ...this.getScrollStyle(),

          display:
            this.props.order.color_search_mode === CARD_SEARCH &&
            !this.props.order.card
              ? ''
              : 'none',
        }}
      >
        <AutoSizer>
          {({ width, height }) => (
            <List
              id="card_scroll"
              className="scroll no-focus"
              width={width}
              rowCount={cards.length}
              rowHeight={40}
              rowRenderer={this.cardRenderer}
              noRowsRenderer={this.noCardsRenderer}
              height={height}
              ref={(ref) => (this.list = ref)}
            />
          )}
        </AutoSizer>
      </div>
    );
  };

  /**
   * END CARD SEARCH
   */

  getFirstColumn = () => {
    const { t, config_values } = this.props;
    const nbrButtons =
      config_values.color_search_list && config_values.color_search_tree
        ? 2
        : 0;
    const selectRowProp = {
      mode: 'radio',
      bgColor: 'lightblue', // you should give a bgcolor, otherwise, you can't regonize which row has been selected
      hideSelectColumn: true, // enable hide selection column.
      clickToSelect: true, // you should enable clickToSelect, otherwise, you can't select column.
      onSelect: this.submitColor,
      selected: this.state.selectedColor
        ? [this.state.selectedColor.colourid]
        : [],
    };

    const columns = [
      {
        dataField: 'colourcode',
        text: t('lbl.colorCode', 'Color code'),
        formatter: this.colorCodeFormatter,
        attrs: (cell, row, ridx, cidx) => ({
          'data-testid': 'color_search_' + ridx + ':' + cidx,
        }),
      },
    ];

    const placeholder =
      this.searchFieldMode() === COLOR_SEARCH
        ? t('prompt.typeColorCode', 'Type color code')
        : t('prompt.typeCardName', 'Type card name');

    return (
      <>
        <InputGroup
          style={{ padding: '0', flexWrap: 'nowrap', marginBottom: '0.5rem' }}
        >
          <SearchInput
            id="color_search"
            inputRef={(ref) => {
              this.searchField = ref;
            }}
            onChange={(e) => this.handleSearch(e.target.value)}
            nbrButtons={nbrButtons}
            placeholder={placeholder}
            value={this.state.searchString}
          />
          {!detectMobile() && (
            <InputGroupAddon addonType="append">
              {config_values.color_search_list && (
                <button
                  data-testid="colorSearchListBtn"
                  style={{ margin: '0' }}
                  onClick={() => this.changeSearchMode(COLOR_SEARCH)}
                  className={this.getModeButtonStyle(COLOR_SEARCH)}
                  type="button"
                >
                  <FontAwesomeIcon icon="list" />
                </button>
              )}
              {config_values.color_search_tree && (
                <button
                  data-testid="colorSearchCardBtn"
                  style={{
                    margin: '0',
                    borderRadius: this.props.order.product
                      ? '0'
                      : rightToLeft()
                        ? '8px 0 0 8px'
                        : '0 8px 8px 0',
                  }}
                  onClick={() => this.changeSearchMode(CARD_SEARCH)}
                  className={this.getModeButtonStyle(CARD_SEARCH)}
                  type="button"
                >
                  <img src={this.getCardIcon()} alt="img" />
                </button>
              )}
              {this.props.moveProductFirst &&
                !offline_mode &&
                config_values.color_search_matching && (
                  <button
                    data-testid="colorSearchMatching"
                    style={{
                      margin: '0',
                      borderRadius: rightToLeft()
                        ? '8px 0 0 8px'
                        : '0 8px 8px 0',
                    }}
                    onClick={() => this.changeSearchMode(MATCH_SEARCH)}
                    className={this.getModeButtonStyle(MATCH_SEARCH)}
                    type="button"
                  >
                    <FontAwesomeIcon icon="eye" />
                  </button>
                )}
            </InputGroupAddon>
          )}
        </InputGroup>
        {this.searchFieldMode() === COLOR_SEARCH ? (
          <>
            {!!this.props.order.card && (
              <div
                className="pointer-cursor"
                onClick={() => this.submitCard(null)}
              >
                <img className="pl-8 pr-8" src={card_selected_img} alt="" />{' '}
                <h5 className="p-8 d-i-b">{this.props.order.card.cardname}</h5>
                <FontAwesomeIcon icon="circle-chevron-up" />
              </div>
            )}
            <div
              className=" scroll bordered br-8"
              style={{ ...this.getScrollStyle() }}
            >
              {this.props.formula.fetch_colors_start && spinner()}
              <div
                style={
                  !this.props.formula.fetch_colors_start
                    ? null
                    : { display: 'none' }
                }
              >
                <BootstrapTable
                  bordered={false}
                  keyField="colourid"
                  hover
                  data={this.props.formula.colors}
                  tabIndexCell
                  headerClasses={'col-hidden'}
                  columns={columns}
                  noDataIndication={() => t('lbl.noColors', 'No colors')}
                  selectRow={selectRowProp}
                />
              </div>
            </div>
          </>
        ) : (
          this.getCardList()
        )}
      </>
    );
  };

  render() {
    const { t } = this.props;
    return (
      <Col style={{ display: '', overflow: 'hidden' }}>
        <Alert
          color="danger"
          isOpen={this.props.formula.fetch_colors_error !== null}
        >
          {t('msg.unableToLoadColors', 'Unable to load colors')}:{' '}
          {this.props.formula.fetch_colors_error
            ? this.props.formula.fetch_colors_error.message
            : null}
        </Alert>

        <Container style={{ padding: detectMobile() ? '0' : '' }}>
          <Row
            className={
              detectMobile()
                ? 'mobile-color-search-container'
                : 'color-search-container'
            }
          >
            <Col
              className={
                detectMobile()
                  ? 'mobile-color-search-panel'
                  : 'color-search-panel'
              }
            >
              {this.getFirstColumn()}
            </Col>
            {/*if mobile then it wont render this */}
            {!detectMobile() && (
              <Col
                md="5"
                style={rightToLeft() ? RTL_BOX_LEFT_STYLE : BOX_LEFT_STYLE}
              >
                <ColorPreview />
              </Col>
            )}
          </Row>
        </Container>
      </Col>
    );
  }
}

ColorSearch.propTypes = {
  formula: PropTypes.shape({
    colors: PropTypes.arrayOf(PropTypes.object),
    fetch_colors_error: PropTypes.string,
    fetch_colors_start: PropTypes.bool,
    product_cards: PropTypes.array,
    product_cards_start: PropTypes.bool,
  }),

  all_cards: PropTypes.arrayOf(PropTypes.object),
  order: orderType,
  moveToNextSection: PropTypes.func.isRequired,
  moveToPrevSection: PropTypes.func.isRequired,
  searchColor: PropTypes.func.isRequired,
  setColor: PropTypes.func.isRequired,
  setHoverColor: PropTypes.func.isRequired,
  fetchProductsWithFormulas: PropTypes.func.isRequired,
  fetchCardsForProduct: PropTypes.func.isRequired,
  setColorSearchMode: PropTypes.func.isRequired,
  loadFormula: PropTypes.func.isRequired,
  setCard: PropTypes.func.isRequired,
  keyFunction: PropTypes.func.isRequired,
  config: PropTypes.object,
  config_values: PropTypes.object,
  moveProductFirst: PropTypes.bool.isRequired,
  t: PropTypes.func.isRequired,
  setColorAfterConfirmation: PropTypes.func,
  is_pro: PropTypes.bool,
};

function mapStateToProps(store) {
  return {
    all_cards: store.cache.cards,
    order: store.order,
    formula: store.formula,
    config: store.configurations.config,
    config_values: store.configurations.config_values,
    configurations: store.configurations,
    is_pro: protectionSelectors.is_pro(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setColorSearchMode: orderActions.setColorSearchMode,
      moveToNextSection: orderActions.moveToNextSection,
      moveToPrevSection: orderActions.moveToPrevSection,
      setColor: orderActions.setColor,
      setHoverColor: hoverActions.setHoverColor,
      searchColor: formulaActions.searchColors,
      loadFormula: formulaActions.loadFormula,
      fetchProductsWithFormulas: formulaActions.fetchProductsWithFormulas,
      fetchCardsForProduct: formulaActions.fetchCardsForProduct,
      setCard: orderActions.setCard,
      setColorAfterConfirmation: orderActions.setColorAfterConfirmation,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(ColorSearch)
);

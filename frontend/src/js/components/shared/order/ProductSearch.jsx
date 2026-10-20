import React, { Component } from 'react';
import {
  Container,
  Col,
  Row,
  InputGroup,
  InputGroupAddon,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import memoizeOne from 'memoize-one';

import orderActions from 'js/redux/reducers/Order';
import formulaActions from 'js/redux/reducers/Formula';
import hoverColorActions from 'js/redux/reducers/HoverColor';
import { selectors as protectionSelectors } from 'js/redux/reducers/Protection';

import {
  COLOR_SEARCH_CARD,
  PRODUCT_SEARCH_CARD,
  INFO_CARD,
  BOX_LEFT_STYLE,
  PRODUCT_SEARCH_MODE_LIST,
  PRODUCT_SEARCH_MODE_TREE,
  PRODUCT_SEARCH_MODE_MATCH,
  ORDER_MODE_LOCAL_FORMULA,
  AMOUNT_CARD,
  RTL_BOX_LEFT_STYLE,
  MATCH_SEARCH,
  ORDER_MODE_NORMAL,
  ORDER_MODE_MATCHING,
  offline_mode,
} from '../../../Constants';

import { spinner, rightToLeft } from 'js/mylib/Utils';
import ProductList from './ProductList';
import ProductTree from './ProductTree';
import ProductPreview from './ProductPreview';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import SearchInput from '../SearchInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import hoverProductActions from 'js/redux/reducers/HoverProduct';
import _ from 'lodash';

import { detectMobile } from '../../../mylib/Utils';
import {
  CUSTOM_FORMULA_COMPATIBLE,
  CUSTOM_FORMULA_NEW,
  CUSTOM_FORMULA_ORIGINAL,
} from '../../../redux/reducers/Formula';

const filterProductsMemoized = memoizeOne(
  (
    searchString,
    all_products,
    products_having_formula,
    compatible_local_frms,
    order_mode,
    product_search_mode
  ) => {
    const search = searchString.toLowerCase();
    const foundProducts = search
      ? all_products.filter((prod) =>
          prod.productzname.toLowerCase().includes(search)
        )
      : all_products;

    if (order_mode === ORDER_MODE_NORMAL && products_having_formula != null) {
      const productids = new Set(
        products_having_formula.map((p) => p.productid)
      );
      const shouldHaveFormula =
        product_search_mode !== PRODUCT_SEARCH_MODE_MATCH;
      return foundProducts.filter(
        (p) => productids.has(p.productid) === shouldHaveFormula
      );
    }

    if (order_mode === ORDER_MODE_LOCAL_FORMULA) {
      const products = foundProducts.map((p) => ({
        ...p,
        formula: compatible_local_frms.find((x) => x.productid === p.productid),
      }));
      return _.orderBy(
        products,
        ['formula', 'formula.original'],
        ['asc', 'desc']
      );
    }

    return foundProducts;
  }
);

class ProductSearch extends Component {
  constructor(props) {
    super(props);
    this.timer = null;
    this.state = {
      searchString: '',
      selectedProductId: null,
      itemidToHide: null,
    };

    this.searchField = null;
  }

  focusOnSearch = () => {
    if (!this.props.colorNameEdit && this.searchField) {
      this.searchField?.focus();
    }
  };

  searchProduct = (searchString) => {
    this.setState({ searchString });
  };

  filterProducts = () => {
    const { products_having_formula, compatible_local_frms } =
      this.props.formula;
    const { order_mode, product_search_mode } = this.props.order;

    return filterProductsMemoized(
      this.state.searchString,
      this.props.cache.products,
      products_having_formula,
      compatible_local_frms,
      order_mode,
      product_search_mode
    );
  };

  handleKeyPress = (key) => {
    if (this.props.order.open_section !== PRODUCT_SEARCH_CARD) {
      return;
    }
    if (this.props.order.product_search_mode === PRODUCT_SEARCH_MODE_TREE) {
      return; // keyboard actions not supported in tree or image mode
    }

    if (key === 'Esc') {
      // No can size selected.. Do not move!
      if (this.state.selectedProductId == null) {
        return this.props.moveToPrevSection();
      }
      return this.selectProduct(null);
    }

    const filteredProducts = this.filterProducts();
    const position = filteredProducts.findIndex(
      (x) => x.productid === this.state.selectedProductId
    );
    const product = filteredProducts[position];

    if (key === 'Enter') {
      // Special case only one product after filtering --> we pick it
      if (filteredProducts.length === 1) {
        this.submitProduct(filteredProducts[0]);
        return;
      }

      if (product) {
        this.submitProduct(product);
      }
      return;
    }

    // up or down
    const step = key === 'down' ? 1 : -1;
    const new_pos = Math.max(
      0,
      Math.min(filteredProducts.length - 1, position + step)
    );
    const new_product = filteredProducts[new_pos];
    if (new_product) {
      this.selectProduct(new_product);
      const elm = document.getElementById('product_scroll');
      elm.scrollTop = 41 * (new_pos - 1);
    }
  };

  productSearchModeChangeHandler = (mode) => {
    this.props.setProductSearchMode(mode);
  };

  selectProduct = (product) => {
    this.setState({ selectedProductId: product ? product.productid : null });
    this.props.setHoverProduct(product);
  };

  submitProduct = (product) => {
    const { formula, ...prod } = product;
    this.props.setProduct(prod);

    const { order } = this.props;

    // In case of ORDER_MODE/MATCHING call backend for match results
    if (
      order.color &&
      product.productid &&
      order.order_mode === ORDER_MODE_MATCHING
    ) {
      this.props.moveToNextSection();
    } else if (order.color && order.order_mode === ORDER_MODE_LOCAL_FORMULA) {
      // Handling local formula selection at this point
      if (formula) {
        // if (formula.original) {
        // this.props.fetchOrderitem(order.color.itemid, RETINT_TYPE_FORMULA);
        // } else {
        if (formula.original) {
          this.props.setNumberOfCans(1);
        }
        this.props.setFormula(formula);
        this.props.setCustomFormulaMode(
          formula.original ? CUSTOM_FORMULA_ORIGINAL : CUSTOM_FORMULA_COMPATIBLE
        );
        // We have formula so lets skip the editor page
        this.props.setOpenSection(AMOUNT_CARD);
        // }
      } else {
        // Clear base when changing to incompatible product
        this.props.setBase(null);
        this.props.setCustomFormulaMode(CUSTOM_FORMULA_NEW);
        this.props.setOpenSection(AMOUNT_CARD);
        // this.props.setOpenSection(FORMULA_INPUT_CARD);
      }
    } else {
      if (
        order.color &&
        order.prev_section === INFO_CARD &&
        this.props.order.color_search_mode !== MATCH_SEARCH &&
        this.props.order.product_search_mode !== PRODUCT_SEARCH_MODE_MATCH
      ) {
        this.props.setProductAfterConfirmation();
      } else {
        if (order.color && product.productid) {
          this.props.moveToNextSection();
          this.props.loadFormula(order.color.colourid, product.productid);
        }
        if (!order.color && product.productid) {
          this.props.moveToNextSection();
        }
      }
    }
  };

  handleOpenModal = (e, itemid) => {
    e.stopPropagation();
    this.setState({ itemidToHide: itemid });
  };

  handleCloseModal = () => {
    this.setState({ itemidToHide: null });
  };

  handleHideLocalFormula = () => {
    this.props.hideLocalFormula(this.state.itemidToHide);
    this.setState({ itemidToHide: null }, () => {
      this.props.setColor(null);
      this.props.setHoverColor(null);
      this.props.setOpenSection(COLOR_SEARCH_CARD);
    });
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

      if (this.props.cache.fetch_products_error) {
        return {
          maxHeight: 'calc(100vh - 19rem ' + height + ')',
          minHeight: '30vh',
        };
      }
      return {
        maxHeight: 'calc(100vh - 13rem ' + height + ')',
        minHeight: 'calc(100vh - 13rem ' + height + ')',
      };
    } else {
      if (this.props.cache.fetch_products_error) {
        return {
          maxHeight: 'calc(100vh - 6.375rem - 4.5rem - 14vw - 17rem)',
          minHeight: '10rem',
        };
      }
      return {
        maxHeight: 'calc(100vh - 6.375rem - 4.5rem - 14vw - 11rem)',
        minHeight: 'max(17rem, calc(100vh - 6.375rem - 4.5rem - 14vw - 11rem))',
      };
    }
  };

  componentDidMount = () => {
    this.props.keyFunction(PRODUCT_SEARCH_CARD, this.handleKeyPress);
    this.selectProduct(null);

    const { config_values, order } = this.props;
    if (order.order_mode === ORDER_MODE_NORMAL) {
      this.props.fetchProductsWithFormulas(this.props.order.color?.colourid);
    }

    this.props.setProductSearchMode(
      config_values.product_search_table && !config_values.product_search_list
        ? PRODUCT_SEARCH_MODE_TREE
        : PRODUCT_SEARCH_MODE_LIST
    );

    this.timer = setTimeout(this.focusOnSearch, 300);
    if (!this.props.cache.fetch_products_start) {
      this.searchProduct('');
    }
  };

  componentDidUpdate(prevProps) {
    if (
      prevProps.cache.fetch_products_start &&
      !this.props.cache.fetch_products_start
    ) {
      this.searchProduct('');
    }
  }

  getProductSearchClassess = (mode) => {
    if (this.props.order.product_search_mode === mode) {
      return 'btn btn-primary btn-selected  h-3rem';
    } else {
      return 'btn btn-secondary  h-3rem';
    }
  };

  render() {
    const { t, formula, config_values, cache } = this.props;

    const both_search =
      config_values.product_search_list && config_values.product_search_table;
    const nbrButtons =
      this.props.order.order_mode === ORDER_MODE_MATCHING
        ? 0
        : both_search
          ? 2
          : 0;

    const filteredProducts = this.filterProducts();

    return (
      <>
        <Modal centered isOpen={this.state.itemidToHide != null}>
          <ModalHeader>
            {t('lbl.deleteLocalFormula', 'Delete local formula')}
          </ModalHeader>
          <ModalBody>{t('prompt.areYouSure', 'Are you sure ?')}</ModalBody>
          <ModalFooter>
            <Button
              data-testid="btn_ok"
              onClick={(e) => this.handleHideLocalFormula(e)}
              color="primary"
            >
              {t('fn.ok', 'OK')}
            </Button>
            <Button onClick={this.handleCloseModal} color="secondary">
              {t('fn.cancel', 'Cancel')}
            </Button>
          </ModalFooter>
        </Modal>
        <Col>
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
                <InputGroup
                  style={{
                    padding: '0',
                    flexWrap: 'nowrap',
                    marginBottom: '0.5rem',
                  }}
                >
                  <SearchInput
                    id="productSearch"
                    inputRef={(ref) => {
                      this.searchField = ref;
                    }}
                    onChange={(e) => this.searchProduct(e.target.value)}
                    nbrButtons={nbrButtons}
                    debounceTimeout={100}
                    placeholder={t(
                      'prompt.typeProductName',
                      'Type product name'
                    )}
                  />
                  {!detectMobile() && nbrButtons > 0 && (
                    <InputGroupAddon addonType="append">
                      {config_values.product_search_list &&
                        this.props.order.order_mode !== ORDER_MODE_MATCHING && (
                          <button
                            style={{ margin: '0' }}
                            data-testid="productSearchListBtn"
                            onClick={() =>
                              this.productSearchModeChangeHandler(
                                PRODUCT_SEARCH_MODE_LIST
                              )
                            }
                            className={this.getProductSearchClassess(
                              PRODUCT_SEARCH_MODE_LIST
                            )}
                            type="button"
                          >
                            <FontAwesomeIcon icon="list" />
                          </button>
                        )}
                      {config_values.product_search_table &&
                        this.props.order.order_mode !== ORDER_MODE_MATCHING && (
                          <button
                            data-testid="productSearchTableBtn"
                            style={{
                              margin: '0',
                              borderRadius: this.props.order.color
                                ? '0'
                                : rightToLeft()
                                  ? '8px 0 0 8px'
                                  : '0 8px 8px 0',
                            }}
                            onClick={() =>
                              this.productSearchModeChangeHandler(
                                PRODUCT_SEARCH_MODE_TREE
                              )
                            }
                            className={this.getProductSearchClassess(
                              PRODUCT_SEARCH_MODE_TREE
                            )}
                            type="button"
                          >
                            <FontAwesomeIcon icon="indent" />
                          </button>
                        )}
                      {!this.props.moveProductFirst &&
                        !offline_mode &&
                        config_values.color_search_matching && (
                          <button
                            data-testid="productSearchMatchingBtn"
                            style={{
                              margin: '0',
                              borderRadius: rightToLeft()
                                ? '8px 0 0 8px'
                                : '0 8px 8px 0',
                              display:
                                this.props.order.order_mode ===
                                  ORDER_MODE_MATCHING && 'none',
                            }}
                            onClick={() =>
                              this.productSearchModeChangeHandler(
                                PRODUCT_SEARCH_MODE_MATCH
                              )
                            }
                            className={this.getProductSearchClassess(
                              PRODUCT_SEARCH_MODE_MATCH
                            )}
                            type="button"
                            disabled={
                              this.props.order.color &&
                              !this.props.order.color.lab
                            }
                          >
                            <FontAwesomeIcon icon="eye" />
                          </button>
                        )}
                    </InputGroupAddon>
                  )}
                </InputGroup>
                {formula.fetch_products_having_formula_start ||
                formula.compatible_local_fetch_frms_start ||
                cache.fetch_products_start ? (
                  spinner('calc(100vh - 6.375rem - 4.5rem - 14vw - 11rem)')
                ) : this.props.order.product_search_mode ===
                  PRODUCT_SEARCH_MODE_TREE ? (
                  <ProductTree
                    scrollstyle={this.getScrollStyle()}
                    filtered_products={filteredProducts}
                    onSelect={this.submitProduct}
                  />
                ) : (
                  <ProductList
                    scrollstyle={this.getScrollStyle()}
                    data={filteredProducts}
                    selectedId={this.state.selectedProductId}
                    onSelect={this.submitProduct}
                    onTrash={this.handleOpenModal}
                    order_mode={this.props.order.order_mode}
                    product_search_mode={this.props.order.product_search_mode}
                    is_pro={this.props.is_pro}
                  />
                )}
              </Col>
              {/* if mobile then it wont render this*/}
              {!detectMobile() && (
                <Col
                  md="5"
                  style={rightToLeft() ? RTL_BOX_LEFT_STYLE : BOX_LEFT_STYLE}
                >
                  <ProductPreview />
                </Col>
              )}
            </Row>
          </Container>
        </Col>
      </>
    );
  }
}

ProductSearch.propTypes = {
  colorNameEdit: PropTypes.bool,
  order: PropTypes.shape({
    product: PropTypes.object,
    color: PropTypes.object,
    can: PropTypes.object,
    open_section: PropTypes.string.isRequired,
    order_mode: PropTypes.string.isRequired,
    product_search_mode: PropTypes.string.isRequired,
    color_search_mode: PropTypes.string,
    prev_section: PropTypes.string,
  }),
  cache: PropTypes.shape({
    fetch_products_start: PropTypes.bool,
    fetch_products_error: PropTypes.object,
    product_groups: PropTypes.array,
    productmap: PropTypes.object,
    products: PropTypes.array,
  }),
  formula: PropTypes.shape({
    products_having_formula: PropTypes.array,
    compatible_local_frms: PropTypes.array,
    product_search_str: PropTypes.string,
    fetch_products_having_formula_start: PropTypes.bool,
    compatible_local_fetch_frms_start: PropTypes.bool,
  }),
  config_values: PropTypes.object.isRequired,
  setProduct: PropTypes.func.isRequired,
  setBase: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  moveToNextSection: PropTypes.func.isRequired,
  moveToPrevSection: PropTypes.func.isRequired,
  loadFormula: PropTypes.func.isRequired,
  setProductSearchMode: PropTypes.func.isRequired,
  keyFunction: PropTypes.func.isRequired,
  setOpenSection: PropTypes.func.isRequired,
  setFormula: PropTypes.func.isRequired,
  order_mode: PropTypes.string,
  setHoverProduct: PropTypes.func.isRequired,
  moveProductFirst: PropTypes.bool,
  setProductAfterConfirmation: PropTypes.func,
  hideLocalFormula: PropTypes.func,
  setCustomFormulaMode: PropTypes.func.isRequired,
  setColor: PropTypes.func,
  setHoverColor: PropTypes.func,
  setNumberOfCans: PropTypes.func,
  is_pro: PropTypes.bool,
  fetchProductsWithFormulas: PropTypes.func.isRequired,
};

function mapStateToProps(store) {
  return {
    order: store.order,
    cache: store.cache,
    formula: store.formula,
    config_values: store.configurations.config_values,
    is_pro: protectionSelectors.is_pro(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      moveToNextSection: orderActions.moveToNextSection,
      moveToPrevSection: orderActions.moveToPrevSection,
      setProduct: orderActions.setProduct,
      setBase: orderActions.setBase,
      loadFormula: formulaActions.loadFormula,
      fetchProductsWithFormulas: formulaActions.fetchProductsWithFormulas,
      setProductSearchMode: orderActions.setProductSearchMode,
      setHoverProduct: hoverProductActions.setHoverProduct,
      setFormula: orderActions.setFormula,
      setOpenSection: orderActions.setOpenSection,
      setColor: orderActions.setColor,
      setHoverColor: hoverColorActions.setHoverColor,
      setProductAfterConfirmation: orderActions.setProductAfterConfirmation,
      hideLocalFormula: formulaActions.hideLocalFormula,
      setCustomFormulaMode: formulaActions.setCustomFormulaMode,
      setNumberOfCans: orderActions.setNumberOfCans,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(ProductSearch)
);

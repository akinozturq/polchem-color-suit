import React, { Component } from 'react';
import { Card, CardBody, Col, Row, Button, CardHeader } from 'reactstrap';
import {
  AMOUNT_CARD,
  PRODUCT_SEARCH_MODE_MATCH,
  INFO_CARD,
  MATCH_SEARCH,
  ORDER_MODE_LOCAL_FORMULA,
  SOURCE_USER,
  SOURCE_MAIN,
  COLDATACLASS_SPHERE,
  ORDER_MODE_MATCHING,
} from 'js/Constants';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import orderActions, { propType as orderType } from 'js/redux/reducers/Order';
import {
  findObjectByKey,
  CustomScrollbars,
  getCanImage,
  spinner,
} from 'js/mylib/Utils';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import formulaActions from 'js/redux/reducers/Formula';
import { RangeFormatter } from 'polchem_base/common/formatters/NumberFormatter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { selectors as protectionSelectors } from '../../../redux/reducers/Protection';
import CustomModal from './CustomModal';
import { detectMobile, rightToLeft } from '../../../mylib/Utils';

import MatchComponents from '../../matchingpage/MatchComponents';
import { handle_db_name } from '../../../redux/Utils';
import {
  CUSTOM_FORMULA_NEW,
  CUSTOM_FORMULA_ORIGINAL,
} from '../../../redux/reducers/Formula';

class AmountSearch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentHoveredCan: null,
      selectComponents: false,
      custom_modal_open: false,
    };
    this.range_formatter = new RangeFormatter();
    this.cansRef = null;
  }

  componentDidMount() {
    this.props.keyFunction(AMOUNT_CARD, this.handleKeyPress);
  }

  componentDidUpdate(prevProps) {
    if (!this.props.show) {
      return;
    }

    if (this.cansRef && !this.state.custom_modal_open) {
      this.cansRef.focus();
    }

    if (
      prevProps.order.base !== this.props.order.base &&
      this.props.order.base &&
      this.props.order.product &&
      this.props.order.order_mode === ORDER_MODE_LOCAL_FORMULA
    ) {
      // Update also the formula basepaint when local order basepaint is changed
      if (
        this.props.order.formula &&
        this.props.order.base.baseid !== this.props.order.formula.baseid
      ) {
        this.props.setFormula({
          ...this.props.order.formula,
          baseid: this.props.order.base.baseid,
        });
        this.props.setItemEdited(true);

        this.props.setCan(this.props.order.base.cans[0]);
      }
    }
  }

  static getDerivedStateFromProps(props, state) {
    if (props.order.can && !state.currentHoveredCan) {
      return { currentHoveredCan: props.order.can };
    }

    return null;
  }

  /**
   * Move up and down with can size selection
   */

  handleKeyPress = (key) => {
    if (this.state.custom_modal_open) {
      // Do not move to next screen on enter press when modal is open
      return;
    }

    if (key === 'Esc') {
      // No can size selected.. Do not move!
      //if (this.props.order.can === null) {
      return this.props.moveToPrevSection();
      //}
      //return this.props.setCan(null);
    }
    if (key === 'Enter') {
      // No can size selected.. Do not move!
      if (this.props.order.can === null) return;
      const {
        order,
        formula: { color_details, closest_search_colorcard },
        allow_matching,
      } = this.props;
      if (
        order.order_mode === ORDER_MODE_MATCHING ||
        order.product_search_mode === PRODUCT_SEARCH_MODE_MATCH ||
        order.color_search_mode === MATCH_SEARCH
      ) {
        this.props.searchClosest(
          color_details.lab,
          order.product.productid,
          this.props.order.can,
          order.order_mode !== ORDER_MODE_MATCHING
            ? color_details.colourid
            : null,
          color_details.coldataclass,
          color_details.refl || color_details?.reflectance?.rinf,
          closest_search_colorcard?.colourcardid
        );
        if (order.product.has_matching && allow_matching) {
          const refl =
            (order.product_search_mode === PRODUCT_SEARCH_MODE_MATCH ||
              order.color_search_mode === MATCH_SEARCH) &&
            order.order_mode !== ORDER_MODE_MATCHING
              ? color_details.reflectance.rinf
              : color_details.refl;
          if (refl && color_details.coldataclass === COLDATACLASS_SPHERE)
            this.props.matchFormula(
              refl,
              order.product.productid,
              this.props.order.can
            );
        }
      }
      return this.props.moveToNextSection();
    }

    const cans = this.canSizes();

    let rs = { position: -1 };
    let new_pos = null;
    if (this.props.order.can) {
      rs = findObjectByKey(cans, 'cansizeid', this.props.order.can.cansizeid);
    }
    if (key === 'down') {
      new_pos = Math.min(cans.length - 1, rs.position + 1);
    } else {
      new_pos = Math.max(0, rs.position - 1);
    }
    this.setCurrentHoveredCan(cans[new_pos]);
    this.props.setCan(cans[new_pos]);
  };

  //todo: when clicked can size it stays in state so if u go back its highlighted.
  canClicked = (can, baseids = null, template = null, cntids = null) => {
    const {
      order,
      formula: { color_details, closest_search_colorcard, custom_formula_mode },
      allow_matching,
    } = this.props;
    if (
      order.order_mode === ORDER_MODE_MATCHING ||
      order.product_search_mode === PRODUCT_SEARCH_MODE_MATCH ||
      order.color_search_mode === MATCH_SEARCH
    ) {
      this.props.searchClosest(
        color_details.lab,
        order.product.productid,
        can,
        order.order_mode !== ORDER_MODE_MATCHING
          ? color_details.colourid
          : null,
        color_details.coldataclass,
        color_details?.reflectance?.rinf,
        closest_search_colorcard?.colourcardid
      );
      if (order.product.has_matching && allow_matching) {
        const refl = color_details?.reflectance?.rinf;
        if (refl && color_details.coldataclass === COLDATACLASS_SPHERE)
          this.props.matchFormula(
            refl,
            order.product.productid,
            can,
            baseids,
            template,
            cntids
          );
      }
    }

    this.props.setCan(can);

    if (
      order.order_mode === ORDER_MODE_LOCAL_FORMULA &&
      order.item.source === SOURCE_USER &&
      order.formula &&
      custom_formula_mode === CUSTOM_FORMULA_ORIGINAL
    ) {
      // We have formula so ok to move ready section
      this.props.setOpenSection(INFO_CARD);
    } else {
      this.props.moveToNextSection(); // to formula editor
    }
  };

  setCurrentHoveredCan = (can) => {
    this.setState({ currentHoveredCan: can });
  };

  /**
   *  LOAD CAN SIZES
   *
   */

  getCanSizes = () => {
    const { config_values, order, t } = this.props;
    const { base, order_mode } = order;

    let cans = this.canSizes();

    if (!cans.length) {
      return; // no can sizes
    }

    const listItems = cans.map((can) => {
      let selected = this.props.order.can?.cansizeid === can.cansizeid;
      const style = {
        backgroundColor: 'white',
        color: 'black',
        fontWeight: 'bold',
        fontSize: '25px',
      };
      return (
        <li key={can.cansizeid ? can.cansizeid.toString() : 1}>
          <Button
            data-testid={`canid_${can.cansizeid}`}
            onClick={() => this.canClicked(can)}
            style={selected ? style : {}}
            onMouseOver={() => this.setCurrentHoveredCan(can)}
            className="amount-cans"
          >
            {can.cansizecode}
          </Button>
        </li>
      );
    });

    const { enable_custom_cansize } = config_values;

    return (
      <div
        className="pl-3"
        style={{
          height: order_mode === ORDER_MODE_MATCHING ? '35vh' : '45vh',
          width: base && detectMobile() ? 'auto' : '100%',
        }}
      >
        {/* {listItems} */}
        <CustomScrollbars
          style={{
            height: 'calc(100% - 2rem)',
          }}
        >
          <ul
            data-testid="cansizes-list"
            ref={(node) => (this.cansRef = node)}
            //tabIndex={0}
            onMouseLeave={() => this.setCurrentHoveredCan(null)}
            style={{
              listStyle: 'none',
              width: '100%',
              padding: '0',
            }}
          >
            {listItems}
            {enable_custom_cansize && (
              <li>
                <Button
                  data-testid={'custom_cansize_btn'}
                  onClick={() => {
                    this.setState({ custom_modal_open: true });
                  }}
                  className="amount-cans"
                >
                  {t('lbl.customCanSize', 'Custom can size')}
                </Button>
              </li>
            )}
          </ul>
        </CustomScrollbars>
      </div>
    );
  };

  allCanSizes = () => {
    const ids = new Set(
      this.props.order.product?.basepaints?.flatMap((base) =>
        base.cans.map((can) => can.cansizeid)
      )
    );
    return this.props.cache.cansizes.filter((cansize) =>
      ids.has(cansize.cansizeid)
    );
  };

  canSizes = () => {
    const { order } = this.props;
    const { base } = order;
    if (
      order.item.source === SOURCE_MAIN &&
      (!base || order.product_search_mode === PRODUCT_SEARCH_MODE_MATCH)
    ) {
      return this.allCanSizes();
    }
    return base ? base.cans : [];
  };

  getCanImages = () => {
    const {
      t,
      order: { product },
    } = this.props;
    const { currentHoveredCan } = this.state;

    let min_coverage, max_coverage;
    if (product && currentHoveredCan) {
      const amount = currentHoveredCan.nominalamount / 1000;
      if (product.coveragemin) min_coverage = product.coveragemin * amount;
      if (product.coveragemax) max_coverage = product.coveragemax * amount;
    }
    return (
      <Card style={{ height: '100%', borderRadius: '0.5rem' }}>
        <CardHeader
          style={{
            padding: '0.4rem 1.25rem',
            textAlign: rightToLeft() ? 'right' : 'left',
            direction: rightToLeft() ? 'rtl' : 'ltr',
          }}
        >
          {t('lbl.canSizeInfo', 'Can size info')}
        </CardHeader>
        <CardBody className={'amount-card'}>
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                textAlign: 'center',
                fontSize: '1.4rem',
                fontWeight: 'bold',
              }}
            >
              {currentHoveredCan
                ? currentHoveredCan.cansizecode
                : this.props.order.can
                  ? this.props.order.can.cansizecode
                  : ''}
            </p>
            {(currentHoveredCan || this.props.order.can) && (
              <div
                style={{
                  width: '100%',
                  height: 'calc(100% - 5rem)',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <img
                  style={{
                    maxHeight: 'calc(100% - 8rem)',
                    maxWidth: 'calc(100% - 2rem)',
                    position: 'absolute',
                  }}
                  alt="cansize"
                  src={
                    currentHoveredCan?.imageid
                      ? handle_db_name(
                          `/rest/image/${currentHoveredCan.imageid}/data?hash=${currentHoveredCan.image_md5_hash}`
                        )
                      : getCanImage(
                          currentHoveredCan?.nominalamount ||
                            this.props.order?.can?.nominalamount
                        )
                  }
                />
              </div>
            )}
            {/** Paint coverage */}
            {(min_coverage || max_coverage) && (
              <p>
                <FontAwesomeIcon
                  icon="paint-roller"
                  className="mr-4 rotate-45-right"
                />
                {this.range_formatter.format([min_coverage, max_coverage])} m
                <sup>2</sup>
              </p>
            )}
          </div>
        </CardBody>
      </Card>
    );
  };

  render() {
    const { t, formula, order } = this.props;
    const { base, order_mode, product } = order;
    const show_bases =
      order.item.source !== SOURCE_MAIN &&
      (!order.formula || formula.custom_formula_mode === CUSTOM_FORMULA_NEW);

    const style = {
      backgroundColor: 'white',
      color: 'black',
      fontWeight: 'bold',
      fontSize: '25px',
    };

    return (
      <Row style={{ display: this.props.show ? '' : 'none' }}>
        <Col
          xs={
            detectMobile()
              ? 12
              : this.state.selectComponents || formula.alternative_matching
                ? 12
                : 7
          }
        >
          <CustomModal
            isOpen={this.state.custom_modal_open}
            onSubmit={this.canClicked}
            onClose={() => this.setState({ custom_modal_open: false })}
          />
          {this.state.selectComponents || formula.alternative_matching ? (
            <MatchComponents
              canSizes={this.canSizes()}
              canClicked={this.canClicked}
            />
          ) : (
            <Card
              data-cy={'amount_card'}
              //tabIndex="99"
              style={{ backgroundColor: 'transparent' }}
            >
              <CardHeader
                style={{
                  padding: '0.4rem 1.25rem',
                  textAlign: rightToLeft() ? 'right' : 'left',
                  direction: rightToLeft() ? 'rtl' : 'ltr',
                }}
              >
                <Row>
                  {show_bases && <Col>{t('prompt.selectBase')}</Col>}

                  <Col>{t('prompt.selectCanSize')}</Col>
                </Row>
              </CardHeader>

              <CardBody className="amount-card pt-3 height-100">
                <Row style={{ width: '100%' }}>
                  {formula.fetch_frms_start ||
                  formula.color_details_start ||
                  formula.recommended_primer_start ? (
                    <div className="amount-pane">{spinner('5rem')}</div>
                  ) : !show_bases ? (
                    <Col xs={12}>
                      {this.getCanSizes()}
                      {order_mode === ORDER_MODE_MATCHING && (
                        <div
                          className={'text-center mb-3'}
                          onClick={() => {
                            this.setState({ selectComponents: true });
                          }}
                        >
                          <Button color="secondary" className={'w-50'}>
                            {' '}
                            {t('fn.selectComponents', 'Select components')}
                          </Button>
                        </div>
                      )}
                    </Col>
                  ) : (
                    <>
                      <Col xs={6}>
                        <ul
                          data-testid="bases-list"
                          style={{
                            listStyle: 'none',
                            width: '100%',
                            padding: '0',
                          }}
                        >
                          {product?.basepaints?.map((basepaint) => {
                            const isActive =
                              base?.basecode === basepaint.basecode;
                            return (
                              <li key={basepaint.basecode}>
                                <Button
                                  data-testid={'base_' + basepaint.basecode}
                                  onClick={() => {
                                    this.props.setBase(basepaint);
                                  }}
                                  style={isActive ? style : {}}
                                  className="amount-cans"
                                >
                                  {basepaint.basecode}
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      </Col>
                      <Col xs={6}>{base && this.getCanSizes()}</Col>
                    </>
                  )}
                </Row>
              </CardBody>
            </Card>
          )}
        </Col>
        {/*if mobile then it wont render this*/}
        {!detectMobile() &&
          !this.state.selectComponents &&
          !formula.alternative_matching && (
            <Col style={{ display: this.props.show ? '' : 'none' }} xs={5}>
              {this.getCanImages()}
            </Col>
          )}
      </Row>
    );
  }
}

AmountSearch.propTypes = {
  setFormula: PropTypes.func.isRequired,
  setItemEdited: PropTypes.func.isRequired,
  allow_matching: PropTypes.bool,
  setCan: PropTypes.func,
  setBase: PropTypes.func,
  setOpenSection: PropTypes.func,
  t: PropTypes.func,
  order: orderType,
  config_values: PropTypes.shape({
    enable_custom_cansize: PropTypes.bool,
  }),
  formula: PropTypes.shape({
    fetch_frms_start: PropTypes.bool,
    color_details: PropTypes.object,
    color_details_start: PropTypes.bool,
    recommended_primer_start: PropTypes.bool,
    alternative_matching: PropTypes.bool,
    closest_search_colorcard: PropTypes.object,
    custom_formula_mode: PropTypes.string,
  }),

  cache: PropTypes.shape({
    cansizes: PropTypes.array,
  }),

  keyFunction: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  moveToNextSection: PropTypes.func.isRequired,
  moveToPrevSection: PropTypes.func.isRequired,
  matchFormula: PropTypes.func,
  searchClosest: PropTypes.func,
};

function mapStateToProps(store) {
  return {
    order: store.order,
    cache: store.cache,
    config_values: store.configurations.config_values,
    formula: store.formula,
    allow_matching: protectionSelectors.allow_matching(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setCan: orderActions.setCan,
      setBase: orderActions.setBase,
      setOpenSection: orderActions.setOpenSection,

      moveToNextSection: orderActions.moveToNextSection,
      moveToPrevSection: orderActions.moveToPrevSection,
      matchFormula: formulaActions.matchFormula,
      searchClosest: formulaActions.searchClosest,
      setFormula: orderActions.setFormula,

      setItemEdited: orderActions.setItemEdited,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(AmountSearch)
);

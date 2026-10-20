import React from 'react';
import _ from 'lodash';
import {
  Button,
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
} from 'reactstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withTranslation } from 'react-i18next';
import { intToR_G_B, RGBColorToHex } from 'js/mylib/Utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import orderActions, {
  propType as orderType,
} from '../../redux/reducers/Order';
import formulaActions, {
  propType as formulaType,
} from '../../redux/reducers/Formula';
import { makeFormatters } from '../../redux/selectors/EIValues';
import { selectors as protectionSelectors } from '../../redux/reducers/Protection';
import { ORDER_MODE_MATCHING, SOURCE_MAIN, SOURCE_USER } from '../../Constants';
import { dateTimeToLocaleString } from '../../mylib/DateUtils';

import { customControlStyles, rightToLeft, sortFormula } from '../../mylib/Utils';
import { push } from 'connected-react-router';
import FormulaCard from './FormulaCard';
import Select from 'react-select';
import ColorThumbnail from '../shared/ColorThumbnail';

function formatErrorMessage(error) {
  let message;
  if (error.response.data) {
    const { data } = error.response;
    message = data.error || data.message || data.msg;
  }
  return message || error.message || error.toString();
}

const propTypes = {
  t: PropTypes.func.isRequired,
  setOrderitemSource: PropTypes.func.isRequired,
  setOriginalFormula: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  allow_matching: PropTypes.bool.isRequired,
  is_pro: PropTypes.bool.isRequired,
  cache: PropTypes.shape({
    cards: PropTypes.array,
  }),
  order: orderType,
  configurations: PropTypes.object,
  formula: formulaType,
  setFormula: PropTypes.func,
  setBase: PropTypes.func,
  setCan: PropTypes.func,
  setColor: PropTypes.func,
  moveToNextSection: PropTypes.func,
  alternativeMatching: PropTypes.func,
  setClosestSearchColorCard: PropTypes.func,
  searchClosest: PropTypes.func,
  restoreOrderState: PropTypes.func.isRequired,
  push: PropTypes.func,
};

const defaultProps = {};
/**
 * This will keep a track of formulas recieved from the backend
 *
 */
const MATCHING = 1;
// const HARMONIES = 2;
const CLOSESTCOLOR = 3;
const ORIGINAL_FORMULA = 4;

class MatchingResults extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      viewFormulas: this.props.formula.alternative_matching
        ? MATCHING
        : CLOSESTCOLOR,
      isFlipped: false,
      showClosestColorCard: false,
      currentClosestColorSection: 0,
      currentMatchingColorSection: 0,
      selectedColor: {},
      showCansizeNotFoundModal: false,
      dotSection: 0,
      previousFormulaResults: null,
    };
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.formula.search_closest_rs !==
        this.props.formula.search_closest_rs &&
      this.props.formula.search_closest_rs?.matches?.length === 0 &&
      this.state.viewFormulas === CLOSESTCOLOR &&
      !_.isEqual(
        this.state.previousFormulaResults,
        this.props.formula.match_result
      )
    ) {
      this.setState({
        previousFormulaResults: this.props.formula.match_result,
      });
      this.setView(MATCHING);
    }
  }

  nextMatchingColorSectionHandler = (e) => {
    e.stopPropagation();
    this.setState((prevState) => ({
      currentMatchingColorSection: prevState.currentMatchingColorSection + 1,
    }));
  };

  previousMatchingColorSectionHandler = (e) => {
    e.stopPropagation();
    this.setState((prevState) => ({
      currentMatchingColorSection: prevState.currentMatchingColorSection - 1,
    }));
  };

  nextClosestColorSectionHandler = (e) => {
    e.stopPropagation();
    this.setState((prevState) => ({
      currentClosestColorSection: prevState.currentClosestColorSection + 1,
    }));
  };

  previousClosestColorSectionHandler = (e) => {
    e.stopPropagation();
    this.setState((prevState) => ({
      currentClosestColorSection: prevState.currentClosestColorSection - 1,
    }));
  };

  selectColorCardHandler = (color) => {
    this.setState({
      selectedColor: color,
    });
  };

  chooseColorHandler = () => {
    const { formula } = this.props;
    const { selectedColor } = this.state;
    const { colourid, colourcode, rgb, lab, xyz, colournames, match_result } =
      selectedColor;

    let auto_code = '';

    let frm = null;

    if (match_result) {
      // Auto generate code
      auto_code += 'Match ' + dateTimeToLocaleString(new Date());
      // Pick the formula from redux store formula.match_rs.matches
      frm = formula.match_rs.matches[selectedColor.index].formula;
      this.props.setOrderitemSource(SOURCE_USER);
    } else {
      // Pick the formula from redux store formula.search_closest_rs.matches
      frm = formula.search_closest_rs.matches.find(
        (match) => match.colourid === colourid
      ).formula;
      this.props.setOrderitemSource(SOURCE_MAIN);
    }

    const { order } = this.props;
    if (order.product && selectedColor) {
      const productBasepaint = order.product.basepaints.find(
        (paint) => paint.baseid === frm.baseid
      );
      if (productBasepaint) {
        let can;

        if (order.can.cansizeid == null) {
          const { specificgravity, nominalfill } = productBasepaint;
          const { nominalamount, gravimetric } = order.can;
          const basevolume = gravimetric
            ? (nominalamount * nominalfill) / specificgravity
            : nominalamount * nominalfill;
          can = {
            ...order.can,
            baseid: frm.baseid,
            basevolume,
          };
        } else {
          can = productBasepaint.cans.find(
            (can) => can.cansizeid === order.can.cansizeid
          );
        }
        if (can) {
          this.props.setColor(
            {
              colourid: colourid || order.color.colourid || null,
              colourcode: colourcode || order.color.colourcode || auto_code,
              colournames: colournames,
              rgb,
              lab,
              xyz,
              reflectance: formula?.color_details?.reflectance,
            },
            undefined,
            undefined,
            match_result
          );
          this.props.setFormula(frm, true);
          this.props.setCan(can);
          this.props.moveToNextSection();
          return;
        }
      }
    }
    this.setState({
      showCansizeNotFoundModal: true,
    });
  };

  toggleModal = () => {
    this.setState({
      showCansizeNotFoundModal: false,
    });
  };

  handleDotSection = (section) => {
    this.setState({
      dotSection: section,
    });
  };

  setView = (viewFormulas) => {
    this.setState({
      viewFormulas: viewFormulas,
    });
  };

  getMatching = () => {
    // This should contain the matching results
    const { order, configurations, formula, cache, t } = this.props;

    const { match_rs_start, match_rs, match_rs_error } = formula;

    const listItems = match_rs?.matches?.map((match, idx) => (
      <FormulaCard
        key={idx}
        id_prefix="matching"
        active={_.isEqual(this.state.selectedColor, match)}
        cache={cache}
        configurations={configurations}
        selectColorHandler={() =>
          this.selectColorCardHandler({
            ...match,
            match_result: true,
            index: idx,
          })
        }
        chooseColorHandler={this.chooseColorHandler}
        data={{
          ...match,
          can: order?.can,
          base: order?.product?.basepaints?.find(
            (paint) => paint.baseid === match.formula.baseid
          ),
          product: order?.product,
        }}
        nextSectionHandler={this.nextMatchingColorSectionHandler}
        previousSectionHandler={this.previousMatchingColorSectionHandler}
        currentSection={this.state.currentMatchingColorSection}
        item={idx}
        std={match_rs.std}
        show_cost={!!configurations?.config_values?.color_match_show_prices}
      />
    ));

    return (
      <div className="scroll height-100">
        {match_rs_start ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <FontAwesomeIcon
              icon="spinner"
              style={{ color: 'white', fontSize: '10rem' }}
              spin
            />
          </div>
        ) : !order?.product?.has_matching ? (
          <p style={{ textAlign: 'center', fontSize: '2rem' }}>
            {t(
              'lbl.matchingNotAvailable',
              'Matching not available for selected product'
            )}
          </p>
        ) : match_rs_error ? (
          <p style={{ textAlign: 'center', fontSize: '1rem' }}>
            {t('lbl.error', 'Error')}: {formatErrorMessage(match_rs_error)}
          </p>
        ) : listItems && listItems.length > 0 ? (
          <div className="result_container">{listItems}</div>
        ) : (
          <p style={{ textAlign: 'center', fontSize: '2rem' }}>
            {t('lbl.no_results', 'No results')}
          </p>
        )}
      </div>
    );
  };
  // payload.response.data.error
  getClosest = () => {
    const { formula, order, configurations, cache, t } = this.props;
    const { search_closest_rs, search_closest_rs_start } = formula;

    const listItems = search_closest_rs?.matches?.map((closest_rs, index) => (
      <FormulaCard
        key={index}
        id_prefix="closest"
        active={_.isEqual(this.state.selectedColor, closest_rs)}
        cache={cache}
        configurations={configurations}
        selectColorHandler={() =>
          this.selectColorCardHandler({ ...closest_rs, match_result: false })
        }
        chooseColorHandler={this.chooseColorHandler}
        colourcode={closest_rs.colourcode}
        colournames={closest_rs.colournames}
        data={{
          ...closest_rs,
          can: order?.can,
          base: order?.product?.basepaints?.find(
            (paint) => paint.baseid === closest_rs.formula.baseid
          ),
          product: order?.product,
        }}
        nextSectionHandler={this.nextClosestColorSectionHandler}
        previousSectionHandler={this.previousClosestColorSectionHandler}
        currentSection={this.state.currentClosestColorSection}
        item={index}
        std={search_closest_rs.std}
        show_cost={!!configurations?.config_values?.closest_color_show_prices}
      />
    ));
    return (
      <div className="scroll height-100">
        {search_closest_rs_start ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <FontAwesomeIcon
              icon="spinner"
              style={{ color: 'white', fontSize: '10rem' }}
              spin
            />
          </div>
        ) : listItems && listItems.length > 0 ? (
          <div className="result_container">{listItems}</div>
        ) : (
          <p
            style={{ textAlign: 'center', fontSize: '2rem' }}
            data-cy={'no_results'}
          >
            {t('lbl.no_results', 'No results')}
          </p>
        )}
      </div>
    );
  };

  searchClosestColorsInCard = (value) => {
    const { setClosestSearchColorCard, order, searchClosest, formula } =
      this.props;

    setClosestSearchColorCard({
      cardname: value?.label,
      colourcardid: value?.value,
    });

    searchClosest(
      formula.color_details.lab,
      order.product.productid,
      order.can,
      order.order_mode !== ORDER_MODE_MATCHING
        ? formula.color_details.colourid
        : null,
      formula.color_details.coldataclass,
      formula.color_details?.reflectance?.rinf,
      value?.value
    );
  };

  getStandard = () => {
    const { t, order, formula, cache, configurations } = this.props;
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';
    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction,
    };
    const color = order.color;
    if (color === null) return;

    const possible_cards = configurations?.config_values
      ?.closest_color_preferred_cards_only
      ? cache.cards.filter((c) => c.preferred)
      : cache.cards;
    return (
      <>
        <Modal
          centered
          isOpen={this.state.showCansizeNotFoundModal}
          toggle={this.toggleModal}
          dir={direction}
        >
          <ModalHeader>
            {t('msg.canSizeUnavailable.title', 'Can size not found')}
          </ModalHeader>
          <ModalBody>
            <p>
              {t(
                'msg.canSizeUnavailable',
                'Can size is not available for this product and base paint. Please select different can size or base paint'
              )}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button onClick={this.toggleModal}>Cancel</Button>
          </ModalFooter>
        </Modal>
        <div
          style={{
            backgroundColor: '#112E40',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            borderRadius: '10px',
            height: '100%',
            ...alignStyle,
          }}
        >
          <p
            style={{
              backgroundColor: '#15374D',
              borderRadius: '10px 10px 0 0',
              padding: '8px',
              minHeight: '3.5rem',
              marginTop: '-2px',
              marginBottom: '0.3rem',
              ...alignStyle,
            }}
          >
            {color && color.colournames && color.colournames.length > 0
              ? color.colournames.map((name, i) => (
                  <span key={name + i}>{name}</span>
                ))
              : color && color.colourcode}
          </p>
          <Row>
            <Col>{t('lbl.colorcard', 'Color card')}</Col>
          </Row>
          <Row className={'mb-2'}>
            <Col className={'pl-1 pr-1'}>
              <Select
                id={'closest_search_colorcard'}
                menuPlacement="auto"
                isRtl={isRtl}
                styles={{
                  control:
                    customControlStyles &
                    { width: '200px', padding: '0.875rem' },
                  singleValue: (styles) => ({
                    ...styles,
                    fontSize: '0.875rem',
                    padding: '2px',
                  }),
                  clearIndicator: (styles) => ({
                    ...styles,
                    padding: '3px',
                  }),
                  dropdownIndicator: (styles) => ({
                    ...styles,
                    padding: '3px',
                  }),
                  option: (base) => ({
                    ...base,
                    color: 'black',
                  }),
                }}
                isSearchable={false}
                isClearable={true}
                options={possible_cards.map((card) => ({
                  label: card.cardname,
                  value: card.colourcardid,
                }))}
                onChange={(value, actionMeta) => {
                  if (actionMeta.action === 'clear') {
                    // Manually close the menu when clear action is triggered
                    document.activeElement.blur();
                  }
                  this.searchClosestColorsInCard(value);
                }}
                value={{
                  label: formula.closest_search_colorcard?.cardname,
                  value: formula.closest_search_colorcard?.colourcardid,
                }}
                defaultValue={{
                  label: formula.closest_search_colorcard?.cardname,
                  value: formula.closest_search_colorcard?.colourcardid,
                }}
              />
            </Col>
          </Row>
          {this.state.dotSection === 1 ? (
            <div style={{ height: '74%' }}>
              <Row className="matching-row">
                <Col className="matching-col" xs={3}>
                  RGB
                </Col>
                <Col className="matching-col">
                  {intToR_G_B(color.rgb)
                    .map((x) => String(x.toFixed(0)))
                    .join(', ')}
                </Col>
              </Row>
              {/** HTML */}
              <Row className="matching-row">
                <Col className="matching-col" xs={3}>
                  HTML
                </Col>
                <Col className="matching-col">{RGBColorToHex(color.rgb)}</Col>
              </Row>
              {/** LAB */}
              <Row className="matching-row">
                <Col className="matching-col" xs={3}>
                  LAB
                </Col>
                <Col className="matching-col">
                  {color.lab &&
                    color.lab.map((x) => String(x.toFixed(2))).join(', ')}
                </Col>
              </Row>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: color ? RGBColorToHex(color.rgb) : 'white',
                height: '74%',
              }}
            />
          )}
          <div>
            <span
              onClick={() => this.handleDotSection(0)}
              style={{
                padding: '1px 10px 1px 10px',
                marginRight: '5px',
                cursor: 'pointer',
                borderRadius: '50%',
                backgroundColor:
                  this.state.dotSection === 0 ? '#308DC7' : 'white',
              }}
            />
            <span
              onClick={() => this.handleDotSection(1)}
              style={{
                padding: '1px 10px 1px 10px',
                marginRight: '5px',
                cursor: 'pointer',
                borderRadius: '50%',
                backgroundColor:
                  this.state.dotSection === 1 ? '#308DC7' : 'white',
              }}
            />
          </div>
        </div>
      </>
    );
  };

  getOriginalFormula = () => {
    const { order, configurations, t } = this.props;

    const formatters = makeFormatters(configurations);
    const currency_formatter = formatters?.EI_TYPE_CURRENCY?.default;

    const getRow = (cnt, index) => {
      const originalColorant = originalFormula[index];
      const originalAmount = configurations.shotFormatter.format({
        volume: originalColorant.originalvolume,
        specificgravity: originalColorant.specificgravity,
      });

      return (
        <>
          <Col xs={6}>
            <div className="matching-colorant-row">
              <ColorThumbnail hideIfNull rgb={cnt.rgb} size="1rem" />
              <span>
                {cnt.cntcode}
                {' - '}
                {originalAmount}
              </span>
            </div>
          </Col>
        </>
      );
    };

    const originalFormula = order?.saved_state?.item?.cnts;
    const originalBasePaint = order?.saved_state?.product?.basepaints?.find(
      (basepaint) => basepaint.baseid === order?.saved_state?.formula?.baseid
    );

    return (
      originalFormula && (
        <div
          style={{
            height: 'calc(100vh - 6.375rem - 4.5rem - 14vw - 8.5rem)',
          }}
        >
          <Row>
            <Col>
              <div className="card__infos">
                <Row>
                  <Col xs={6}>{originalBasePaint?.basecode}</Col>
                  <Col xs={6}>
                    {' '}
                    {order.can?.basevolume} {' ml'}{' '}
                  </Col>
                </Row>

                {order.formula &&
                  sortFormula(this.props.configurations, originalFormula).map(
                    (cnt, index) => (
                      <Row
                        className="pt-1"
                        key={index}
                        data-testid={ORIGINAL_FORMULA + '_frm' + index}
                      >
                        {getRow(cnt, index)}
                      </Row>
                    )
                  )}

                <Row className="pt-3">
                  <Col xs={6}>{t('extraInfo.cost')}</Col>
                  <Col xs={6}>
                    {currency_formatter
                      ? currency_formatter.format(
                          order.saved_state.item.price.excTaxCan.cost
                        )
                      : order.saved_state.item.price.excTaxCan.cost}
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          <Button
            data-testid="fn.back_to_original"
            className={'w-50 float-right'}
            style={{ position: 'absolute', bottom: '1rem' }}
            onClick={this.handleOriginalFormula}
          >
            {t('lbl.back_to_original_formula', 'Back to original formula')}
          </Button>
        </div>
      )
    );
  };

  handleOriginalFormula = () => {
    this.props.alternativeMatching(false);
    this.props.push('/orderpage');
    this.props.restoreOrderState();
  };

  render() {
    const { t, formula, allow_matching, show } = this.props;
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';

    const { search_closest_rs, match_rs } = formula;
    if (!show) {
      return null;
    }
    return (
      <div className="matching-results" dir={direction}>
        <Row
          style={{
            color: 'white',
            textAlign: 'center',
            height: 'calc(100vh - 12.875rem - min(250px, max(14vw, 22vh)))',
            minHeight: '24rem',
          }}
        >
          <Col md="3">{this.getStandard()}</Col>
          <Col md="9">
            <div
              style={{
                backgroundColor: '#112E40',
                borderRadius: '10px',
                height: '100%',
              }}
            >
              <Nav className="tab-header tab-header-small" tabs>
                <NavItem className="tab-item tab-item-small">
                  <NavLink
                    data-testid="closest_color"
                    className="tab-link tab-link-small"
                    active={this.state.viewFormulas === CLOSESTCOLOR}
                    onClick={() => this.setView(CLOSESTCOLOR)}
                  >
                    {t('lbl.closestColor', 'Closest color')} (
                    {search_closest_rs?.matches.length || 0})
                  </NavLink>
                </NavItem>

                {allow_matching && this.props.is_pro && (
                  <NavItem className="tab-item tab-item-small">
                    <NavLink
                      data-testid="matching"
                      className="tab-link tab-link-small"
                      active={this.state.viewFormulas === MATCHING}
                      onClick={() => this.setView(MATCHING)}
                    >
                      {t('fn.colorMatching', 'Color matching')}
                      {match_rs?.matches ? `(${match_rs.matches.length})` : ''}
                    </NavLink>
                  </NavItem>
                )}
                {this.props.formula.alternative_matching && (
                  <NavItem className="tab-item tab-item-small">
                    <NavLink
                      data-testid="matching_original_formula"
                      className="tab-link tab-link-small"
                      active={this.state.viewFormulas === ORIGINAL_FORMULA}
                      onClick={() => this.setView(ORIGINAL_FORMULA)}
                    >
                      {t('lbl.originalFormula', 'Original Formula')}
                    </NavLink>
                  </NavItem>
                )}
              </Nav>

              {/**
               * If pro then also change the tab
               */}
              <TabContent
                activeTab={
                  this.props.is_pro ? this.state.viewFormulas : CLOSESTCOLOR
                }
                style={{
                  maxHeight: 'calc(100% - 4rem)',
                  height: 'calc(100% - 4rem)',
                }}
              >
                {this.props.is_pro && (
                  <TabPane tabId={MATCHING} className="height-100">
                    {this.getMatching()}
                  </TabPane>
                )}
                <TabPane tabId={CLOSESTCOLOR} className="height-100">
                  {this.getClosest()}
                </TabPane>
                {this.props.is_pro && (
                  <TabPane tabId={ORIGINAL_FORMULA} className="height-100">
                    {this.getOriginalFormula()}
                  </TabPane>
                )}
              </TabContent>
            </div>
          </Col>
        </Row>
      </div>
    );
  }
}

MatchingResults.propTypes = propTypes;
MatchingResults.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    order: store.order,
    formula: store.formula,
    cache: store.cache,
    configurations: store.configurations,
    allow_matching: protectionSelectors.allow_matching(store),
    is_pro: protectionSelectors.is_pro(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setFormula: orderActions.setFormula,
      setBase: orderActions.setBase,
      setColor: orderActions.setColor,
      setOrderitemSource: orderActions.setOrderitemSource,
      setCan: orderActions.setCan,
      moveToNextSection: orderActions.moveToNextSection,
      setOriginalFormula: orderActions.setOriginalFormula,
      alternativeMatching: formulaActions.alternativeMatching,
      setClosestSearchColorCard: formulaActions.setClosestSearchColorCard,
      restoreOrderState: orderActions.restoreState,
      searchClosest: formulaActions.searchClosest,
      push: push,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MatchingResults)
);

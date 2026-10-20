import React, { Component } from 'react';
import { RGBColorToHex } from 'js/mylib/Utils';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

import { Card, Row, Col, CardHeader } from 'reactstrap';
import ColorThumbnail from '../ColorThumbnail';
import _ from 'lodash';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ORDER_MODE_LOCAL_FORMULA } from '../../../Constants';
import { rightToLeft } from '../../../mylib/Utils';
import { dateTimeToLocaleString } from '../../../mylib/DateUtils';
import { selectors as cacheSelectors } from '../../../redux/reducers/Cache';

export class PreviewBox extends Component {
  render() {
    const hex =
      this.props.color !== null && this.props.color !== undefined
        ? RGBColorToHex(this.props.color)
        : null;
    const isRtl = rightToLeft();

    const squareStyle = {
      borderRadius: '.5rem',
      backgroundColor: hex,
      height: this.props.height ? this.props.height : '16.5vh',
      width: '100%',
      marginTop: '.1875rem',
    };

    return (
      hex !== null && (
        <div
          data-testid="colorPreview"
          className={
            (isRtl ? 'float-right ' : 'float-left ') +
            (this.props.ignoreBoxShadow ? '' : 'bordered  box-shadow ') +
            (hex === null ? ' color-preview-no-rgb' : '')
          }
          style={squareStyle}
        >
          {!hex && (
            <FontAwesomeIcon
              icon="eye-slash"
              color="white"
              className="color-preview-na"
            />
          )}
        </div>
      )
    );
  }
}

PreviewBox.propTypes = {
  color: PropTypes.number,
  height: PropTypes.string,
  ignoreBoxShadow: PropTypes.bool,
};

class ColorPreview extends Component {
  mapToList = (itm) => {
    if (!itm) {
      return '';
    }

    if (Array.isArray(itm)) {
      //return itm.join(', ');
      return itm.map((name) => (
        <li key={name}>
          <b>{name}</b>
        </li>
      ));
    } else {
      return itm;
    }
  };

  getFormula = (cnts) => {
    const isRtl = rightToLeft();
    // NOTE: for blended bases does not get sg from product, but this is only a preview
    const cntmap = this.props.cntmap;
    const data = cnts.map(({ cntcode, cntid, volume }) => ({
      cntcode,
      ...cntmap.get(cntid),
      volume,
    }));

    const size = '1.5rem';
    const sf = this.props.config.shotFormatter;
    return data.map((c) => (
      <Row
        key={c.cntcode}
        className="p-1"
        data-testid={'cnt-' + c.cntcode}
        style={{
          flexDirection: isRtl ? 'row-reverse' : 'row',
          textAlign: isRtl ? 'right' : 'left',
        }}
      >
        <Col xs={1} className="p-0">
          <ColorThumbnail rgb={c.rgb} size={size} />
        </Col>
        <Col xs={6}> {c.cntcode}</Col>
        <Col className="p-0">{sf.getString(c.volume)} </Col>
      </Row>
    ));
  };

  getScrollStyle = () => {
    if (
      this.props.formula.local_fetch_frms_error ||
      this.props.formula.fetch_frms_error
    ) {
      return {
        height: 'calc(100vh - 6.375rem - 4.5rem - 14vw - 17rem)',
        minHeight: '10rem',
      };
    }
    return {
      height: 'calc(100vh - 6.375rem - 4.5rem - 14vw - 11rem)',
      minHeight: '15rem',
    };
  };

  render() {
    const { t, hover, order, formula } = this.props;
    const isRtl = rightToLeft();
    const alignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction: isRtl ? 'rtl' : 'ltr',
    };
    let color = (hover.color ? hover.color : order.color) || {};

    if (formula.local_frms && color.itemid) {
      const fn = _.find(formula.local_frms, ['itemid', color.itemid]) || {};
      color = { ...color, ...fn };
    }

    // DEBUG: let colorNames = ['Colorname 123', 'Colorname 123', 'Colorname 123'];
    return (
      <Card style={alignStyle} dir={alignStyle.direction}>
        <div className="card-img-overlay">
          <CardHeader
            style={{ backgroundColor: '#15374D', ...alignStyle }}
          >
            {t('lbl.colorDetails', 'Color details')}
          </CardHeader>

          <Row
            style={{
              padding: '0.5rem 0 0 0',
              flexDirection: 'column',
              ...alignStyle,
            }}
          >
            <Col
              xs={12}
              style={{
                padding: '0 1rem 0 1rem',
                ...alignStyle,
              }}
            >
              <>
                <Row>
                  <Col xs={7} className="p-0 ">
                    <div>
                      <Row>
                        <Col>
                          <b>{color.colourcode}</b>
                        </Col>
                      </Row>
                      {color.colourcode && (
                        <div>
                          <Row>
                            <Col>{t('lbl.names', 'Names')}:</Col>
                          </Row>
                          <Row>
                            <Col>
                              <ul
                                style={{
                                  listStyle: 'none',
                                  paddingLeft: isRtl ? 0 : '1rem',
                                  paddingRight: isRtl ? '1rem' : 0,
                                  fontWeight: 'bold',
                                }}
                              >
                                {this.mapToList(
                                  order.order_mode === ORDER_MODE_LOCAL_FORMULA
                                    ? color.colourname
                                    : color.colournames
                                )}
                              </ul>
                            </Col>
                          </Row>
                          <Row>
                            <Col>{t('lbl.colorcards', 'Color cards')}:</Col>
                          </Row>
                          <Row>
                            <Col>
                              <ul
                                data-testid="color_details_cards"
                                style={{
                                  listStyle: 'none',
                                  paddingLeft: isRtl ? 0 : '1rem',
                                  paddingRight: isRtl ? '1rem' : 0,
                                  fontWeight: 'bold',
                                }}
                              >
                                {this.mapToList(this.props.card_names)}
                              </ul>
                            </Col>
                          </Row>
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col xs={5} className="p-0">
                    <PreviewBox color={color.rgb} />
                  </Col>
                </Row>
              </>
            </Col>
            {color.cntinitem && (
              <Col
                xs={12}
                style={{
                  padding: '0 1rem 0 1rem',
                  backgroundColor: '#15374D',
                  margin: '0.65rem 0 0.65rem 0',
                  ...alignStyle,
                }}
              >
                {t('lbl.formula', 'Formula')}:
              </Col>
            )}

            <Col xs={12} style={{ padding: '0 1rem 0 1rem', ...alignStyle }}>
              <Row>
                <Col
                  xs={7}
                  className="pl-2"
                  style={{
                    fontWeight: 'bold',
                    paddingLeft: isRtl ? 0 : undefined,
                    paddingRight: isRtl ? '0.5rem' : undefined,
                  }}
                >
                  {color.productname && (
                    <Row>
                      <Col>{color.productname}</Col>
                    </Row>
                  )}
                  {color.basecode && (
                    <Row>
                      <Col>{color.basecode}</Col>
                    </Row>
                  )}
                  {color.cansizecode && (
                    <Row>
                      <Col>{color.cansizecode}</Col>
                    </Row>
                  )}
                </Col>
                <Col xs={5} className="p-0">
                  {color.cntinitem && (
                    <Row>
                      <Col>{this.getFormula(color.cntinitem)}</Col>
                    </Row>
                  )}
                </Col>
              </Row>
            </Col>

            {color.orderdate && (
              <Col
                xs={12}
                style={{
                  padding: '0 0.5rem 0 1rem',
                  backgroundColor: '#15374D',
                  margin: '0.65rem 0 0.65rem 0',
                  ...alignStyle,
                }}
              >
                <Row>
                  <Col xs={7} className="p-0">
                    {t('lbl.orderdate', 'Order date')}:
                  </Col>

                  <Col xs={5} className="p-0">
                    {dateTimeToLocaleString(color.orderdate)}
                  </Col>
                </Row>
              </Col>
            )}
          </Row>
        </div>
      </Card>
    );
  }
}

ColorPreview.propTypes = {
  t: PropTypes.func.isRequired,
  hover: PropTypes.shape({
    color: PropTypes.shape({
      rgb: PropTypes.number,
      colournames: PropTypes.array,
      colourcardids: PropTypes.array,
    }),
  }).isRequired,
  card_names: PropTypes.array,
  order: PropTypes.object,
  config: PropTypes.shape({
    shotFormatter: PropTypes.object,
  }),
  cntmap: PropTypes.object,
  formula: PropTypes.shape({
    local_fetch_frms_error: PropTypes.object,
    fetch_frms_error: PropTypes.object,
    local_frms: PropTypes.arrayOf(
      PropTypes.shape({
        itemid: PropTypes.number.isRequired,
      })
    ),
  }),
};

function mapStateToProps(store) {
  return {
    cntmap: store.cache.cntmap,
    formula: store.formula,
    config: store.configurations,
    order: store.order,
    hover: store.hover_color,
    card_names: (store.hover_color.color?.colourcardids || []).map(
      (x) => cacheSelectors.getCard(store, x)?.cardname
    ),
  };
}

export default withTranslation('translations')(
  connect(mapStateToProps)(ColorPreview)
);

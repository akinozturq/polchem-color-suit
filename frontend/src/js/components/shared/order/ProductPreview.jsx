import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { selectors as configSelectors } from 'js/redux/reducers/Configuration';
import _ from 'lodash';
import { Card, CardHeader, Col, Row } from 'reactstrap';
import { handle_db_name } from '../../../redux/Utils';

class ProductPreview extends Component {
  render() {
    const { t, config, order, hover, products_having_formula } = this.props;
    const product = hover.product ? hover.product : order.product;
    const product_with_formula = products_having_formula?.find(
      (item) => item.productid === product?.productid
    );
    const prodimageid = product ? product.prodimageid : null;
    const infoimageid = product ? product.infoimageid : null;
    const prodimage_md5_hash = product ? product.prodimage_md5_hash : null;
    const infoimage_md5_hash = product ? product.infoimage_md5_hash : null;

    const image_position = _.get(config, 'info_image_position.value', 'PBR');
    const image_size = _.get(config, 'info_image_size.value', '30%');
    const margin = _.get(config, 'info_image_margin.value', '0');

    const small_img_src =
      prodimageid && infoimageid
        ? image_position[0] === 'P' || image_position === 'ISR'
          ? { piid: prodimageid, hash: prodimage_md5_hash }
          : { piid: infoimageid, hash: infoimage_md5_hash }
        : null;

    const big_img_src =
      prodimageid && infoimageid
        ? image_position[0] === 'I' && image_position !== 'ISR'
          ? { piid: prodimageid, hash: prodimage_md5_hash }
          : { piid: infoimageid, hash: infoimage_md5_hash }
        : prodimageid
          ? { piid: prodimageid, hash: prodimage_md5_hash }
          : infoimageid
            ? { piid: infoimageid, hash: infoimage_md5_hash }
            : null;

    const small_style = {
      position: 'absolute',
      top: image_position[1] === 'T' ? 0 : null,
      bottom: image_position[1] === 'B' ? 0 : null,
      right: image_position[2] === 'R' ? 0 : null,
      left: image_position[2] === 'L' ? 0 : null,
      margin: margin,
      width: image_size,
      maxHeight: 'calc(100% - ' + margin + ' - ' + margin + ')',
      maxWidth: 'calc(100% - ' + margin + ' - ' + margin + ')',
    };

    const big_style = {
      height: 'calc(100vh - 6.375rem - 4.5rem - 14vw - 11rem)',
    };

    return (
      <Card>
        <div className="br-8 product-preview" style={{ height: '100%' }}>
          <CardHeader style={{ backgroundColor: '#15374D' }}>
            <Row>
              <Col xs={8}>
                {product ? product.productzname : t('lbl.product')}
              </Col>
              {product_with_formula?.basecode && (
                <Col
                  xs={4}
                  className="text-right"
                  data-testid="product-basecode"
                >
                  {product_with_formula.basecode}
                </Col>
              )}
            </Row>
          </CardHeader>
          <div style={{ justifyContent: 'center', display: 'flex' }}>
            <div
              style={{
                position: 'relative',
                margin: '1rem',
              }}
            >
              {image_position !== 'ISL' && image_position !== 'ISR' ? (
                <>
                  {small_img_src && (
                    <img
                      className="img-fluid float-none br-8 "
                      style={small_style}
                      src={handle_db_name(
                        `/rest/prodimage/${small_img_src.piid}/data?hash=${small_img_src.hash}`
                      )}
                      alt="smallimage"
                    />
                  )}
                  {big_img_src && (
                    <img
                      className="img-fluid float-none br-8 "
                      style={big_style}
                      src={handle_db_name(
                        `/rest/prodimage/${big_img_src.piid}/data?hash=${big_img_src.hash}`
                      )}
                      alt="smallimage"
                    />
                  )}
                </>
              ) : (
                <>
                  {small_img_src && (
                    <img
                      className="img-fluid float-none br-8 "
                      style={{
                        width: big_img_src
                          ? 'calc(50% - ' + margin + ' - ' + margin + ')'
                          : '100%',
                        margin: margin,
                      }}
                      src={handle_db_name(
                        `/rest/prodimage/${small_img_src.piid}/data?hash=${small_img_src.hash}`
                      )}
                      alt="smallimage"
                    />
                  )}
                  {big_img_src && (
                    <img
                      className="img-fluid float-none br-8 "
                      style={{
                        width: small_img_src
                          ? 'calc(50% - ' + margin + ' - ' + margin + ')'
                          : '100%',
                        margin: margin,
                      }}
                      src={handle_db_name(
                        `/rest/prodimage/${big_img_src.piid}/data?hash=${big_img_src.hash}`
                      )}
                      alt="smallimage"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }
}

ProductPreview.propTypes = {
  t: PropTypes.func.isRequired,
  hover: PropTypes.shape({
    product: PropTypes.object,
  }),
  order: PropTypes.shape({
    product: PropTypes.object,
    color: PropTypes.object,
  }),
  config: PropTypes.object,
  products_having_formula: PropTypes.array,
};

function mapStateToProps(store) {
  return {
    order: store.order,
    config: configSelectors.config(store),
    hover: store.hover_product,
    products_having_formula: store.formula.products_having_formula,
  };
}

export default withTranslation('translations')(
  connect(mapStateToProps)(ProductPreview)
);

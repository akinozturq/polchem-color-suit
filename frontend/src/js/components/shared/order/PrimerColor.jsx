import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

import { Button, Card, CardBody, CardHeader, Col, Row } from 'reactstrap';
import { PreviewBox } from './ColorPreview.jsx';

import formulaActions from 'js/redux/reducers/Formula';
import { bindActionCreators } from 'redux';
import orderActions from 'js/redux/reducers/Order';

class PrimerColor extends Component {
  render() {
    const { t, order, formula, show, config, acknowledgePrimer } = this.props;

    const multiple_items_in_order =
      config?.config_values?.multiple_items_in_order || false;

    const ready = !!formula.recommended_primer?.colourid;

    return (
      <Row style={{ display: show ? 'block' : 'none' }}>
        <Col>
          <Card data-testid={'primer-card'}>
            <CardHeader>
              {ready
                ? t('lbl.use_primer_color', 'Use primer color')
                : t(
                    'lbl.checkingPrimerColor',
                    'Checking for primer recommendation'
                  )}
            </CardHeader>
            <CardBody className={'m-8'}>
              {ready && (
                <>
                  <Row className={'pb-2'}>
                    <Col xs={6}>
                      {t(
                        'lbl.primer_rec',
                        'It is recommended that you use a primer color together with "{{colourcode}}".',
                        order?.item || {}
                      )}
                    </Col>
                    <Col xs={2}>
                      <PreviewBox color={order?.item?.rgb} height={'4rem'} />
                    </Col>
                    <Col xs={4}>
                      {multiple_items_in_order && (
                        <Button
                          data-testid={'skipPrimer'}
                          onClick={acknowledgePrimer}
                        >
                          {t('fn.skip', 'Skip')}
                        </Button>
                      )}
                    </Col>
                  </Row>
                  <Row className={'mb-8 pt-2'}>
                    <Col xs={6} data-testid={'primerColorLabel'}>
                      {t(
                        'lbl.primer_use',
                        'Use of primer color "{{colourcode}}" will improve hiding power and accurate color.',
                        formula?.recommended_primer || {}
                      )}
                    </Col>
                    <Col xs={2}>
                      <PreviewBox
                        color={formula?.recommended_primer?.rgb}
                        height={'4rem'}
                      />
                    </Col>
                    <Col xs={4}>
                      {multiple_items_in_order ? (
                        <Button
                          color={'primary'}
                          className={'mt-8'}
                          data-testid={'setPrimer'}
                          onClick={() => {
                            this.props.setPrimer(formula?.recommended_primer);
                            acknowledgePrimer();
                          }}
                        >
                          {t('fn.addPrimerToOrder', 'Add primer to order')}
                        </Button>
                      ) : (
                        <Button
                          color={'primary'}
                          className={'mt-8'}
                          data-testid={'skipPrimer'}
                          onClick={acknowledgePrimer}
                        >
                          {t('fn.ok', 'Ok')}
                        </Button>
                      )}
                    </Col>
                  </Row>
                </>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    );
  }
}

PrimerColor.propTypes = {
  moveToNextSection: PropTypes.func.isRequired,
  setPrimer: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  order: PropTypes.object,
  config: PropTypes.shape({
    config_values: PropTypes.object,
  }),
  formula: PropTypes.shape({
    recommended_primer: PropTypes.shape({
      rgb: PropTypes.number,
      colourcode: PropTypes.string,
      productid: PropTypes.number,
      colourid: PropTypes.number,
    }),
    local_fetch_frms_error: PropTypes.object,
    fetch_frms_error: PropTypes.object,
    local_frms: PropTypes.arrayOf(
      PropTypes.shape({
        itemid: PropTypes.number.isRequired,
      })
    ),
  }),
  acknowledgePrimer: PropTypes.func.isRequired,
};

function mapStateToProps(store) {
  return {
    formula: store.formula,
    config: store.configurations,
    order: store.order,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setOpenSection: orderActions.setOpenSection,
      moveToNextSection: orderActions.moveToNextSection,
      moveToPrevSection: orderActions.moveToPrevSection,
      acknowledgePrimer: formulaActions.acknowledgePrimer,
      setPrimer: orderActions.setPrimer,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(PrimerColor)
);

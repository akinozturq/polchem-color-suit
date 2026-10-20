import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Input } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import ColorThumbnail from '../../shared/ColorThumbnail';

class ColorantBarcode extends React.Component {
  render() {
    const {
      t,
      colorant_barcode,
      canister_barcode,
      canister,
      cansize,
      require_machine_canister_barcode,
    } = this.props;

    return (
      <div className="pl-8 pr-8">
        <Row className="mb-8">
          <Col className="font-weight-bold m-auto">
            {t('lbl.colorantBarcode.colon', 'Colorant barcode:')}
          </Col>

          <Col>
            <Input
              data-testid="colorant_barcode"
              value={colorant_barcode}
              onChange={this.props.searchColorantBarcode}
            />
          </Col>
        </Row>
        <Row className="mb-8">
          <Col>
            {t(
              'lbl.colorantBarcodeCansize.colon',
              'Colorant cansize based on barcode:'
            )}
          </Col>
          <Col>
            <Input readOnly value={cansize?.cansizecode || ''} />
          </Col>
        </Row>

        <Row className="mb-8">
          <Col className="font-weight-bold m-auto">
            {t('lbl.canisterBarcode.colon', 'Canister barcode:')}
          </Col>

          <Col>
            <Input
              data-testid="modal_canister_barcode"
              onChange={this.props.searchCanisterBarcode}
              value={canister_barcode}
              disabled={!require_machine_canister_barcode}
            />
          </Col>
        </Row>
        <Row className="mb-8">
          <Col className="m-auto">
            {t('lbl.canisterId.colon', 'Canister ID:')}
          </Col>

          <Col className="m-auto" style={{ display: 'inline-flex' }}>
            <div style={{ width: '32px' }} className="pl-4">
              <ColorThumbnail rgb={canister?.rgb} size="24px" />
            </div>
            {canister?.id}({canister?.code})
          </Col>
          <Col className="m-auto">
            {t('lbl.currentVolume.colon', 'Current volume:')}
          </Col>
          <Col>
            <Input readOnly value={canister ? canister.currLevel : ''} />
          </Col>
        </Row>
      </div>
    );
  }
}

ColorantBarcode.propTypes = {
  t: PropTypes.func.isRequired,
  searchColorantBarcode: PropTypes.func.isRequired,
  searchCanisterBarcode: PropTypes.func.isRequired,
  canister_barcode: PropTypes.string.isRequired,
  colorant_barcode: PropTypes.string.isRequired,
  cansize: PropTypes.shape({ cansizecode: PropTypes.string }),
  canister: PropTypes.shape({
    rgb: PropTypes.number,
    id: PropTypes.number,
    code: PropTypes.string,
    currLevel: PropTypes.number,
  }),
  require_machine_canister_barcode: PropTypes.bool,
};

ColorantBarcode.defaultProps = {};

export default withTranslation('translations')(ColorantBarcode);

import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
  Alert,
} from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import barcodeActions from 'js/redux/reducers/BarcodeAction';

const propTypes = {
  t: PropTypes.func.isRequired,
  config: PropTypes.object,
  resolveBarcode: PropTypes.func,
  clear: PropTypes.func.isRequired,
  rejected: PropTypes.shape({
    msg: PropTypes.string,
  }),
};

const defaultProps = {};

class BarcodeRejectedModal extends React.Component {
  constructor(props) {
    super(props);
    this.okButtonRef = createRef(); // Create a ref
  }

  componentDidUpdate(prevProps) {
    // If the modal just opened, set focus on the OK button
    if (!prevProps.rejected && this.props.rejected) {
      setTimeout(() => {
        if (typeof this.okButtonRef?.focus === 'function') {
          this.okButtonRef.focus();
        }
      }, 100);
    }
  }
  render() {
    const { t, rejected } = this.props;
    return (
      <Modal isOpen={!!rejected} toggle={this.props.clear} centered>
        <ModalHeader toggle={this.props.clear}>
          {t('lbl.barcodeActionError', 'Barcode action error')}
        </ModalHeader>
        <ModalBody>
          <Alert color="warning">{rejected?.msg}</Alert>
        </ModalBody>
        <ModalFooter>
          <Row style={{ width: '100%' }}>
            <Col xs={9} />
            <Col>
              <Button
                innerRef={(ref) => {
                  if (ref) this.okButtonRef = ref;
                }}
                data-testid="barcode_btn_ok"
                color="primary"
                onClick={this.props.clear}
              >
                {t('fn.ok', 'OK')}
              </Button>{' '}
            </Col>
          </Row>
        </ModalFooter>
      </Modal>
    );
  }
}

BarcodeRejectedModal.propTypes = propTypes;
BarcodeRejectedModal.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    rejected: store.barcodeaction.fetch_barcodeaction_error,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      clear: barcodeActions.clearBarcodeState,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(BarcodeRejectedModal)
);

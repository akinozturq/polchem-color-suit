import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
} from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';
import { KEY_CODES } from '../../Constants';
import barcodeActions from 'js/redux/reducers/BarcodeAction';
import { selectors as protectionSelectors } from 'js/redux/reducers/Protection';
import log from '../../api/Logger';

const propTypes = {
  t: PropTypes.func.isRequired,
  config: PropTypes.object,
  resolveBarcode: PropTypes.func,
  is_pro: PropTypes.bool,
};

const defaultProps = {};

class BarcodeModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      enabled: false,
      first_key: 'F7',
      last_key: 'Enter',
    };
    this.input = React.createRef();
  }

  static getDerivedStateFromProps(props, state) {
    const { config, is_pro } = props;
    const enabled =
      is_pro && _.get(config, 'barcode_action_enable.value', false);
    let first_key = null;
    let last_key = 'Enter';
    if (enabled) {
      first_key = _.get(config, 'barcode_first_char.value', null);
      last_key = _.get(config, 'barcode_last_char.value', null);

      first_key = _.find(KEY_CODES, (k) => k.id === first_key)?.name || null;
      last_key = _.find(KEY_CODES, (k) => k.id === last_key)?.name || 'Enter';
    }
    return { ...state, enabled, first_key, last_key };
  }

  toggle = () => {
    this.setState((prevState) => ({
      show: !prevState.show,
    }));
  };

  keyHandler = (e) => {
    if (this.state.enabled) {
      if (e.key === this.state.first_key) {
        e.preventDefault();
        this.toggle();
        this.input.focus();
      }
    }
  };

  preventHandler = (e) => {
    if (e.key === this.state.last_key) {
      e.preventDefault();
    }
  };

  componentDidMount() {
    document.addEventListener('keyup', this.keyHandler, false);
  }
  componentWillUnmount() {
    document.removeEventListener('keyup', this.keyHandler, false);
  }

  processBarcode = () => {
    this.toggle();
    const { value } = this.input;
    log.info('Barcode scanned: ' + JSON.stringify(value));
    this.props.resolveBarcode(value);
    this.input.value = '';
  };

  render() {
    const { t } = this.props;
    return (
      <Modal
        isOpen={this.state.show}
        toggle={this.toggle}
        size="sm"
        keyboard={false}
      >
        <ModalHeader toggle={this.toggle}>
          {t('lbl.barcode', 'Barcode')}
        </ModalHeader>

        <ModalBody>
          <input
            data-testid="barcode_input"
            ref={(node) => (this.input = node)}
            style={{ width: '100%' }}
            onKeyUp={(e) => {
              if (e.key === this.state.last_key) this.processBarcode();
            }}
            onKeyDown={this.preventHandler}
          />
        </ModalBody>
        <ModalFooter>
          <Row style={{ width: '100%' }}>
            <Col>
              <Button
                data-testid="barcode_btn_cancel"
                color="secondary"
                onClick={this.toggle}
              >
                {t('fn.cancel', 'Cancel')}
              </Button>
            </Col>
            <Col />
            <Col>
              <Button
                data-testid="barcode_btn_ok"
                color="primary"
                onClick={this.processBarcode}
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

BarcodeModal.propTypes = propTypes;
BarcodeModal.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    config: store.configurations.config,
    barcodes: store.cache.cmd_barcodes,
    is_pro: protectionSelectors.is_pro(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      resolveBarcode: barcodeActions.resolveBarcode,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(BarcodeModal)
);

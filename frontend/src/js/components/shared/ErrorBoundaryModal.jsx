import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { ModalFooter, Button, Modal, ModalBody, ModalHeader } from 'reactstrap';
import { formatStackTrace } from 'polchem_base/common/ErrorUtils';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { CURRENT_VERSION } from '../../../version';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { modal: false, error: null, errorInfo: null };

    this.toggle = this.toggle.bind(this);
  }

  componentDidCatch(error) {
    // Catch errors in any components below and re-render with error message
    try {
      formatStackTrace(error).then(({ message, stack }) => {
        this.setState({
          modal: true,
          error: error,
          errorInfo: stack,
        });

        window.qtside?.bridge.reportBug(message, stack, '', CURRENT_VERSION);
      });
    } catch (e) {
      console.error('Error in ErrorBoundary:', e);
      this.setState({
        modal: true,
        error: error,
        errorInfo: 'Error in ErrorBoundary',
      });
    }
  }

  toggle() {
    this.setState((state) => ({
      modal: !state.modal,
    }));
  }

  render() {
    if (this.state.errorInfo) {
      const { t } = this.props;
      return (
        <Modal
          size="lg"
          isOpen={this.state.modal}
          toggle={this.toggle}
          centered
        >
          <ModalHeader toggle={this.toggle}>
            {t('lbl.criticalError', 'Critical error')}
          </ModalHeader>
          <ModalBody className="scroll">
            {this.state.error && this.state.error.toString()}
            <br />
            <details style={{ whiteSpace: 'pre' }}>
              {this.state.errorInfo}
            </details>
          </ModalBody>
          <ModalFooter>
            <Button color="warning" onClick={this.toggle}>
              {t('fn.ok', 'OK')}
            </Button>{' '}
          </ModalFooter>
        </Modal>
      );
    }
    // Normally, just render children
    // eslint-disable-next-line react/prop-types
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  t: PropTypes.func.isRequired,
  protection: PropTypes.shape({
    status: PropTypes.shape({ license_code: PropTypes.string }),
  }),
};

function mapStateToProps(state) {
  return {
    protection: state.protection,
  };
}

export default withTranslation('translations')(
  connect(mapStateToProps)(ErrorBoundary)
);

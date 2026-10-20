import React from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  Row,
  Label,
  Col,
  Input,
  Alert,
} from 'reactstrap';

const propTypes = {
  header: PropTypes.string.isRequired,
  edited: PropTypes.func.isRequired,
  prompt: PropTypes.string.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  save: PropTypes.string.isRequired,
  cancel: PropTypes.string.isRequired,
  show: PropTypes.bool.isRequired,
  pending: PropTypes.bool,
  error: PropTypes.string,
  hideModal: PropTypes.func.isRequired,
  validator: PropTypes.func,
  value: PropTypes.string,
};

const defaultProps = {
  type: 'text',
  placeholder: '',
  value: '',
  validator: () => {
    return true;
  },
};

export default class SimpleModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      pre_value: '',
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.value && props.value !== state.pre_value) {
      return { value: props.value, pre_value: props.value };
    }
    return null;
  }

  render() {
    const {
      header,
      edited,
      prompt,
      type,
      placeholder,
      save,
      cancel,
      show,
      hideModal,
      validator,
      pending,
      error,
    } = this.props;

    const valid = validator(this.state.value);

    return (
      <Modal isOpen={show} centered fade>
        <ModalHeader>{header}</ModalHeader>
        <ModalBody>
          <Row>
            <Label sm={4}>{prompt}</Label>
            <Col sm={8}>
              <Input
                data-testid="simple_input"
                invalid={!valid || !!error}
                type={type}
                //defaultValue={value}
                value={this.state.value}
                onChange={(e) => this.setState({ value: e.target.value })}
                onKeyUp={(e) => {
                  if (
                    e.key === 'Enter' &&
                    this.state.value.length > 1 &&
                    valid
                  ) {
                    edited(this.state.value);
                    hideModal();
                  }
                }}
                placeholder={placeholder}
              />
            </Col>
          </Row>
          {error && (
            <Row className="m-8">
              <Col sx={12}>
                <Alert color="danger">{error}</Alert>
              </Col>
            </Row>
          )}
          <Row className="mt-16">
            <Col sm={4}>
              <Button
                data-testid="simple_cancel_btn"
                className="d-inline"
                onClick={hideModal}
                color="primary"
              >
                {cancel}
              </Button>
            </Col>
            <Col />
            <Col sm={4}>
              <Button
                data-testid="simple_save_btn"
                className="w-100"
                onClick={() => {
                  edited(this.state.value);
                  hideModal();
                }}
                color="success"
                disabled={
                  this.state.value.length < 1 || !valid || pending || !!error
                }
              >
                {save}
              </Button>
            </Col>
          </Row>
        </ModalBody>
      </Modal>
    );
  }
}

SimpleModal.propTypes = propTypes;
SimpleModal.defaultProps = defaultProps;

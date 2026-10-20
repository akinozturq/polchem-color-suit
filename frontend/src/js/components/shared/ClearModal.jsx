import React from 'react';

import {
  Button,
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from 'reactstrap';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

export const ClearModal = (props) => {
  const { t } = useTranslation();
  const { show, toggle, onCancel, onOk, header, message } = props;

  return (
    <Modal isOpen={show} toggle={toggle} centered fade={false}>
      <ModalHeader toggle={toggle}>{header}</ModalHeader>
      <ModalBody data-cy={'msg.clear_modal'}>{message}</ModalBody>
      <ModalFooter>
        <Row className="w-100">
          <Col>
            <Button
              data-cy={'fn.cancel'}
              color="secondary"
              onClick={() => {
                toggle();
                onCancel && onCancel();
              }}
            >
              {t('fn.cancel', 'Cancel')}
            </Button>
          </Col>
          <Col />
          <Col>
            <Button data-cy={'fn.ok'} color="primary" onClick={onOk}>
              {t('fn.ok', 'OK')}
            </Button>
          </Col>
        </Row>
      </ModalFooter>
    </Modal>
  );
};

ClearModal.propTypes = {
  header: PropTypes.string,
  message: PropTypes.string,
  show: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  onOk: PropTypes.func.isRequired,
};

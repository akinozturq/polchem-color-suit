import React, { useEffect, useRef } from 'react';
import { Button, Modal, ModalFooter, ModalHeader } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

export const TextModal = ({ header, text, onClose }) => {
  const { t } = useTranslation();

  const buttonRef = useRef(); // Create a ref for the button

  useEffect(() => {
    // If the modal is shown, focus the button
    setTimeout(() => {
      if (buttonRef.current) {
        buttonRef.current.focus();
      }
    }, 100);
  }, [text]); // Run the effect whenever `text` changes

  return (
    <Modal isOpen={!!text} toggle={onClose}>
      <ModalHeader>{header}</ModalHeader>
      <div className={'m-2'}>{text}</div>
      <ModalFooter>
        <Button innerRef={buttonRef} onClick={onClose}>
          {t('btn.close', 'Close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

TextModal.propTypes = {
  header: PropTypes.string,
  text: PropTypes.string,
  onClose: PropTypes.func,
};

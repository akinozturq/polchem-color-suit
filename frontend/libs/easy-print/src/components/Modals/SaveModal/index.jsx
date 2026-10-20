import React from 'react';
import PropTypes from 'prop-types';

import './styles.css';
import { download } from '../../../containers/Utils';

import { withTranslation } from 'react-i18next';
import { Button } from '../../../mylib/Button';
import { Input } from '../../../mylib/Input';
import { Modal } from '../../../mylib/Modal';
import { ModalHeader } from '../../../mylib/ModalHeader';
import { ModalBody } from '../../../mylib/ModalBody';
import { ModalFooter } from '../../../mylib/ModalFooter';

const SaveModal = (props) => {
  const {
    showSaveModal,
    toggleSaveModal,
    fileName,
    handleFileNameChange,
    saveType,
    handleSaveDB,
    t,
  } = props;
  const save = (type) => {
    if (type === 'PC') {
      download(fileName, props.layout);
      toggleSaveModal();
    } else {
      handleSaveDB(fileName, props.layout);
      toggleSaveModal();
    }
  };
  return (
    <Modal isOpen={showSaveModal}>
      <ModalHeader>
        {saveType === 'PC'
          ? t('prompt.enterFileName', 'Enter file name')
          : t('prompt.enterLabelName', 'Enter label name')}
      </ModalHeader>
      <ModalBody>
        <Input
          value={fileName}
          onChange={(e) => handleFileNameChange(e)}
          className="saveModal__input"
        />
      </ModalBody>
      <ModalFooter>
        <Button
          data-cy="fn.save"
          primary
          onClick={() => save(saveType)}
          disabled={!fileName}
        >
          {t('fn.save', 'Save')}
        </Button>
        <Button data-cy="fn.cancel" onClick={toggleSaveModal}>
          {t('fn.cancel', 'Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

SaveModal.propTypes = {
  showSaveModal: PropTypes.bool,
  toggleSaveModal: PropTypes.func,
  fileName: PropTypes.string,
  saveType: PropTypes.string,
  handleFileNameChange: PropTypes.func,
  handleSaveDB: PropTypes.func,
  saveToPC: PropTypes.func,
  t: PropTypes.func,
  layout: PropTypes.object,
};

export default withTranslation('translations')(SaveModal);

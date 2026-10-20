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
import { handle_db_name } from '../../../redux/Utils';
import { expandCommentsAndImages } from '../../../redux/selectors/FormulaComments';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { selectors as orderSelectors } from '../../../redux/reducers/Order';
import { selectors as cacheSelectors } from '../../../redux/reducers/Cache';

export const FormulaCommentModal = ({ show, onOk, onCancel }) => {
  const { t } = useTranslation();

  const formula = useSelector(orderSelectors.formula);
  const commentTexts = useSelector(cacheSelectors.commentTexts);
  const commentImages = useSelector(cacheSelectors.commentImages);

  const comments_to_show = expandCommentsAndImages(
    formula?.fcomment,
    commentTexts,
    commentImages
  );

  return (
    <Modal isOpen={show} toggle={onCancel} centered>
      <ModalHeader>{t('lbl.formula_note', 'Formula note')}</ModalHeader>
      <ModalBody data-cy={'formula_note_modal'}>
        {comments_to_show.map((c) => (
          <Row key={c.text}>
            <Col xs={2}>
              {c.imageId && (
                <img
                  style={{
                    height: '2rem',
                    width: '2rem',
                  }}
                  alt="feedback"
                  src={handle_db_name(
                    `/rest/image/${c.imageId}/data?hash=${c.hash}`
                  )}
                />
              )}
            </Col>
            <Col xs={10}>
              <p>{c.text}</p>
            </Col>
          </Row>
        ))}
      </ModalBody>
      <ModalFooter>
        <Button data-cy={'fn.dispense'} onClick={onOk}>
          {t('fn.dispense', 'Dispense')}
        </Button>
        <Button data-cy={'fn.cancel'} onClick={onCancel}>
          {t('fn.cancel', 'Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

FormulaCommentModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onOk: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

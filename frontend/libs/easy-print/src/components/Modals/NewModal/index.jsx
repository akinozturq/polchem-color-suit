import React from 'react';
import PropTypes from 'prop-types';

import './styles.css';
import actions from '../../../redux/reducers/Layout';
import editorActions from '../../../redux/reducers/Editor';
import { withTranslation } from 'react-i18next';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Preview from '../../Preview';
import { Row } from '../../../mylib/layouts/Row';
import { Col } from '../../../mylib/layouts/Col';
import { Button } from '../../../mylib/Button';
import { Modal } from '../../../mylib/Modal';
import { ModalHeader } from '../../../mylib/ModalHeader';
import { ModalBody } from '../../../mylib/ModalBody';
import { ModalFooter } from '../../../mylib/ModalFooter';

class NewModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      layouts: [],
    };
  }

  load_layouts = () => {
    if (this.props.newModalOpen && this.state.layouts.length === 0) {
      // Start loading layout templates only when no layouts are available
      this.props.axios
        .get('/templates/ep4')
        .then((rs) => {
          if (rs.status === 200) {
            this.setState({ layouts: rs.data });
          }
        })
        .catch((reason) => console.log(reason));
    }
  };

  render() {
    const {
      t,
      newModalOpen,
      orderItem,
      formatters,
      resetLayout,
      load,
      toggleNewModal,
    } = this.props;

    this.load_layouts();

    const examples = this.state.layouts.map((x, idx) => (
      <Row
        key={idx}
        className="modalRow cursor-pointer"
        onClick={() => {
          load(x);
          toggleNewModal(false);
        }}
      >
        <Col className="p-0">
          <Preview
            pWidth={450}
            pHeight={100}
            layout={x}
            orderItem={orderItem}
            formatters={formatters}
            classNames="new-label-container"
          />
        </Col>
      </Row>
    ));

    return (
      <Modal isOpen={newModalOpen}>
        <ModalHeader toggle={() => toggleNewModal(false)}>
          {t('lbl.newLabel', 'New label')}
        </ModalHeader>
        <ModalBody>
          <div className="scroll">
            <Row
              className="modalRow cursor-pointer"
              onClick={() => {
                resetLayout();
                toggleNewModal(false);
              }}
            >
              <Col className="p-0">
                <div className={'emptyLabel new-label-container'}>
                  {t('lbl.empty', '<Empty>')}
                </div>
              </Col>
            </Row>
            {/** examples */}
            {examples}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={() => {
              toggleNewModal(false);
            }}
          >
            {t('fn.cancel', 'Cancel')}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}

NewModal.propTypes = {
  t: PropTypes.func.isRequired,
  toggleNewModal: PropTypes.func.isRequired,
  resetLayout: PropTypes.func.isRequired,
  load: PropTypes.func.isRequired,
  newModalOpen: PropTypes.bool,
  orderItem: PropTypes.object,
  formatters: PropTypes.object,
  axios: PropTypes.any,
};

const mapStateToProps = (state) => {
  return {
    newModalOpen: state.editor.newModalOpen,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      resetLayout: actions.resetLayout,
      toggleNewModal: editorActions.toggleNewModal,
      load: actions.load,
    },
    dispatch
  );
};

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(NewModal)
);

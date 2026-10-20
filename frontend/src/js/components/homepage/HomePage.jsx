import React, { Component } from 'react';
import HomePageLabel from './HomePageLabel';
import HomePageButtons from './HomePageButton';
import OrderQueue from '../orderqueue/OrderQueue';
import MachineButtons from '../dispenser/MachineButtons';
import {
  Container,
  Row,
  Col,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from 'reactstrap';

import TopButtons from '../shared/TopButtons';
import { isSiteUser } from '../../api/WebRequest';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { rightToLeft } from '../../mylib/Utils';

class HomePage extends Component {
  state = {
    open_modal: false,
  };

  componentDidUpdate(prevProps) {
    if (prevProps.warning_batch !== this.props.warning_batch) {
      if (this.props.warning_batch?.length > 0) {
        this.setState({
          open_modal: true,
        });
      }
    }
  }

  handleCloseModal = () => {
    this.setState({ open_modal: false });
  };
  render() {
    const isRtl = rightToLeft();
    const { warning_batch, machine, t } = this.props;
    const dispname = get(machine, 'info.dispenserName');
    let machineContainerStyle = {
      position: 'fixed',
      width: '96%',
      bottom: '2rem',
      height: '12rem',
      left: '1rem',
      right: '1rem',
      margin: 'auto',
      zIndex: '-1',
    };

    return (
      <>
        <Modal isOpen={this.state.open_modal} centered>
          <ModalHeader>
            {t('lbl.disp_warning', 'Dispenser {{dispname}} warning', {
              dispname,
            })}
          </ModalHeader>
          <ModalBody>
            {warning_batch?.map((batch) => {
              if (batch.blocked) {
                return (
                  <p key={batch.cntbatch + batch.canisterIndex + batch.cntcode}>
                    {t(
                      'lbl.canister_contains_blocked',
                      'Canister {{canisterIndex}} ({{cntcode}}) contains blocked batch {{cntbatch}}.',
                      batch
                    )}
                  </p>
                );
              } else {
                return (
                  <p key={batch.cntbatch + batch.canisterIndex + batch.cntcode}>
                    {t(
                      'lbl.canister_contains_expired',
                      'Canister {{canisterIndex}} ({{cntcode}}) contains expired batch {{cntbatch}}.',
                      batch
                    )}
                  </p>
                );
              }
            })}
            <p>
              {t(
                'lbl.please_clean_canister',
                'Please take appropriate action to clean canisters.'
              )}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button onClick={this.handleCloseModal}>OK</Button>
          </ModalFooter>
        </Modal>
        <TopButtons show_update={true} />
        <div className={'zoom-in'}>
          <HomePageLabel />
          <HomePageButtons />
        </div>
        <Container
          className="d-flex flex-row justify-content-end align-items-end align-content-end align-self-end"
          style={machineContainerStyle}
        >
          <Row className="width100">
            {/** Machine buttons */}
            <Col
              xs="3"
              style={{
                marginTop: 'auto',
                marginBottom: '0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              {isSiteUser() && <MachineButtons />}{' '}
            </Col>
            {/** Order queue  */}
            <OrderQueue />
          </Row>
        </Container>
      </>
    );
  }
}

HomePage.propTypes = {
  warning_batch: PropTypes.array,
  machine: PropTypes.object,
  t: PropTypes.func.isRequired,
};

export default withTranslation('translations')(HomePage);

import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Modal, ModalBody, Button, ModalHeader } from 'reactstrap';
import spectroActions, { selectors } from 'js/redux/reducers/Spectro';

const propTypes = {
  t: PropTypes.func.isRequired,
  setGloss: PropTypes.func.isRequired,
  spectro_dialog: PropTypes.object,
  spectro_busy: PropTypes.bool.isRequired,
  show: PropTypes.bool.isRequired,
  gloss_options: PropTypes.arrayOf(PropTypes.object),
};

const defaultProps = {};
/**
 * Handles gloss level selection
 */
class GlossCompensationModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  getButtons = () => {
    const { t, gloss_options } = this.props;
    return gloss_options.map((opt) => (
      <Button onClick={() => this.props.setGloss(opt.value)} key={opt.key}>
        {t('opt.gloss.' + opt.key)}
        <br />
        {t('lbl.gloss_from_to', opt.range)}
      </Button>
    ));
  };

  render() {
    const { t, show } = this.props;
    return (
      show && (
        <Modal className="customer-width" isOpen={true} centered fade={true}>
          <ModalHeader>{t('msg.glossCompensation.title')}</ModalHeader>
          <ModalBody>
            <p>{t('msg.glossCompensation')}</p>
            <p>{this.getButtons()}</p>
          </ModalBody>
        </Modal>
      )
    );
  }
}

GlossCompensationModal.propTypes = propTypes;
GlossCompensationModal.defaultProps = defaultProps;

const mapStateToProps = (state) => ({
  spectro_busy: selectors.busy(state),
  show: selectors.show_gloss_modal(state),
  gloss_options: selectors.gloss_options(state),
});

const mapDispatchToProps = {
  setGloss: spectroActions.setGloss,
};

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(GlossCompensationModal)
);

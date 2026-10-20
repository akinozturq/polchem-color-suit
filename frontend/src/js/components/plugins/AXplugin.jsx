import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Button, UncontrolledTooltip } from 'reactstrap';
import { selectors as configSelectors } from 'js/redux/reducers/Configuration';
import { selectors as orderSelectors } from 'js/redux/reducers/Order';
import AXmodal from './AXmodal';
import PropTypes from 'prop-types';

const AX_BUTTON_TEXT = 'AX';

class AXplugin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
    };
  }

  closeModal = () => {
    this.setState({ showModal: false });
  };

  render() {
    const { t, ax_ui, enabled } = this.props;
    if (!ax_ui) return null;

    return (
      <>
        <Button
          key="axplugin"
          id="axpluginBtn"
          className="btn btn-primary btn-left btn-top"
          disabled={!enabled}
          onClick={() => this.setState({ showModal: true })}
        >
          {AX_BUTTON_TEXT}
        </Button>
        {this.state.showModal && <AXmodal closeModal={this.closeModal} />}

        <UncontrolledTooltip placement="bottom" target="axpluginBtn">
          {t('lbl.ax_plugin', 'AX plugin')}
        </UncontrolledTooltip>
      </>
    );
  }
}

AXplugin.propTypes = {
  enabled: PropTypes.object,
  ax_ui: PropTypes.any,
  t: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const { plugins } = configSelectors.config_values(state);
  const order = orderSelectors.order(state);
  return {
    ax_ui: plugins?.ax_ui,
    enabled: order.color && order.product && order.can,
  };
}

export default withTranslation('translations')(
  connect(mapStateToProps)(AXplugin)
);

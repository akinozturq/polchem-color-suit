import React, { lazy, Suspense } from 'react';
import { Container } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { selectors as userSelectors } from '../../redux/reducers/User';
import pricingActions from 'js/redux/reducers/Pricing';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TopBar, TopBarLeft } from 'js/components/layout/Containers';
import _ from 'lodash';
import { offline_mode } from '../../Constants';
import { rightToLeft } from '../../mylib/Utils';

const ConfigTree = lazy(() => import('./ConfigTree'));

class ConfigPage extends React.Component {
  state = {
    modalOpen: false,
    modalOpenOnce: false,
    originalDriverConfig: null,
    originalEnableAutomaticDispensers: null,
    modalOpenFromBack: false,
  };

  componentDidMount() {
    if (
      this.props.privileges &&
      !this.props.privileges.includes('tools_and_settings')
    ) {
      this.props.history.push('/');
    } else {
      this.props.fetchPricingBundle();
    }
    this.setState({
      originalDriverConfig: this.props.machine.driver_config,
      originalEnableAutomaticDispensers:
        this.props.configurations?.config?.enable_automatic_dispensers?.value,
    });
  }

  handleCloseModal = () => {
    this.setState({
      modalOpen: false,
    });
    if (this.state.modalOpenFromBack) {
      window.history.back();
    }
  };

  handleOpenModal = () => {
    if (
      this.state.originalDriverConfig !== this.props.machine.driver_config ||
      this.state.originalEnableAutomaticDispensers !==
        this.props.configurations?.config?.enable_automatic_dispensers?.value
    ) {
      this.setState({
        modalOpen: true,
        modalOpenFromBack: false,
        // modalOpenOnce: true,
        originalDriverConfig: this.props.machine.driver_config,
        originalEnableAutomaticDispensers:
          this.props.configurations?.config?.enable_automatic_dispensers?.value,
      });
    }
  };
  goBack = () => {
    if (
      !_.isEqual(
        this.state.originalDriverConfig,
        this.props.machine.driver_config
      ) ||
      !_.isEqual(
        this.state.originalEnableAutomaticDispensers,
        this.props.configurations?.config?.enable_automatic_dispensers?.value
      )
    ) {
      if (!this.state.modalOpenOnce) {
        this.setState({
          modalOpen: true,
          modalOpenOnce: true,
          modalOpenFromBack: true,
        });
      } else {
        window.history.back();
      }
    } else {
      window.history.back();
    }
  };

  render() {
    const isRtl = rightToLeft();
    const { t } = this.props;
    const { configPath } = this.props.match.params;
    const setConfigPath = (path) => {
      this.props.history.replace(
        path ? `/config/${encodeURIComponent(path)}` : '/config'
      );
    };

    return (
      <div className={'zoom-in'}>
        {offline_mode && (
          <div className="offline_info_text_right">
            {t(
              'msg.offlineChangesWillBeLost',
              'Changes will be lost when returning online mode'
            )}
          </div>
        )}
        <TopBar>
          <TopBarLeft>
            <h2
              data-testid={'back'}
              className="clickable-text directly-over-bg mt-8"
              onClick={this.goBack}
            >
              <FontAwesomeIcon
                icon={isRtl ? 'arrow-right' : 'arrow-left'}
                style={{ fontSize: '1.7rem' }}
              />{' '}
              {t('fn.toolsAndSettings', 'Tools and Settings')}
            </h2>
          </TopBarLeft>
        </TopBar>
        <Container className="justify-content-center">
          <Suspense fallback={null}>
            <ConfigTree
              configPath={configPath}
              setConfigPath={setConfigPath}
              originalDriverConfig={this.state.originalDriverConfig}
              originalEnableAutomaticDispensers={
                this.state.originalEnableAutomaticDispensers
              }
              handleCloseModal={this.handleCloseModal}
              handleOpenModal={this.handleOpenModal}
              modalOpen={this.state.modalOpen}
            />
          </Suspense>
        </Container>
      </div>
    );
  }
}

ConfigPage.propTypes = {
  t: PropTypes.func.isRequired,
  privileges: PropTypes.array,
  history: PropTypes.object,
  match: PropTypes.object,
  machine: PropTypes.object,
  configurations: PropTypes.shape({
    config: PropTypes.object,
  }),
  fetchPricingBundle: PropTypes.func,
};

const mapStateToProps = (state) => ({
  privileges: userSelectors.privileges(state),
  configurations: state.configurations,
  machine: state.machine,
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchPricingBundle: pricingActions.fetchPricingBundle,
    },
    dispatch
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation('translations')(ConfigPage));

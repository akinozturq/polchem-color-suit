import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, Row, Col } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';
import { selectors as protectionSelectors } from '../../redux/reducers/Protection';
import { FEATURE_POS_MATCHING, FEATURE_PRO } from '../../Constants';
import protectionActions from 'js/redux/reducers/Protection';

const propTypes = {
  t: PropTypes.func.isRequired,
  status: PropTypes.shape({
    cloud: PropTypes.bool,
    features: PropTypes.arrayOf(PropTypes.string),
  }),
  setStatus: PropTypes.func.isRequired,
};

const defaultProps = {};

class VersionModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      original_status: null,
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (!state.original_status) {
      return { original_status: _.cloneDeep(props.status) };
    }
    return null;
  }

  toggle = () => {
    this.setState((prevState) => ({
      show: !prevState.show,
    }));
  };

  keyHandler = (e) => {
    if (e.key === 'F12' && e.shiftKey) {
      e.preventDefault();
      this.toggle();
    }
  };

  componentDidMount() {
    document.addEventListener('keyup', this.keyHandler, false);
  }
  componentWillUnmount() {
    document.removeEventListener('keyup', this.keyHandler, false);
  }

  render() {
    const { t, setStatus, status } = this.props;
    const allow_matching =
      this.state.original_status?.features.includes(FEATURE_POS_MATCHING);
    const is_pro = this.state.original_status?.features.includes(FEATURE_PRO);

    let active_btn = 'basic';
    if (status?.cloud && !status?.features.includes(FEATURE_POS_MATCHING)) {
      active_btn = 'cloud';
    } else if (
      status?.cloud &&
      status?.features.includes(FEATURE_POS_MATCHING)
    ) {
      active_btn = 'cloud_with_matching';
    } else if (
      status?.features.includes(FEATURE_PRO) &&
      status?.features.includes(FEATURE_POS_MATCHING)
    ) {
      active_btn = 'pro';
    }
    console.log(active_btn);

    return (
      <Modal isOpen={this.state.show} toggle={this.toggle} size="sm">
        <ModalHeader toggle={this.toggle}>
          {t('lbl.softwareVersion', 'Software version')}
        </ModalHeader>

        <ModalBody>
          <Row style={{ width: '100%', padding: '1rem' }}>
            <Col>
              <Button
                data-testid="btn_basic"
                color={active_btn === 'basic' ? 'primary' : 'secondary'}
                onClick={() => {
                  this.toggle();
                  setStatus({
                    ...this.state.original_status,
                    features: this.state.original_status.features.filter(
                      (x) => ![FEATURE_POS_MATCHING, FEATURE_PRO].includes(x)
                    ),
                    cloud: false,
                  });
                }}
              >
                {t('fn.basic', 'Basic')}
              </Button>
            </Col>
          </Row>
          {is_pro && (
            <Row style={{ width: '100%', padding: '1rem' }}>
              <Col>
                <Button
                  data-testid="btn_pro"
                  color={active_btn === 'pro' ? 'primary' : 'secondary'}
                  onClick={() => {
                    this.toggle();
                    setStatus({
                      ...this.state.original_status,
                      cloud: false,
                    });
                  }}
                >
                  {t('fn.pro', 'Pro')}
                </Button>
              </Col>
            </Row>
          )}
          {allow_matching && (
            <Row style={{ width: '100%', padding: '1rem' }}>
              <Col>
                <Button
                  data-testid="cloud"
                  color={active_btn === 'cloud' ? 'primary' : 'secondary'}
                  onClick={() => {
                    this.toggle();
                    setStatus({
                      ...this.state.original_status,
                      features: this.state.original_status.features.filter(
                        (x) => ![FEATURE_POS_MATCHING].includes(x)
                      ),
                      cloud: true,
                    });
                  }}
                >
                  {t('fn.Cloud', 'Cloud')}
                </Button>
              </Col>
            </Row>
          )}
          {allow_matching && (
            <Row style={{ width: '100%', padding: '1rem' }}>
              <Col>
                <Button
                  data-testid="cloud_with_matching"
                  color={
                    active_btn === 'cloud_with_matching'
                      ? 'primary'
                      : 'secondary'
                  }
                  onClick={() => {
                    this.toggle();
                    setStatus({
                      ...this.state.original_status,
                      cloud: true,
                    });
                  }}
                >
                  {t('fn.cloud_with_matching', 'Cloud with matching')}
                </Button>
              </Col>
            </Row>
          )}
        </ModalBody>
      </Modal>
    );
  }
}

VersionModal.propTypes = propTypes;
VersionModal.defaultProps = defaultProps;

function mapStateToProps(store) {
  return {
    status: protectionSelectors.status(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setStatus: protectionActions.setStatus,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(VersionModal)
);

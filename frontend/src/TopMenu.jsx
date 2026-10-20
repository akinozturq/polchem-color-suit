import React from 'react';
import {
  Alert,
  Button,
  Carousel,
  CarouselIndicators,
  CarouselItem,
  Input,
  InputGroup,
  InputGroupAddon,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import loginActions from './js/redux/reducers/Login';
import TopButtons from './js/components/shared/TopButtons';
import { withTranslation } from 'react-i18next';
import { selectors as protectionSelectors } from './js/redux/reducers/Protection';
import { selectors as orderSelectors } from './js/redux/reducers/Order';

import PropTypes from 'prop-types';

import banner from './img/banner.svg';
import {
  ADD_TYPE_BANNER,
  ADD_TYPE_MAIN,
  DEFAULT_FONT,
  ERROR_THEME,
  FEATURE_IT4,
  FEATURE_REPLICATION,
  ORDER_STATUS_PREPARING,
  RIGHT_TO_LEFT_LANGUAGES,
  SEGOE_UI,
  SEGOE_UI_LANGUAGES,
} from './js/Constants';
import lostPasswordActions from './js/redux/reducers/LostPassword';
import errToJSON from 'error-to-json';
import JSONPretty from 'react-json-pretty';
import Spinner from './js/components/shared/Spinner';
import { detectMobile } from './js/mylib/Utils';
import _ from 'lodash';
import { handle_db_name } from './js/redux/Utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dateToLocaleString } from './js/mylib/DateUtils';
import { push } from 'connected-react-router';

class TopMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      activationcode: '',
      language: 'en', // Handle language change here!
      visible_index: 0,
      animating: false,
      show_send_password: false,
      zoneid: null,
      show: false,
    };
  }

  login = () => {
    this.props.logInSite(
      this.state.username,
      this.state.password,
      this.state.activationcode
    );
  };

  static getDerivedStateFromProps(props, state) {
    // check and change language here? Saga would be better, but weren't able to get it working
    let lng = props.configurations.language;
    const { i18n } = props;
    if (lng !== undefined && i18n.language !== lng.value) {
      // need to change the language
      i18n.changeLanguage(lng.value);
      if (RIGHT_TO_LEFT_LANGUAGES.includes(lng.value)) {
        document.getElementsByTagName('html')[0].setAttribute('dir', 'rtl');
      } else {
        document.getElementsByTagName('html')[0].setAttribute('dir', 'ltr');
      }

      const fontFamily = SEGOE_UI_LANGUAGES.includes(lng.value)
        ? SEGOE_UI
        : DEFAULT_FONT;

      document.body.style.fontFamily = fontFamily;
    }

    if (state.zoneid !== props.zone?.zoneid) {
      return { zoneid: props.zone?.zoneid, visible_index: 0 };
    }

    return null;
  }

  nextAdd = () => {
    if (this.state.animating) return;

    const ads = this.props.zone
      ? this.props.zone.advertisement.filter(
          (a) => a.adtype === ADD_TYPE_MAIN || a.adtype === ADD_TYPE_BANNER
        )
      : [];
    let total = ads.length;
    if (!ads.map((x) => x.adtype).includes(ADD_TYPE_MAIN)) {
      total += 1;
    }

    this.setState((s) => ({
      visible_index: s.visible_index >= total - 1 ? 0 : s.visible_index + 1,
    }));
  };
  prevAdd = () => {
    if (this.state.animating) return;

    const ads = this.props.zone
      ? this.props.zone.advertisement.filter(
          (a) => a.adtype === ADD_TYPE_MAIN || a.adtype === ADD_TYPE_BANNER
        )
      : [];
    let total = ads.length;
    if (!ads.map((x) => x.adtype).includes(ADD_TYPE_MAIN)) {
      total += 1;
    }
    this.setState((s) => ({
      visible_index: s.visible_index - 1 < 0 ? total - 1 : s.visible_index - 1,
    }));
  };

  goToIndex = (idx) => {
    if (this.state.animating) return;
    this.setState({ visible_index: idx });
  };

  getItem = (itm) => {
    return (
      <CarouselItem
        key={itm.adid}
        onExiting={() => this.setState({ animating: true })}
        onExited={() => this.setState({ animating: false })}
      >
        <div style={{ overflow: 'hidden', height: '102px' }}>
          <img
            src={handle_db_name(
              `/rest/advertisement/${itm.adid}/data?hash${itm.md5_hash}`
            )}
            alt="banner"
            height={102}
          />
        </div>
        {itm.linkurl && (
          <a
            className="banner-link"
            href={itm.linkurl}
            rel="noreferrer noopener"
            target="_blank"
          >
            {itm.linkurl}
          </a>
        )}
      </CarouselItem>
    );
  };

  getAdvertisement = () => {
    const { is_pro, configurations } = this.props;
    const hide = _.get(configurations, 'hide_banner.value');
    if (hide) {
      return;
    }

    const default_banner_delay =
      _.get(configurations, 'banners_default_delay.value') * 1000 || 5000;

    const ads = _.sortBy(
      this.props.zone ? this.props.zone.advertisement : [],
      'position'
    );
    let slides = [];
    if (!ads.map((x) => x.adtype).includes(ADD_TYPE_MAIN)) {
      // No need to add main banner as it's coming from database
      // Add main banner
      slides.push(
        <CarouselItem key="Main">
          <div
            data-cy={'main_banner'}
            style={{ overflow: 'hidden', height: '102px' }}
          >
            <img src={banner} alt="banner" />
          </div>
        </CarouselItem>
      );
    }

    for (let i = 0; i < ads.length; i++) {
      if (ads[i].adtype === ADD_TYPE_MAIN) {
        slides.unshift(this.getItem(ads[i]));
      }
      if (is_pro && ads[i].adtype === ADD_TYPE_BANNER) {
        slides.push(this.getItem(ads[i]));
      }
    }

    let interval = default_banner_delay;
    if (ads.length > 0 && ads[this.state.visible_index - 1]) {
      interval = ads[this.state.visible_index - 1].seconds
        ? ads[this.state.visible_index - 1].seconds * 1000
        : default_banner_delay;
    }

    return (
      <Carousel
        className="banner"
        activeIndex={this.state.visible_index}
        next={this.nextAdd}
        previous={this.prevAdd}
        interval={is_pro ? interval : false}
        keyboard={false}
      >
        {slides.length > 1 && (
          <CarouselIndicators
            items={slides}
            activeIndex={this.state.visible_index}
            onClickHandler={this.goToIndex}
          />
        )}
        {slides}
      </Carousel>
    );
  };

  navigateTo = (url) => {
    if (url) this.props.navigateTo(url);
  };

  notification = () => {
    const { t, offline, replication, status } = this.props;
    let notification_text = null;
    let nav_url = null;
    {
      /** FALLBACK ENGINE IN USE */
    }
    if (offline.time_remaining) {
      if (offline.time_remaining.days > 1) {
        notification_text = t(
          'msg.offlineTimeRemainingDays',
          '{{days}} days offline time remaining',
          offline.time_remaining
        );
      } else if (offline.time_remaining.hours > 1) {
        notification_text = t(
          'msg.offlineTimeRemainingHours',
          '{{hours}} hour offline time remaining',
          offline.time_remaining
        );
      } else {
        notification_text = t(
          'msg.offlineTimeRemainingMinutes',
          '{{minutes}} minute offline time remaining',
          offline.time_remaining
        );
      }
    }

    if (!notification_text && status?.errmsg) {
      notification_text = status.errmsg;
    }

    const expdate = status?.expdate;
    const daysleft = status?.daysleft;

    if (!notification_text && expdate && daysleft < 30) {
      notification_text = t(
        'msg.licenseExpiresSoon',
        'License expires on {{expdate}}, {{daysleft}} days left',
        {
          expdate: dateToLocaleString(expdate),
          daysleft: daysleft,
        }
      );
      nav_url = '/protection';
    }

    // Notify if replication setup, but replication not in license
    if (
      !notification_text &&
      replication.details?.data?.has_replication &&
      !status?.features?.includes(FEATURE_REPLICATION)
    ) {
      notification_text = t(
        'msg.replicationNotInLicense',
        'Replication feature is missing from license'
      );
      nav_url = '/protection';
    }

    // Notify if it4 is not in the features
    if (
      !notification_text &&
      status?.features &&
      !status?.features?.includes(FEATURE_IT4)
    ) {
      notification_text = t(
        'msg.it4NotInLicense',
        'Polchem Color Suit 4 feature is missing from license'
      );
      nav_url = '/protection';
    }

    if (!notification_text && replication.details?.data?.is_broken) {
      notification_text = t(
        'msg.replicationBroken',
        'Replication has not worked for 30 days, please check reason'
      );
    }

    return (
      notification_text && (
        <div className="notification_container">
          <div
            className="notification_box"
            onClick={() => this.navigateTo(nav_url)}
            style={{ cursor: nav_url ? 'pointer' : 'inherit' }}
          >
            <div>{notification_text}</div>
          </div>
          <div className="notification_line" />
        </div>
      )
    );
  };

  render() {
    const { t, login, router, login_required, lostpassword, itemstatus } =
      this.props;

    const is_dispensing = itemstatus === ORDER_STATUS_PREPARING;

    const slide_over = !(
      router.location.pathname === '/' ||
      router.location.pathname.startsWith('/config') ||
      router.location.pathname.startsWith('/protection')
    );

    return (
      <>
        {this.notification()}

        {!detectMobile() && (
          <div className="banner">
            {this.getAdvertisement()}
            {slide_over ? (
              <div id="move-in-to-place">
                <TopButtons dispensing={is_dispensing} order_creation={true} />
              </div>
            ) : null}
          </div>
        )}

        <Modal
          isOpen={!login.site_logged_in && login_required}
          centered
          modalClassName="login-modal"
        >
          <ModalHeader>
            {!window.qtside
              ? t('lbl.login', 'Login')
              : t('lbl.siteActivation', 'Site activation')}
          </ModalHeader>
          <ModalBody>
            <Alert
              color="info"
              isOpen={
                lostpassword.sendPasswordResetLink.pending &&
                this.state.show_send_password
              }
            >
              <Spinner />
              {t(
                'lbl.sendingPasswordRecoveryLink',
                'Sending password recover link please wait...'
              )}
            </Alert>
            <Alert
              color="danger"
              isOpen={
                lostpassword.sendPasswordResetLink.error !== null &&
                this.state.show_send_password
              }
            >
              <div>
                {t(
                  'lbl.sendingPasswordRecoveryLinkError',
                  'Error while sending password recover link'
                )}
              </div>
              <pre>
                {lostpassword.sendPasswordResetLink?.error?.response?.data?.msg}
              </pre>
              <div style={{ color: '#212529' }}>
                <div className="scroll" style={{ maxHeight: '15rem' }}>
                  {lostpassword.sendPasswordResetLink.error && (
                    <JSONPretty
                      id="json-pretty"
                      theme={ERROR_THEME}
                      data={errToJSON(lostpassword.sendPasswordResetLink.error)}
                    />
                  )}
                </div>
              </div>
            </Alert>
            <Alert
              color="success"
              isOpen={
                lostpassword.sendPasswordResetLink.data !== null &&
                this.state.show_send_password
              }
            >
              {lostpassword.sendPasswordResetLink?.data?.msg}
            </Alert>

            <p>
              {!window.qtside
                ? t('lbl.username', 'Username')
                : t('lbl.siteLoginName', 'Site login name')}
            </p>
            <Input
              data-testid="siteUsername"
              className="input-normal br-8"
              onChange={(e) => this.setState({ username: e.target.value })}
            />

            {window.qtside ? (
              <>
                <p>{t('lbl.activationCode', 'Activation code')}</p>
                <Input
                  data-testid="siteActivationCode"
                  className="input-normal br-8 mt-8"
                  type="text"
                  onChange={(e) =>
                    this.setState({ activationcode: e.target.value })
                  }
                  onKeyUp={(e) => {
                    if (e.keyCode === 13) this.login();
                  }}
                />
              </>
            ) : (
              !this.state.show_send_password && (
                <>
                  <p>{t('lbl.password', 'Password')}</p>
                  <InputGroup>
                    <Input
                      data-testid="sitePassword"
                      style={{ borderRadius: '5px 0 0 5px' }}
                      className="input-normal mt-8"
                      type={this.state.show ? 'text' : 'password'}
                      onChange={(e) =>
                        this.setState({ password: e.target.value })
                      }
                      onKeyUp={(e) => {
                        if (e.keyCode === 13) this.login();
                      }}
                    />
                    <InputGroupAddon addonType="append">
                      <Button
                        className="mt-8"
                        color="warning"
                        onClick={() =>
                          this.setState((state) => ({ show: !state.show }))
                        }
                        style={{
                          height: '48px',
                          //padding: '4px 10px',
                          borderRadius: '0 5px 5px 0',
                        }}
                      >
                        <FontAwesomeIcon
                          icon={this.state.show ? 'eye-slash' : 'eye'}
                        />
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </>
              )
            )}
            <Alert
              color="danger"
              className="mt-8 br-8"
              isOpen={
                login.site_login_error &&
                !this.state.show_send_password &&
                !login.site_login_error?.response?.data?.hide
              }
            >
              {login.site_login_error?.response?.data?.msg}
              <br />
              <pre className="font-italic m-0">
                {login.site_login_error && login.site_login_error.message}
              </pre>
            </Alert>
          </ModalBody>
          <ModalFooter>
            {!window.qtside && (
              <Button
                color="secondary"
                onClick={() =>
                  this.setState((og) => ({
                    show_send_password: !og.show_send_password,
                  }))
                }
              >
                {this.state.show_send_password
                  ? t('fn.backToLogin', '< Back to login')
                  : t('fn.forgotPassword', 'Forgot password?')}
              </Button>
            )}
            {this.state.show_send_password ? (
              <Button
                color="primary"
                onClick={() =>
                  this.props.sendPasswordResetLink(
                    this.state.username,
                    window.location.href
                  )
                }
                disabled={
                  lostpassword.sendPasswordResetLink.data ||
                  lostpassword.sendPasswordResetLink.pending ||
                  !this.state.username
                }
              >
                <i
                  className={
                    login.site_login_start ? 'fas fa-spinner fa-spin' : null
                  }
                />
                {t('fn.sendRecoverPasswordLink', 'Send recover password link')}
              </Button>
            ) : (
              <Button
                color="primary"
                onClick={this.login}
                disabled={login.site_login_start || !this.state.username}
              >
                <i
                  className={
                    login.site_login_start ? 'fas fa-spinner fa-spin' : null
                  }
                />{' '}
                {window.qtside
                  ? t('fn.activation', 'Activation')
                  : t('fn.login', 'Login')}
              </Button>
            )}
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

TopMenu.propTypes = {
  login_required: PropTypes.bool,
  logInSite: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  login: PropTypes.shape({
    site_logged_in: PropTypes.bool.isRequired,
    site_login_error: PropTypes.string,
    site_login_start: PropTypes.bool.isRequired,
  }),

  sendPasswordResetLink: PropTypes.func.isRequired,
  lostpassword: PropTypes.shape({
    sendPasswordResetLink: PropTypes.shape({
      data: PropTypes.any,
      pending: PropTypes.bool.isRequired,
      error: PropTypes.any,
    }),
  }),
  zone: PropTypes.shape({
    advertisement: PropTypes.array,
    zoneid: PropTypes.number,
  }),
  is_pro: PropTypes.bool.isRequired,

  router: PropTypes.shape(),
  i18n: PropTypes.object,

  configurations: PropTypes.shape({
    language: PropTypes.shape({
      value: PropTypes.string,
    }),
  }),

  offline: PropTypes.shape({
    time_remaining: PropTypes.object,
  }),

  replication: PropTypes.shape({
    details: PropTypes.shape({
      data: PropTypes.shape({
        has_replication: PropTypes.bool,
        is_broken: PropTypes.bool,
      }),
    }),
  }),
  status: PropTypes.shape({
    features: PropTypes.arrayOf(PropTypes.string),
    computerid: PropTypes.string,
    license_code: PropTypes.string,
    cloud: PropTypes.bool,
    status: PropTypes.number,
    daysleft: PropTypes.number,
    expdate: PropTypes.array,
    errmsg: PropTypes.string,
  }),
  navigateTo: PropTypes.func.isRequired,
  itemstatus: PropTypes.string,
};

function mapStateToProps(store) {
  return {
    login: store.login,
    router: store.router,
    offline: store.offline,
    zone: store.configurations.zone,
    configurations: store.configurations.config,
    lostpassword: store.lostpassword,
    is_pro: protectionSelectors.is_pro(store),
    replication: store.replication,
    status: store.protection.status,
    itemstatus: orderSelectors.itemstatus(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      logInSite: loginActions.logInSite,
      sendPasswordResetLink: lostPasswordActions.sendPasswordResetLink,
      navigateTo: push,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(TopMenu)
);

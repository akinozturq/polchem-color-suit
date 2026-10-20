import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  Label,
  Col,
  Row,
  Input,
  FormFeedback,
} from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import configActions, {
  selectors as configSelectors,
} from 'js/redux/reducers/Configuration';
import { MANUAL_LOGOUT, offline_mode } from '../../../Constants';
import { confirmAlert } from 'js/ext/react-confirm-alert/index';
import loginActions from 'js/redux/reducers/Login';
import isEmail from 'validator/es/lib/isEmail'; // Tree-shakeable import
import isMobilePhone from 'validator/es/lib/isMobilePhone';
import _ from 'lodash';
import Select from 'react-select';
import { customControlStyles, rightToLeft } from '../../../mylib/Utils';
import CountrySelect from '../../shared/CountrySelect';

const propTypes = {
  t: PropTypes.func.isRequired,
  updateSite: PropTypes.func.isRequired,
  accessDenied: PropTypes.func.isRequired,
  site: PropTypes.object.isRequired,
  systemgroups: PropTypes.arrayOf(
    PropTypes.shape({
      systemgroupid: PropTypes.number,
      systemgroupname: PropTypes.string,
    })
  ).isRequired,
  logOutSite: PropTypes.func.isRequired,
  is_standalone: PropTypes.bool.isRequired,
};

const defaultProps = {};

class SiteDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      emailError: false,
      phoneError: false,
    };
  }

  logOutSite = () => {
    const { t } = this.props;

    confirmAlert({
      title: t('msg.confirmLogOut.title', 'Confirm site logout'),
      message: t('msg.confirmLogOut', 'Are you sure you want to log out?'),
      buttons: [
        {
          label: t('fn.yes', 'Yes'),
          onClick: () => this.props.logOutSite(MANUAL_LOGOUT),
        },
        {
          label: t('fn.no', 'No'),
        },
      ],
    });
  };

  updateItem = (site, value, key) => {
    // Only update if changed

    if (site[key] !== value) {
      switch (key) {
        case 'phone':
          if (!this.state.phoneError) {
            this.props.updateSite({ ...site, [key]: value });
          }
          break;
        case 'email':
          if (!this.state.emailError) {
            this.props.updateSite({ ...site, [key]: value });
          }
          break;
        default:
          this.props.updateSite({ ...site, [key]: value });
          break;
      }
    }
  };

  validate(type, value) {
    switch (type) {
      case 'email':
        if (!isEmail(value)) {
          this.setState({
            emailError: true,
          });
        } else {
          this.setState({
            emailError: false,
          });
        }
        break;
      case 'phone':
        if (!isMobilePhone(value)) {
          this.setState({
            phoneError: true,
          });
        } else {
          this.setState({
            phoneError: false,
          });
        }
        break;
      default:
        break;
    }
  }

  render() {
    const { t, site, systemgroups, is_standalone } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';

    const disable = offline_mode;

    const trans = {
      sitename: t('lbl.siteName', 'Site name'),
      companyname: t('lbl.companyName', 'Company name'),
      phone: t('lbl.phone', 'Phone'),
      address1: t('lbl.address', 'Address'),
      postcode: t('lbl.postCode', 'Post code'),
      address2: t('lbl.city', 'City'),
      country: t('lbl.country', 'Country'),
      email: t('lbl.email_address', 'Email'),
      website: t('lbl.website', 'Website'),
      systemgroupid: t('lbl.systemGroup', 'System group'),
    };

    const field2Privilege = {
      companyname: 'companyName',
      postcode: 'postCode',
    };

    const keys = [
      'sitename',
      'companyname',
      'phone',
      'address1',
      'postcode',
      'address2',
      'country',
      'email',
      'website',
    ];

    if (systemgroups && systemgroups.length > 1) {
      keys.push('systemgroupid');
    }

    const fields = keys.map((key) => {
      if (key === 'systemgroupid') {
        return (
          <FormGroup row key={key}>
            <Label sm={5} data-testid="systemgroupid">
              {trans[key]}
            </Label>
            <Col sm={7}>
              <Select
                id="systemgroupid"
                menuPlacement="auto"
                styles={{
                  control: customControlStyles,
                  option: (base) => ({ ...base, color: 'black' }),
                }}
                isSearchable={false}
                onChange={(value) => this.updateItem(site, value.value, key)}
                options={(systemgroups || []).map((x) => ({
                  label: x.systemgroupname,
                  value: x.systemgroupid,
                }))}
                value={{
                  value: site.systemgroupid,
                  label: systemgroups.find(
                    (x) => x.systemgroupid === site.systemgroupid
                  )?.systemgroupname,
                }}
                defaultValue={{
                  value: site.systemgroupid,
                  label: systemgroups.find(
                    (x) => x.systemgroupid === site.systemgroupid
                  )?.systemgroupname,
                }}
              />
            </Col>
          </FormGroup>
        );
      } else if (key === 'country') {
        return (
          <FormGroup row key={key}>
            <Label sm={5}>{trans[key]}</Label>
            <Col sm={7}>
              <CountrySelect
                value={site.country}
                isDisabled={
                  disable ||
                  this.props.accessDenied(
                    'siteInfo.' + _.get(field2Privilege, key, key)
                  )
                }
                onChange={(e) => this.updateItem(site, e?.code, key)}
              />
            </Col>
          </FormGroup>
        );
      } else {
        return (
          <FormGroup row key={key}>
            <Label sm={5}>{trans[key]}</Label>
            <Col sm={7}>
              <Input
                type={
                  key === 'phone' ? 'tel' : key === 'email' ? 'email' : 'text'
                }
                disabled={
                  disable ||
                  this.props.accessDenied(
                    'siteInfo.' + _.get(field2Privilege, key, key)
                  )
                }
                defaultValue={site[key]}
                onBlur={(event) =>
                  this.updateItem(site, event.target.value, key)
                }
                onChange={(event) =>
                  this.validate(
                    key === 'phone'
                      ? 'phone'
                      : key === 'email'
                        ? 'email'
                        : 'text',
                    event.target.value
                  )
                }
                invalid={
                  key === 'phone'
                    ? this.state.phoneError
                    : key === 'email'
                      ? this.state.emailError
                      : false
                }
                onKeyUp={(event) => {
                  if (event.key === 'Enter')
                    this.updateItem(site, event.target.value, key);
                }}
              />
              {key === 'email' && this.state.emailError && (
                <FormFeedback>
                  {t('cfg.email_is_not_valid', 'Email is not valid !')}
                </FormFeedback>
              )}
              {key === 'phone' && this.state.phoneError && (
                <FormFeedback>
                  {t(
                    'cfg.phone_number_is_not_valid',
                    'Phone number is not valid !'
                  )}
                </FormFeedback>
              )}
            </Col>
          </FormGroup>
        );
      }
    });

    return (
      <Card
        style={{ height: 'calc((100vh - 102px) - 6rem)' }}
        className="config-card"
        dir={direction}
      >
        <CardHeader className="config-card-header" dir={direction}>
          {t('cfg.h_site_information')}
        </CardHeader>
        <CardBody className="scroll config-card-body" dir={direction}>
          <FormGroup row>
            <Label sm={5}>{t('lbl.siteId', 'Site ID')}</Label>
            <Col sm={7}>
              <Input type="text" defaultValue={site.siteid} disabled />
            </Col>
          </FormGroup>
          {fields}
          <Row>
            <Col sm={5} />
            <Col sm={7}>
              {t(
                'lbl.pleaseReloadAfterChanges',
                'Please reload page after making changes'
              )}
            </Col>
          </Row>
          <Row>
            <Col className="m-16">
              <Button
                color="danger"
                onClick={this.logOutSite}
                disabled={disable || is_standalone}
              >
                {t('fn.logOutSite', 'Log out site')}
              </Button>
            </Col>
          </Row>
        </CardBody>
      </Card>
    );
  }
}

SiteDetails.propTypes = propTypes;
SiteDetails.defaultProps = defaultProps;
/**
 * Mapping redux store configurations as this.props.configurations
 * @param {} state
 */
function mapStateToProps(state) {
  return {
    site: state.configurations.site,
    systemgroups: state.configurations.systemgroups,
    is_standalone: configSelectors.is_standalone(state),
  };
}

/**
 * Connection actions here
 * @param {} dispatch
 */
function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      updateSite: configActions.updateSite,
      logOutSite: loginActions.logOutSite,
    },
    dispatch
  );
}

/**
 * Wrapped with translations and connect to store.
 */
export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(SiteDetails)
);

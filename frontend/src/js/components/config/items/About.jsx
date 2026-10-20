import {
  Card,
  CardBody,
  CardHeader,
  Col,
  FormGroup,
  Input,
  Label,
} from 'reactstrap';
import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { rightToLeft } from '../../../mylib/Utils';

import { eula } from './Eula';
import PropTypes from 'prop-types';
import { CURRENT_VERSION } from '../../../../version';
import { connect } from 'react-redux';

const CustomFormGroup = ({ label, value, dataTestId }) => (
  <FormGroup row>
    <Label sm={5}>{label}</Label>
    <Col
      sm={7}
      style={{
        paddingTop: '0.5rem',
        zIndex: '0',
        display: 'inline-flex',
      }}
    >
      <Input
        type="text"
        defaultValue={value}
        data-testid={dataTestId}
        disabled
      />
    </Col>
  </FormGroup>
);

CustomFormGroup.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  dataTestId: PropTypes.string,
};

class About extends Component {
  render() {
    const { t, version_details } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';
    let versions = {};
    try {
      versions = JSON.parse(window.installed_versions);
    } catch (e) {
      versions = {
        Component: {
          rep: 'N/A',
        },
        Application: {
          driver: 'N/A',
          it_utility: 'N/A',
          licensingserver: 'N/A',
        },
      };
    }

    return (
      <Card
        style={{ height: 'calc((100vh - 102px) - 6rem)' }}
        className="config-card"
        dir={direction}
      >
        <CardHeader className="config-card-header" dir={direction}>
          {t('cfg.h_about')}
        </CardHeader>
        <CardBody className="scroll config-card-body" dir={direction}>
          <CustomFormGroup
            label={t('lbl.versionNumber.colon', 'Version number:')}
            value={CURRENT_VERSION}
          />
          <CustomFormGroup
            label={t(
              'lbl.databaseVersionNumber.colon',
              'Database version number:'
            )}
            value={version_details?.database_version_number}
            dataTestId="db-version"
          />
          <CustomFormGroup
            label={t(
              'lbl.replication_version.colon',
              'Replication version number:'
            )}
            value={versions?.Component?.rep}
            dataTestId="rep-version"
          />
          <CustomFormGroup
            label={t(
              'lbl.driver_version.colon',
              'Tinting driver version number:'
            )}
            value={versions?.Application?.driver}
            dataTestId="driver-version"
          />
          <CustomFormGroup
            label={t('lbl.it_utility.colon', 'IT utility version number:')}
            value={versions?.Application?.it_utility}
            dataTestId="it_utility-version"
          />
          <CustomFormGroup
            label={t(
              'lbl.licensing_server.colon',
              'Licensing server version number:'
            )}
            value={versions?.Application?.licensingserver}
            dataTestId="it_utility-version"
          />

          <div className="row col-xs-12">{eula}</div>
        </CardBody>
      </Card>
    );
  }
}

About.propTypes = {
  t: PropTypes.func.isRequired,
  version_details: PropTypes.object,
};

function mapStateToProps(state) {
  return {
    version_details: state.update_checker.version_details,
  };
}

/**
 * Wrapped with translations and connect to store.
 */
export default withTranslation('translations')(
  connect(mapStateToProps, null)(About)
);

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as configSelectors } from '../../../redux/reducers/Configuration';
import errorsActions from '../../../redux/reducers/Errors';
import {
  default as machineActions,
  selectors as machineSelectors,
} from '../../../redux/reducers/Machine';
import { useTranslation } from 'react-i18next';
import {
  default as minigdataActions,
  selectors as minigdataSelectors,
} from '../../../redux/reducers/MiniGData';
import { Alert, Button, Col, Row } from 'reactstrap';
import PropTypes from 'prop-types';
import Spinner from '../../shared/Spinner';
import { MIMETYPE_MAP } from '../../../mylib/mimetypes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BootstrapTable from 'react-bootstrap-table-next';
import { download_client_data } from '../../../api/Machine';
import { CustomScrollbars, rightToLeft } from '../../../mylib/Utils';
import SimpleModal from '../../shared/SimpleModal';
import { confirmAlert } from '../../../ext/react-confirm-alert';
import { selectors as cacheSelectors } from 'js/redux/reducers/Cache';
import { dateTimeToLocaleString } from '../../../mylib/DateUtils';

export function downloadClientData(siteid, dataid, filename, onError) {
  download_client_data({ siteid, dataid })()
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
    })
    .catch(onError);
}

function MachineBackup(props) {
  const { t } = useTranslation();
  const localclient = useSelector(configSelectors.localclient);
  const backup_in_progress = useSelector(machineSelectors.backup_in_progress);
  const clientdata = useSelector(machineSelectors.clientdata);
  const generateminigdata = useSelector(minigdataSelectors.generateminigdata);
  const listminigdata = useSelector(minigdataSelectors.listminigdata);
  const colorants = useSelector(cacheSelectors.cnts);
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);

  const isRtl = rightToLeft();
  const direction = isRtl ? 'rtl' : 'ltr';

  const has_privilege = (priv) => {
    return props.privileges.includes(priv);
  };

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (localclient?.clientid) {
      dispatch(machineActions.fetchClientData(localclient?.clientid));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localclient]);

  useEffect(() => {
    dispatch(minigdataActions.listGdata());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateminigdata?.data]);

  useEffect(() => {
    if (generateminigdata?.data) {
      setVisible(true);
    }
  }, [generateminigdata?.data, setVisible]);

  // Check that there are no matching colorants in minigdata already
  const existing =
    listminigdata?.data?.map((d) => d.cntset.sort().join(';')) || [];

  const disable_generate = existing.includes(
    colorants
      .map((d) => d.cntcode)
      .sort()
      .join(';')
  );

  const deleteBackup = ({ datakey, dataid }) => {
    confirmAlert({
      title: t(
        'msg.confirmDeleteMachineBackup.title',
        'Confirm machine backup deletion'
      ),
      message: t(
        'msg.confirmDeleteMachineBackup',
        'Are you sure want to delete "{{datakey}}"?',
        { datakey }
      ),
      buttons: [
        {
          label: t('fn.yes', 'Yes'),
          onClick: () => {
            dispatch(machineActions.deleteClientData(dataid));
          },
        },
        {
          label: t('fn.no', 'No'),
        },
      ],
    });
  };

  const buttonsFormatter = (cell, row) => {
    const filename = row.datakey + '.' + MIMETYPE_MAP.get(row.mimetype);
    const handleError = (error) => {
      dispatch(
        errorsActions.showCriticalError(
          t('msg.downloadBackupError', 'Error downloading backup file'),
          error
        )
      );
    };
    return (
      <div style={{ direction }}>
        <Button
          data-cy={'download_clientdata'}
          disabled={backup_in_progress || !has_privilege('clientdata_download')}
          data-denied={!has_privilege('clientdata_download')}
          onClick={() =>
            downloadClientData(
              localclient?.siteid,
              row.dataid,
              filename,
              handleError
            )
          }
        >
          <FontAwesomeIcon icon="download" /> {t('fn.download', 'Download')}
        </Button>
        <Button
          data-cy={'delete_clientdata'}
          disabled={!has_privilege('clientdata_delete')}
          data-denied={!has_privilege('clientdata_delete')}
          onClick={() => deleteBackup(row)}
        >
          <FontAwesomeIcon icon="trash-alt" /> {t('fn.delete', 'Delete')}
        </Button>
      </div>
    );
  };

  const modifiedFormatter = (cell, row) => {
    return <div>{row.modificationdate ? dateTimeToLocaleString(cell) : ''}</div>;
  };

  const columns = [
    {
      dataField: 'modificationdate',
      text: t('lbl.creationdate', 'Creation date'),
      formatter: modifiedFormatter,
    },
    {
      dataField: 'datakey',
      text: t('lbl.backup_type', 'Backup type'),
    },
    {
      dataField: 'notes',
      text: t('lbl.notes', 'Notes'),
    },
    {
      dataField: 'actions',
      text: '',
      formatter: buttonsFormatter,
    },
  ];

  return (
    <>
      <Row style={{ marginBottom: '0.5rem', marginTop: '0.5rem' }}>
        <Col className="machine-backup" style={{ direction }}>
          <CustomScrollbars
            className="br-8"
            style={{
              height: 'calc(100vh - 102px - 12rem) ',
              background: 'white',
            }}
          >
            <BootstrapTable
              keyField="dataid"
              striped
              hover
              data={clientdata.data}
              columns={columns}
              direction={direction}
              noDataIndication={t('lbl.no_backups', 'No backups available')}
            />
          </CustomScrollbars>
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <Button
            data-testid="machine_install_minigdata"
            onClick={() => dispatch(minigdataActions.generateMiniGdata())}
            disabled={
              disable_generate ||
              generateminigdata.pending ||
              !has_privilege('automatic_dispensers_config')
            }
            data-denied={!has_privilege('automatic_dispensers_config')}
          >
            {generateminigdata.pending && <Spinner />}
            {disable_generate
              ? t('fn.minigdata_installed', 'Minigdata installed')
              : t('fn.install_minigdata', 'Install minigdata')}
          </Button>
        </Col>
        <Col />
        <Col xs={3}>
          <Button
            data-testid="machine_take_backup"
            onClick={() => setShowModal(true)}
            disabled={
              backup_in_progress ||
              !has_privilege('clientdata_new') ||
              !props.commands.backup
            }
            data-denied={!has_privilege('clientdata_new')}
          >
            {backup_in_progress && <Spinner />}
            {t('fn.take_backup', 'Take backup')}
          </Button>
        </Col>
      </Row>
      <Alert
        style={{ position: 'fixed', bottom: '3rem', left: '2rem' }}
        color="success"
        isOpen={visible}
        toggle={() => setVisible(false)}
      >
        {t('msg.minigdata_installed', 'Minigdata installed successfully!')}
      </Alert>

      <SimpleModal
        header={t('lbl.backup_notes', 'Notes for backup')}
        edited={(notes) => dispatch(machineActions.backup(props.dispID, notes))}
        prompt={t('lbl.notes', 'Notes')}
        save={t('fn.backup', 'Backup')}
        cancel={t('fn.cancel', 'Cancel')}
        show={showModal}
        hideModal={() => setShowModal(false)}
      />
    </>
  );
}

MachineBackup.propTypes = {
  dispID: PropTypes.string.isRequired,
  privileges: PropTypes.arrayOf(PropTypes.string).isRequired,
  commands: PropTypes.object.isRequired,
};

export default MachineBackup;

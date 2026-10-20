import { Component } from 'react';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { Button, Col, Row, Table } from 'reactstrap';

import { PreviewBox } from '../../shared/order/ColorPreview';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import spectroActions, { selectors } from '../../../redux/reducers/Spectro';

import { rightToLeft } from '../../../mylib/Utils';
import './styles.scss';

// Values for measureMode prop
export const MEASURE_TARGET = 'MEASURE_TARGET';
export const MEASURE_PAINT = 'MEASURE_PAINT';

class MeasurePanel extends Component {
  state = {
    downloadClicked: false,
  };

  componentDidMount() {
    this.props.fetchSpectroStatus();
  }

  render() {
    const {
      measureMode,
      measure,
      setMeasurement,
      hasMeasurement,
      t,
      spectro_status,
      spectro_busy,
      spectro_error,
      calibrate,
      download,
      spectro_downloaded_measurements,
      clear,
    } = this.props;

    const columns = [
      {},
      { text: t('lbl.colorName') },
      { text: t('lbl.color') },
    ];
    const columnWidth = spectro_status?.download ? 4 : 6;

    const show_calibration_error =
      spectro_error || (!spectro_busy && !this.state.downloadClicked);
    const isRtl = rightToLeft();
    const direction = isRtl ? 'rtl' : 'ltr';

    return (
      <div style={{ height: '100%' }}>
        <Row>
          <Col>
            <Button
              data-testid="btn_measure"
              disabled={
                (spectro_status && spectro_status.calibrationNeeded) ||
                spectro_busy ||
                !spectro_status
              }
              onClick={() => {
                this.setState(() => ({
                  downloadClicked: false,
                }));
                measure();
              }}
            >
              {spectro_busy ? (
                <FontAwesomeIcon icon="spinner" spin />
              ) : (
                t('fn.measure')
              )}
            </Button>
          </Col>
          <Col md={columnWidth}>
            {spectro_status?.calibrationSequence?.length && (
              <Button
                disabled={spectro_busy || !spectro_status}
                onClick={() => {
                  this.setState(() => ({ downloadClicked: false }));
                  calibrate();
                }}
              >
                {spectro_busy ? (
                  <FontAwesomeIcon
                    icon="spinner"
                    style={{ display: 'inline-block' }}
                    spin
                  />
                ) : (
                  t('fn.calibrate')
                )}
              </Button>
            )}
          </Col>
          {spectro_status?.download && (
            <Col md={columnWidth}>
              <Button
                data-testid="btn_memory"
                disabled={
                  spectro_busy || !spectro_status || !spectro_status.storedCount
                }
                onClick={() => {
                  this.setState(() => ({ downloadClicked: true }));
                  download();
                }}
              >
                {spectro_busy ? (
                  <FontAwesomeIcon
                    icon="spinner"
                    style={{ display: 'inline-block' }}
                    spin
                  />
                ) : (
                  t('fn.memory_of_spectro', 'Memory')
                )}
              </Button>
            </Col>
          )}
        </Row>
        {this.state.downloadClicked && !spectro_busy && (
          <div
            className={'scroll mt-2'}
            style={{ height: 'calc(100% - 3rem)' }}
          >
            <Table size="md" dir={direction}>
              <thead style={{ textAlign: 'center' }}>
                <tr className={'memory-color-item'}>
                  {columns.map((name, index) => (
                    <th key={name.text + index}>{name.text}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {spectro_downloaded_measurements.map((m, index) => (
                  <tr
                    className={'memory-color-item'}
                    key={m.name + index}
                    onClick={() => setMeasurement(m)}
                  >
                    <td> {index + 1}</td>
                    <td> {m.name}</td>
                    <td>
                      <PreviewBox color={m.rgb} height="3.5vh" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div
              className={'mt-1'}
              style={{
                display: 'flex',
                justifyContent: isRtl ? 'flex-start' : 'flex-end',
              }}
            >
              {!!spectro_downloaded_measurements.length && (
                <Button
                  color="danger"
                  disabled={
                    spectro_busy ||
                    !spectro_status ||
                    !spectro_status.storedCount
                  }
                  onClick={() => {
                    this.setState(() => ({
                      downloadClicked: false,
                    }));
                    clear();
                  }}
                  style={{ width: 'unset' }}
                >
                  {spectro_busy ? (
                    <FontAwesomeIcon
                      icon="spinner"
                      style={{ display: 'inline-block' }}
                      spin
                    />
                  ) : (
                    t('fn.clearMemory_of_spectro', 'Clear memory')
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {show_calibration_error && (
          <Row className="align-items-center">
            {spectro_error && (
              <>
                <FontAwesomeIcon icon="exclamation-triangle" />
                <p className="calibrate__status">{spectro_error.message}</p>
              </>
            )}
            <p
              className="calibrate__status"
              data-testid={`spectro_status_message_${measureMode.toLowerCase()}`}
            >
              {!spectro_busy &&
                !this.state.downloadClicked &&
                (spectro_status
                  ? spectro_status.calibrationNeeded
                    ? t('lbl.calibrationNeeded')
                    : measureMode === MEASURE_TARGET
                      ? hasMeasurement
                        ? t(
                            'msg.spectroMeasureReplaceTarget',
                            'Place the target color sample and read to replace existing measurement.'
                          )
                        : t(
                            'msg.spectroMeasureTarget',
                            'Place the target color sample and read.'
                          )
                      : hasMeasurement
                        ? t(
                            'msg.spectroMeasureReplacePaint',
                            'Place the paint sample and read to replace existing measurement.'
                          )
                        : t(
                            'msg.spectroMeasurePaint',
                            'Place the paint sample and read.'
                          )
                  : t('msg.spectroNotFound'))}
            </p>
          </Row>
        )}
      </div>
    );
  }
}

MeasurePanel.propTypes = {
  // props from parent component
  measureMode: PropTypes.oneOf([MEASURE_TARGET, MEASURE_PAINT]).isRequired,
  measure: PropTypes.func.isRequired, // function to measure with spectro
  setMeasurement: PropTypes.func.isRequired, // function to save measurement result
  hasMeasurement: PropTypes.bool, // whether there is already a measurement for the current mode (target or paint)

  // props from redux and i18n
  t: PropTypes.func.isRequired,
  spectro_busy: PropTypes.bool.isRequired,
  spectro_status: PropTypes.object,
  spectro_error: PropTypes.object,
  spectro_downloaded_measurements: PropTypes.array,
  calibrate: PropTypes.func,
  download: PropTypes.func,
  clear: PropTypes.func,
  fetchSpectroStatus: PropTypes.func,
};

const mapStateToProps = (state) => ({
  spectro_downloaded_measurements: selectors.downloaded_measurements(state),
  spectro_busy: selectors.busy(state),
  spectro_status: selectors.status(state),
  spectro_error: selectors.error(state),
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      calibrate: spectroActions.calibrate,
      fetchSpectroStatus: spectroActions.fetchStatus,
      download: spectroActions.fetchDownload,
      clear: spectroActions.clearStoredMeasurements,
    },
    dispatch
  );
};

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(MeasurePanel)
);

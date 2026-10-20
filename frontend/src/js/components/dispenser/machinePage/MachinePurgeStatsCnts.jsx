import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Col, Row, Table } from 'reactstrap';
import { CustomScrollbars, spinner } from '../../../mylib/Utils';
import { propType as machineType } from '../../../redux/reducers/Machine';
import ColorThumbnail from '../../shared/ColorThumbnail';
import { dateTimeToLocaleString } from '../../../mylib/DateUtils';
import { NumberFormatter } from 'polchem_base/common/formatters/NumberFormatter';

function MachinePurgeStatsCnts({ machine, t, purge }) {
  const [cntcode, setCntcode] = useState(null);

  const selected_style = {
    backgroundColor: 'darkblue',
  };
  const rows = machine.colorants.map((c) => (
    <tr key={c.id} style={cntcode === c.code ? selected_style : {}}>
      <td className="pointer-cursor" onClick={() => setCntcode(c.code)}>
        <Row>
          <Col xs={'auto'}>
            <ColorThumbnail rgb={c.rgb} size="24px" />
          </Col>
          <Col>{c.code}</Col>
        </Row>
      </td>
    </tr>
  ));

  let details = (
    <tr>
      <td colSpan={2}>{t('lbl.noData', 'No data')}</td>
    </tr>
  );
  if (purge.pending) {
    details = (
      <tr>
        <td colSpan={2}>{spinner('5rem')}</td>
      </tr>
    );
  } else {
    const filtered = purge.data.filter((x) => x.cntcode === cntcode);
    if (filtered.length) {
      const nf = new NumberFormatter({ decimals: 1 });
      details = filtered.map((c) => (
        <tr key={c.datetime}>
          <td>{dateTimeToLocaleString(c.datetime)}</td>
          <td>{nf.format(c.volume)}</td>
        </tr>
      ));
    }
  }
  return (
    <CustomScrollbars style={{ height: '65vh' }}>
      <Row>
        <Col>
          <Table size="xs" bordered>
            <thead>
              <tr>
                <td>{t('lbl.colorantInMachine', 'Colorant in machine')}</td>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </Table>
        </Col>
        <Col>
          <Table size="xs" bordered>
            <thead>
              <tr>
                <td>{t('lbl.dispenseDateTime', 'Dispense date time')}</td>
                <td>{t('lbl.volumeMl', 'Volume (ml)')}</td>
              </tr>
            </thead>
            <tbody>{details}</tbody>
          </Table>
        </Col>
      </Row>
    </CustomScrollbars>
  );
}

MachinePurgeStatsCnts.propTypes = {
  t: PropTypes.func.isRequired,
  machine: machineType,
  purge: PropTypes.shape({
    pending: PropTypes.bool.isRequired,
    data: PropTypes.any,
    error: PropTypes.any,
  }),
};

function mapStateToProps(state) {
  return {
    purge: state.statistics.purge,
  };
}

export default withTranslation('translations')(
  connect(mapStateToProps)(MachinePurgeStatsCnts)
);

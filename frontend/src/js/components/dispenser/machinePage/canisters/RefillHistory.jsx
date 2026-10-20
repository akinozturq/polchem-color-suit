import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import { CustomScrollbars, convertUTCDateToLocalDate } from 'js/mylib/Utils';

import { dateTimeToLocaleString } from '../../../../mylib/DateUtils';

const propTypes = {
  t: PropTypes.func.isRequired,
  canister: PropTypes.object,
  refills_list: PropTypes.array,
  levelFormatter: PropTypes.object,
};

export default function RefillHistory({
  t,
  canister,
  refills_list,
  levelFormatter,
}) {
  return (
    <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
      <h1>{canister?.code}</h1>
      <CustomScrollbars style={{ height: 'calc((100vh - 102px) - 22rem)' }}>
        <Table>
          <thead>
            <tr style={{ backgroundColor: 'rgb(17, 46, 64)' }}>
              <th>{t('lbl.batchRefillDate', 'Date & Time')}</th>
              <th>{t('lbl.batch', 'Batch')}</th>
              <th>{t('lbl.batchAmount', 'Amount')}</th>
              <th>{t('lbl.batchNotes', 'Note')}</th>
              <th>{t('lbl.batchRefillUser', 'User')}</th>
            </tr>
          </thead>
          <tbody>
            {canister &&
              refills_list &&
              refills_list
                .filter((can) => can.canisterIndex === canister.id)
                .map((cb, index) => (
                  <tr key={index}>
                    <td>
                      {dateTimeToLocaleString(
                        convertUTCDateToLocalDate(new Date(cb.date))
                      )}
                    </td>
                    <td>{cb.batch}</td>
                    <td>{`${levelFormatter.format({
                      volume: cb.volume,
                      specificgravity: canister.specificgravity,
                    })} ${levelFormatter.getUnitName()}`}</td>
                    <td>{cb.note}</td>
                    <td>{cb.user}</td>
                  </tr>
                ))}
          </tbody>
        </Table>
      </CustomScrollbars>
    </div>
  );
}

RefillHistory.propTypes = propTypes;

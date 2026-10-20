import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  CustomScrollbars,
  convertUTCDateToLocalDate,
  sortByKey,
} from 'js/mylib/Utils';
import { dateTimeToLocaleString } from '../../../../mylib/DateUtils';

const propTypes = {
  t: PropTypes.func.isRequired,
  canister: PropTypes.object,
  canisterid: PropTypes.number,
  refills_batch_list: PropTypes.array,
  cache_cnts: PropTypes.array,
};

export default function ColorantBatches({
  t,
  canister,
  canisterid,
  refills_batch_list,
  cache_cnts,
}) {
  const [selectedBatch, selectBatch] = useState(null);

  if (!refills_batch_list) return null;

  //Colorant batch info from machine
  let colorantBatches = refills_batch_list?.filter(
    (colorant) => colorant.canisterIndex === canisterid
  );
  colorantBatches = sortByKey(colorantBatches, 'percentage');

  //Colorant batch info from db
  const colorantBatchesDb =
    canister && cache_cnts?.find((can) => can.cntid === canister.cntid);
  const findBatchinfo = (batchInMachine) =>
    colorantBatchesDb?.cntbatchinfo?.find(
      (batch) => batch.cntbatch === batchInMachine?.batch
    );
  const displayNote = findBatchinfo(selectedBatch)?.notes;

  return (
    <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
      <h1>{canister?.code}</h1>
      <CustomScrollbars style={{ height: 'calc((100vh - 102px) - 25rem)' }}>
        <Table hover>
          <thead>
            <tr style={{ backgroundColor: 'rgb(17, 46, 64)' }}>
              <th />
              <th />
              <th>{t('lbl.batch', 'Batch')}</th>
              <th>{t('lbl.batchFill', 'Fill')}</th>
              <th>{t('lbl.batchAmount', 'Batch amount')}</th>
              <th>{t('lbl.batchExpirationDate', 'Expiration date')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {colorantBatches.map((cb, index) => {
              const batchinfo = findBatchinfo(cb);
              return (
                <tr
                  onClick={() => selectBatch(cb)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor:
                      selectedBatch?.batch === cb.batch && 'white',
                    color: selectedBatch?.batch === cb.batch && 'black',
                  }}
                  key={index}
                >
                  <th scope="row" />
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '1.5em',
                      }}
                    >
                      {batchinfo?.blocked && <FontAwesomeIcon icon="lock" />}
                      {batchinfo?.expired && (
                        <FontAwesomeIcon icon="calendar-times" />
                      )}
                    </div>
                  </td>
                  <td>{cb.batch}</td>
                  <td>{`${Math.floor(cb.percentage * 100)}%`}</td>
                  <td>
                    {Math.floor(cb.percentage * 100 <= 0.1)
                      ? 0
                      : Math.round(cb.batchVolume * 100.0) / 100}
                  </td>
                  <td>
                    {batchinfo?.expirationdate
                      ? dateTimeToLocaleString(
                          convertUTCDateToLocalDate(
                            new Date(batchinfo?.expirationdate)
                          )
                        )
                      : cb.expirationDate &&
                        dateTimeToLocaleString(
                          convertUTCDateToLocalDate(new Date(cb.expirationDate))
                        )}
                  </td>
                  <td>
                    {batchinfo?.notes && (
                      <FontAwesomeIcon
                        style={{ fontSize: '1.5em' }}
                        onClick={() => selectBatch(cb)}
                        icon="file"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </CustomScrollbars>
      {displayNote && (
        <div>
          <p>{t('lbl.notes.colon', 'Notes:')}</p>
          <p>{displayNote}</p>
        </div>
      )}
    </div>
  );
}
ColorantBatches.propTypes = propTypes;

import React from 'react';
import ColorThumbnail from '../shared/ColorThumbnail';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dateTimeToLocaleString } from '../../mylib/DateUtils';
import { rightToLeft } from '../../mylib/Utils';

export const dateTimeFormatter = (cell, row) => {
  return dateTimeToLocaleString(row.orderdate);
};

export const siteDateTimeFormatter = (cell, row, sitemap) => {
  return (
    <div>
      {dateTimeToLocaleString(row.orderdate)}
      <br />
      {sitemap.get(row.siteid)?.sitename || row.siteid}
    </div>
  );
};

export const productnameBasecodeFormatter = (cell, row) => {
  return (
    <div>
      {row.productname}
      <br />
      {row.basecode}
    </div>
  );
};

export const cansizeNcansFormatter = (cell, row) => {
  return (
    <div>
      {row.cansizecode}
      <br />
      {row.ncans}
    </div>
  );
};

export const orderIdItemIDFormatter = (cell, row) => {
  return (
    <div>
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
        {row.orderid}
      </div>
      <div>/ {row.itemid}</div>
    </div>
  );
};

export const colorFormatter = (cell, row) => {
  const isRtl = rightToLeft();
  return (
    <div>
      <div
        style={{
          display: 'inline-flex',
          flexDirection: isRtl ? 'row-reverse' : 'row',
        }}
      >
        <ColorThumbnail rgb={row.rgb} size="24px" />
        <div
          className="fill-available"
          style={{
            marginLeft: isRtl ? 0 : '0.5rem',
            marginRight: isRtl ? '0.5rem' : 0,
          }}
        >
          {row.colourcode}
        </div>
      </div>
      <br />
      {row.colourname}
    </div>
  );
};

export const notesFormatter = (notes, itemnotes, setNotes) => {
  const isRtl = rightToLeft();
  let total_notes = '';
  if (notes && itemnotes) {
    total_notes = `${notes} / ${itemnotes}`;
  } else if (notes) {
    total_notes = notes;
  } else if (itemnotes) {
    total_notes = itemnotes;
  }

  const content = total_notes.substring(0, 120);
  const overflow = total_notes.length > 200;
  return (
    <div
      onClick={(e) => {
        if (overflow) {
          e.stopPropagation();
          if (notes && itemnotes) {
            setNotes(
              <>
                <div>{notes} </div> <hr /> <div>{itemnotes}</div>
              </>
            );
          } else if (notes) {
            setNotes(notes);
          } else if (itemnotes) {
            setNotes(itemnotes);
          }
        }
      }}
    >
      {content}

      {overflow && (
        <FontAwesomeIcon
          className={isRtl ? 'fa-pull-left' : 'fa-pull-right'}
          icon={'fa-arrow-up-right-from-square'}
        />
      )}
    </div>
  );
};

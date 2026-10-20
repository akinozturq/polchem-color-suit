import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PropTypes from 'prop-types';
import { parse, format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_DATE_FORMATS,
  sanitizeMomentDateFormat,
  toDateFnsFormat,
} from '../../mylib/DateFormat';

export const CustomDatePicker = (props) => {
  const { t } = useTranslation();
  const {
    prefix,
    selected,
    onChange,
    direction = 'ltr',
    ...forward_props
  } = props;
  const isRtl = direction === 'rtl';

  let value = null;

  // Parse date from selected if it is a string (e.g. from API) fallback to null if parsing fails

  if (selected instanceof Date) {
    value = selected;
  } else if (typeof selected === 'string' && selected.length > 0) {
    try {
      value = parse(selected, 'yyyy-MM-dd', new Date());
    } catch (e) {
      value = null;
    }
  }

  if (!(value instanceof Date)) {
    value = null;
  }

  const is_touch_screen = window.matchMedia('(pointer: coarse)').matches;

  let dateFormat = toDateFnsFormat(DEFAULT_DATE_FORMATS.date);

  try {
    const safeMomentDateFormat = sanitizeMomentDateFormat(
      t('format.date', DEFAULT_DATE_FORMATS.date)
    );
    dateFormat = toDateFnsFormat(safeMomentDateFormat);
  } catch (e) {
    dateFormat = toDateFnsFormat(DEFAULT_DATE_FORMATS.date);
  }

  return (
    <div
      className={'datepicker-container'}
      dir={direction}
      style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}
    >
      {prefix && (
        <span
          className={'datepicker-prefix'}
          style={{
            borderRadius: isRtl ? '0 0.25rem 0.25rem 0' : undefined,
          }}
        >
          {prefix}
        </span>
      )}
      <DatePicker
        className={
          'react-datepicker-input ' +
          (prefix ? 'with-prefix' : '') +
          (isRtl ? ' rtl' : '')
        }
        //showIcon={true}
        showIcon
        toggleCalendarOnIconClick
        selected={value}
        onChange={(date) => {
          onChange(date ? format(date, 'yyyy-MM-dd') : null);
        }}
        strictParsing={true}
        dateFormat={dateFormat}
        placeholderText={dateFormat}
        withPortal={is_touch_screen}
        {...forward_props}
        autoComplete={'off'}
      />
    </div>
  );
};

CustomDatePicker.propTypes = {
  selected: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  prefix: PropTypes.string,
  direction: PropTypes.string,
};

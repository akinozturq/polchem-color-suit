import { pad } from 'js/mylib/Utils';
import moment from 'moment';
import { t } from 'i18next';
import { formatISO, lightFormat, startOfMonth } from 'date-fns';
import {
  DEFAULT_DATE_FORMATS,
  sanitizeMomentDateFormat,
  sanitizeMomentDateTimeFormat,
  sanitizeMomentTimeFormat,
} from './DateFormat';

const SAFE_FORMAT_CACHE = {};

function getSafeFormat(formatType) {
  const rawFormat =
    window.dateTimeFormats?.[formatType] ??
    t(`format.${formatType}`, DEFAULT_DATE_FORMATS[formatType]);

  const cached = SAFE_FORMAT_CACHE[formatType];
  if (cached && cached.raw === rawFormat) {
    return cached.safe;
  }

  let safeFormat;

  if (formatType === 'date') {
    safeFormat = sanitizeMomentDateFormat(rawFormat);
  } else if (formatType === 'time') {
    safeFormat = sanitizeMomentTimeFormat(rawFormat);
  } else {
    safeFormat = sanitizeMomentDateTimeFormat(rawFormat);
  }

  SAFE_FORMAT_CACHE[formatType] = {
    raw: rawFormat,
    safe: safeFormat,
  };

  return safeFormat;
}

export function dateTimeToLocaleString(date) {
  if (date) {
    return moment(new Date(date)).format(getSafeFormat('datetime'));
  }
  return '';
}

export function dateToLocaleString(date) {
  if (date) {
    return moment(new Date(date)).format(getSafeFormat('date'));
  }
  return '';
}

export function timeToLocaleString(date) {
  if (date) {
    return moment(new Date(date)).format(getSafeFormat('time'));
  }
  return '';
}

export function date_diff_indays(dt1, dt2) {
  return Math.floor(
    (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) -
      Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) /
      (1000 * 60 * 60 * 24)
  );
}

export function time_to_hour_minute(time_str) {
  return {
    h: parseInt(time_str.split(':')[0]),
    m: parseInt(time_str.split(':')[1]),
  };
}

export function datetimeToLocalIso(datetime) {
  //YYYY-MM-DDThh:mmTZD
  if (datetime) {
    let d = new Date(datetime);
    return (
      String(d.getFullYear()) +
      '-' +
      String(pad(d.getMonth() + 1, 2)) +
      '-' +
      String(pad(d.getDate(), 2)) +
      'T' +
      String(pad(d.getHours(), 2)) +
      ':' +
      String(pad(d.getMinutes(), 2))
    );
  }

  return '';
}

export function formatISODate(datetime) {
  return formatISO(datetime, { representation: 'date' });
}

/** Current time in string format suitable for log messages */
export function logTime() {
  return lightFormat(new Date(), 'HH:mm:ss.SSS');
}

export function statsDefaultDateRange() {
  const now = new Date();
  return {
    start_date: formatISODate(startOfMonth(now)),
    end_date: formatISODate(now),
  };
}

const DAY_MILLISECONDS = 86400000;
const MS_DAY_OFFSET = 25569;

/**
 * JS Date to OLE Automation date
 * @param {date} date
 * @returns {number}
 */
export function toOADate(date) {
  const timezoneOffset = date.getTimezoneOffset() / (60 * 24);
  return date.getTime() / DAY_MILLISECONDS + (MS_DAY_OFFSET - timezoneOffset);
}

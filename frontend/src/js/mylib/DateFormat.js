const DEFAULT_DATE_FORMATS = Object.freeze({
  date: 'MM/DD/YYYY',
  datetime: 'YYYY/MM/DD HH:mm',
  time: 'HH:mm',
});

const DATE_ALIASES = Object.freeze({
  YYYY: 'YYYY',
  yyyy: 'YYYY',
  AAAA: 'YYYY',
  aaaa: 'YYYY',
  ÅÅÅÅ: 'YYYY',
  åååå: 'YYYY',
  RRRR: 'YYYY',
  rrrr: 'YYYY',
  YY: 'YY',
  yy: 'YY',
  MM: 'MM',
  M: 'M',
  mm: 'MM',
  m: 'M',
  AA: 'MM',
  aa: 'MM',
  DD: 'DD',
  D: 'D',
  dd: 'DD',
  d: 'D',
  JJ: 'DD',
  jj: 'DD',
  GG: 'DD',
  gg: 'DD',
  year: 'YYYY',
  Year: 'YYYY',
  month: 'MM',
  Month: 'MM',
  day: 'DD',
  Day: 'DD',
  jour: 'DD',
  Jour: 'DD',
  mois: 'MM',
  Mois: 'MM',
  année: 'YYYY',
  Année: 'YYYY',
  annee: 'YYYY',
  Annee: 'YYYY',
  سنة: 'YYYY',
  شهر: 'MM',
  يوم: 'DD',
});

const TIME_ALIASES = Object.freeze({
  HH: 'HH',
  H: 'H',
  hh: 'hh',
  h: 'h',
  SS: 'HH',
  S: 'H',
  TT: 'HH',
  T: 'H',
  mm: 'mm',
  m: 'm',
  dd: 'mm',
  d: 'm',
  ss: 'ss',
  s: 's',
  tt: 'a',
  ap: 'a',
  AP: 'A',
  a: 'a',
  A: 'A',
  hour: 'HH',
  Hour: 'HH',
  heure: 'HH',
  Heure: 'HH',
  minute: 'mm',
  Minute: 'mm',
  دقيقة: 'mm',
  ساعة: 'HH',
});

const DATE_FNS_ALIASES = Object.freeze({
  YYYY: 'yyyy',
  YY: 'yy',
  DD: 'dd',
  D: 'd',
});

const VALID_DATE_TOKENS = new Set(['YYYY', 'YY', 'MMMM', 'MMM', 'MM', 'M', 'DD', 'D']);
const VALID_TIME_TOKENS = new Set(['HH', 'H', 'hh', 'h', 'mm', 'm', 'ss', 's', 'a', 'A']);

function normalizeFormat(rawFormat) {
  return typeof rawFormat === 'string'
    ? rawFormat.trim().replaceAll('：', ':')
    : '';
}

function isLetter(character) {
  return /\p{L}/u.test(character);
}

function isTimeOnlyToken(token) {
  return token in TIME_ALIASES && !(token in DATE_ALIASES);
}

function replaceKnownTokens(format, aliases) {
  let result = '';
  let token = '';

  const flushToken = () => {
    if (!token) {
      return;
    }

    result += aliases[token] ?? token;
    token = '';
  };

  for (const character of format) {
    if (isLetter(character)) {
      token += character;
      continue;
    }

    flushToken();
    result += character;
  }

  flushToken();

  return result;
}

function collectTokens(format) {
  const tokens = [];
  let token = '';
  let tokenStart = -1;

  for (let index = 0; index < format.length; index += 1) {
    const character = format[index];

    if (isLetter(character)) {
      if (!token) {
        tokenStart = index;
      }
      token += character;
      continue;
    }

    if (token) {
      tokens.push({ token, start: tokenStart, end: index });
      token = '';
      tokenStart = -1;
    }
  }

  if (token) {
    tokens.push({ token, start: tokenStart, end: format.length });
  }

  return tokens;
}

function splitDateTimeFormat(format) {
  let sawDateToken = false;

  for (const { token, start } of collectTokens(format)) {
    if (token in DATE_ALIASES) {
      sawDateToken = true;
    }

    if (sawDateToken && isTimeOnlyToken(token)) {
      return [format.slice(0, start), format.slice(start)];
    }
  }

  return null;
}

function hasDateParts(format) {
  return /Y/.test(format) && /M/.test(format) && /D/.test(format);
}

function hasTimeParts(format) {
  return /H|h/.test(format) && /m/.test(format);
}

function hasOnlyAllowedTokens(format, allowedTokens) {
  return collectTokens(format).every(({ token }) => allowedTokens.has(token));
}

export function sanitizeMomentDateFormat(rawFormat) {
  const normalizedFormat = normalizeFormat(rawFormat);

  if (!normalizedFormat) {
    return DEFAULT_DATE_FORMATS.date;
  }

  const canonicalFormat = replaceKnownTokens(normalizedFormat, DATE_ALIASES);
  return hasDateParts(canonicalFormat) &&
    hasOnlyAllowedTokens(canonicalFormat, VALID_DATE_TOKENS)
    ? canonicalFormat
    : DEFAULT_DATE_FORMATS.date;
}

export function sanitizeMomentTimeFormat(rawFormat) {
  const normalizedFormat = normalizeFormat(rawFormat);

  if (!normalizedFormat) {
    return DEFAULT_DATE_FORMATS.time;
  }

  const canonicalFormat = replaceKnownTokens(normalizedFormat, TIME_ALIASES);
  return hasTimeParts(canonicalFormat) &&
    hasOnlyAllowedTokens(canonicalFormat, VALID_TIME_TOKENS)
    ? canonicalFormat
    : DEFAULT_DATE_FORMATS.time;
}

export function sanitizeMomentDateTimeFormat(rawFormat) {
  const normalizedFormat = normalizeFormat(rawFormat);

  if (!normalizedFormat) {
    return DEFAULT_DATE_FORMATS.datetime;
  }

  const segments = splitDateTimeFormat(normalizedFormat);

  if (!segments) {
    return DEFAULT_DATE_FORMATS.datetime;
  }

  const [datePart, timePart] = segments;
  const canonicalDatePart = replaceKnownTokens(datePart, DATE_ALIASES);
  const canonicalTimePart = replaceKnownTokens(timePart, TIME_ALIASES);
  const canonicalFormat = canonicalDatePart + canonicalTimePart;

  return hasDateParts(canonicalFormat) &&
    hasTimeParts(canonicalFormat) &&
    hasOnlyAllowedTokens(canonicalDatePart, VALID_DATE_TOKENS) &&
    hasOnlyAllowedTokens(canonicalTimePart, VALID_TIME_TOKENS)
    ? canonicalFormat
    : DEFAULT_DATE_FORMATS.datetime;
}

export function sanitizeMomentFormat(rawFormat, fallbackFormat) {
  if (fallbackFormat === DEFAULT_DATE_FORMATS.date) {
    return sanitizeMomentDateFormat(rawFormat);
  }

  if (fallbackFormat === DEFAULT_DATE_FORMATS.time) {
    return sanitizeMomentTimeFormat(rawFormat);
  }

  return sanitizeMomentDateTimeFormat(rawFormat);
}

export function toDateFnsFormat(momentFormat) {
  return momentFormat.replace(
    /YYYY|YY|DD|D/g,
    (token) => DATE_FNS_ALIASES[token] || token
  );
}

export { DEFAULT_DATE_FORMATS };

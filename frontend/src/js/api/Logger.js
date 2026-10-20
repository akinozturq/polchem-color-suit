import { formatStackTrace } from 'polchem_base/common/ErrorUtils';

// Python logging levels
const LEVEL_ERROR = 40;
const LEVEL_WARNING = 30;
const LEVEL_INFO = 20;
const LEVEL_DEBUG = 10;

/** Logs messages both to console, and to POS App log if run from App */
class Logger {
  /** Send all arguments to console.debug, and the first arg to App */
  debug(...args) {
    this._log(console.debug, LEVEL_DEBUG, args);
  }
  /** Send all arguments to console.log, and the first arg to App */
  info(...args) {
    this._log(console.log, LEVEL_INFO, args);
  }
  /** Send all arguments to console.warn, and the first arg to App */
  warning(...args) {
    this._log(console.warn, LEVEL_WARNING, args);
  }
  /** Send all arguments to console.error, and the first arg to App */
  error(...args) {
    this._log(console.error, LEVEL_ERROR, args);
  }

  async _log(console_func, level, args) {
    console_func(...args);
    try {
      const msg = await this._stringify(args[0]);
      window.qtside?.bridge.logMessage?.(level, msg);
    } catch (e) {
      console.error('App side logging failed', e);
    }
  }

  _stringify(obj) {
    if (typeof obj === 'string') {
      return obj;
    }
    if (obj instanceof Error) {
      return formatStackTrace(obj).then(
        ({ message, stack }) => `${message}\n${stack}`
      );
    }
    return JSON.stringify(obj);
  }
}

const log = new Logger();

export default log;

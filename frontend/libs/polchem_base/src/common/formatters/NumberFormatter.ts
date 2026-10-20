import { isNumber, omitNullValues } from '../ObjectUtils';

export interface Options {
  decimals?: number | null;
  allowTrailingZeros?: boolean;
  groupSeparator?: string | null;
  decimalSeparator?: string | null;
  symbol?: string;
  scale?: number;
  currencyFormat?: number;
  fallback?: string;
}

/**
 *
 * NumberFormatter formats numbers to strings with units and allows
 * customization of separators, number of decimals, and use of trailing zeros,
 * and scaling of values
 */

export class NumberFormatter {
  defaultGroupSeparator: string;
  defaultDecimalSeparator: string;
  isDefault: boolean;

  decimals: number;
  allowTrailingZeros: boolean;
  decimalSeparator: string;
  groupSeparator: string;
  symbol?: string;
  scale: number;
  currencyFormat: number;
  fallback: string;

  constructor(options: Options = {}) {
    [this.defaultGroupSeparator, this.defaultDecimalSeparator] =
      localeDefaultSeparators();

    const {
      decimals,
      allowTrailingZeros = false,
      groupSeparator,
      decimalSeparator,
      symbol,
      scale = 1,
      currencyFormat = 3,
      fallback = '',
    } = options;

    this.decimals = decimals ?? 2;
    this.allowTrailingZeros = allowTrailingZeros;
    // use default when nullish, or empty string
    this.decimalSeparator = decimalSeparator || this.defaultDecimalSeparator;
    this.groupSeparator =
      groupSeparator === this.decimalSeparator || // prevent same separator
      groupSeparator === '' // explicit empty string
        ? ''
        : groupSeparator || this.defaultGroupSeparator;
    this.symbol = symbol;
    this.scale = scale;
    this.currencyFormat = currencyFormat;
    this.fallback = fallback;

    this.isDefault =
      !this.defaultDecimalSeparator ||
      (this.decimalSeparator === this.defaultDecimalSeparator &&
        this.groupSeparator === this.defaultGroupSeparator);
  }

  /**
   * Converts a numeric value to string with unit symbol, non-number to fallback string.
   *
   * @param {*} num Value
   * @returns {string}
   */
  format(num?: number | null): string {
    if (isNumber(num)) {
      const value = this.formatWithoutSymbol(num);
      if (!this.symbol) return value;
      switch (this.currencyFormat) {
        case 0:
          return `${this.symbol}${value}`;
        case 1:
          return `${value}${this.symbol}`;
        case 2:
          return `${this.symbol} ${value}`;
        default:
          return `${value} ${this.symbol}`;
      }
    }
    return this.fallback;
  }

  /**
   * Converts a numeric value to string without unit symbol
   *
   * @param {*} num Value
   * @returns {string}
   */
  formatWithoutSymbol(num?: number | null): string {
    if (isNumber(num)) {
      const str = (num * this.scale).toLocaleString(undefined, {
        maximumFractionDigits: this.decimals,
        minimumFractionDigits: this.allowTrailingZeros ? this.decimals : 0,
      });
      return this.isDefault
        ? str
        : // replace non-digit substrings
          str.replace(/\D+/g, this._replaceSeparator);
    }
    return this.fallback;
  }

  _replaceSeparator = (sep: string): string => {
    switch (sep) {
      case this.defaultDecimalSeparator:
        return this.decimalSeparator;
      case this.defaultGroupSeparator:
        return this.groupSeparator;
      default:
        // eg. minus sign passes here
        return sep;
    }
  };

  _normalizeSeparators(string: string): string {
    let str = String(string);
    if (this.groupSeparator) {
      str = str.replaceAll(this.groupSeparator, '');
    }
    if (this.decimalSeparator !== '.') {
      str = str.replace(this.decimalSeparator, '.');
    }
    return str;
  }

  /**
   * Converts a formatted String to Number.
   */
  parse(str: string | number): number {
    if (typeof str === 'number') {
      return str / this.scale;
    }
    if (this.symbol) {
      str = str.replace(this.symbol, '');
    }
    str = this._normalizeSeparators(str);
    return (
      parseFloat(str) / this.scale || 0 // parseFloat returns NaN for ''
    );
  }

  /**
   * Validate possibly incomplete user input to be parsed
   *
   * @param {string} string User input
   * @returns {boolean} true if valid
   */
  validate(string: string): boolean {
    const str = this._normalizeSeparators(string);
    return !!str.match(/^[+-]?\d*([.]\d*)?$/);
  }
}

/**
 * Finds out the default separators for number formatting,
 * specifically those used by toLocaleString()
 *
 * @returns {array} [groupSeparator, decimalSeparator]
 */
export function localeDefaultSeparators(): string[] {
  // Make and parse an example string
  const example = (111111111.2).toLocaleString();
  const matches = example.match(/(\D*)\d+(\D+)\d$/);
  return matches
    ? [matches[1], matches[2]]
    : // no match -> disable separator change. Problematic case
      // TODO: better approach https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/formatToParts
      ['', ''];
}

interface ArrayFormatterOptions extends Options {
  valueSeparator?: string;
}

/**
 * ArrayFormatter is used for formatting arrays of numbers
 */
export class ArrayFormatter {
  valueSeparator: string;
  numberFormatter: NumberFormatter;

  constructor(options: ArrayFormatterOptions) {
    const { valueSeparator = '\n', ...rest } = omitNullValues(
      options
    ) as ArrayFormatterOptions;
    this.valueSeparator = valueSeparator;
    this.numberFormatter = new NumberFormatter(rest);
  }

  format(numbers?: number[]): string {
    if (!numbers) return '';

    return numbers
      .map((x) => this.numberFormatter.format(x))
      .join(this.valueSeparator);
  }
}

/**
 * RangeFormatter is used for paint coverage
 */
export class RangeFormatter {
  numberFormatter: NumberFormatter;

  constructor(options: Options) {
    this.numberFormatter = new NumberFormatter(options);
  }

  format(numbers?: (number | null)[]): string {
    if (!numbers) return this.numberFormatter.fallback;

    const filtered = numbers.filter((x) => x != null);
    let result = '';
    switch (filtered.length) {
      case 0:
        return this.numberFormatter.fallback;
      case 2:
        result =
          this.numberFormatter.formatWithoutSymbol(filtered.shift()) + ' - ';
        break;
      default:
    }
    return result + this.numberFormatter.format(filtered[0]);
  }
}

export class InputNumberFormatter {
  decimals: number | null;
  decimalSeparator: string;
  regexp: RegExp;

  constructor(decimals: number | null, allowNegative = true) {
    this.decimalSeparator = localeDefaultSeparators()[1] || '.';
    this.decimals = decimals;
    const sign = allowNegative ? '-' : '';
    const fractional =
      decimals !== 0 ? `([.${this.decimalSeparator}]\\d*)?` : '';
    this.regexp = new RegExp(`^[${sign}]?\\d*${fractional}$`);
  }
  format(number: number | null): string {
    let n = number || 0;
    if (typeof n !== 'number') {
      return '';
    }

    if (this.decimals != null) {
      const fixed = n.toFixed(this.decimals);
      // remove trailing zeros by parsing back
      n = parseFloat(fixed);
    }
    return n.toString().replace('.', this.decimalSeparator);
  }
  validate(string: string): boolean {
    return !!string.match(this.regexp);
  }
  parse(string: string): number {
    return parseFloat(string.replace(this.decimalSeparator, '.')) || 0;
  }
}

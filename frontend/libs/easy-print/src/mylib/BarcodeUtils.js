/**
 * Compute GTIN check digit.
 * Supports GTIN-8, GTIN-12, GTIN-13 (= EAN-13), GTIN-14, GSIN, SSCC.
 * The last digit of the code is the check digit.
 *
 * @param {(string|number)} code Code without check digit
 * @returns {string} The check digit, or null if invalid code
 */
export function computeGTINCheckDigit(code) {
  if (!/^\d{7,18}$/.test(code)) return null; //code must be digits only, 7-18 digits

  const digits = [...String(code).padStart(18, '0')];
  const weights = Array(9).fill([1, 3]).flat();
  const reducer = (accumulator, weight, i) => accumulator + weight * digits[i];
  const sum = weights.reduce(reducer, 0);

  const remainder = sum % 10;
  return String(remainder ? 10 - remainder : 0);
}

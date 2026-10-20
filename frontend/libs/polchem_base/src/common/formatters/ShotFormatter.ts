import { NumberFormatter } from './NumberFormatter';

export interface ShotUnitType {
  decimals?: number | null;
  div1: number;
  div2?: number | null;
  div3?: number | null;
  gravimetric?: boolean | null;
  mainunit: number;
  sym1?: string | null;
  sym2?: string | null;
  sym3?: string | null;
  unitname: string;
  display_name?: string;
}

type Divisor = [number, string];
type Divisors = Divisor[];

export class ShotFormatter {
  unit: ShotUnitType;
  divisors: Divisors;
  formatters: NumberFormatter[];
  ratios: number[];
  majorUnit: number;
  decimals: number;
  decimalDivisor: number;
  internalUnit: number;
  zeroAsString: string;

  constructor(
    unit: ShotUnitType | null | undefined = undefined,
    decimalSeparator: string | undefined = undefined,
    allowTrailingZeros = false
  ) {
    /**
     *      majorUnit (float) is typically a fluid ounce, in ml
     *      divisors is a sequence of sequences. Each sub-sequence must
     *           consist of an int that is the divisor of the fluid ounce
     *           and a string that appears after the fraction in string format
     *      decimals (int) is the number of decimal places for the last fraction
     *
     */
    if (unit) {
      this.unit = unit;
    } else {
      this.unit = {
        decimals: 0,
        div1: 1,
        div2: null,
        div3: null,
        gravimetric: false,
        mainunit: 1,
        sym1: null,
        sym2: null,
        sym3: null,
        unitname: 'ml',
      };
    }

    const divisors = [
      [this.unit.div1, this.unit.sym1],
      [this.unit.div2, this.unit.sym2],
      [this.unit.div3, this.unit.sym3],
    ].filter((x) => x[0]) as Divisors; // remove emptys

    // Ensure there is at least one divisor and each divisor divides the next,
    // calculate ratio between successive divisors,
    // and create formatter for each divisor
    this.divisors = [divisors[0] || [1, '']];
    this.ratios = [];
    this.formatters = [];
    for (let i = 1; i < divisors.length; i++) {
      const d1 = divisors[i - 1];
      const d2 = divisors[i];
      if (d2[0] % d1[0] === 0) {
        this.divisors.push(d2);
        this.ratios.push(d2[0] / d1[0]);
        this.formatters.push(
          new NumberFormatter({
            decimals: 0,
            groupSeparator: '',
            symbol: d1[1],
          })
        );
      } else break; // Skip invalid divisors
    }
    // With multiple divisors, only the final remainder should have decimals
    this.formatters.push(
      new NumberFormatter({
        decimals: this.unit.decimals,
        decimalSeparator,
        allowTrailingZeros,
        groupSeparator: '',
        symbol: this.divisors[this.divisors.length - 1][1],
      })
    );
    // VolToList needs ratios in revere order
    this.ratios.reverse();

    this.majorUnit = this.unit.mainunit || 1.0;
    this.decimals = this.unit.decimals != null ? this.unit.decimals : 0;
    this.decimalDivisor = 10 ** this.decimals;
    this.internalUnit =
      this.majorUnit /
      this.divisors[this.divisors.length - 1][0] /
      this.decimalDivisor;
    this.zeroAsString = this.getString(0);
  }
  getUnit(): ShotUnitType {
    return this.unit;
  }
  getDecimals(): number {
    return this.decimals;
  }
  getUnitName(): string {
    return this.unit.display_name || this.unit.unitname;
  }
  getShotInMl(specificgravity: number): number {
    const shot = this.majorUnit / this.divisors[this.divisors.length - 1][0];
    return this.unit.gravimetric ? shot / specificgravity : shot;
  }
  isGravimetric(): boolean {
    return !!this.unit.gravimetric;
  }
  format(
    {
      volume,
      specificgravity,
    }: { volume?: number | null; specificgravity: number },
    withPlusSign = false
  ): string {
    if (volume == null) {
      return '';
    }
    return this.getString(
      this.unit.gravimetric ? volume * specificgravity : volume,
      withPlusSign
    );
  }
  getString(vol: number, withPlusSign = false): string {
    const res = this.VolToList(vol)
      .map((value, i) => this.formatters[i].format(value))
      .join(' ');

    if (withPlusSign && vol > 0 && res !== this.zeroAsString) {
      return '+' + res;
    }

    return res;
  }
  VolToList(volume: number): number[] {
    let u = Math.round(volume / this.internalUnit) / this.decimalDivisor;
    const res = [];
    for (const ratio of this.ratios) {
      res.push(u % ratio);
      u = Math.trunc(u / ratio);
    }
    res.push(u);
    res.reverse();

    return res;
  }
  ListToVol(lst: (number | string)[]): number {
    /* the inverse of VolToList */
    let rs = 0;
    for (let i = 0; i < Math.min(this.divisors.length, lst.length); i++) {
      rs +=
        (this.majorUnit / this.divisors[i][0]) *
        this.formatters[i].parse(lst[i]);
    }
    return rs;
  }
  unformat(str: string, specificgravity: number): number {
    const lst = str.trim().split(' ');
    return this.unit.gravimetric
      ? this.ListToVol(lst) / specificgravity
      : this.ListToVol(lst);
  }
}

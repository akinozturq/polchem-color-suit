export const EI_TYPE_CURRENCY = 'EI_TYPE_CURRENCY';
export const EI_TYPE_LARGE_VOLUME = 'EI_TYPE_LARGE_VOLUME';
export const EI_TYPE_LARGE_MASS = 'EI_TYPE_LARGE_MASS';
export const EI_TYPE_SMALL_VOLUME = 'EI_TYPE_SMALL_VOLUME';
export const EI_TYPE_SMALL_MASS = 'EI_TYPE_SMALL_MASS';
export const EI_TYPE_NUMBER = 'EI_TYPE_NUMBER';
export const EI_TYPE_PERCENTAGE = 'EI_TYPE_PERCENTAGE';
export const EI_TYPE_AREA = 'EI_TYPE_AREA';
export const EI_TYPE_ARRAY = 'EI_TYPE_ARRAY';
export const EI_TYPE_STRING = 'EI_TYPE_STRING';
import i18n from 'i18next';

export type EI_VARIABLE_TYPE = {
  code: string;
  dataType: string;
  name: string;
  isTaxable?: boolean;
  isScalable?: boolean;
};

export const EI_VARIABLES = (): EI_VARIABLE_TYPE[] => {
  const result = [
    {
      code: 'baseCost',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true, // can be multiplied by number of cans
    },
    {
      code: 'baseMargin',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'basePrice',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    { code: 'baseTaxRate', dataType: EI_TYPE_PERCENTAGE },
    { code: 'bfsGrade', dataType: EI_TYPE_STRING },
    { code: 'canCode', dataType: EI_TYPE_STRING },
    {
      code: 'cntCost',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'cntMargin',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'cntPrice',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    { code: 'cntMass', dataType: EI_TYPE_SMALL_MASS, isScalable: true },
    { code: 'cntVolume', dataType: EI_TYPE_SMALL_VOLUME, isScalable: true },
    { code: 'cntTaxRate', dataType: EI_TYPE_PERCENTAGE },
    {
      code: 'cost',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'discount',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'baseOffset',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'baseAdjusted',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'hardenerOffset',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'hardenerAdjusted',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'cntOffset',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'cntAdjusted',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    { code: 'formulaUFIs', dataType: EI_TYPE_STRING },
    {
      code: 'hardenerCost',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'hardenerMargin',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    { code: 'hardenerName', dataType: EI_TYPE_STRING }, // t('extraInfo.hardenerName', 'Hardener')
    {
      code: 'hardenerPrice',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    { code: 'lab', dataType: EI_TYPE_ARRAY },
    {
      code: 'listPrice',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'margin',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'maxPrice',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    { code: 'paintCoverage', dataType: EI_TYPE_AREA, isScalable: true },
    {
      code: 'price',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    { code: 'priceGroup', dataType: EI_TYPE_STRING },
    { code: 'priceGroupBarcode', dataType: EI_TYPE_STRING, isHidden: true },
    { code: 'pricePerKilogram', dataType: EI_TYPE_CURRENCY },
    { code: 'pricePerLitre', dataType: EI_TYPE_CURRENCY },
    { code: 'cntCostPerLiter', dataType: EI_TYPE_CURRENCY, isTaxable: true },
    { code: 'cntPricePerLiter', dataType: EI_TYPE_CURRENCY, isTaxable: true },
    { code: 'productDescription', dataType: EI_TYPE_STRING },
    { code: 'rgb', dataType: EI_TYPE_STRING },
    { code: 'rgbHex', dataType: EI_TYPE_STRING },
    { code: 'tax', dataType: EI_TYPE_CURRENCY, isScalable: true },
    { code: 'taxRate', dataType: EI_TYPE_PERCENTAGE },
    {
      code: 'tintCost',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'tintFee',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    {
      code: 'tintPrice',
      dataType: EI_TYPE_CURRENCY,
      isTaxable: true,
      isScalable: true,
    },
    { code: 'totalVolume', dataType: EI_TYPE_LARGE_VOLUME, isScalable: true },
    { code: 'totalMass', dataType: EI_TYPE_LARGE_MASS, isScalable: true },
    { code: 'xyz', dataType: EI_TYPE_ARRAY },
    { code: 'y', dataType: EI_TYPE_NUMBER },
  ];

  return result.map((x) => ({ ...x, name: i18n.t('extraInfo.' + x.code) }));
};

export const EI_VARIABLES_EXC_INC_TAX = (): EI_VARIABLE_TYPE[] => {
  const excSuffix = ' ' + i18n.t('suffix.excludeTax', '(exclude tax)');
  const incSuffix = ' ' + i18n.t('suffix.includeTax', '(include tax)');
  const vars = EI_VARIABLES();
  const taxable = vars.filter((x) => x.isTaxable);
  const excVars = taxable.map((x) => ({
    ...x,
    code: x.code + '_excTax',
    name: x.name + excSuffix,
  }));
  const incVars = taxable.map((x) => ({
    ...x,
    code: x.code + '_incTax',
    name: x.name + incSuffix,
  }));

  return [...vars, ...excVars, ...incVars];
};

export const EI_VARS_ORDERITEMPRICE_TABLE = [
  'baseCost',
  'basePrice',
  'baseTaxRate',
  'cntCost',
  'cntPrice',
  'cntTaxRate',
  'taxRate',
  'listPrice',
  'price',
  'maxPrice',
  'priceGroup',
  'totalVolume',
  'totalMass',
];

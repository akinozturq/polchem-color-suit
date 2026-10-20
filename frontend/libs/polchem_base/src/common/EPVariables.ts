import {
  BARCODE_EAN8,
  BARCODE_EAN13,
  BARCODE_CODE39,
  BARCODE_CODE128,
  BARCODE_UPCA,
  BARCODE_GS_128,
  BARCODE_QRCODE,
  BARCODE_DATABAR_STACKED,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from 'e-p';

import { EI_VARIABLES, EI_TYPE_CURRENCY } from './EIVariables';

export const EP_TYPE_TEXT = 'EP_TYPE_TEXT';
export const EP_TYPE_BARCODE = 'EP_TYPE_BARCODE';

export const EP_GROUP_ORDER = 'EP_GROUP_ORDER';
export const EP_GROUP_FORMULA = 'EP_GROUP_FORMULA';
export const EP_GROUP_FORMULAINLINE = 'EP_GROUP_FORMULAINLINE';
export const EP_GROUP_SITE = 'EP_GROUP_SITE';
export const EP_GROUP_PRICESDEFAULT = 'EP_GROUP_PRICESDEFAULT';
export const EP_GROUP_PRICESSELECTED = 'EP_GROUP_PRICESSELECTED';
export const EP_GROUP_EXTRAINFO = 'EP_GROUP_EXTRAINFO';
export const EP_GROUP_DATE = 'EP_GROUP_DATE';
export const EP_GROUP_LAB = 'EP_GROUP_LAB';

export const EP_GROUP_BARCODE_PRICES = 'EP_GROUP_BARCODE_PRICES';
export const EP_GROUP_BARCODE_OTHER = 'EP_GROUP_BARCODE_OTHER';

const t = (v: string): string => {
  return v;
};

export type EP_VARIABLE_TYPE = {
  code: string;
  nameKey: string;
  type: string;
  group: string;
  name: string;
};

export type EP_GROUP_TYPE = {
  code: string;
  nameKey: string;
  type: string;
  name: string;
};

export const EP_GROUPS = (): EP_GROUP_TYPE[] => {
  const result = [
    // for text variables
    { code: EP_GROUP_ORDER, nameKey: 'Order', type: EP_TYPE_TEXT },
    { code: EP_GROUP_FORMULA, nameKey: 'Formula', type: EP_TYPE_TEXT },
    {
      code: EP_GROUP_FORMULAINLINE,
      nameKey: 'Formula inline',
      type: EP_TYPE_TEXT,
    },
    { code: EP_GROUP_SITE, nameKey: 'Site', type: EP_TYPE_TEXT },
    {
      code: EP_GROUP_PRICESDEFAULT,
      nameKey: 'Prices (default currency)',
      type: EP_TYPE_TEXT,
    },
    {
      code: EP_GROUP_PRICESSELECTED,
      nameKey: 'Prices (selected currency)',
      type: EP_TYPE_TEXT,
    },
    { code: EP_GROUP_EXTRAINFO, nameKey: 'Extra info', type: EP_TYPE_TEXT },
    { code: EP_GROUP_DATE, nameKey: 'Date and time', type: EP_TYPE_TEXT },
    // No LAB variables #6283
    //{ code: EP_GROUP_LAB, nameKey: 'Innovatint Lab', type: EP_TYPE_TEXT },

    // for barcode variables
    { code: EP_GROUP_BARCODE_PRICES, nameKey: 'Prices', type: EP_TYPE_BARCODE },
    {
      code: EP_GROUP_BARCODE_OTHER,
      nameKey: 'Other info',
      type: EP_TYPE_BARCODE,
    },
  ];

  return result.map((x) => ({ ...x, name: t(x.nameKey) }));
};

export const EP_VARIABLES = (): EP_VARIABLE_TYPE[] => {
  const allEI = EI_VARIABLES();
  const prices = allEI.filter((x) => x.dataType === EI_TYPE_CURRENCY);
  const pricesDefault = prices.map((x) => ({
    code: 'price.defaultCurrency.' + x.code,
    type: EP_TYPE_TEXT,
    name: x.name,
    group: EP_GROUP_PRICESDEFAULT,
  }));
  const pricesSelected = prices.map((x) => ({
    code: 'price.selectedCurrency.' + x.code,
    type: EP_TYPE_TEXT,
    name: x.name,
    group: EP_GROUP_PRICESSELECTED,
  }));
  const priceBarcodes = prices.map((x) => ({
    code: 'priceBarcode.' + x.code,
    type: EP_TYPE_BARCODE,
    name: x.name,
    group: EP_GROUP_BARCODE_PRICES,
    barcode_types: [BARCODE_QRCODE, BARCODE_EAN8, BARCODE_EAN13, BARCODE_UPCA],
  }));
  const extraInfo = allEI
    .filter((x) => x.dataType !== EI_TYPE_CURRENCY)
    .map((x) => ({
      code: 'extraInfo.' + x.code,
      type: EP_TYPE_TEXT,
      name: x.name,
      group: EP_GROUP_EXTRAINFO,
    }));
  const result = [
    ...pricesDefault,
    ...pricesSelected,
    ...extraInfo,
    ...priceBarcodes,
    {
      code: 'baseCode',
      nameKey: 'Base code',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'canName',
      nameKey: 'Can name',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'nominalQuantity',
      nameKey: 'Can nominal quantity',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'baseVolume',
      nameKey: 'Can base volume',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'colourCode',
      nameKey: 'Colour code',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'colourName',
      nameKey: 'Colour name',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'cardName',
      nameKey: 'Colour card',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'colourCards',
      nameKey: 'Colour cards',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'customerCompany',
      nameKey: 'Customer company',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'customerName',
      nameKey: 'Customer name',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'customerNote',
      nameKey: 'Customer note',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'orderID',
      nameKey: 'Order ID',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'itemID',
      nameKey: 'Item ID',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'productName',
      nameKey: 'Product name',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'orderNote',
      nameKey: 'Order note',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'itemNote',
      nameKey: 'Item note',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'creationDate',
      nameKey: 'Date of order creation',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'modificationDate',
      nameKey: 'Date of order',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'tintExpiryDate',
      nameKey: 'Tint expiry date',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'canTotal',
      nameKey: 'Cans total number',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'canNumber',
      nameKey: 'Can actual number',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'cansProgress',
      nameKey: 'Can actual / total',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'errorMessage',
      nameKey: 'Error message',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'productInfoLink',
      nameKey: 'Product info URL',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'productDescription',
      nameKey: 'Product description',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'userName',
      nameKey: 'User name',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'orderBarcode',
      nameKey: 'Order barcode',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'itemBarcode',
      nameKey: 'Item barcode',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'canBarcode',
      nameKey: 'Can barcode',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'priceGroupBarcode',
      nameKey: 'Price group barcode',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },
    {
      code: 'formulaBarcode',
      nameKey: 'Formula barcode',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_ORDER,
    },

    {
      code: 'companyName',
      nameKey: 'Company name',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_SITE,
    },
    {
      code: 'siteName',
      nameKey: 'Site name',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_SITE,
    },
    {
      code: 'address1',
      nameKey: 'Site address 1',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_SITE,
    },
    {
      code: 'address2',
      nameKey: 'Site address 2',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_SITE,
    },
    {
      code: 'phone',
      nameKey: 'Site phone',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_SITE,
    },
    {
      code: 'postCode',
      nameKey: 'Site post code',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_SITE,
    },
    {
      code: 'country',
      nameKey: 'Site country',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_SITE,
    },
    {
      code: 'email',
      nameKey: 'Site email',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_SITE,
    },
    {
      code: 'website',
      nameKey: 'Website',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_SITE,
    },

    {
      code: 'formulaNote',
      nameKey: 'Formula note',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaColorants',
      nameKey: 'Formula cnts codes',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaDefaultCumulativeVolumes',
      nameKey: 'Formula cnts cumulative volumes (default unit)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaDefaultOriginalVolumes',
      nameKey: 'Formula cnts original volumes (default unit)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaDefaultVolumes',
      nameKey: 'Formula cnts volumes (default unit)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaDefaultUnit',
      nameKey: 'Formula volumes unit (default)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaSelectedCumulativeVolumes',
      nameKey: 'Formula cnts cumulative volumes (currently selected unit)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaSelectedOriginalVolumes',
      nameKey: 'Formula cnts original volumes (currently selected unit)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaSelectedVolumes',
      nameKey: 'Formula cnts volumes (currently selected unit)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaSelectedUnit',
      nameKey: 'Formula volumes unit (currently selected)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaMlCumulativeVolumes',
      nameKey: 'Formula cnts cumulative volumes (ml)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaMlOriginalVolumes',
      nameKey: 'Formula cnts original volumes (ml)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaMlVolumes',
      nameKey: 'Formula cnts volumes (ml)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaMlUnit',
      nameKey: 'Formula volumes unit (ml)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaWeightsFromScale',
      nameKey: 'Formula (weights from scale)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaWeightsFromDb',
      nameKey: 'Formula (weights from DB)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaCCsFromScale',
      nameKey: 'Formula (volumes from scale)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },
    {
      code: 'formulaCCsFromDb',
      nameKey: 'Formula (volumes from DB)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULA,
    },

    {
      code: 'formulaDefaultCumulativeInline',
      nameKey: 'Formula cnts cumulative volumes inline (default unit)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULAINLINE,
    },
    {
      code: 'formulaDefaultOriginalInline',
      nameKey: 'Formula cnts original volumes inline (default unit)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULAINLINE,
    },
    {
      code: 'formulaDefaultInline',
      nameKey: 'Formula cnts volumes inline (default unit)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULAINLINE,
    },
    {
      code: 'formulaSelectedCumulativeInline',
      nameKey:
        'Formula cnts cumulative volumes inline (currently selected unit)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULAINLINE,
    },
    {
      code: 'formulaSelectedOriginalInline',
      nameKey: 'Formula cnts original volumes inline (currently selected unit)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULAINLINE,
    },
    {
      code: 'formulaSelectedInline',
      nameKey: 'Formula cnts volumes inline (currently selected unit)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULAINLINE,
    },
    {
      code: 'formulaMlCumulativeInline',
      nameKey: 'Formula cnts cumulative volumes inline (ml)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULAINLINE,
    },
    {
      code: 'formulaMlOriginalInline',
      nameKey: 'Formula cnts original volumes inline (ml)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULAINLINE,
    },
    {
      code: 'formulaMlInline',
      nameKey: 'Formula cnts volumes inline (ml)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_FORMULAINLINE,
    },

    {
      code: 'colorLAB',
      nameKey: 'Color LAB',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    }, //L*: 68,41  a*: -84,13 b*: -48,23
    {
      code: 'colorXYZ',
      nameKey: 'Color XYZ',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    }, //X: 23  Y: 24  Z: 12
    {
      code: 'colorHTML',
      nameKey: 'Color HTML',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    }, //#D3D2CD
    {
      code: 'formulaVOC',
      nameKey: 'VOC total',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    }, //5,42 g / l
    {
      code: 'formulaVOCcontent',
      nameKey: 'VOC components',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    }, //10.6\n13.7\n0.15 (Same way as formulaVolumes)
    {
      code: 'charsetName',
      nameKey: 'Characterization set name',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    }, //Test Characterization set
    {
      code: 'charsetSampleName',
      nameKey: 'Characterization set sample name',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    }, //Characterization set sample nameKey
    {
      code: 'charsetSampleComponents',
      nameKey: 'Characterization set components',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    }, //Characterization set components
    {
      code: 'charsetCMP',
      nameKey: 'Characterization set component',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    }, //<bootstrap> (Characterization set component)
    {
      code: 'charsetCMPsg',
      nameKey:
        'Characterization set formula volumes (true specific gravity for sample)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    }, //10.6\n13.7\n0.15 (Same way as formulaVolumes. True specific gravity for sample components.)
    {
      code: 'charsetCMPpro',
      nameKey:
        'Characterization set formula volumes (proposed amount of component)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    }, //10.6\n13.7\n0.15 (Same way as formulaVolumes. Proposed amount of component)
    {
      code: 'charsetCMPam',
      nameKey: 'Characterization set volumes (actual amount of component)',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    }, //10.6\n13.7\n0.15 (Same way as formulaVolumes. Actual amount of component)
    {
      code: 'thickness',
      nameKey: 'Sample thickness',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    },
    {
      code: 'madeBy',
      nameKey: 'Sample made by',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_LAB,
    },

    {
      code: 'currentDate',
      nameKey: 'Current date',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_DATE,
    },
    {
      code: 'currentTime',
      nameKey: 'Current time',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_DATE,
    },
    {
      code: 'currentDateTime',
      nameKey: 'Current date + time',
      type: EP_TYPE_TEXT,
      group: EP_GROUP_DATE,
    },

    {
      code: 'bcdOrderID',
      nameKey: 'Order barcode',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_QRCODE, BARCODE_CODE39, BARCODE_CODE128],
    },
    {
      code: 'bcdOrderIDEIPDPrice',
      nameKey: 'OrderID^Price (default)',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_QRCODE, BARCODE_CODE128],
    },
    {
      code: 'bcdOrderIDPriceGroup',
      nameKey: 'OrderID^PriceGroup barcode',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_QRCODE, BARCODE_CODE128],
    },
    {
      code: 'bcdItemID',
      nameKey: 'Item barcode',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_QRCODE, BARCODE_CODE39, BARCODE_CODE128],
    },
    {
      code: 'bcdCan',
      nameKey: 'Can barcode',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [
        BARCODE_QRCODE,
        BARCODE_EAN8,
        BARCODE_EAN13,
        BARCODE_CODE39,
        BARCODE_CODE128,
        BARCODE_UPCA,
      ],
    },
    {
      code: 'bcdColor',
      nameKey: 'Color barcode',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_QRCODE, BARCODE_CODE39, BARCODE_CODE128],
    },
    {
      code: 'bcdColorFromDB',
      nameKey: 'Color barcode from DB',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_QRCODE, BARCODE_CODE39, BARCODE_CODE128],
    },
    {
      code: 'bcdPriceGroup',
      nameKey: 'Price group barcode',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [
        BARCODE_QRCODE,
        BARCODE_EAN8,
        BARCODE_EAN13,
        BARCODE_UPCA,
      ],
    },
    {
      code: 'bcdFormula',
      nameKey: 'Formula barcode',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [
        BARCODE_QRCODE,
        BARCODE_EAN8,
        BARCODE_EAN13,
        BARCODE_UPCA,
      ],
    },

    {
      code: 'bcd2Email',
      nameKey: 'Email',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_QRCODE],
    },
    {
      code: 'bcd2Phone',
      nameKey: 'Phone',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_QRCODE],
    },
    {
      code: 'bcd2ProductInfo',
      nameKey: 'Link to product info',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_QRCODE],
    },
    {
      code: 'bcd2VCard',
      nameKey: 'vCard',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_QRCODE],
    },
    {
      code: 'bcd2Website',
      nameKey: 'Link to site website',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_QRCODE],
    },
    {
      code: 'bcd2GPS',
      nameKey: 'GPS position',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_QRCODE],
    },

    {
      code: 'bcdGS1Product',
      nameKey: 'Databar product',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_GS_128, BARCODE_DATABAR_STACKED],
    },
    {
      code: 'bcdGS1ProductPrice',
      nameKey: 'Databar product + price',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_GS_128, BARCODE_DATABAR_STACKED],
    },
    {
      code: 'bcdGS1ProductPGroup',
      nameKey: 'Databar product + pricegroup',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_GS_128, BARCODE_DATABAR_STACKED],
    },
    {
      code: 'bcdGS1ProductColor',
      nameKey: 'Databar product + color code',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_GS_128, BARCODE_DATABAR_STACKED],
    },
    {
      code: 'bcdGS1ProductPriceColor',
      nameKey: 'Databar product + price + color code',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_GS_128, BARCODE_DATABAR_STACKED],
    },
    {
      code: 'bcdGS1ProductPGroupColor',
      nameKey: 'Databar product + pricegroup + color code',
      type: EP_TYPE_BARCODE,
      group: EP_GROUP_BARCODE_OTHER,
      allowPrefix: false,
      barcode_types: [BARCODE_GS_128, BARCODE_DATABAR_STACKED],
    },
  ];

  return result.map(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    (x) => ({ ...x, name: x?.name || t(x?.nameKey) }) as EP_VARIABLE_TYPE
  );
};

export function EPvariableTree(
  type: string
): { label: string; code: string; variables: EP_VARIABLE_TYPE[] }[] {
  const hasRightType = (x: EP_GROUP_TYPE) => x.type === type;
  const groups = EP_GROUPS().filter(hasRightType);
  const variables = EP_VARIABLES().filter(hasRightType);
  return groups.map((group) => ({
    label: group.name,
    code: group.code,
    variables: variables
      .filter((x) => x.group === group.code)
      .map((x) => ({ ...x, label: x.name })),
  }));
}

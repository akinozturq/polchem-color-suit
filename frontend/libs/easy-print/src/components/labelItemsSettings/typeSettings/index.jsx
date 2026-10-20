import React from 'react';
import './styles.css';
import { withTranslation } from 'react-i18next';
import Select from 'react-select';
import {
  ITEM_IMAGE,
  ITEM_TEXT,
  ITEM_VARIABLE,
  ITEM_BARCODE,
  ITEM_LINE,
  ITEM_RECTANGLE,
  ITEM_ELLIPSE,
  BARCODE_EAN8,
  BARCODE_EAN13,
  BARCODE_CODE39,
  BARCODE_CODE128,
  BARCODE_UPCA,
  BARCODE_GS_128,
  BARCODE_QRCODE,
  FILL_COLOR_VARIABLE_PLACEHOLDER,
} from '../../../mylib/Constants';
import { Col } from '../../../mylib/layouts/Col';
import { Row } from '../../../mylib/layouts/Row';
import { Input } from '../../../mylib/Input';

const barcodes = [
  BARCODE_EAN8,
  BARCODE_EAN13,
  BARCODE_CODE39,
  BARCODE_CODE128,
  BARCODE_UPCA,
  BARCODE_GS_128,
  BARCODE_QRCODE,
];

const TYPE_NAME_MAP = {
  auspost: 'AusPost 4 State Customer Code',
  azteccode: 'Aztec Code',
  azteccodecompact: 'Compact Aztec Code',
  aztecrune: 'Aztec Runes',
  bc412: 'BC412',
  channelcode: 'Channel Code',
  codablockf: 'Codablock F',
  code11: 'Code 11',
  code128: 'Code 128',
  code16k: 'Code 16K',
  code2of5: 'Code 25',
  code32: 'Italian Pharmacode',
  code39: 'Code 39',
  code39ext: 'Code 39 Extended',
  code49: 'Code 49',
  code93: 'Code 93',
  code93ext: 'Code 93 Extended',
  codeone: 'Code One',
  coop2of5: 'COOP 2 of 5',
  daft: 'Custom 4 state symbology',
  databarexpanded: 'GS1 DataBar Expanded',
  databarexpandedcomposite: 'GS1 DataBar Expanded Composite',
  databarexpandedstacked: 'GS1 DataBar Expanded Stacked',
  databarexpandedstackedcomposite: 'GS1 DataBar Expanded Stacked Composite',
  databarlimited: 'GS1 DataBar Limited',
  databarlimitedcomposite: 'GS1 DataBar Limited Composite',
  databaromni: 'GS1 DataBar Omnidirectional',
  databaromnicomposite: 'GS1 DataBar Omnidirectional Composite',
  databarstacked: 'GS1 DataBar Stacked',
  databarstackedcomposite: 'GS1 DataBar Stacked Composite',
  databarstackedomni: 'GS1 DataBar Stacked Omnidirectional',
  databarstackedomnicomposite: 'GS1 DataBar Stacked Omnidirectional Composite',
  databartruncated: 'GS1 DataBar Truncated',
  databartruncatedcomposite: 'GS1 DataBar Truncated Composite',
  datalogic2of5: 'Datalogic 2 of 5',
  datamatrix: 'Data Matrix',
  datamatrixrectangular: 'Data Matrix Rectangular',
  datamatrixrectangularextension: 'Data Matrix Rectangular Extension',
  dotcode: 'DotCode',
  ean13: 'EAN-13',
  ean13composite: 'EAN-13 Composite',
  ean14: 'GS1-14',
  ean2: 'EAN-2 (2 digit addon)',
  ean5: 'EAN-5 (5 digit addon)',
  ean8: 'EAN-8',
  ean8composite: 'EAN-8 Composite',
  flattermarken: 'Flattermarken',
  'gs1-128': 'GS1-128',
  'gs1-128composite': 'GS1-128 Composite',
  'gs1-cc': 'GS1 Composite 2D Component',
  gs1datamatrix: 'GS1 Data Matrix',
  gs1datamatrixrectangular: 'GS1 Data Matrix Rectangular',
  gs1dotcode: 'GS1 DotCode',
  gs1northamericancoupon: 'GS1 North American Coupon',
  gs1qrcode: 'GS1 QR Code',
  hanxin: 'Han Xin Code',
  hibcazteccode: 'HIBC Aztec Code',
  hibccodablockf: 'HIBC Codablock F',
  hibccode128: 'HIBC Code 128',
  hibccode39: 'HIBC Code 39',
  hibcdatamatrix: 'HIBC Data Matrix',
  hibcdatamatrixrectangular: 'HIBC Data Matrix Rectangular',
  hibcmicropdf417: 'HIBC MicroPDF417',
  hibcpdf417: 'HIBC PDF417',
  hibcqrcode: 'HIBC QR Code',
  iata2of5: 'IATA 2 of 5',
  identcode: 'Deutsche Post Identcode',
  industrial2of5: 'Industrial 2 of 5',
  interleaved2of5: 'Interleaved 2 of 5 (ITF)',
  isbn: 'ISBN',
  ismn: 'ISMN',
  issn: 'ISSN',
  itf14: 'ITF-14',
  japanpost: 'Japan Post 4 State Customer Code',
  kix: 'Royal Dutch TPG Post KIX',
  leitcode: 'Deutsche Post Leitcode',
  mailmark: 'Royal Mail Mailmark',
  matrix2of5: 'Matrix 2 of 5',
  maxicode: 'MaxiCode',
  micropdf417: 'MicroPDF417',
  microqrcode: 'Micro QR Code',
  msi: 'MSI Modified Plessey',
  onecode: 'USPS Intelligent Mail',
  pdf417: 'PDF417',
  pdf417compact: 'Compact PDF417',
  pharmacode: 'Pharmaceutical Binary Code',
  pharmacode2: 'Two-track Pharmacode',
  planet: 'USPS PLANET',
  plessey: 'Plessey UK',
  posicode: 'PosiCode',
  postnet: 'USPS POSTNET',
  pzn: 'Pharmazentralnummer (PZN)',
  qrcode: 'QR Code',
  rationalizedCodabar: 'Codabar',
  raw: 'Custom 1D symbology',
  rectangularmicroqrcode: 'Rectangular Micro QR Code',
  royalmail: 'Royal Mail 4 State Customer Code',
  sscc18: 'SSCC-18',
  symbol: 'Miscellaneous symbols',
  telepen: 'Telepen',
  telepennumeric: 'Telepen Numeric',
  ultracode: 'Ultracode',
  upca: 'UPC-A',
  upcacomposite: 'UPC-A Composite',
  upce: 'UPC-E',
  upcecomposite: 'UPC-E Composite',
};

const strokeAndCorner = ['0', '2', '4', '6', '8', '10'];

const selectStyles = {
  menu: ({ top, ...remains }, _) => ({ ...remains }),
};

const TypeSettings = (props) => {
  const {
    t,
    item,
    writeText,
    customText,
    toggleCustomText,
    customStrokeWidth,
    customCornerCurve,
    customFillColor,
    customFillColorMode,
    customVariableGroup,
    customVariable,
    customBarcode,
    customBarcodeType,
    writePrompt,
    variableGroup,
    barcodeVariables,
    customBarcodeGroup,
    codeToInfo,
  } = props;

  const isHexColor = (value) =>
    typeof value === 'string' &&
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);

  const fillColorModeOptions = [
    { value: 'transparent', label: t('lbl.transparent', 'Transparent') },
    {
      value: 'variable',
      label: t('lbl.colorValue', '[Color value]'),
    },
    { value: 'picked', label: t('lbl.pickedValue', 'Picked value') },
  ];
  const fillColorMode = item
    ? item.fillColorMode ||
      (item.fillColor === FILL_COLOR_VARIABLE_PLACEHOLDER
        ? 'variable'
        : item.fillColor && item.fillColor !== 'transparent'
          ? 'picked'
          : 'transparent')
    : 'transparent';
  const selectedFillColorMode =
    fillColorModeOptions.find((option) => option.value === fillColorMode) ||
    fillColorModeOptions[0];

  const fillColorValue =
    item && isHexColor(item.fillColor) ? item.fillColor : '#00000069';
  const showFillColorLabel = item?.fillColor && !isHexColor(item.fillColor);
  const lineWidthValue =
    item && item.strokeWidth
      ? { value: item.strokeWidth, label: item.strokeWidth }
      : { value: '0', label: '0' };

  const strokeWidthOptions = strokeAndCorner.map((value) => ({
    value,
    label: value,
  }));

  const renderLineWidthControl = () => (
    <Col xs={2}>
      <Row>
        <Col style={{ padding: 0 }}>
          <p className="typeSettings__title margin-0">
            {t('lbl.lineWidth', 'Line Width')}
          </p>
        </Col>
      </Row>
      <Row>
        <Col style={{ padding: 0 }}>
          <Select
            className="typeSettings__select--inline"
            value={lineWidthValue}
            options={strokeWidthOptions}
            onChange={customStrokeWidth}
          />
        </Col>
      </Row>
    </Col>
  );

  const renderFillControls = () => (
    <React.Fragment>
      <Col xs={3}>
        <Row>
          <Col style={{ padding: 0 }}>
            <p className="typeSettings__title margin-0">
              {t('lbl.fillSource', 'Fill source')}
            </p>
          </Col>
        </Row>
        <Row>
          <Col style={{ padding: 0 }}>
            <Select
              className="typeSettings__select--inline"
              isDisabled={!item}
              value={selectedFillColorMode}
              options={fillColorModeOptions}
              onChange={customFillColorMode}
            />
          </Col>
        </Row>
      </Col>
      <Col xs={2}>
        <Row>
          <Col style={{ padding: 0 }}>
            <p className="typeSettings__title margin-0">
              {t('lbl.fillColor', 'Fill Color')}
            </p>
          </Col>
        </Row>
        <Row>
          <Col style={{ padding: 0, height: '100%' }}>
            {showFillColorLabel ? (
              <p className="typeSettings__fillValue">{item.fillColor}</p>
            ) : (
              <Input
                type="color"
                disabled={!item || fillColorMode !== 'picked'}
                value={fillColorValue}
                onChange={customFillColor}
                className="typeSettings__colorInput--inline"
              />
            )}
          </Col>
        </Row>
      </Col>
    </React.Fragment>
  );
  let typeSettings = null;

  if (item) {
    switch (item.itemType) {
      case ITEM_IMAGE:
        break;
      case ITEM_TEXT:
        typeSettings = (
          <React.Fragment>
            <Col style={{ maxWidth: '100px' }}>
              <Row>
                <Col>
                  <p className="typeSettings__title--horizontal margin-0">
                    {t('lbl.custom_cansize', 'Custom')}
                  </p>
                </Col>
              </Row>
              <Row>
                <Col style={{ paddingTop: '7px' }}>
                  <Input
                    type="checkbox"
                    id="exampleCustomCheckbox3"
                    checked={toggleCustomText}
                    onChange={customText}
                  />
                </Col>
              </Row>
            </Col>

            <Col>
              <Row>
                <Col>
                  <p className="typeSettings__title margin-0">
                    {toggleCustomText
                      ? t('lbl.customText', 'Custom Text')
                      : t('lbl.text', 'Text')}
                  </p>
                </Col>
              </Row>
              <Row>
                <Col>
                  {toggleCustomText ? (
                    <Input
                      value={item.prompt}
                      onChange={(e) => writePrompt(e)}
                      placeholder={t('prompt.enterPrompt', 'Enter prompt')}
                      className="prompt__text"
                    />
                  ) : (
                    <Input
                      value={item.text}
                      onChange={(e) => writeText(e)}
                      placeholder={t(
                        'prompt.enterStaticText',
                        'Enter static text'
                      )}
                      className="prompt__text"
                    />
                  )}
                </Col>
              </Row>
            </Col>
          </React.Fragment>
        );
        break;
      case ITEM_VARIABLE:
        try {
          const info = codeToInfo[item.varCode];
          const label = info ? info.label : '';
          const group = info
            ? variableGroup.find((el) => el.code === info.group)
            : null;
          typeSettings = (
            <React.Fragment>
              <Col>
                <p className="typeSettings__title margin-0">
                  {t('lbl.variableGroup', 'Variable Group')}
                </p>
                <Select
                  styles={selectStyles}
                  value={
                    group
                      ? { value: group.label, label: group.label }
                      : { value: '', label: t('lbl.group', 'Group') }
                  }
                  options={variableGroup.map((group) => ({
                    value: group.label,
                    label: group.label,
                  }))}
                  onChange={customVariableGroup}
                />
              </Col>
              <Col>
                <Row>
                  <Col>
                    <p className="typeSettings__title margin-0">
                      {t('lbl.variable', 'Variable')}
                    </p>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Select
                      styles={selectStyles}
                      value={{
                        value: `[${item.varCode}]`,
                        label: `[${label}]`,
                      }}
                      options={
                        group &&
                        group.variables.map((variable) => ({
                          value: variable.code,
                          label: variable.label,
                        }))
                      }
                      onChange={customVariable}
                    />
                  </Col>
                </Row>
              </Col>
            </React.Fragment>
          );
        } catch (e) {
          console.log(e);
        }
        break;
      case ITEM_BARCODE:
        try {
          const info = codeToInfo[item.varCode];
          const label = info ? info.label : '';
          const group = info
            ? barcodeVariables.find((el) => el.code === info.group)
            : null;

          const variables = group
            ? group.variables.filter((x) =>
                item.type === BARCODE_QRCODE
                  ? x.barcode_types.includes(BARCODE_QRCODE)
                  : x.barcode_types.filter((y) => y !== BARCODE_QRCODE).length >
                    0
              )
            : [];

          const variable_barcode_types = info
            ? (info.barcode_types ? info.barcode_types : barcodes).filter(
                (x) =>
                  item.type === BARCODE_QRCODE
                    ? x === BARCODE_QRCODE
                    : x !== BARCODE_QRCODE
              )
            : [];

          // Update the type to be correct one if there is only one type available or the type is not valid
          if (variable_barcode_types.length > 0 && item) {
            if (
              (item.type !== variable_barcode_types[0] &&
                variable_barcode_types.length === 1) ||
              !variable_barcode_types.includes(item.type)
            ) {
              setTimeout(() => {
                customBarcodeType({ value: variable_barcode_types[0] });
              }, 300);
            }
          }

          typeSettings = (
            <React.Fragment>
              <Col>
                <Row>
                  <Col>
                    <p className="typeSettings__title margin-0">
                      {t('lbl.barcodeGroup', 'Barcode Group')}
                    </p>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Select
                      value={
                        group
                          ? { value: group.label, label: group.label }
                          : { value: '', label: t('lbl.group', 'Group') }
                      }
                      options={barcodeVariables.map((group) => ({
                        value: group.label,
                        label: group.label,
                      }))}
                      onChange={customBarcodeGroup}
                    />
                  </Col>
                </Row>
              </Col>
              <Col>
                <Row>
                  <Col>
                    <p className="typeSettings__title margin-0">
                      {t('lbl.variable', 'Variable')}
                    </p>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Select
                      isDisabled={variables.length === 0}
                      value={{ value: item.varCode, label }}
                      options={variables.map((variable) => ({
                        value: variable.code,
                        label: variable.label,
                      }))}
                      onChange={customBarcode}
                    />
                  </Col>
                </Row>
              </Col>
              <Col>
                {item.type !== BARCODE_QRCODE && (
                  <React.Fragment>
                    <Row>
                      <Col>
                        <p className="typeSettings__title margin-0">
                          {t('lbl.barcodeType', 'Barcode type')}
                        </p>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <Select
                          isDisabled={!info}
                          styles={selectStyles}
                          value={
                            variable_barcode_types.includes(item.type)
                              ? {
                                  value: item.type,
                                  label:
                                    TYPE_NAME_MAP[item.type] ||
                                    item.type.toUpperCase(),
                                }
                              : {
                                  value: '',
                                  label: '',
                                }
                          }
                          options={variable_barcode_types.map((value) => ({
                            value,
                            label: TYPE_NAME_MAP[value] || value.toUpperCase(),
                          }))}
                          onChange={customBarcodeType}
                        />
                      </Col>
                    </Row>
                  </React.Fragment>
                )}
              </Col>
            </React.Fragment>
          );
        } catch (e) {
          console.log(e);
        }
        break;
      case ITEM_LINE:
        typeSettings = (
          <React.Fragment>{renderLineWidthControl()}</React.Fragment>
        );
        break;
      case ITEM_RECTANGLE:
        typeSettings = (
          <React.Fragment>
            {renderLineWidthControl()}
            <Col xs={2}>
              <Row>
                <Col style={{ padding: 0 }}>
                  <p className="typeSettings__title margin-0">
                    {t('lbl.lineCurve', 'Line Curve')}
                  </p>
                </Col>
              </Row>
              <Row>
                <Col style={{ padding: 0 }}>
                  <Select
                    className="typeSettings__select--inline"
                    value={
                      item.cornerRadius
                        ? { value: item.cornerRadius, label: item.cornerRadius }
                        : { value: '0', label: '0' }
                    }
                    options={strokeAndCorner.map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={customCornerCurve}
                  />
                </Col>
              </Row>
            </Col>

            {renderFillControls()}
          </React.Fragment>
        );
        break;
      case ITEM_ELLIPSE:
        typeSettings = (
          <React.Fragment>
            {renderLineWidthControl()}
            {renderFillControls()}
          </React.Fragment>
        );
        break;
      default:
        break;
    }
  }
  return typeSettings;
};

export default withTranslation('translations')(TypeSettings);

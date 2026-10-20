import React, { Component } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Collapse,
  Table,
} from 'reactstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import actions, {
  selectors as pricingSelectors,
} from '../../../redux/reducers/Pricing';
import { selectors as cacheSelectors } from '../../../redux/reducers/Cache';
import ErrorBoundary from '../../shared/ErrorBoundaryModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import { NumberFormatter } from 'polchem_base/common/formatters/NumberFormatter';
import Spinner from '../../shared/Spinner';
import NumberInput from '../../../mylib/NumberInput';
import { rightToLeft } from '../../../mylib/Utils';

const PGMODE_Y_VALUE = 2;

function isMargin(keyid) {
  return ['bmargin', 'cmargin'].includes(keyid);
}

const handleObjectChange = (
  keyid,
  data,
  editedCustomValue,
  objectName,
  type
) => {
  let newObject, newData;

  const customValue = editedCustomValue === '' ? null : editedCustomValue;

  switch (objectName) {
    case 'common':
    case 'cansizes':
    case 'productGeneral':
    case 'productBasepaints':
    case 'productCansizes':
      switch (true) {
        case keyid.includes('pgbc'):
          newObject = {
            ...data[`pgbc:${keyid[keyid.length - 1]}`],
            customValue,
          };
          newData = {
            ...data,
            [`pgbc:${keyid[keyid.length - 1]}`]: newObject,
          };
          break;
        case keyid.includes('pglimit'):
          newObject = {
            ...data[`pglimit:${keyid[keyid.length - 1]}`],
            customValue,
          };

          newData = {
            ...data,
            [`pglimit:${keyid[keyid.length - 1]}`]: newObject,
          };
          break;
        default:
          newObject = {
            ...data[keyid],
            customValue,
          };
          newData = {
            ...data,
            [keyid]: newObject,
          };

          break;
      }
      break;

    case 'colorants':
      newObject = {
        ...data.find((colorant) => colorant.cntid === keyid.cntid),
        [type]: {
          ...data.find((colorant) => colorant.cntid === keyid.cntid)[type],
          customValue,
        },
      };
      newData = data.map((colorant) =>
        colorant.cntid === keyid.cntid ? newObject : colorant
      );
      break;
    default:
      break;
  }
  return newData;
};

const getFormattedProduct = (productPricing) => {
  let formatedCurrentProduct = _.cloneDeep(productPricing);
  formatedCurrentProduct.bmargin.customValue =
    formatedCurrentProduct.bmargin.customValue !== null
      ? formatedCurrentProduct.bmargin.customValue * 100
      : null;
  formatedCurrentProduct.tax.customValue =
    formatedCurrentProduct.tax.customValue !== null
      ? formatedCurrentProduct.tax.customValue * 100
      : null;
  formatedCurrentProduct.basepaints = formatedCurrentProduct.basepaints.map(
    (basepaint) => ({
      ...basepaint,
      bmargin: {
        ...basepaint.bmargin,
        customValue: basepaint.bmargin.customValue
          ? basepaint.bmargin.customValue * 100
          : basepaint.bmargin.customValue,
      },
    })
  );
  return formatedCurrentProduct;
};

class Pricing extends Component {
  state = {
    has_changes: false,
    productid: null,
    common: Object.keys(this.props.commonPricing)
      .map((key) => {
        if (
          key === 'bmargin' ||
          key === 'cmargin' ||
          key === 'ctax' ||
          key === 'coffset' ||
          key === 'boffset' ||
          key === 'tax'
        ) {
          return {
            name: key,
            ...this.props.commonPricing[key],
            customValue:
              this.props.commonPricing[key].customValue !== null
                ? this.props.commonPricing[key].customValue * 100
                : null,
          };
        }
        return {
          name: key,
          ...this.props.commonPricing[key],
        };
      })
      .reduce((obj, current) => {
        obj[current.name] = current;
        delete obj[current.name].name;
        return obj;
      }, {}),
    colorants: this.props.colorantsPricing.map((colorant) => ({
      ccost: undefined,
      ...colorant,
      cmargin: {
        ...colorant.cmargin,
        customValue: colorant.cmargin.customValue
          ? colorant.cmargin.customValue * 100
          : colorant.cmargin.customValue,
      },
    })),
    cansizes: this.props.cansizePricing,
    currentActiveBasePaints: [],
    currentActiveCansizes: [],
    basepaintExpand: [],
    currentProduct: {},
  };

  static getDerivedStateFromProps(nextprops, prevstate) {
    // load the data if missing
    if (
      nextprops.node?.config?.productid &&
      !nextprops.loading &&
      nextprops.node?.config?.productid !== prevstate.productid
    ) {
      nextprops.fetchProductsPricing(nextprops.node?.config?.productid);
      return { productid: nextprops.node?.config?.productid };
    }
    // Set the current product for editing
    if (
      nextprops.node?.config?.productid !==
        prevstate.currentProduct?.productid &&
      !nextprops.loading &&
      nextprops.productPricing?.productid
    ) {
      return {
        currentProduct: getFormattedProduct(nextprops.productPricing),
      };
    }

    if (!nextprops.node?.config?.productid) {
      return {
        currentActiveBasePaints: [],
        currentActiveCansizes: [],
      };
    }

    return null;
  }

  inputOnChangeHandler = (
    value,
    inputName,
    objectName,
    type,
    basepaintid,
    cansizeid
  ) => {
    let newDataObject, newActiveCansizes, newCansizesArray;
    switch (objectName) {
      case 'common':
        newDataObject = handleObjectChange(
          inputName,
          this.state[objectName],
          value,
          objectName
        );
        this.setState({
          common: newDataObject,
        });
        break;
      case 'colorants':
        newDataObject = handleObjectChange(
          inputName,
          this.state[objectName],
          value,
          objectName,
          type
        );
        this.setState({
          [objectName]: newDataObject,
        });
        break;
      case 'cansizes':
        newDataObject = handleObjectChange(
          inputName,
          this.state.cansizes.find((can) => can.cansizeid === cansizeid),
          value,
          objectName
        );
        this.setState({
          cansizes: this.state.cansizes.map((cansize) =>
            cansize.cansizeid === cansizeid ? newDataObject : cansize
          ),
        });
        break;
      case 'productGeneral':
        newDataObject = handleObjectChange(
          inputName,
          this.state.currentProduct,
          value,
          objectName
        );

        this.setState({
          currentProduct: newDataObject,
        });
        break;
      case 'productBasepaints':
        newDataObject = handleObjectChange(
          inputName,
          this.state.currentActiveBasePaints.find(
            (basepaint) => basepaint.baseid === basepaintid
          ),
          value,
          objectName
        );
        this.setState(
          {
            currentActiveBasePaints: this.state.currentActiveBasePaints.map(
              (basepaint) =>
                basepaint.baseid === basepaintid ? newDataObject : basepaint
            ),
          },
          () => {
            const newProduct = _.cloneDeep(this.state.currentProduct);
            newProduct.basepaints.splice(
              this.state.currentProduct.basepaints.findIndex(
                (basepaint) => basepaint.baseid === basepaintid
              ),
              1,
              newDataObject
            );
            this.setState({
              currentProduct: newProduct,
            });
          }
        );
        break;
      case 'productCansizes':
        newDataObject = handleObjectChange(
          inputName,
          this.state.currentActiveCansizes
            .find((base) => base.baseid === basepaintid)
            .cansizes.find((cansize) => cansize.cansizeid === cansizeid),
          value,
          objectName
        );
        newCansizesArray = this.state.currentActiveCansizes
          .find((base) => base.baseid === basepaintid)
          .cansizes.map((cansize) =>
            cansize.cansizeid === cansizeid ? newDataObject : cansize
          );
        newActiveCansizes = _.cloneDeep(this.state.currentActiveCansizes).map(
          (base) =>
            base.baseid === basepaintid
              ? { baseid: basepaintid, cansizes: newCansizesArray }
              : base
        );

        this.setState(
          {
            currentActiveCansizes: newActiveCansizes,
          },
          () => {
            const newProduct = _.cloneDeep(this.state.currentProduct);
            const newBasepaint = newProduct.basepaints.find(
              (basepaint) => basepaint.baseid === basepaintid
            );
            newBasepaint.cansizes = newCansizesArray;
            this.setState({
              currentProduct: newProduct,
            });
          }
        );
        break;
      default:
        break;
    }
    this.setState({ has_changes: true });
  };

  saveButtonHandler = () => {
    //bmargin, cmargin, ctax, tax
    const { code } = this.props.node;

    this.setState({
      has_changes: false,
    });
    let percentageFormatedData, basepaintsFormated;
    switch (true) {
      case code === 'h_common_data_pricing':
        percentageFormatedData = Object.keys(this.state.common)
          .map((key) => {
            if (
              key === 'bmargin' ||
              key === 'cmargin' ||
              key === 'ctax' ||
              key === 'coffset' ||
              key === 'boffset' ||
              key === 'tax'
            ) {
              return {
                name: key,
                ...this.state.common[key],
                customValue:
                  this.state.common[key].customValue !== null
                    ? this.state.common[key].customValue / 100
                    : null,
              };
            }
            return {
              name: key,
              ...this.state.common[key],
            };
          })
          .reduce((obj, current) => {
            obj[current.name] = current;
            delete obj[current.name].name;
            return obj;
          }, {});
        this.props.setCommonPrice(percentageFormatedData);
        break;
      case code === 'h_colorants_pricing':
        percentageFormatedData = this.state.colorants.map((colorant) => ({
          ...colorant,
          cmargin: {
            ...colorant.cmargin,
            customValue: colorant.cmargin.customValue
              ? colorant.cmargin.customValue / 100
              : colorant.cmargin.customValue,
          },
        }));
        this.props.setColorantsPrice(percentageFormatedData);
        break;
      case code === 'h_cansize_pricing':
        this.props.setCansizesPrice(this.state.cansizes);
        break;
      case code.includes('product_'):
        percentageFormatedData = _.cloneDeep(this.state.currentProduct);
        percentageFormatedData.bmargin.customValue =
          percentageFormatedData.bmargin.customValue !== null
            ? percentageFormatedData.bmargin.customValue / 100
            : null;
        percentageFormatedData.tax.customValue =
          percentageFormatedData.tax.customValue !== null
            ? percentageFormatedData.tax.customValue / 100
            : null;
        basepaintsFormated = percentageFormatedData.basepaints.map(
          (basepaint) => ({
            ...basepaint,
            bmargin: {
              ...basepaint.bmargin,
              customValue: basepaint.bmargin.customValue
                ? basepaint.bmargin.customValue / 100
                : basepaint.bmargin.customValue,
            },
          })
        );
        percentageFormatedData.basepaints = basepaintsFormated;

        this.props.setProductPrice(percentageFormatedData);
        break;
      default:
        break;
    }
  };

  resetButtonHandler = () => {
    const { commonPricing, colorantsPricing, cansizePricing, productPricing } =
      this.props;
    let percentageFormatedData;
    const { code } = this.props.node;

    switch (true) {
      case code === 'h_common_data_pricing':
        percentageFormatedData = Object.keys(commonPricing)
          .map((key) => {
            if (
              key === 'bmargin' ||
              key === 'cmargin' ||
              key === 'ctax' ||
              key === 'coffset' ||
              key === 'boffset' ||
              key === 'tax'
            ) {
              return {
                name: key,
                ...commonPricing[key],
                customValue:
                  commonPricing[key].customValue !== null
                    ? commonPricing[key].customValue * 100
                    : null,
              };
            }
            return {
              name: key,
              ...commonPricing[key],
            };
          })
          .reduce((obj, current) => {
            obj[current.name] = current;
            delete obj[current.name].name;
            return obj;
          }, {});
        this.setState({
          common: percentageFormatedData,
        });
        break;
      case code === 'h_colorants_pricing':
        percentageFormatedData = colorantsPricing.map((colorant) => ({
          ...colorant,
          cmargin: {
            ...colorant.cmargin,
            customValue: colorant.cmargin.customValue
              ? colorant.cmargin.customValue * 100
              : colorant.cmargin.customValue,
          },
        }));
        this.setState({
          colorants: percentageFormatedData,
        });
        break;
      case code === 'h_cansize_pricing':
        this.setState({
          cansizes: cansizePricing,
        });
        break;
      case code.includes('product_'):
        this.setState({ currentProduct: getFormattedProduct(productPricing) });

        break;
      default:
        break;
    }
    this.setState({ has_changes: false });
  };

  handleToggleTable = (type, id) => {
    switch (type) {
      case 'basepaintExpand':
        this.setState((prevState) => {
          const oldBasepaintExpand = _.cloneDeep(prevState.basepaintExpand);
          let newBasepaintExpand;
          if (oldBasepaintExpand.find((basepaint) => basepaint.id === id)) {
            newBasepaintExpand =
              oldBasepaintExpand.length === 0
                ? [{ id, open: true }]
                : oldBasepaintExpand.map((basepaint) =>
                    basepaint.id === id
                      ? { id, open: !basepaint.open }
                      : basepaint
                  );
          } else {
            newBasepaintExpand = [{ id, open: true }];
          }
          return {
            ...this.state,
            currentActiveBasePaints: [
              ...new Set([
                // ...this.state.currentActiveBasePaints,
                this.state.currentProduct.basepaints &&
                  this.state.currentProduct.basepaints.find(
                    (base) => base.baseid === id
                  ),
              ]),
            ],
            currentActiveCansizes: _.uniqWith(
              [
                ...this.state.currentActiveCansizes,
                {
                  baseid: id,
                  cansizes:
                    this.state.currentProduct.basepaints &&
                    this.state.currentProduct.basepaints.find(
                      (base) => base.baseid === id
                    ).cansizes,
                },
              ],
              _.isEqual
            ),
            basepaintExpand: newBasepaintExpand,
          };
        });
        break;
      default:
        break;
    }
  };

  render() {
    const {
      t,
      node,
      cnts,
      loading,
      cacheCansizes,
      products,
      priceFormatter,
      currencySymbol,
      commonPricing,
    } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';
    const {
      common,
      colorants,
      cansizes,
      currentActiveCansizes,
      currentProduct,
      has_changes,
    } = this.state;
    const translatedTextObj = (key) => {
      let priceGroupNumber = null;
      if (
        key.includes('pglimit') ||
        key.includes('pgbc') ||
        key.includes('pgcprice') ||
        key.includes('pgprice')
      ) {
        priceGroupNumber = key[key.length - 1];
      }
      return {
        bmargin: t('pricing.bmargin', 'Base margin'),
        bround: t('pricing.bround', 'Base price rounding'),
        cmargin: t('pricing.cmargin', 'Colorant margin [%]'),
        cround: t('pricing.cround', 'Colorant price rounding'),
        ctax: t('pricing.ctax', 'Tax rate on colorants [%]'),
        lround: t('pricing.lround', 'List price rounding'),
        boffset: t('pricing.boffset', 'Base offset [%]'),
        coffset: t('pricing.coffset', 'Colorant offset [%]'),
        pround: t('pricing.pround', 'Final price rounding'),
        tax: t('pricing.tax', 'Tax [%]'),
        tintfee: t('pricing.tintfee', 'Tinting service price ({{0}})', {
          0: currencySymbol,
        }),
        bcostl: t('pricing.bcostl', 'Base cost (per litre) ({{0}})', {
          0: currencySymbol,
        }),
        bcost: t('pricing.bcost', 'Base cost (per can size) ({{0}})', {
          0: currencySymbol,
        }),
        bprice: t('pricing.bprice', 'Base price ({{0}})', {
          0: currencySymbol,
        }),
        mrp: t('pricing.mrp', 'Maximum retail price'),
        [`pglimit:${priceGroupNumber}`]: t(
          'pricing.pglimit',
          'Price group limit for group {{1}} ({{0}})',
          {
            0:
              commonPricing.pgmode?.value === PGMODE_Y_VALUE
                ? 'Y'
                : currencySymbol,
            1: priceGroupNumber,
          }
        ),
        [`pgbc:${priceGroupNumber}`]: t(
          'pricing.pgbc',
          'Price group barcode {{1}}',
          {
            1: priceGroupNumber,
          }
        ),
        [`pgcprice:${priceGroupNumber}`]: t(
          'pricing.pgcprice',
          'Colorant price for group {{1}} ({{0}})',
          {
            0: currencySymbol,
            1: priceGroupNumber,
          }
        ),
        [`pgprice:${priceGroupNumber}`]: t(
          'pricing.pgprice',
          'Total list price for group {{1}} ({{0}})',
          {
            0: currencySymbol,
            1: priceGroupNumber,
          }
        ),
      };
    };
    //Common Data format
    const commonFormated = Object.keys(common)
      .filter((key) => !['usepg', 'pgmode'].includes(key))
      .map((key) => {
        return {
          keyid: key,
          ...common[key],
        };
      })
      .map((key) =>
        key.keyid === 'bmargin' ||
        key.keyid === 'cmargin' ||
        key.keyid === 'coffset' ||
        key.keyid === 'boffset' ||
        key.keyid === 'ctax' ||
        key.keyid === 'tax'
          ? {
              ...key,
              value: key.value !== null ? `${key.value * 100} %` : null,
            }
          : key.keyid === 'bcost' ||
              key.keyid === 'bprice' ||
              key.keyid === 'tintfee'
            ? { ...key, value: key.value ? key.value : '' }
            : key
      );

    //Colorants data format
    const colorantsFormated = colorants.map((colorant) => {
      const cnt = cnts.find((cnt) => cnt.cntid === colorant.cntid);
      return {
        keyid: {
          value: cnt ? cnt.cntcode : `[CNTID_${colorant.cntid}]`,
          cntid: colorant.cntid,
        },
        cost: {
          value: colorant.ccost.value,
          customValue: colorant.ccost.customValue,
          state: colorant.ccost.state,
        },
        margin: {
          value: colorant.cmargin.value * 100,
          customValue: colorant.cmargin.customValue,
          state: colorant.cmargin.state,
        },
      };
    });

    //Cansize data format
    const cansizeFormated = cansizes.map((cansize) => {
      const can = cacheCansizes.find(
        (can) => can.cansizeid === cansize.cansizeid
      );
      return {
        cancode: { code: can.cansizecode, cansizeid: cansize.cansizeid },
        candata: Object.keys(cansize)
          .filter((key) => key !== 'cansizeid' && key !== 'usepg')
          .map((key) => {
            return {
              keyid: key,
              ...cansize[key],
            };
          }),
      };
    });

    //Product General Data format
    const selectedProduct = Object.keys(this.state.currentProduct).filter(
      (key) => key !== 'basepaints' && key !== 'productid' && key !== 'usepg'
    );
    const productFormated = selectedProduct
      .map((key) => {
        return {
          keyid: key,
          ...currentProduct[key],
        };
      })
      .map((key) =>
        key.keyid === 'bmargin' ||
        key.keyid === 'cmargin' ||
        key.keyid === 'tax'
          ? {
              ...key,
              value: `${key.value * 100} %`,
            }
          : key.keyid === 'bcost' ||
              key.keyid === 'bprice' ||
              key.keyid === 'tintfee'
            ? {
                ...key,
                value: key.value
                  ? `${priceFormatter.format(key.value)} ${currencySymbol}`
                  : '',
              }
            : key
      );

    //Basepaints product data format

    const currentProductBasepaintsCodes = currentProduct?.basepaints
      ?.map((basepaint) => {
        return products
          .find((product) => product.productid === currentProduct.productid)
          .basepaints.find((base) => base.baseid === basepaint.baseid);
      })
      .sort((a, b) => (a.basecode > b.basecode ? 1 : -1));
    const formatBasepaint = (id, array) => {
      return array.map((key) => {
        return {
          baseid: id,
          keyid: key,
          ...this.state.currentActiveBasePaints.find(
            (basepaint) => basepaint.baseid === id
          )[key],
        };
      });
    };

    const selectedBasepaints = this.state.currentActiveBasePaints
      .map((basepaint) => {
        const objectKeysArray = Object.keys(basepaint);
        return formatBasepaint(
          basepaint.baseid,
          objectKeysArray.filter(
            (key) => key !== 'cansizes' && key !== 'baseid' && key !== 'usepg'
          )
        );
      })
      .flat()
      .map((key) =>
        key.keyid === 'bmargin' ||
        key.keyid === 'cmargin' ||
        key.keyid === 'tax'
          ? {
              ...key,
              value: `${key.value * 100} %`,
            }
          : key.keyid === 'bcost' ||
              key.keyid === 'bprice' ||
              key.keyid === 'tintfee'
            ? { ...key, value: key.value ? `${key.value} €` : '' }
            : key
      );
    // Cansizes product data format
    const productCansizeWithCodes = currentActiveCansizes
      .map((cans) => {
        return cans.cansizes.map((cansize) => {
          const can = cacheCansizes.find(
            (can) => can.cansizeid === cansize.cansizeid
          );
          return {
            cansizeValue: {
              code: can.cansizecode,
              cansizeid: cansize.cansizeid,
              basepaintid: cans.baseid,
            },
            ...cansize,
          };
        });
      })
      .flat();

    const productCansizesFormated = productCansizeWithCodes
      .map((cansize) => {
        const data = Object.keys(cansize)
          .filter(
            (key) =>
              key !== 'cansizeid' && key !== 'cansizeValue' && key !== 'usepg'
          )
          .map((key) => {
            return {
              keyid: key,
              ...cansize[key],
            };
          });
        return { cansizeValue: cansize['cansizeValue'], cansizes: data };
      })
      .sort((prevCan, nextCan) => {
        return (
          prevCan.cansizeValue.code.match(/\d+/g)[0] -
          nextCan.cansizeValue.code.match(/\d+/g)[0]
        );
      });

    const pricingHead = [
      t('lbl.description'),
      t('lbl.value_pricing'),
      t('lbl.customValue_pricing'),
    ];
    // Display data according to each type
    let data, tableBody;
    switch (true) {
      case node.code.split('_').includes('common'):
        data = {
          name: t('cfg.h_common_data_pricing'),
          head: pricingHead,
          body: commonFormated,
        };

        tableBody = data.body.map((data) => (
          <tr key={`common_${data.keyid}`}>
            <td>{translatedTextObj(data.keyid)[data.keyid]}</td>
            <td>
              {typeof data.value === 'number'
                ? priceFormatter.format(data.value)
                : data.value}
            </td>
            <td
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {data.state === 'L' && (
                <FontAwesomeIcon icon="lock" style={{ margin: 'auto' }} />
              )}
              <NumberInput
                dataTestid={`common_${data.keyid}`}
                className="table__cell form-control"
                disabled={data.state === 'L'}
                readOnly={
                  data.state === 'L' || this.props.accessDenied('price_tab')
                }
                step={0.1}
                max={isMargin(data.keyid) ? 99 : undefined}
                onChange={(value) =>
                  this.inputOnChangeHandler(value, data.keyid, 'common')
                }
                value={data.customValue}
                emptyIsNull
              />
            </td>
          </tr>
        ));
        break;
      case node.code.split('_').includes('colorants'):
        data = {
          name: t('cfg.h_colorants_pricing'),
          head: [
            t('lbl.colorant'),
            t('pricing.ccost', { 0: currencySymbol }),

            t('lbl.customValue_pricing'),
            t('pricing.cmargin'),
            t('lbl.customValue_pricing'),
          ],
          body: colorantsFormated,
        };

        tableBody = data.body.map((data) => (
          <tr key={data.keyid.cntid}>
            <td>{data.keyid.value}</td>
            <td>{priceFormatter.format(data.cost.value)}</td>
            <td>
              {data.cost.state === 'L' ? (
                <FontAwesomeIcon icon="lock" />
              ) : (
                <NumberInput
                  dataTestid={`cnt_cost_${data.keyid.cntid}`}
                  readOnly={
                    data.state === 'L' || this.props.accessDenied('price_tab')
                  }
                  step={0.1}
                  className="table__cell form-control"
                  onChange={(value) =>
                    this.inputOnChangeHandler(
                      value,
                      data.keyid,
                      'colorants',
                      'ccost'
                    )
                  }
                  value={
                    this.state.colorants.find(
                      (colorant) => colorant.cntid === data.keyid.cntid
                    )?.ccost.customValue
                  }
                  emptyIsNull
                />
              )}
            </td>
            <td>{data.margin.value}</td>
            <td>
              {data.margin.state === 'L' ? (
                <FontAwesomeIcon icon="lock" />
              ) : (
                <NumberInput
                  dataTestid={`cnt_margin_${data.keyid.cntid}`}
                  step={0.1}
                  max={99}
                  className="table__cell form-control"
                  onChange={(value) => {
                    this.inputOnChangeHandler(
                      value,
                      data.keyid,
                      'colorants',
                      'cmargin'
                    );
                  }}
                  value={
                    this.state.colorants.find(
                      (colorant) => colorant.cntid === data.keyid.cntid
                    )?.cmargin.customValue
                  }
                  emptyIsNull
                />
              )}
            </td>
          </tr>
        ));
        break;
      case node.code.split('_').includes('cansize'):
        data = {
          name: t('cfg.h_cansize_pricing'),
          head: pricingHead,
          body: cansizeFormated,
        };
        tableBody = data.body.map((can) => (
          <div key={can.cancode.code}>
            <p style={{ width: '20%', fontSize: '1.5rem' }}>
              {can.cancode.code}
            </p>
            <Table size="xs" bordered>
              <thead className="settings__th">
                <tr>
                  {data.head.map((name, index) => (
                    <th key={data.name + index}>{name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {can.candata.map((cansize) => (
                  <tr key={cansize.keyid + can.cancode.cansizeid.toString()}>
                    <td>{translatedTextObj(cansize.keyid)[cansize.keyid]}</td>
                    <td>{priceFormatter.format(cansize.value)}</td>
                    <td>
                      {cansize.state === 'L' ? (
                        <FontAwesomeIcon icon="lock" />
                      ) : (
                        <NumberInput
                          dataTestid={`cnt_can_${cansize.keyid}_${can.cancode}`}
                          className="table__cell form-control"
                          step={0.1}
                          onChange={(value) =>
                            this.inputOnChangeHandler(
                              value,
                              cansize.keyid,
                              'cansizes',
                              undefined,
                              undefined,
                              can.cancode.cansizeid
                            )
                          }
                          value={cansize.customValue}
                          emptyIsNull
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ));
        break;
      case node.code.includes('product_'):
        data = {
          name: node.name,
          head: pricingHead,
          body: productFormated,
        };

        tableBody = data.body.map((data) => (
          <tr key={data.keyid}>
            <td>{translatedTextObj(data.keyid)[data.keyid]}</td>
            <td>{data.value}</td>
            <td>
              {data.state === 'L' ? (
                <FontAwesomeIcon icon="lock" />
              ) : (
                <NumberInput
                  dataTestid={`product_${data.keyid}`}
                  step={0.1}
                  max={isMargin(data.keyid) ? 99 : undefined}
                  className="table__cell form-control"
                  onChange={(value) =>
                    this.inputOnChangeHandler(
                      value,
                      data.keyid,
                      'productGeneral'
                    )
                  }
                  value={data.customValue}
                  emptyIsNull
                />
              )}
            </td>
          </tr>
        ));
        break;
      default:
        data = {
          name: node.name,
          head: [],
          body: [],
        };
        break;
    }
    return (
      <>
        <ErrorBoundary>
          <Card
            style={{ height: 'calc((100vh - 102px) - 6rem)' }}
            className="config-card"
            dir={direction}
          >
            <CardHeader
              className="config-card-header"
              dir={direction}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{data.name}</span>
              {this.props.node.name !== 'Products' && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                  }}
                >
                  <Button
                    color="primary"
                    className="mb-2 mr-2 ml-2"
                    data-testid="price_save"
                    onClick={this.saveButtonHandler}
                    disabled={
                      this.props.accessDenied('price_tab') ||
                      loading ||
                      !has_changes
                    }
                    data-denied={this.props.accessDenied('price_tab')}
                    style={{ maxWidth: '300px' }}
                  >
                    {loading && <Spinner />}
                    {t('fn.save')}
                  </Button>
                  <Button
                    color="warning"
                    className="mb-2"
                    data-testid="price_reset"
                    onClick={this.resetButtonHandler}
                    disabled={
                      this.props.accessDenied('price_tab') ||
                      loading ||
                      !has_changes
                    }
                    data-denied={this.props.accessDenied('price_tab')}
                    style={{ maxWidth: '300px' }}
                  >
                    {loading && <Spinner />}
                    {t('fn.reset')}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardBody
              className="scroll config-card-body"
              dir={direction}
              style={{ textAlign: 'center' }}
            >
              {node.code !== 'h_cansize_pricing' ? (
                <Table size="md" bordered>
                  <thead className="settings__th">
                    <tr>
                      {data.head.map((name, index) => (
                        <th key={data.name + index}>{name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{tableBody}</tbody>
                </Table>
              ) : (
                tableBody
              )}
              {/** Basepaints */}
              {currentProductBasepaintsCodes &&
                node.type === 'product_pricing' &&
                currentProductBasepaintsCodes.map((basepaint, index) => {
                  return (
                    <div
                      className="mr-2 ml-2"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        marginBottom: '1rem',
                      }}
                      key={`${basepaint.baseid}${index}`}
                    >
                      <Button
                        data-testid={`base_${basepaint.basecode}`}
                        style={{
                          width: '100%',
                          display: 'flex',
                          textAlign: 'left',
                          alignItems: 'center',
                        }}
                        onClick={() =>
                          this.handleToggleTable(
                            'basepaintExpand',
                            basepaint.baseid
                          )
                        }
                      >
                        <FontAwesomeIcon
                          size="2x"
                          color="#308DC7"
                          style={{ marginRight: '1rem' }}
                          icon={
                            this.state.basepaintExpand.length > 0 &&
                            this.state.basepaintExpand.find(
                              (base) => base.id === basepaint.baseid
                            ) &&
                            this.state.basepaintExpand.find(
                              (base) => base.id === basepaint.baseid
                            ).open
                              ? faCaretDown
                              : faCaretRight
                          }
                        />
                        {basepaint.basecode}
                      </Button>
                      <Collapse
                        style={{ margin: '0' }}
                        isOpen={
                          this.state.basepaintExpand.length > 0 &&
                          this.state.basepaintExpand.find(
                            (base) => base.id === basepaint.baseid
                          ) &&
                          this.state.basepaintExpand.find(
                            (base) => base.id === basepaint.baseid
                          ).open
                        }
                      >
                        <Table size="xs" bordered>
                          <thead className="settings__th">
                            <tr>
                              {data.head.map((name, index) => (
                                <th key={data.name + index}>{name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedBasepaints.map(
                              (data, index) =>
                                data.baseid === basepaint.baseid && (
                                  <tr
                                    key={
                                      `${basepaint.basecode}
                                      ${basepaint.baseid}` + index
                                    }
                                  >
                                    <td>
                                      {
                                        translatedTextObj(data.keyid)[
                                          data.keyid
                                        ]
                                      }
                                    </td>
                                    <td>{data.value}</td>
                                    <td>
                                      {data.state === 'L' ? (
                                        <FontAwesomeIcon icon="lock" />
                                      ) : (
                                        <NumberInput
                                          dataTestid={`base_${basepaint.baseid}_${data.keyid}`}
                                          className="table__cell form-control"
                                          step={0.1}
                                          max={
                                            isMargin(data.keyid)
                                              ? 99
                                              : undefined
                                          }
                                          onChange={(value) =>
                                            this.inputOnChangeHandler(
                                              value,
                                              data.keyid,
                                              'productBasepaints',
                                              undefined,
                                              basepaint.baseid
                                            )
                                          }
                                          value={data.customValue}
                                          emptyIsNull
                                        />
                                      )}
                                    </td>
                                  </tr>
                                )
                            )}
                          </tbody>
                        </Table>
                        {productCansizesFormated.map(
                          (cansize, index) =>
                            cansize.cansizeValue.basepaintid ===
                              basepaint.baseid && (
                              <div
                                key={cansize.cansizeValue.cansizeid + index}
                                style={{
                                  display: 'flex',
                                  marginLeft: '1rem',
                                  flexDirection: 'column',
                                }}
                              >
                                <p
                                  style={{
                                    width: '20%',
                                    textAlign: 'left',
                                    fontSize: '1.5rem',
                                  }}
                                >
                                  {cansize.cansizeValue.code}
                                </p>
                                <Table size="xs" bordered>
                                  <thead className="settings__th">
                                    <tr>
                                      {data.head.map((name, index) => (
                                        <th key={data.name + index}>{name}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cansize.cansizes.map((data) => (
                                      <tr
                                        key={
                                          data.keyid +
                                          cansize.cansizeValue.cansizeid +
                                          cansize.cansizeValue.basepaintid
                                        }
                                      >
                                        <td>
                                          {
                                            translatedTextObj(data.keyid)[
                                              data.keyid
                                            ]
                                          }
                                        </td>
                                        <td>{data.value}</td>
                                        <td>
                                          {data.state === 'L' ? (
                                            <FontAwesomeIcon icon="lock" />
                                          ) : (
                                            <NumberInput
                                              dataTestid={`can_${basepaint.baseid}_${data.keyid}_${cansize.cansizeValue.cansizeid}`}
                                              step={0.1}
                                              className="table__cell form-control"
                                              onChange={(value) =>
                                                this.inputOnChangeHandler(
                                                  value,
                                                  data.keyid,
                                                  'productCansizes',
                                                  undefined,
                                                  basepaint.baseid,
                                                  cansize.cansizeValue.cansizeid
                                                )
                                              }
                                              value={data.customValue}
                                              emptyIsNull
                                            />
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </Table>
                              </div>
                            )
                        )}
                      </Collapse>
                    </div>
                  );
                })}
            </CardBody>
          </Card>
        </ErrorBoundary>
      </>
    );
  }
}

Pricing.propTypes = {
  t: PropTypes.func,
  data: PropTypes.object,
  commonPricing: PropTypes.object,
  productPricing: PropTypes.object,
  colorantsPricing: PropTypes.array,
  cansizePricing: PropTypes.array,
  node: PropTypes.object,
  cnts: PropTypes.array,
  fetchProductsPricing: PropTypes.func,
  setCommonPrice: PropTypes.func,
  setColorantsPrice: PropTypes.func,
  setCansizesPrice: PropTypes.func,

  loading: PropTypes.bool,
  cacheCansizes: PropTypes.array,
  setProductPrice: PropTypes.func,
  accessDenied: PropTypes.func,
  products: PropTypes.array,
  priceFormatter: PropTypes.object,
  currencySymbol: PropTypes.string,
};

const mapStateToProps = (state) => ({
  commonPricing: pricingSelectors.commonPricing(state),
  colorantsPricing: pricingSelectors.colorantsPricing(state),
  cnts: cacheSelectors.cnts(state),
  products: cacheSelectors.products(state),
  cacheCansizes: cacheSelectors.cansizes(state),
  loading: pricingSelectors.loading(state),
  cansizePricing: pricingSelectors.cansizesPricing(state),
  productPricing: pricingSelectors.productPricing(state),
  priceFormatter: new NumberFormatter({
    decimals: state.configurations.zone.currencydecimals,
    allowTrailingZeros: true,
  }),
  currencySymbol: state.configurations.zone.currencysymbol || '',
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      setCommonPrice: actions.setCommonPricing,
      setColorantsPrice: actions.setColorantsPricing,
      setCansizesPrice: actions.setCansizesPricing,
      setProductPrice: actions.setProductPricing,
      fetchProductsPricing: actions.fetchProductsPricing,
    },
    dispatch
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(Pricing);

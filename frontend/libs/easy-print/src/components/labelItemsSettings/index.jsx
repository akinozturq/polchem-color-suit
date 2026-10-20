import React, { Component } from 'react';
import './styles.css';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Select from 'react-select';
import CustomInput from '../CustomInput';
import { mmToPixel, pixelToMm } from '../../containers/Utils';
import { withTranslation } from 'react-i18next';
import { ITEM_BARCODE } from '../../mylib/Constants';

const rotations = ['0', '90', '180', '270'];

const selectStyles = {
  menu: ({ top, ...remains }, _) => ({ ...remains }),
};

class labelItemsSettings extends Component {
  shouldComponentUpdate(nextProps) {
    if (
      this.props.item !== nextProps.item ||
      this.props.layout.marginTop !== nextProps.layout.marginTop ||
      this.props.layout.marginBottom !== nextProps.layout.marginBottom ||
      this.props.layout.marginLeft !== nextProps.layout.marginLeft ||
      this.props.layout.marginRight !== nextProps.layout.marginRight
    ) {
      return true;
    }
    return false;
  }
  customWidth = (e) => {
    let num = Number(e.target.value);
    if (!isNaN(num)) {
      num = mmToPixel(num);
      const item = { ...this.props.item, width: num };
      this.props.updateItem(item);
    }
  };
  customHeight = (e) => {
    let num = Number(e.target.value);
    if (!isNaN(num)) {
      num = mmToPixel(num);
      const item = { ...this.props.item, height: num };
      this.props.updateItem(item);
    }
  };
  customPositionLeft = (e) => {
    let num = Number(e.target.value);
    if (!isNaN(num)) {
      num = mmToPixel(num);
      const item = { ...this.props.item, x: num };
      this.props.updateItem(item);
    }
  };
  customPositionTop = (e) => {
    let num = Number(e.target.value);
    if (!isNaN(num)) {
      num = mmToPixel(num);
      const item = { ...this.props.item, y: num };
      this.props.updateItem(item);
    }
  };

  render() {
    const { t, item, rotationSnaps } = this.props;
    const sizeInputs = classnames('labelItem__inputs', {
      'labelItem__inputs--line': false,
    });
    const itemSettings = (
      <React.Fragment>
        <div className="labelItem__position">
          <p className="labelItem__title margin-0">
            {t('lbl.positionFrom', 'Position from')}
          </p>
          <div className="labelItem__inputs">
            <CustomInput
              type="number"
              disabled={!item}
              onChange={this.customPositionLeft}
              value={
                item
                  ? pixelToMm(Math.round(item.x)) === 0
                    ? ''
                    : pixelToMm(Math.round(item.x))
                  : ''
              }
              inputSize="md"
              variant="vertical"
              labelText={t('lbl.leftMargin', 'Left')}
            />
            <CustomInput
              type="number"
              disabled={!item}
              onChange={this.customPositionTop}
              value={
                item
                  ? pixelToMm(Math.round(item.y)) === 0
                    ? ''
                    : pixelToMm(Math.round(item.y))
                  : ''
              }
              inputSize="md"
              variant="vertical"
              labelText={t('lbl.topMargin', 'Top')}
            />
          </div>
        </div>
        <div className="labelItem__size">
          <p className="labelItem__title margin-0">
            {t('lbl.size_itemOnLabel', 'Size')}
          </p>
          <div className={sizeInputs}>
            <CustomInput
              type="number"
              disabled={!item}
              onChange={this.customWidth}
              value={
                item
                  ? pixelToMm(Math.round(item.width)) === 0
                    ? ''
                    : pixelToMm(Math.round(item.width))
                  : ''
              }
              inputSize="md"
              variant="vertical"
              labelText={t('lbl.width', 'Width')}
            />
            <CustomInput
              type="number"
              disabled={!item || (item && item.itemType === 'line')}
              onChange={this.customHeight}
              value={
                item
                  ? pixelToMm(Math.round(item.height)) === 0
                    ? ''
                    : pixelToMm(Math.round(item.height))
                  : ''
              }
              inputSize="md"
              variant="vertical"
              labelText={t('lbl.height', 'Height')}
            />
          </div>
        </div>
        <div className="labelItem__position">
          <p className="labelItem__title margin-0">
            {t('lbl.rotation', 'Rotation')}
          </p>
          <div className="labelItem__inputs">
            <Select
              styles={selectStyles}
              className="typeSettings__select--inline"
              disabled={!item}
              value={
                item?.rotation
                  ? {
                      value: item.rotation.toString(),
                      label: item.rotation.toString(),
                    }
                  : { value: '0', label: '0' }
              }
              options={rotations.map((deg) => ({
                value: deg,
                label: deg,
              }))}
              onChange={rotationSnaps}
            />
          </div>
        </div>
        {item?.itemType === ITEM_BARCODE && (
          <div className="labelItem__position">
            <p className="labelItem__title margin-0">
              {t('lbl.showText', 'Show text')}
            </p>
            <div className="labelItem__inputs">
              <CustomInput
                type="checkbox"
                disabled={!item}
                onChange={(e) => {
                  const item = {
                    ...this.props.item,
                    showText: e.target.checked,
                  };
                  this.props.updateItem(item);
                }}
                checked={item?.showText ? item.showText : false}
                inputSize="md"
                variant="vertical"
                width="1.25rem"
              />
            </div>
          </div>
        )}
      </React.Fragment>
    );

    return <React.Fragment>{itemSettings}</React.Fragment>;
  }
}

labelItemsSettings.propTypes = {
  t: PropTypes.func.isRequired,
  item: PropTypes.object,
  layout: PropTypes.object,
  updateItem: PropTypes.func.isRequired,
  rotationSnaps: PropTypes.func,
};

export default withTranslation('translations')(labelItemsSettings);

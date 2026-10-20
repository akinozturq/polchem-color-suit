import React from 'react';
import PropTypes from 'prop-types';
import Write from './Write';
import Rectangle from './Rectangle';
import Barcode from './Barcode';
import DrawEllipse from './DrawEllipse';
import DrawLine from './DrawLine';
import LabelVariable from './LabelVariable';
import ImageDisplay from './ImageDisplay';
import {
  ITEM_TEXT,
  ITEM_VARIABLE,
  ITEM_BARCODE,
  ITEM_ELLIPSE,
  ITEM_LINE,
  ITEM_RECTANGLE,
  ITEM_IMAGE,
} from '../../mylib/Constants';

class Item extends React.Component {
  render() {
    const { item, isPreview } = this.props;
    const readonly = isPreview && !item.customText;

    if (item.itemType === ITEM_TEXT) {
      return <Write {...this.props} readonly={readonly} />;
    } else if (item.itemType === ITEM_VARIABLE) {
      return <LabelVariable {...this.props} />;
    } else if (item.itemType === ITEM_BARCODE) {
      return <Barcode {...this.props} />;
    } else if (item.itemType === ITEM_ELLIPSE) {
      return <DrawEllipse {...this.props} />;
    } else if (item.itemType === ITEM_LINE) {
      return <DrawLine {...this.props} />;
    } else if (item.itemType === ITEM_RECTANGLE) {
      return <Rectangle {...this.props} />;
    } else if (item.itemType === ITEM_IMAGE) {
      return <ImageDisplay {...this.props} />;
    } else {
      return null;
    }
  }
}
Item.propTypes = {
  item: PropTypes.object,
  layout: PropTypes.object,
  selectItem: PropTypes.func,
  updateItem: PropTypes.func,
  selectedItemId: PropTypes.number,
  useDummyData: PropTypes.bool,
  isPreview: PropTypes.bool,
};

Item.defaultProps = {
  useDummyData: true,
  readonly: false,
};

export default Item;

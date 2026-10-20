import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import './styles.css';
import FontStyle from '../FontStyle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEM_TEXT, ITEM_VARIABLE } from '../../mylib/Constants';

import alignBottom from '../../icons/alignBottom.svg';
import alignCenter from '../../icons/alignCenter.svg';
import alignTop from '../../icons/alingTop.svg';
import bringtoFront from '../../icons/toFront.svg';
import bringtoBack from '../../icons/toBack.svg';
import moveUp from '../../icons/moveUp.svg';
import moveDown from '../../icons/moveDown.svg';
import { Col } from '../../mylib/layouts/Col';
import { Button } from '../../mylib/Button';

const Alignments = (props) => {
  const {
    item,
    updateItem,
    moveItemBottom,
    moveItemDown,
    moveItemTop,
    moveItemUp,
  } = props;

  const alignItem = (align) => {
    let changedItem = {};
    switch (align) {
      case 'right':
      case 'center':
      case 'left':
        changedItem = { ...item, align };
        break;
      case 'top':
      case 'middle':
      case 'bottom':
        changedItem = { ...item, verticalAlign: align };
        break;
      default:
        break;
    }
    updateItem(changedItem);
  };

  const moveItemLayer = (direction) => {
    switch (direction) {
      case 'down':
        moveItemDown(item);
        break;
      case 'up':
        moveItemUp(item);
        break;
      case 'bottom':
        moveItemBottom(item);
        break;
      case 'top':
        moveItemTop(item);
        break;
      default:
        break;
    }
  };

  return (
    <Fragment>
      <Col
        xs={'auto'}
        style={{ display: 'flex', padding: 0, maxWidth: '560px' }}
      >
        <FontStyle
          isDisabled={
            !item ||
            (item.itemType !== ITEM_TEXT && item.itemType !== ITEM_VARIABLE)
          }
          item={item}
          updateItem={updateItem}
        />
        <Button
          className="font__icon"
          title="Align text to left"
          disabled={
            !item ||
            (item.itemType !== ITEM_TEXT && item.itemType !== ITEM_VARIABLE)
          }
          onClick={() => alignItem('left')}
        >
          <FontAwesomeIcon icon="align-left" />
        </Button>
        <Button
          className="font__icon"
          title="Align text to center"
          onClick={() => alignItem('center')}
          disabled={
            !item ||
            (item.itemType !== ITEM_TEXT && item.itemType !== ITEM_VARIABLE)
          }
        >
          <FontAwesomeIcon icon="align-center" />
        </Button>
        <Button
          className="font__icon"
          title="Align text to right"
          onClick={() => alignItem('right')}
          disabled={
            !item ||
            (item.itemType !== ITEM_TEXT && item.itemType !== ITEM_VARIABLE)
          }
        >
          <FontAwesomeIcon icon="align-right" />
        </Button>
        <Button
          className="font__icon"
          title="Align text to top"
          onClick={() => alignItem('top')}
          disabled={
            !item ||
            (item.itemType !== ITEM_TEXT && item.itemType !== ITEM_VARIABLE)
          }
        >
          <img width={20} height={20} src={alignTop} alt="align top" />
        </Button>
        <Button
          className="font__icon"
          title="Align text to middle"
          onClick={() => alignItem('middle')}
          disabled={
            !item ||
            (item.itemType !== ITEM_TEXT && item.itemType !== ITEM_VARIABLE)
          }
        >
          <img width={20} height={20} src={alignCenter} alt="align center" />
        </Button>
        <Button
          className="font__icon"
          title="Align text to bottom"
          onClick={() => alignItem('bottom')}
          disabled={
            !item ||
            (item.itemType !== ITEM_TEXT && item.itemType !== ITEM_VARIABLE)
          }
        >
          <img width={20} height={20} src={alignBottom} alt="align bottom" />
        </Button>
      </Col>

      <Col
        xs={'auto'}
        style={{ padding: 0, display: 'flex', maxWidth: '160px' }}
      >
        <Button
          className="font__icon"
          title="Bring to front"
          onClick={() => moveItemLayer('top')}
          disabled={!item}
        >
          <img width={20} height={20} src={bringtoFront} alt="missing" />
        </Button>
        <Button
          className="font__icon"
          title="Move up"
          onClick={() => moveItemLayer('up')}
          disabled={!item}
        >
          <img width={20} height={20} src={moveUp} alt="missing" />
        </Button>
        <Button
          className="font__icon"
          title="Move down"
          onClick={() => moveItemLayer('down')}
          disabled={!item}
        >
          <img width={20} height={20} src={moveDown} alt="missing" />
        </Button>
        <Button
          className="font__icon"
          title="Bring to back"
          onClick={() => moveItemLayer('bottom')}
          disabled={!item}
        >
          <img width={20} height={20} src={bringtoBack} alt="missing" />
        </Button>
      </Col>
    </Fragment>
  );
};

Alignments.propTypes = {
  item: PropTypes.object,
  updateItem: PropTypes.func,
  moveItemDown: PropTypes.func,
  moveItemUp: PropTypes.func,
  moveItemTop: PropTypes.func,
  moveItemBottom: PropTypes.func,
};

export default Alignments;

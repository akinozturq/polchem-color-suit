import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  CardHeader,
  Col,
  ListGroup,
  ListGroupItem,
  Row,
  UncontrolledTooltip,
} from 'reactstrap';
import _ from 'lodash';
import { equalsIgnoreCase, rightToLeft } from '../../../mylib/Utils.jsx';

const MultiSelect = ({
  item,
  idx,
  t,
  updateItem,
  accessDenied,
  is_pro,
  unsetConfig,
}) => {
  const itemInNodeRef = useRef(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const isRtl = rightToLeft();

  let in_use = String(item.value).split(';');
  let available = _.difference(item.options, in_use);
  const pro_only = ['article', 'matching', 'customer'];
  const move_button_style = {
    width: '2rem',
    margin: '4 0',
    padding: 2,
  };
  if (!is_pro) {
    available = _.difference(available, pro_only);
  }
  const disabled = item.islocked || accessDenied(item.code);

  const tool_tip = { ...item };
  if (item.type === 'select') {
    tool_tip.common_value =
      _.find(tool_tip.options, (x) =>
        equalsIgnoreCase(x.value, item.common_value)
      )?.label || item.common_value;
    tool_tip.site_value =
      _.find(tool_tip.options, (x) =>
        equalsIgnoreCase(x.value, item.site_value)
      )?.label || item.site_value;
  }

  const allowDrop = (ev) => {
    ev.preventDefault();
  };

  const drag = (ev) => {
    ev.dataTransfer.setData('text', ev.target.id);
  };

  const drop = (ev, item, setinuse, idx) => {
    ev.preventDefault();

    const tid = ev.target.id;
    const data = ev.dataTransfer.getData('text');
    let in_use = String(item.value).split(';');

    if (setinuse) {
      in_use.splice(in_use.indexOf(tid), 0, data);
    } else {
      in_use = in_use.filter((x) => x !== data);
    }
    // only unique items
    in_use = in_use.filter((x, i, self) => self.indexOf(x) === i);

    updateItem(item, in_use.join(';'), idx);
  };

  const move_item = (ev, item, setinuse, idx) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) {
      return;
    }
    const toInUseKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
    const toAvailableKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    if (!setinuse && ev.key === toInUseKey) return;
    if (setinuse && ['ArrowDown', 'ArrowUp', toAvailableKey].includes(ev.key))
      return;

    ev.preventDefault();

    const tid = ev.target.id;
    let in_use = String(item.value).split(';');

    // Move to inuse or take out
    if ([toInUseKey, toAvailableKey].includes(ev.key)) {
      if (ev.key === toInUseKey) {
        if (setinuse && !in_use.includes(tid)) {
          in_use.push(tid);
        }
      } else if (!setinuse) {
        in_use = in_use.filter((x) => x !== tid);
      }
    }
    // Re arrange
    else {
      let from = in_use.indexOf(tid);
      let to = Math.max(from - 1, 0);
      if (ev.key === 'ArrowDown') to = Math.min(from + 1, in_use.length - 1);
      // remove `from` item and store it
      let f = in_use.splice(from, 1)[0];
      // insert stored item into position `to`
      in_use.splice(to, 0, f);
    }

    itemInNodeRef.current = tid;
    updateItem(item, in_use.join(';'), idx);
  };

  const handleButtonClick = (direction) => {
    if (!selectedItem) return;

    let in_use = String(item.value).split(';');

    if (direction === 'left' && !in_use.includes(selectedItem)) {
      in_use.push(selectedItem);
    } else if (direction === 'right') {
      in_use = in_use.filter((x) => x !== selectedItem);
    } else if (
      ['up', 'down'].includes(direction) &&
      in_use.includes(selectedItem)
    ) {
      const from = in_use.indexOf(selectedItem);
      const to =
        direction === 'down'
          ? Math.min(from + 1, in_use.length - 1)
          : Math.max(from - 1, 0);
      in_use.splice(to, 0, in_use.splice(from, 1)[0]);
    } else {
      itemInNodeRef.current = selectedItem;
      return;
    }

    itemInNodeRef.current = selectedItem;
    updateItem(item, in_use.join(';'), idx);
  };

  useEffect(() => {
    if (itemInNodeRef.current) {
      document.getElementById(itemInNodeRef.current).focus();
    }
  }, [item.value]);

  const listItemStyle = (index) => ({
    backgroundColor: index % 2 === 0 ? 'white' : 'rgb(220, 228, 233)',
    paddingLeft: isRtl ? 0 : '0.5rem',
    paddingRight: isRtl ? '0.5rem' : 0,
    textAlign: isRtl ? 'right' : 'left',
  });
  const leftArrow = isRtl ? '→' : '←';
  const rightArrow = isRtl ? '←' : '→';

  return (
    <div key={idx} dir={isRtl ? 'rtl' : 'ltr'}>
      <Row>
        <Col xs={1} />
        <Col style={{ textAlign: 'center' }}>
          <div id={item.key + '_tooltip'} style={{ fontSize: 'x-large' }}>
            {item.name}
          </div>
          <UncontrolledTooltip placement="auto" target={item.key + '_tooltip'}>
            {t(
              'prompt.dragItemsToLocation',
              'Drag items into desired location'
            )}
          </UncontrolledTooltip>
        </Col>
      </Row>
      <Row style={{ margin: '1rem' }}>
        <Col
          style={{
            marginRight: isRtl ? 0 : '0.5rem',
            marginLeft: isRtl ? '0.5rem' : 0,
          }}
        >
          <Card style={{ backgroundColor: 'white' }}>
            <CardHeader style={{ textAlign: isRtl ? 'right' : 'left' }}>
              {t('lbl.onScreen', 'On Screen')}
            </CardHeader>
            <div
              className="scroll"
              style={{ height: '12rem' }}
              onDrop={(e) => drop(e, item, true, idx)}
              onDragOver={allowDrop}
            >
              <ListGroup flush data-testid="drag_enabled">
                {in_use.map((name, i) => (
                  <ListGroupItem
                    tag="button"
                    style={listItemStyle(i)}
                    draggable={!disabled}
                    id={name}
                    onDragStart={drag}
                    onKeyDown={(e) => move_item(e, item, false, idx)}
                    onClick={() => setSelectedItem(name)}
                    action
                    key={i}
                  >
                    {item.trans[name] || name}
                  </ListGroupItem>
                ))}
              </ListGroup>
            </div>
          </Card>
        </Col>
        <div
          style={{
            height: '15rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Button
            data-testid="move_up"
            style={move_button_style}
            onClick={() => handleButtonClick('up')}
            disabled={
              !selectedItem ||
              !in_use.includes(selectedItem) ||
              disabled ||
              in_use.indexOf(selectedItem) === 0
            }
          >
            {'↑'}
          </Button>
          <Button
            data-testid="move_left"
            style={move_button_style}
            onClick={() => handleButtonClick('left')}
            disabled={
              !selectedItem || in_use.includes(selectedItem) || disabled
            }
          >
            {leftArrow}
          </Button>
          <Button
            data-testid="move_right"
            style={move_button_style}
            onClick={() => handleButtonClick('right')}
            disabled={
              !selectedItem || !in_use.includes(selectedItem) || disabled
            }
          >
            {rightArrow}
          </Button>
          <Button
            data-testid="move_down"
            style={move_button_style}
            onClick={() => handleButtonClick('down')}
            disabled={
              !selectedItem ||
              !in_use.includes(selectedItem) ||
              disabled ||
              in_use.indexOf(selectedItem) === in_use.length - 1
            }
          >
            {'↓'}
          </Button>

          {item.site_value !== undefined && (
            <>
              <Button
                disabled={accessDenied(item.code)}
                data-denied={accessDenied(item.code)}
                className={'restore_btn'}
                onClick={() => unsetConfig(item.code)}
                id={String(item.code).replace('.', '_') + '_reset_tooltip'}
              />

              <UncontrolledTooltip
                placement="auto"
                target={String(item.code).replace('.', '_') + '_reset_tooltip'}
              >
                {t(
                  'tooltip.configDifferent',
                  'Config is different for common ({{common_value}}) and in site ({{site_value}}). Revert back to common by clicking',
                  tool_tip
                )}
              </UncontrolledTooltip>
            </>
          )}
        </div>
        <Col
          style={{
            marginLeft: isRtl ? 0 : '0.5rem',
            marginRight: isRtl ? '0.5rem' : 0,
          }}
        >
          <Card style={{ backgroundColor: 'white' }}>
            <CardHeader style={{ textAlign: isRtl ? 'right' : 'left' }}>
              {t('msg.hidden', 'Hidden')}
            </CardHeader>
            <div
              className="scroll"
              style={{ height: '12rem' }}
              onDrop={(e) => drop(e, item, false, idx)}
              onDragOver={allowDrop}
            >
              <ListGroup flush data-testid="drag_available">
                {available.map((name, i) => (
                  <ListGroupItem
                    tag="button"
                    style={listItemStyle(i)}
                    draggable={!disabled}
                    id={name}
                    onDragStart={drag}
                    onKeyDown={(e) => move_item(e, item, true, idx)}
                    onClick={() => setSelectedItem(name)}
                    action
                    key={i}
                  >
                    {item.trans[name] || name}
                  </ListGroupItem>
                ))}
              </ListGroup>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

MultiSelect.propTypes = {
  item: PropTypes.object.isRequired,
  idx: PropTypes.number.isRequired,
  t: PropTypes.func.isRequired,
  updateItem: PropTypes.func.isRequired,
  accessDenied: PropTypes.func.isRequired,
  unsetConfig: PropTypes.func.isRequired,
  is_pro: PropTypes.bool.isRequired,
};

export default MultiSelect;

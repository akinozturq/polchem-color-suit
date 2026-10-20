import React from 'react';
import { Rect } from 'react-konva';
import AddTransformer from './Transformer';
import PropTypes from 'prop-types';
import { gridSize, dragBoundItem } from '../../containers/Utils';
import { FILL_COLOR_VARIABLE_PLACEHOLDER } from '../../mylib/Constants';

class Rectangle extends React.Component {
  constructor() {
    super();
    this.shapeRef = React.createRef();
    this.trRef = React.createRef();
  }

  dragBound = (pos) => {
    const { x, y } = dragBoundItem(pos, this.props.layout, this.props.item);
    return { x, y };
  };

  render() {
    const { item, move, selectedItemId, readonly, selectItem, updateItem } =
      this.props;
    const name = 'rectangle' + item.id;
    const isSelected = item.id === selectedItemId;
    const isVariableMode =
      item.fillColorMode === 'variable' ||
      item.fillColor === FILL_COLOR_VARIABLE_PLACEHOLDER;
    const fillColor = isVariableMode
      ? 'rgba(2, 114, 52, 0.25)'
      : item.fillColor || 'transparent';

    return (
      <React.Fragment>
        {isSelected && !readonly && (
          <Rect
            x={item.x - 2}
            y={item.y - 2}
            width={item.width + 4}
            height={item.height + 4}
            rotation={item.rotation}
            stroke={'#99EEFF88'}
            strokeWidth={2}
            shadowBlur={10}
            shadowOffset={{ x: 5, y: 5 }}
            shadowOpacity={0.5}
          />
        )}
        <Rect
          name={name}
          ref={this.shapeRef}
          x={item.x}
          y={item.y}
          width={item.width}
          height={item.height}
          rotation={item.rotation}
          stroke={'black'}
          fill={fillColor}
          strokeWidth={item.strokeWidth}
          dragBoundFunc={this.dragBound}
          cornerRadius={item.cornerRadius}
          draggable={move && selectedItemId === item.id}
          onClick={readonly ? null : () => selectItem(item.id)}
          onTransformEnd={(e) => {
            // transformer is changing scale
            const node = this.shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            // we will reset it back
            node.scaleX(1);
            node.scaleY(1);
            updateItem({
              ...item,
              x: node.x(),
              y: node.y(),
              width: node.width() * scaleX,
              height: node.height() * scaleY,
            });
          }}
          onDragEnd={(e) => {
            const x = Math.round(e.target.x() / gridSize) * gridSize;
            const y = Math.round(e.target.y() / gridSize) * gridSize;
            this.shapeRef.current.position({
              x,
              y,
            });
            updateItem({
              ...item,
              x,
              y,
            });
          }}
        />
        {readonly || !move ? null : (
          <AddTransformer
            ref={this.trRef}
            selectedShapeName={isSelected ? name : null}
          />
        )}
      </React.Fragment>
    );
  }
}
Rectangle.propTypes = {
  readonly: PropTypes.bool,
  move: PropTypes.bool,
  selectItem: PropTypes.func.isRequired,
  updateItem: PropTypes.func.isRequired,
  item: PropTypes.object,
  selectedItemId: PropTypes.number,
  layout: PropTypes.object,
};

Rectangle.defaultProps = {
  readonly: false,
  selectItem: () => {},
  updateItem: () => {},
};

export default Rectangle;

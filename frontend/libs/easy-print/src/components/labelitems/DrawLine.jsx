import React from 'react';
import PropTypes from 'prop-types';
import { Line, Rect } from 'react-konva';
import AddTransformer from './Transformer';
import { gridSize, dragBoundItem } from '../../containers/Utils';

class DrawLine extends React.Component {
  constructor() {
    super();
    this.shapeRef = React.createRef();
    this.trRef = React.createRef();
  }

  dragBound = (pos, rotation) => {
    const { x, y } = dragBoundItem(
      pos,
      this.props.layout,
      this.props.item,
      rotation
    );
    return { x, y };
  };

  render() {
    const {
      item,
      move,
      selectedItemId,
      readonly,
      selectItem,
      updateItem,
    } = this.props;
    const isSelected = item.id === this.props.selectedItemId;
    const name = 'line' + item.id;
    return (
      <React.Fragment>
        {isSelected && !readonly && (
          <Rect
            x={item.x - 2}
            y={item.y - 2}
            width={item.width + 10}
            height={item.height + 10}
            stroke={'#99EEFF88'}
            strokeWidth={2}
            shadowBlur={10}
            shadowOffset={{ x: 5, y: 5 }}
            shadowOpacity={0.5}
            rotation={item.rotation}
          />
        )}
        <Line
          name={name}
          x={item.x}
          y={item.y}
          points={
            [
              0,
              0,
              item.width,
              item.height,
            ] /*,item.x1,item.y1,item.x2,item.y2]*/
          }
          stroke="black"
          strokeWidth={item.strokeWidth}
          draggable={move && selectedItemId === item.id}
          rotation={item.rotation}
          onClick={readonly ? null : () => selectItem(item.id)}
          dragBoundFunc={(pos) => this.dragBound(pos, Number(item.rotation))}
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
          ref={this.shapeRef}
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
DrawLine.propTypes = {
  readonly: PropTypes.bool,
  item: PropTypes.object,
  selectedItemId: PropTypes.number,
  selectItem: PropTypes.func.isRequired,
  updateItem: PropTypes.func.isRequired,
  layout: PropTypes.object,
  move: PropTypes.bool,
};

DrawLine.defaultProps = {
  readonly: false,
  selectItem: () => {},
  updateItem: () => {},
};

export default DrawLine;

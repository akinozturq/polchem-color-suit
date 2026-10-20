import React from 'react';
import PropTypes from 'prop-types';
import { Ellipse } from 'react-konva';
import AddTransformer from './Transformer';
import { dragBoundItem } from '../../containers/Utils';
import { FILL_COLOR_VARIABLE_PLACEHOLDER } from '../../mylib/Constants';

class DrawEllipse extends React.Component {
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
    const isSelected = item.id === selectedItemId;
    const name = 'ellipse' + item.id;
    const isVariableMode =
      item.fillColorMode === 'variable' ||
      item.fillColor === FILL_COLOR_VARIABLE_PLACEHOLDER;
    const fillColor = isVariableMode
      ? 'rgba(2, 114, 52, 0.25)'
      : item.fillColor || 'transparent';

    return (
      <React.Fragment>
        {isSelected && !readonly && (
          <Ellipse
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
        <Ellipse
          name={name}
          ref={this.shapeRef}
          x={item.x}
          y={item.y}
          radiusX={item.radiusX}
          radiusY={item.radiusY}
          width={item.width}
          height={item.height}
          rotation={item.rotation}
          stroke={'black'}
          fill={fillColor}
          strokeWidth={item.strokeWidth}
          draggable={move && selectedItemId === item.id}
          dragBoundFunc={this.dragBound}
          onClick={readonly ? null : () => selectItem(item.id)}
          shadowBlur={2}
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
            // const x = Math.round(e.target.x() / 30) * 30;
            // const y = Math.round(e.target.y() / 30) * 30;
            // this.shapeRef.current.position({
            //   x,
            //   y,
            // });
            updateItem({
              ...item,
              x: e.target.x(),
              y: e.target.y(),
              radiusX: item.radiusX,
              radiusY: item.radiusY,
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
DrawEllipse.propTypes = {
  readonly: PropTypes.bool,
  item: PropTypes.object,
  selectedItemId: PropTypes.number,
  layout: PropTypes.object,
  selectItem: PropTypes.func.isRequired,
  updateItem: PropTypes.func.isRequired,
  move: PropTypes.bool,
};

DrawEllipse.defaultProps = {
  readonly: false,
  selectItem: () => {},
  updateItem: () => {},
};

export default DrawEllipse;

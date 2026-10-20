import React from 'react';
import PropTypes from 'prop-types';
import { Text, Rect } from 'react-konva';
import AddTransformer from './Transformer';
import { gridSize, dragBoundItem } from '../../containers/Utils';

class LabelVariable extends React.Component {
  constructor() {
    super();
    this.state = {
      isDragging: false,
      x: 80,
      y: 80,
    };
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
      varInfo,
      isPreview,
      selectedItemId,
      selectItem,
      move,
      readonly,
      updateItem,
    } = this.props;
    const name = 'write' + item.id;
    const isSelected = item.id === selectedItemId;
    return (
      <React.Fragment>
        {isSelected && !readonly && (
          <Rect
            x={item.x - 2}
            y={item.y - 2}
            width={item.width + 4}
            height={item.height + 4}
            stroke={'#99EEFF88'}
            strokeWidth={2}
            shadowBlur={10}
            shadowOffset={{ x: 5, y: 5 }}
            shadowOpacity={0.5}
            rotation={item.rotation}
          />
        )}

        <Text
          text={isPreview ? item.text : `[${varInfo ? varInfo.label : ''}]`}
          ref={this.shapeRef}
          x={item.x}
          y={item.y}
          align={item.align}
          verticalAlign={item.verticalAlign}
          fill={'black'}
          name={name}
          fontSize={item.fontSize}
          width={item.width}
          height={item.height}
          fontStyle={item.fontStyle}
          rotation={item.rotation}
          textDecoration={item.textDecoration}
          draggable={move && selectedItemId === item.id}
          dragBoundFunc={(pos) => this.dragBound(pos, Number(item.rotation))}
          fontFamily={item.fontFamily}
          //fill={this.state.isDragging ? 'green' : 'black'}
          onClick={this.props.readonly ? null : () => selectItem(item.id)}
          onDragStart={() => {
            this.setState({
              isDragging: true,
            });
          }}
          onDragEnd={(e) => {
            const x = Math.round(e.target.x() / gridSize) * gridSize;
            const y = Math.round(e.target.y() / gridSize) * gridSize;
            if (this.shapeRef.current) {
              this.shapeRef.current.position({
                x,
                y,
              });
            }
            updateItem({
              ...item,
              x,
              y,
            });
          }}
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
LabelVariable.propTypes = {
  readonly: PropTypes.bool,
  item: PropTypes.object,
  varInfo: PropTypes.object,
  selectedItemId: PropTypes.number,
  selectItem: PropTypes.func.isRequired,
  updateItem: PropTypes.func.isRequired,
  layout: PropTypes.object,
  isPreview: PropTypes.bool,
  formatters: PropTypes.object,
  move: PropTypes.bool,
};

LabelVariable.defaultProps = {
  readonly: false,
  selectItem: () => {},
  updateItem: () => {},
  isPreview: false,
};

export default LabelVariable;

import React from 'react';
import { Image, Rect } from 'react-konva';
import AddTransformer from './Transformer';
import PropTypes from 'prop-types';
import { gridSize, dragBoundItem } from '../../containers/Utils';

class ImageDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      image: null,
    };
    this.shapeRef = React.createRef();
    this.trRef = React.createRef();
  }

  componentDidMount() {
    const image = new window.Image();
    image.src = this.props.item.image;
    image.onload = () => {
      // setState will redraw layer
      // because "image" property is changed
      this.setState({
        image: image,
      });
    };
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
    const { item, move, selectedItemId, readonly, selectItem, updateItem } =
      this.props;
    const isSelected = item.id === selectedItemId;
    const name = 'image' + item.id;
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
        <Image
          name={name}
          x={item.x}
          y={item.y}
          ref={this.shapeRef}
          image={this.state.image}
          width={item.width}
          height={item.height}
          rotation={item.rotation}
          draggable={move && selectedItemId === item.id}
          dragBoundFunc={(pos) => this.dragBound(pos, Number(item.rotation))}
          onClick={readonly ? null : () => selectItem(item.id)}
          onTransformEnd={(e) => {
            // transformer is changing scale
            const node = this.shapeRef.current;
            if (node) {
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
            }
          }}
          onDragEnd={(e) => {
            const x = Math.round(e.target.x() / gridSize) * gridSize;
            const y = Math.round(e.target.y() / gridSize) * gridSize;
            this.shapeRef.current?.position({ x, y });
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
ImageDisplay.propTypes = {
  readonly: PropTypes.bool,
  item: PropTypes.object,
  layout: PropTypes.object,
  selectedItemId: PropTypes.number,
  selectItem: PropTypes.func.isRequired,
  updateItem: PropTypes.func.isRequired,
  move: PropTypes.bool,
};

ImageDisplay.defaultProps = {
  readonly: false,
  selectItem: () => {},
  updateItem: () => {},
};

export default ImageDisplay;

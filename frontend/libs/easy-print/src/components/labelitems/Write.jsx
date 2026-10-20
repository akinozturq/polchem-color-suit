import React from 'react';
import { Text, Rect } from 'react-konva';
import AddTransformer from './Transformer';
import PropTypes from 'prop-types';
import { gridSize, dragBoundItem } from '../../containers/Utils';

class Write extends React.Component {
  constructor() {
    super();
    this.state = {
      isDragging: false,
      x: 0,
      y: 0,
      textEditVisible: false,
      textValue: '',
    };
    this.shapeRef = React.createRef();
    this.trRef = React.createRef();
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    this.setState({
      ...this.state,
      x: this.props.item.x,
      y: this.props.item.y,
      textValue: this.props.item.text,
    });
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
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

  handleClickOutside = () => {
    if (this.inputRef) {
      this.setState({
        ...this.state,
        textEditVisible: false,
      });
    }
  };

  renderEditor = (event) => {
    if (this.props.readonly) {
      return;
    }
    // at first lets find position of text node relative to the stage:
    var textPosition = event.target.getAbsolutePosition();

    const stageBox = this.shapeRef.current.parent.parent
      .container()
      .getBoundingClientRect();

    var areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
    };

    // create textarea and style it
    var textarea = document.createElement('textarea');
    document.getElementById('ep_editor_container').appendChild(textarea);

    textarea.value = event.target.attrs.text;
    textarea.style.position = 'fixed';
    textarea.style.top = areaPosition.y + 'px';
    textarea.style.left = areaPosition.x + 'px';
    textarea.style.width = event.target.width();

    textarea.focus();

    textarea.addEventListener('keydown', (e) => {
      // hide on enter
      if (e.keyCode === 13) {
        this.props.updateItem({
          ...this.props.item,
          text: textarea.value,
        });
        document.getElementById('ep_editor_container').removeChild(textarea);
      }
    });
    textarea.addEventListener('focusout', () => {
      // hide on focus lost
      this.props.updateItem({
        ...this.props.item,
        text: textarea.value,
      });
      document.getElementById('ep_editor_container').removeChild(textarea);
    });
  };

  render() {
    const { item, move, selectedItemId, readonly, selectItem, updateItem } =
      this.props;

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
        {item.customText && !item.text && (
          <Text
            text="(Double click to edit)"
            x={item.x + (item.width / 2 - 45)} // Center of parent item!
            y={item.y + item.height}
            fill={'#FF6347'}
            fontSize={8}
            align="center"
            verticalAlign="top"
            width={90}
            height={12}
          />
        )}

        <Text
          text={item.text ? item.text : item.prompt}
          ref={this.shapeRef}
          x={item.x}
          id={'id_' + item.id}
          y={item.y}
          fill={item.text ? 'black' : '#FF6347'}
          name={name}
          fontSize={item.fontSize}
          align={item.align}
          verticalAlign={item.verticalAlign}
          width={item.width}
          height={item.height}
          fontStyle={item.fontStyle}
          textDecoration={item.textDecoration}
          rotation={item.rotation}
          draggable={move && selectedItemId === item.id}
          fontFamily={item.fontFamily}
          dragBoundFunc={(pos) => this.dragBound(pos, Number(item.rotation))}
          onClick={readonly ? null : () => selectItem(item.id)}
          onDragStart={() => {
            this.setState({
              isDragging: true,
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
          onTransformEnd={() => {
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
          onDblClick={this.renderEditor}
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

Write.propTypes = {
  readonly: PropTypes.bool,
  item: PropTypes.object,
  selectedItemId: PropTypes.number,
  selectItem: PropTypes.func,
  updateItem: PropTypes.func,
  layout: PropTypes.object,
  standAlone: PropTypes.bool,
  zIndex: PropTypes.string,
  move: PropTypes.bool,
};

Write.defaultProps = {
  readonly: false,
  standAlone: false,
  zIndex: '0',
  move: false,
};

export default Write;

import React, { Component } from 'react';
import './styles.css';
import { Stage, Layer } from 'react-konva';
import PropTypes from 'prop-types';
import Item from '../labelitems/Item';
import { defaultItems } from '../../containers/Toolbar';
import { gridSize, gridGenerate } from '../../containers/Utils';

class Editor extends Component {
  constructor(props) {
    super(props);
    this.stageref = React.createRef();
    this.layerref = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleDeleteItem);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleDeleteItem);
  }

  handleDeleteItem = (e) => {
    if (
      e.key === 'Delete' &&
      document.activeElement.type !== 'number' &&
      this.props.currentItem
    ) {
      this.props.deleteItem(this.props.currentItem);
    }
  };

  /*bitmap for canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const pixelImageData= ctx.createImageData(100,100);// creating new empty ImageData object
  const ImageData = ctx.getImageData(1,1,props.layout.width,props.layout.height);// getting a copy of the pixel data from canvas to imageData object
  const data = ImageData.data;
*/
  addItem(item, x, y) {
    const newItem = {
      ...item,
      x: x,
      y: y,
      id: this.props.items.length,
    };

    this.props.createItem(newItem);
    this.props.selectItem(newItem.id);
  }
  drop = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - (window.scrollX + rect.x);
    const y = e.clientY - (window.scrollY + rect.y);
    var data = e.dataTransfer.getData('text');

    this.addItem(defaultItems[data], x, y);
  };

  dragover = (e) => {
    e.preventDefault();
  };

  render() {
    const { selectItem, updateItem, layout, selectedItemId, codeToInfo, move } =
      this.props;
    const itemsArray = layout.itemids.map((id) => layout.items[id]);
    const widthGrid = gridGenerate(
      layout.width.pixel - layout.marginLeft - layout.marginRight,
      layout.height.pixel - layout.marginTop - layout.marginBottom,
      gridSize
    ).widthLines;
    const heightGrid = gridGenerate(
      layout.width.pixel - layout.marginLeft - layout.marginRight,
      layout.height.pixel - layout.marginTop - layout.marginBottom,
      gridSize
    ).heightLines;
    return (
      <div className="editor__scrollbar">
        <div
          className="editor__field"
          style={{
            backgroundColor: 'white',
            height: layout.height.pixel,
            width: layout.width.pixel,
            paddingTop: layout.marginTop,
            paddingBottom: layout.marginBottom,
            paddingLeft: layout.marginLeft,
            paddingRight: layout.marginRight,
          }}
        >
          <div
            className="editor__border"
            onDrop={this.drop}
            onDragOver={this.dragover}
            id={'ep_editor_container'}
          >
            <Stage
              height={
                layout.height.pixel - layout.marginTop - layout.marginBottom
              }
              width={
                layout.width.pixel - layout.marginLeft - layout.marginRight
              }
              id="stage"
              ref={this.stageref}
              onClick={(event) => {
                const thisstage = this.stageref.current;
                const thislayer = this.layerref.current;
                if (event.target === thisstage) {
                  this.props.selectItem(null);
                  //thisstage.find('Transformer').destroy();
                  thislayer.draw();
                  return;
                }
              }}
            >
              <Layer ref={this.layerref}>
                {widthGrid}
                {heightGrid}
                {itemsArray.map((item) => (
                  <Item
                    key={item.id}
                    item={item}
                    varInfo={codeToInfo[item.varCode]}
                    //{props.uploads.map((upload) => <Item key={upload.id} upload={upload}
                    layout={layout}
                    selectItem={selectItem}
                    updateItem={updateItem}
                    selectedItemId={selectedItemId}
                    codeToInfo={codeToInfo}
                    move={move}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    );
  }
}
Editor.propTypes = {
  currentItem: PropTypes.object,
  selectItem: PropTypes.func.isRequired,
  createItem: PropTypes.func.isRequired,
  updateItem: PropTypes.func,
  items: PropTypes.arrayOf(PropTypes.object),
  width: PropTypes.number,
  height: PropTypes.number,
  layout: PropTypes.object,
  updatePage: PropTypes.func,
  updateReadOnly: PropTypes.func,
  selectedItemId: PropTypes.number,
  codeToInfo: PropTypes.object,
  move: PropTypes.bool,
  deleteItem: PropTypes.func,
};

export default Editor;

import React from 'react';
import PropTypes from 'prop-types';
import { Transformer } from 'react-konva';

class AddTransformer extends React.Component {
  componentDidMount() {
    this.checkNode();
  }
  componentDidUpdate() {
    this.checkNode();
  }
  checkNode = () => {
    const stage = this.transformer.getStage();
    const { selectedShapeName } = this.props;
    const selectedNode = stage.findOne('.' + selectedShapeName);
    if (selectedNode === this.transformer.node()) {
      return;
    }
    if (selectedNode) {
      this.transformer.attachTo(selectedNode);
    } else {
      this.transformer.detach();
    }
    this.transformer.getLayer().batchDraw();
  };

  render() {
    return (
      <Transformer
        rotateEnabled={false}
        ref={(node) => {
          this.transformer = node;
        }}
      />
    );
  }
}

AddTransformer.propTypes = {
  selectedShapeName: PropTypes.string,
};

export default AddTransformer;

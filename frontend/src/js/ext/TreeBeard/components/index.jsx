import React from 'react';
import PropTypes from 'prop-types';
import { castArray } from 'lodash';

import defaultTheme from '../themes/default';
import defaultAnimations from '../themes/animations';
import { randomString } from '../util';
import { Ul } from './common';
import defaultDecorators from './Decorators';
import TreeNode from './TreeNode';

const TreeBeard = ({
  animations,
  decorators,
  data,
  onToggle,
  onMouseOver,
  style,
  t,
}) => (
  <Ul style={{ ...defaultTheme.tree.base, ...style.tree.base }}>
    {data.length > 0 ? (
      castArray(data).map((node) => (
        <TreeNode
          key={node.id || randomString()}
          {...{ decorators, node, onToggle, onMouseOver, animations }}
          style={{ ...defaultTheme.tree.node, ...style.tree.node }}
        />
      ))
    ) : (
      <div
        style={{
          borderTop: '1px solid #dce4e9',
          padding: '5px',
          height: '40px',
          backgroundColor: 'lightblue',
        }}
      >
        {t('lbl.noProducts', 'No products')}
      </div>
    )}
  </Ul>
);

TreeBeard.propTypes = {
  style: PropTypes.object,
  data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  animations: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  onToggle: PropTypes.func,
  onMouseOver: PropTypes.func,
  decorators: PropTypes.object,
  t: PropTypes.func,
};

TreeBeard.defaultProps = {
  style: defaultTheme,
  animations: defaultAnimations,
  decorators: defaultDecorators,
};

export default TreeBeard;

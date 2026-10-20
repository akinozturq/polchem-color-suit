import React from 'react';
import PropTypes from 'prop-types';
import ColorThumbnail from 'js/components/shared/ColorThumbnail';
import { Input } from 'reactstrap';

export const treeStyle = (color, background, rtl = false) => {
  const toggleWrapperPadding = rtl ? '0 5px 5px 0' : '0 0 5px 5px';
  const subtreePaddingKey = rtl ? 'paddingRight' : 'paddingLeft';
  const connectorPosition = rtl ? { right: '-21px' } : { left: '-21px' };
  const connectorBorder = rtl
    ? { borderRight: 'solid 2px black' }
    : { borderLeft: 'solid 2px black' };
  const direction = rtl ? 'rtl' : 'ltr';

  return {
    tree: {
      base: {
        listStyle: 'none',
        backgroundColor: background ? background : 'transparent',
        margin: 0,
        padding: 0,
        color: color ? color : 'white',
        fontFamily: '"Noto Sans"',
        fontSize: '1rem',
        direction,
      },
      node: {
        base: {
          position: 'relative',
          marginRight: '2px',
        },
        link: {
          cursor: 'pointer',
          position: 'relative',
          padding: '0px 5px',
          display: 'block',
          backgroundColor: background ? background : 'transparent',
        },
        activeLink: {
          background: '#d7e7fc',
          color: 'black',
          borderRadius: '0.25rem',
        },
        toggle: {
          base: {
            position: 'relative',
            display: 'inline-block',
            verticalAlign: 'top',
            marginLeft: '0px',
            height: '24px',
            width: '24px',
          },
          wrapper: {
            position: 'relative',
            padding: toggleWrapperPadding,
          },
          height: 14,
          width: 14,
          arrow: {
            fill: color,
            strokeWidth: 0,
          },
        },
        header: {
          base: {
            display: 'inline-block',
            verticalAlign: 'top',
            //color: '#9DA5AB',
            //color:color
          },
          connector: {
            width: '2px',
            height: '12px',
            position: 'absolute',
            top: '0px',
            borderBottom: 'solid 2px black',
            ...connectorBorder,
            ...connectorPosition,
          },
          title: {
            lineHeight: '24px',
            verticalAlign: 'middle',
          },
        },
        subtree: {
          listStyle: 'none',
          [subtreePaddingKey]: '19px',
        },
        loading: {
          //color: '#E2C089'
          color: color,
        },
      },
    },
  };
};

export const CustomTreeNode = ({ node, style }) => {
  return (
    <div style={{ ...style.base, width: node.progress ? '100%' : 'unset' }}>
      <div
        style={{
          ...style.title,
          display: 'flex',
          width: node.progress ? '100%' : 'unset',
        }}
      >
        {node.rgb && <ColorThumbnail rgb={node.rgb} size="30px" />}
        <div
          style={{
            textOverflow: 'ellipsis',
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            maxWidth: node.progress ? 'calc(100% - 9rem)' : 'unset',
          }}
        >
          {node.name}
        </div>
        {node.progress && (
          <div style={{ position: 'absolute', right: '4rem' }}>
            {node.progress}
          </div>
        )}
        {typeof node.id === 'number' && (
          <Input
            id={`nodeInputToggle${node.id}`}
            onChange={() => {
              node.checkboxFunc(node);
            }}
            checked={node.checkbox}
            style={{ right: '3rem' }}
            type="checkbox"
          />
        )}
      </div>
    </div>
  );
};

CustomTreeNode.propTypes = {
  node: PropTypes.shape({
    progress: PropTypes.number,
    name: PropTypes.string,
    rgb: PropTypes.number,
    checkbox: PropTypes.bool,
    checkboxFunc: PropTypes.func,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  style: PropTypes.shape(),
  prefix: PropTypes.shape(),
};

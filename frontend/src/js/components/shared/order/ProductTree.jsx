import React, { useMemo, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';

import { treeStyle } from 'js/mylib/TreeStyle';
import { Treebeard } from 'js/ext/TreeBeard';
import hoverActions from 'js/redux/reducers/HoverProduct';
import { rightToLeft } from '../../../mylib/Utils';

// Helper functions for ProductTree component

const filterGroups = (filtered_products, product_groups) => {
  const prodmap = new Map(filtered_products.map((p) => [p.productid, p]));
  const groups = product_groups.map((group) => ({
    ...group,
    products: group.products
      .filter((p) => prodmap.has(p.productid))
      .map((p) => {
        const product = prodmap.get(p.productid);
        return { ...product, name: product.productzname };
      }),
  }));

  return groups;
};

const searchSubTree = (node, id) =>
  node.id === id || !!node.children.find((x) => searchSubTree(x, id));

const addProductsAndPrune = (node) => {
  let { children, products } = node;
  children = children.map(addProductsAndPrune).filter(Boolean);
  if (children.length + products.length === 0) {
    node.children = [];
    return null;
  }
  node.children = [...children, ...products];
  return node;
};

const nestGroups = (groups) => {
  const nodes = new Map(
    groups.map((g) => [
      g.prodgroupid,
      {
        name: g.prodgroupname,
        toggled: true,
        id: g.prodgroupid,
        parentid: g.parentgroupid,
        children: [],
        products: g.products,
      },
    ])
  );
  const root = { children: [], products: [] };
  nodes.set(null, root);

  // Add each node to parent's children
  for (const node of nodes.values()) {
    const { parentid } = node;
    // Search to prevent cycles in case of bad data
    if (!searchSubTree(node, parentid)) {
      nodes.get(parentid).children.push(node);
    }
  }

  // Append products to children and prune empty groups
  addProductsAndPrune(root);
  return root.children;
};

// The component

const ProductTree = (props) => {
  const { filtered_products, product_groups } = props;
  const isRtl = rightToLeft();
  const data = useMemo(
    () => nestGroups(filterGroups(filtered_products, product_groups)),
    [filtered_products, product_groups]
  );
  // eslint-disable-next-line no-unused-vars
  const [cursor, setCursor] = useState(null);

  const onToggle = (node, toggled) => {
    if (node.children) {
      node.toggled = toggled;
    }
    setCursor(node);

    if (node.productid != undefined) {
      props.onSelect(node);
    }
  };

  const treeHover = (node) => {
    if (props.hover_product.product?.productid !== node?.productid) {
      props.setHoverProduct(node);
    }
  };

  const { t } = props;
  return (
    <div
      className="scroll bordered br-8"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        ...props.scrollstyle,
        backgroundColor: '#112e40',
        paddingLeft: isRtl ? 0 : '8px',
        paddingRight: isRtl ? '8px' : 0,
        textAlign: isRtl ? 'right' : 'left',
      }}
    >
      <Treebeard
        onMouseOver={treeHover}
        data={data}
        style={treeStyle('white', '#112e40', isRtl)}
        onToggle={onToggle}
        t={t}
      />
    </div>
  );
};

ProductTree.propTypes = {
  filtered_products: PropTypes.arrayOf(PropTypes.object).isRequired,
  scrollstyle: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,

  product_groups: PropTypes.arrayOf(PropTypes.object).isRequired,
  hover_product: PropTypes.object.isRequired,
  setHoverProduct: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    product_groups: state.cache.product_groups,
    hover_product: state.hover_product,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setHoverProduct: hoverActions.setHoverProduct,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(ProductTree)
);

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'reactstrap';
import { AutoSizer, List } from 'react-virtualized';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';

import {
  HTML_COLOR_BLUE,
  ORDER_MODE_LOCAL_FORMULA,
  ORDER_MODE_MATCHING,
  PRODUCT_SEARCH_MODE_MATCH,
} from '../../../Constants';

import ProductName from './ProductName';
import { rightToLeft } from '../../../mylib/Utils';

const ProductList = (props) => {
  const { t } = useTranslation();
  const isRtl = rightToLeft();

  const noRowsRenderer = () => {
    var prodStyle = {
      borderTop: '1px solid #dce4e9',
      paddingLeft: isRtl ? 0 : '5px',
      paddingRight: isRtl ? '5px' : 0,
      height: '40px',
      backgroundColor: 'lightblue',
      textAlign: isRtl ? 'right' : 'left',
    };

    return <div style={prodStyle}>{t('lbl.noProducts', 'No products')}</div>;
  };

  const rowRenderer = ({
    key, // Unique key within array of rows
    index, // Index of row within collection
    //isScrolling, // The List is currently being scrolled
    //isVisible, // This row is visible within the List (eg it is not an overscanned row)
    style, // Style object to be applied to row (to position it)
  }) => {
    const product = props.data[index];
    const background =
      product && props.selectedId === product.productid
        ? 'lightblue'
        : index % 2 === 0
          ? '#0C2433'
          : '#183445';

    let suffix;
    if (props.order_mode === ORDER_MODE_LOCAL_FORMULA) {
      if (product.formula?.original && product.formula.itemid != null) {
        suffix = 'O'; // Original
      } else if (product.formula) {
        suffix = 'C'; // Compatible
      } else {
        suffix = 'A'; // Add
      }
    }
    if (
      props.order_mode === ORDER_MODE_MATCHING ||
      props.product_search_mode === PRODUCT_SEARCH_MODE_MATCH
    ) {
      if (product?.has_matching && props.is_pro) {
        suffix = 'E'; // Eye
      }
    }

    const product_style = {
      borderTop: '1px solid #dce4e9',
      paddingLeft: isRtl ? 0 : '5px',
      paddingRight: isRtl ? '5px' : 0,
      height: '100%',
      cursor: 'pointer',
      textAlign: isRtl ? 'right' : 'left',
    };

    return (
      <div
        key={key}
        style={{
          ...style,
          display: 'flex',

          direction: isRtl ? 'rtl' : 'ltr',
        }}
        className="product-item"
      >
        {product && (
          <ProductName
            setProduct={props.onSelect}
            productData={product}
            selected={background === 'lightblue'}
            style={{
              ...product_style,
              width: suffix ? '85%' : '100%',
            }}
          />
        )}
        {suffix && (
          <div
            style={{
              ...product_style,
              width: '20%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isRtl ? 'flex-start' : 'flex-start',
            }}
            onClick={() => props.onSelect(product)}
          >
            {suffix === 'C' && (
              <FontAwesomeIcon
                icon={'star-half-stroke'}
                color={HTML_COLOR_BLUE}
              />
            )}
            {suffix === 'A' && (
              <FontAwesomeIcon icon={'circle-plus'} color={HTML_COLOR_BLUE} />
            )}
            {suffix === 'O' && (
              <>
                <FontAwesomeIcon icon="star" color={HTML_COLOR_BLUE} />
                <Button
                  data-testid={'btn_del_local_frm'}
                  onClick={(e) => props.onTrash(e, product.formula.itemid)}
                  style={{ background: 'none', border: 'none' }}
                >
                  <FontAwesomeIcon icon="trash" color={HTML_COLOR_BLUE} />
                </Button>
              </>
            )}

            {suffix === 'E' && <FontAwesomeIcon icon={'eye'} />}
          </div>
        )}
      </div>
    );
  };

  const listRef = useRef(null);
  useEffect(() => listRef.current?.forceUpdateGrid());

  return (
    <div
      className="bordered br-8"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        ...props.scrollstyle,
        textAlign: isRtl ? 'right' : 'left',
      }}
    >
      <AutoSizer>
        {({ width, height }) => {
          return (
            <List
              id="product_scroll"
              className="scroll no-focus"
              style={{ direction: isRtl ? 'rtl' : 'ltr' }}
              width={width}
              height={height}
              rowCount={props.data.length}
              rowHeight={50}
              rowRenderer={rowRenderer}
              noRowsRenderer={noRowsRenderer}
              ref={listRef}
            />
          );
        }}
      </AutoSizer>
    </div>
  );
};

ProductList.propTypes = {
  scrollstyle: PropTypes.object.isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedId: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
  onTrash: PropTypes.func.isRequired, //handleOpenModal
  order_mode: PropTypes.string.isRequired,
  product_search_mode: PropTypes.string.isRequired,
  is_pro: PropTypes.bool,
};

export default ProductList;

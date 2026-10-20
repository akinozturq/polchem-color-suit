import React, { Component } from 'react';
import {
  Col,
  Row,
  Alert,
  InputGroup,
  InputGroupAddon,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import orderActions, { propType as orderType } from 'js/redux/reducers/Order';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { selectors as userSelectors } from 'js/redux/reducers/User';

import {
  COLOR_SEARCH_CARD,
  BOX_LEFT_STYLE,
  MIN_LOCAL_FORMULA_CODE_LENGTH,
  SOURCE_USER,
  HTML_COLOR_BLUE,
} from 'js/Constants';

import { spinner } from 'js/mylib/Utils';
import BootstrapTable from 'react-bootstrap-table-next';
import SearchInput from 'js/components/shared/SearchInput';
import ColorCode from 'js/components/shared/order/ColorCode';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import formulaActions from 'js/redux/reducers/Formula';
import hoverActions from 'js/redux/reducers/HoverColor';
import ColorPreview from 'js/components/shared/order/ColorPreview';
import { RETINT_TYPE_FORMULA } from '../../redux/reducers/Order';
import { rightToLeft } from '../../mylib/Utils';

class LocalFormulaSearch extends Component {
  constructor(props) {
    super(props);
    this.searchField = null;
    this.state = {
      colorcode: '',
      localFormulaModalOpen: false,
      selectedItem: null,
      itemidToHide: null,
    };
  }

  componentDidMount() {
    this.props.keyFunction(COLOR_SEARCH_CARD, this.handleKeyPress);
    this.searchLocalFormula('');
  }

  handleKeyPress = (key) => {
    if (key === 'Esc') {
      if (this.state.selectedItem == null) {
        return this.props.moveToPrevSection();
      }
      return this.selectColor(null);
    }

    const { local_frms } = this.props.formula;

    if (key === 'Enter') {
      // Special case when to pick the one result automatically on enter press
      const item =
        local_frms.length === 1 ? local_frms[0] : this.state.selectedItem;
      if (item) {
        this.submitColor(item, false);
      }
      return;
    }

    // up or down
    if (local_frms.length) {
      const step = key === 'down' ? 1 : -1;
      const position = local_frms.findIndex(
        (x) => x.itemid === this.state.selectedItem?.itemid
      );
      const new_pos = Math.max(
        0,
        Math.min(local_frms.length - 1, position + step)
      );

      const color = local_frms[new_pos];
      this.selectItem(color);

      // Findind based on id and scrolling to that
      const id = 'colorid_' + local_frms[new_pos].itemid;
      const elm = document.getElementById(id);
      elm.parentElement.scrollIntoView(true);
    }
  };

  focusOnSearch = () => {
    this.searchField?.focus();
  };

  colorCodeFormatter = (cell, row) => (
    <ColorCode isLocalFormula={true} colorData={row} />
  );

  selectItem = (item) => {
    this.setState({ selectedItem: item });
    this.props.setHoverColor(item);
  };

  submitColor = (color, fetchItem = true) => {
    if (!color) {
      return;
    }
    // Setting order source to user
    this.props.setOrderitemSource(SOURCE_USER);

    this.props.setColor({
      itemid: color.itemid, // Needed for keyboard navigation to work!
      colourcode: color.colourcode,
      colournames: [color.colourname],
      rgb: color.rgb,
    });

    if (color.baseid && color.itemid) {
      this.props.moveToNextSection();
      // If baseid is available then load compatible products
      this.props.fetchLocalFormulaCompatibleProducts(
        color.itemid,
        color.baseid
      );
      if (fetchItem) {
        // NOTE: fetch item directly from mouse click;
        // move to product list from Enter key. (Is this by design?)
        this.props.fetchOrderitem(color.itemid, RETINT_TYPE_FORMULA);
      }
    } else {
      if (color.itemid) {
        // Case when the custom formula exists on local formula history and is
        // made in a product / base which are not currectly present in the main database
        this.props.fetchOrderitem(color.itemid, RETINT_TYPE_FORMULA);
      } else {
        // Case when adding completely new color
        this.props.moveToNextSection();
        this.props.fetchLocalFormulaCompatibleProducts();
      }
    }
  };

  getScrollStyle = () => {
    if (this.props.formula.local_fetch_frms_error) {
      return {
        height: 'calc(100vh - 6.375rem - 4.5rem - 14vw - 17rem)',
        minHeight: '10rem',
      };
    }
    return {
      height: 'calc(100vh - 6.375rem - 4.5rem - 14vw - 11rem)',
      minHeight: '15rem',
    };
  };

  addColor = () => {
    this.submitColor({ colourcode: this.state.colorcode });
    this.props.setItemEdited(true);
  };

  searchLocalFormula = (colorcode) => {
    this.setState({ colorcode: colorcode });
    this.props.searchLocalFormulas(colorcode);
    this.props.config_values?.prevent_color_code_copying &&
      this.props.isColourcodeFree(colorcode);
  };

  handleOpenModal = (e, itemidToHide) => {
    e.stopPropagation();
    this.setState({ localFormulaModalOpen: true, itemidToHide });
  };

  handleCloseModal = () => {
    this.setState({ localFormulaModalOpen: false });
  };

  handleHideLocalFormula = () => {
    this.props.hideLocalFormula(this.state.itemidToHide);
    this.setState({ localFormulaModalOpen: false });
  };

  formulaHideButtonFormatter = (cell, row, idx) => {
    const itemid = row && row.itemid;
    return (
      itemid != null &&
      this.props.privileges.includes('order_delete_local_formula') && (
        <Button
          data-testid={'btn_del_local_frm_' + idx}
          onClick={(e) => this.handleOpenModal(e, itemid)}
          style={{ background: 'none', border: 'none' }}
        >
          <FontAwesomeIcon icon="trash" color={HTML_COLOR_BLUE} />
        </Button>
      )
    );
  };

  getFirstColumn = () => {
    const { t, order } = this.props;
    const { selectedItem } = this.state;

    const selectRowProp = {
      mode: 'radio',
      bgColor: 'lightblue', // you should give a bgcolor, otherwise, you can't regonize which row has been selected
      hideSelectColumn: true, // enable hide selection column.
      clickToSelect: true, // you should enable clickToSelect, otherwise, you can't select column.
      onSelect: this.submitColor,
      selected: selectedItem ? [selectedItem.itemid] : [],
    };

    const columns = [
      {
        dataField: 'colourcode',
        text: t('lbl.code_error', 'Code'),
        formatter: this.colorCodeFormatter,
      },
      {
        dataField: 'hideformula',
        text: 'Delete',
        formatter: this.formulaHideButtonFormatter,
        style: { width: '10%' },
      },
    ];

    const placeholder = t(
      'prompt.searchLocalFormulaOrTypeColorCode',
      'Search local formula or type color code'
    );

    return (
      <>
        <InputGroup
          style={{ padding: '0', flexWrap: 'nowrap', marginBottom: '0.5rem' }}
        >
          <SearchInput
            id="LocalFormulaSearch"
            inputRef={(ref) => {
              this.searchField = ref;
            }}
            onChange={(e) => this.searchLocalFormula(e.target.value)}
            nbrButtons={0}
            placeholder={placeholder}
            invalid={!order.isColourcodeFree && this.state.colorcode.length > 0}
          />
          <InputGroupAddon addonType="append"></InputGroupAddon>
          <Button
            style={{ width: 'unset' }}
            className={rightToLeft() ? 'mr-2' : 'ml-2'}
            id="addNewLocalFormula"
            color="success"
            disabled={
              this.state.colorcode.length < MIN_LOCAL_FORMULA_CODE_LENGTH ||
              !order.isColourcodeFree
            }
            onClick={this.addColor}
          >
            {t('lbl.create', 'Create')}
          </Button>
        </InputGroup>

        <div className=" scroll bordered br-8" style={this.getScrollStyle()}>
          {!order.isColourcodeFree && this.state.colorcode.length > 0 && (
            <Alert color="danger">
              {t(
                'lbl.colorCodeReservedForStandardColor',
                'Color code is reserved for standard color'
              )}
            </Alert>
          )}
          {this.props.formula.local_fetch_frms_start ? (
            spinner()
          ) : (
            <BootstrapTable
              keyField="itemid"
              hover
              bordered={false}
              data={this.props.formula.local_frms}
              headerClasses={'col-hidden'}
              columns={columns}
              noDataIndication={() => t('lbl.noColors', 'No colors')}
              selectRow={selectRowProp}
            />
          )}
        </div>
      </>
    );
  };

  componentDidUpdate() {
    this.focusOnSearch();
  }

  render() {
    const { t } = this.props;

    return (
      <>
        <Modal centered isOpen={this.state.localFormulaModalOpen}>
          <ModalHeader>
            {t('lbl.deleteLocalFormula', 'Delete local formula')}
          </ModalHeader>
          <ModalBody>{t('prompt.areYouSure', 'Are you sure ?')}</ModalBody>
          <ModalFooter>
            <Button
              data-testid="btn_ok"
              onClick={(e) => this.handleHideLocalFormula(e)}
              color="primary"
            >
              {t('fn.ok', 'OK')}
            </Button>
            <Button
              data-testid="btn_cancel"
              onClick={this.handleCloseModal}
              color="secondary"
            >
              {t('fn.cancel', 'Cancel')}
            </Button>
          </ModalFooter>
        </Modal>
        <Col
          style={{
            overflow: 'hidden',
          }}
        >
          <Alert
            color="danger"
            isOpen={this.props.formula.local_fetch_frms_error !== null}
          >
            {t('msg.unableToLoadColors', 'Unable to load colors')}:{' '}
            {this.props.formula.local_fetch_frms_error
              ? this.props.formula.local_fetch_frms_error.message
              : null}
          </Alert>
          <Row className="color-search-container">
            <Col className="color-search-panel" md="6">
              {this.getFirstColumn()}
            </Col>
            <Col md="5" style={BOX_LEFT_STYLE}>
              <ColorPreview />
            </Col>
          </Row>
        </Col>
      </>
    );
  }
}

LocalFormulaSearch.propTypes = {
  formula: PropTypes.shape({
    local_frms: PropTypes.arrayOf(PropTypes.object),
    local_fetch_frms_error: PropTypes.string,
    local_fetch_frms_start: PropTypes.bool,
  }),

  order: orderType,

  moveToNextSection: PropTypes.func.isRequired,
  moveToPrevSection: PropTypes.func.isRequired,
  setColor: PropTypes.func.isRequired,
  setHoverColor: PropTypes.func.isRequired,
  searchLocalFormulas: PropTypes.func.isRequired,
  keyFunction: PropTypes.func.isRequired,
  fetchLocalFormulaCompatibleProducts: PropTypes.func.isRequired,
  setOrderitemSource: PropTypes.func.isRequired,
  fetchOrderitem: PropTypes.func.isRequired,
  config_values: PropTypes.object,
  setOpenSection: PropTypes.func,
  hideLocalFormula: PropTypes.func,
  t: PropTypes.func.isRequired,
  privileges: PropTypes.array,
  setItemEdited: PropTypes.func.isRequired,
  isColourcodeFree: PropTypes.func.isRequired,
};

function mapStateToProps(store) {
  return {
    order: store.order,
    formula: store.formula,
    config_values: store.configurations.config_values,
    privileges: userSelectors.privileges(store),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      moveToNextSection: orderActions.moveToNextSection,
      moveToPrevSection: orderActions.moveToPrevSection,
      isColourcodeFree: orderActions.isColourcodeFree,
      setOrderitemSource: orderActions.setOrderitemSource,
      setColor: orderActions.setColor,
      setHoverColor: hoverActions.setHoverColor,
      fetchOrderitem: orderActions.fetchOrderitem,
      searchLocalFormulas: formulaActions.searchLocalFormulas,
      fetchLocalFormulaCompatibleProducts:
        formulaActions.fetchLocalFormulaCompatibleProducts,
      hideLocalFormula: formulaActions.hideLocalFormula,
      setOpenSection: orderActions.setOpenSection,
      setItemEdited: orderActions.setItemEdited,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(LocalFormulaSearch)
);

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import barcodeActions from 'js/redux/reducers/BarcodeAction';
import barcodeSearchAction from 'js/redux/reducers/BarcodeSearch';
import { spinner } from 'js/mylib/Utils';
import BootstrapTable from 'react-bootstrap-table-next';
import SearchInput from '../SearchInput';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { detectMobile } from '../../../mylib/Utils';
import { Col, Container, Row } from 'reactstrap';

class ArticleSearch extends Component {
  constructor(props) {
    super(props);
    this.timer = null;
    this.searchField = null;
    this.state = {
      articleNumber: '',
    };
  }

  componentDidMount() {
    this.timer = setTimeout(this.focusOnSearch, 300);
  }

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer);
  }

  focusOnSearch = () => {
    if (this.searchField) {
      this.timer = setTimeout(() => this.searchField?.focus(), 300);
    }
  };

  handleArticleNumberChange = (search) => {
    this.props.searchBarcode(search);
  };

  //mobiledetecting for styling scrolling, calculating maybe useless?
  getScrollStyle = () => {
    if (detectMobile()) {
      return {
        maxHeight: 'calc(100vh - 16rem)',
        minHeight: '30vh',
      };
    } else {
      return {
        maxHeight: 'calc(100vh - 6.375rem - 4.5rem - 14vw - 11rem)',
        minHeight: '17rem',
      };
    }
  };

  render() {
    const { t } = this.props;

    const articleColumns = [
      {
        dataField: 'barcode',
        text: 'Barcode',
      },
    ];

    return (
      <>
        <SearchInput
          id="article_number_search"
          inputRef={(ref) => {
            this.searchField = ref;
          }}
          onChange={(e) => this.handleArticleNumberChange(e.target.value)}
          nbrButtons={0}
          placeholder={t('lbl.typeArticleNumber', 'Type article number')}
        />
        <div
          className=" scroll bordered br-8"
          ref={(ref) => (this.scrollDiv = ref)}
          style={{
            ...this.getScrollStyle(),
          }}
        >
          {this.props.barcodeSearch.barcodes.pending && spinner()}
          <div
            style={
              !this.props.barcodeSearch.barcodes.pending
                ? null
                : { display: 'none' }
            }
          >
            <BootstrapTable
              rowStyle={{ color: 'white' }}
              bordered={false}
              keyField="barcode"
              hover
              data={this.props.barcodeSearch.barcodes.data}
              tabIndexCell
              headerClasses={'col-hidden'}
              columns={articleColumns}
              noDataIndication={() => 'No barcodes'}
              selectRow={{
                onSelect: (articleNum) =>
                  this.setState(
                    {
                      articleNumber: articleNum.barcode,
                    },
                    () => this.props.resolveBarcode(this.state.articleNumber)
                  ),
                mode: 'radio',
                bgColor: 'lightblue', // you should give a bgcolor, otherwise, you can't regonize which row has been selected
                hideSelectColumn: true, // enable hide selection column.
                clickToSelect: true, // you should enable clickToSelect, otherwise, you can't select column.
              }}
            />
          </div>
        </div>
      </>
    );
  }
}

function ArticleSearchContainer(props) {
  return (
    <Col style={{ display: '', overflow: 'hidden' }}>
      <Container style={{ padding: detectMobile() ? '0' : '' }}>
        <Row
          className={
            detectMobile()
              ? 'mobile-color-search-container'
              : 'color-search-container'
          }
        >
          <Col
            className={
              detectMobile()
                ? 'mobile-color-search-panel'
                : 'color-search-panel'
            }
          >
            <ArticleSearch {...props} />
          </Col>
        </Row>
      </Container>
    </Col>
  );
}

ArticleSearch.propTypes = {
  show: PropTypes.bool.isRequired,
  t: PropTypes.func.isRequired,
  resolveBarcode: PropTypes.func,
  searchBarcode: PropTypes.func,
  barcodeSearch: PropTypes.object,
};

ArticleSearchContainer.propTypes = ArticleSearch.propTypes;

function mapStateToProps(store) {
  return {
    barcodeSearch: store.barcodesearch,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      resolveBarcode: barcodeActions.resolveBarcode,
      searchBarcode: barcodeSearchAction.searchBarcodes,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(ArticleSearchContainer)
);

import React, { Component, Suspense } from 'react';
import './styles.scss';
import { library } from '@fortawesome/fontawesome-svg-core';
import store from './redux/Store';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import PropTypes from 'prop-types';
import {
  faPrint,
  faFile,
  faFolder,
  faSave,
  faQrcode,
  faPen,
  faBarcode,
  faMinus,
  faBold,
  faItalic,
  faUnderline,
  faPaintBrush,
  faCopy,
  faDownload,
  faFileImport,
  faSpinner,
  faAlignLeft,
  faAlignRight,
  faAlignCenter,
  faImage,
  faImagePortrait,
  faRotateLeft,
  faRotateRight,
  faEye,
  faT,
  faCode,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { faCircle, faSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from './containers/Navbar';
import Toolbar from './containers/Toolbar';
import Layout from './containers/Layout';
import i18n from './localization/i18n';
import _ from 'lodash';
import layoutActions from './redux/reducers/Layout';
import editorActions from './redux/reducers/Editor';
import { Container } from './mylib/layouts/Container';
import { Row } from './mylib/layouts/Row';
import { Col } from './mylib/layouts/Col';
// import 'bootstrap/dist/css/bootstrap.min.css';

//Add FontAwesomeIcon to the whole app
library.add(
  faPrint,
  faFile,
  faFolder,
  faSave,
  faPen,
  faQrcode,
  faBarcode,
  faMinus,
  faBold,
  faItalic,
  faUnderline,
  faPaintBrush,
  faCopy,
  faDownload,
  faFileImport,
  faSpinner,
  faAlignLeft,
  faAlignRight,
  faAlignCenter,
  faImage,
  faImagePortrait,
  faRotateLeft,
  faRotateRight,
  faEye,
  faT,
  faCode,
  faCircle,
  faXmark,
  faSquare
);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      initialLayout: null,
      showPreview: false,
    };
    this.stageRef = React.createRef();
  }

  static getDerivedStateFromProps(props, state) {
    if (
      !_.isEqual(state.initialLayout, props.initialLayout) &&
      props.initialLayout
    ) {
      store.dispatch(layoutActions.setInitialLayout(props.initialLayout));
      return { ...state, initialLayout: _.cloneDeep(props.initialLayout) };
    }
    return state;
  }

  componentDidMount() {
    store.dispatch(editorActions.toggleNewModal(this.props.isNewLabel));
  }

  toggleShowPreview = () => {
    this.setState((prevState) => ({ showPreview: !prevState.showPreview }));
  };

  toggleShowPrinterModal = () => {
    this.setState((old) => ({
      showPrinterSelectionModal: !old.showPrinterSelectionModal,
    }));
  };

  render() {
    const { variableGroup, orderItem, formatters, barcodeVariables } =
      this.props;
    return (
      <Provider store={store}>
        <Container className="container__width">
          <I18nextProvider i18n={i18n}>
            <Suspense fallback={<div>Loading...</div>}>
              <Navbar
                showPreview={this.state.showPreview}
                handleExportClick={this.toggleShowPrinterModal}
                handleSaveDB={this.props.handleSaveDB}
                ref={this.stageRef}
                axios={this.props.axios}
                orderItem={orderItem}
                formatters={formatters}
              />
              <Row
                className="content__container m-0"
                style={{ height: 'calc(100vh - 120px)' }}
              >
                <Col style={{ padding: 0 }} xs={2}>
                  <Toolbar />
                </Col>

                <Col style={{ padding: 0 }} xs={10}>
                  <Layout
                    ref={this.stageRef}
                    showPreview={this.state.showPreview}
                    toggleShowPreview={this.toggleShowPreview}
                    variableGroup={variableGroup}
                    orderItem={orderItem}
                    formatters={formatters}
                    barcodeVariables={barcodeVariables}
                    toggleShowPrinterModal={this.toggleShowPrinterModal}
                    showPrinterSelectionModal={
                      this.state.showPrinterSelectionModal
                    }
                  />
                </Col>
              </Row>
            </Suspense>
          </I18nextProvider>
        </Container>
      </Provider>
    );
  }
}

App.propTypes = {
  handleSaveDB: PropTypes.func,
  axios: PropTypes.any, // Axios library
  initialLayout: PropTypes.object,
  variableGroup: PropTypes.array, // Object containing actual variables to be shown on POS labels
  orderItem: PropTypes.object, // Object containing data for variables to be shown on preview
  barcodeVariables: PropTypes.array, // Barcode variables (Search values from orderItem)
  formatters: PropTypes.object, // Functions to call to get the data in required format
  isNewLabel: PropTypes.bool, // Shows the new label modal
};

App.defaultProps = {
  handleSaveDB: () => console.log('Add save func'),
  axios: null,
};

export default App;

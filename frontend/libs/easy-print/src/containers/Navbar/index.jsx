import React, { Component, forwardRef } from 'react';
import './styles.css';
import { connect } from 'react-redux';
import actions, {
  selectors as layoutSelectors,
} from '../../redux/reducers/Layout';
import IconButton from '../../components/IconButton';
import PageSettings from '../../components/PageSettings';
import SaveModal from '../../components/Modals/SaveModal';
import NewModal from '../../components/Modals/NewModal';
import { withTranslation } from 'react-i18next';
import { bindActionCreators } from 'redux';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { Row } from '../../mylib/layouts/Row';
import { Col } from '../../mylib/layouts/Col';
import { Navbar } from '../../mylib/layouts/Navbar';
import { NavItem } from '../../mylib/layouts/NavItem';

class NavBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      fileName: '',
      saveType: '',
      converting: false,
    };
    this.saveToDB = this.toggleSaveModal.bind(this, 'DB');
    this.saveToPC = this.toggleSaveModal.bind(this, 'PC');
    this.inputFile = React.createRef();
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!_.isEqual(this.state, nextState)) {
      return true;
    }
    return false;
  }

  handleFileNameChange = (e) => {
    this.setState({
      ...this.state,
      fileName: e.target.value,
    });
  };
  toggleSaveModal = (type = '') => {
    const { layout } = this.props;
    this.setState((prevState) => ({
      ...prevState,
      showSaveModal: !prevState.showSaveModal,
      showConfirmModal: false,
      saveType: type,
      fileName: layout.labelname || '',
    }));
  };

  handleImport = (event) => {
    const { t } = this.props;
    let file = event.target.files[0];
    if (!file) {
      return;
    }
    if (file.name.endsWith('.ept')) {
      var formData = new FormData();

      this.setState({ converting: true });
      formData.append('layout', file);
      this.props.axios
        .post('/convert/ep3_to_ep4', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((rs) => {
          if (rs.status === 200) {
            this.props.load(rs.data);
            this.inputFile.current.value = null;
          } else {
            alert(
              t(
                'error.unable_to_convert_template',
                'Unable to convert the template'
              )
            );

            this.inputFile.current.value = null;
          }

          this.setState({ converting: false });
        })
        .catch(() => {
          this.setState({ converting: false });
        });
    } else {
      var reader = new FileReader();

      reader.onload = (e) => {
        this.props.load(JSON.parse(e.target.result));
        this.inputFile.current.value = null;
      };
      reader.readAsText(file);
    }
  };

  render() {
    const { layout, handleSaveDB, t, orderItem, formatters, axios } =
      this.props;
    const { saveType, fileName, showSaveModal } = this.state;
    return (
      <React.Fragment>
        <SaveModal
          layout={layout}
          saveType={saveType}
          handleFileNameChange={this.handleFileNameChange}
          handleSaveDB={handleSaveDB}
          fileName={fileName}
          showSaveModal={showSaveModal}
          toggleSaveModal={this.toggleSaveModal}
        />
        <NewModal orderItem={orderItem} formatters={formatters} axios={axios} />

        <Row className="m-0" style={{ height: '120px', overflow: 'hidden' }}>
          <Navbar className="nav__container">
            <Col className="nav__splitter" xs={4}>
              <NavItem className="nav__btns">
                <IconButton
                  inNavbar
                  onClick={this.props.handleExportClick}
                  icon="print"
                  text={t('fn.print', 'Print')}
                />
                <IconButton
                  onClick={this.saveToDB}
                  inNavbar
                  icon="save"
                  text={t('fn.save', 'Save')}
                />
                <IconButton
                  inNavbar
                  icon="download"
                  text={t('fn.download', 'Download')}
                  onClick={this.saveToPC}
                />
                <input
                  type="file"
                  accept={'.json;*.ept'}
                  id={'upload_input'}
                  onChange={this.handleImport}
                  style={{ display: 'none' }}
                  ref={this.inputFile}
                />
                <IconButton
                  inNavbar
                  icon={this.state.converting ? 'spinner' : 'file-import'}
                  text={
                    this.state.converting
                      ? t('lbl.converting', 'Converting...')
                      : t('fn.file_import', 'Import')
                  }
                  spin={this.state.converting}
                  onClick={() => this.inputFile.current.click()}
                />
              </NavItem>
            </Col>
            <Col xs={8}>
              <NavItem className="nav__pageSettings">
                <PageSettings />
              </NavItem>
            </Col>
          </Navbar>
        </Row>
      </React.Fragment>
    );
  }
}

NavBar.propTypes = {
  t: PropTypes.func.isRequired,
  layout: PropTypes.object,
  navbarForwardedRef: PropTypes.object,
  items: PropTypes.array,
  resetLayout: PropTypes.func,
  handleSaveDB: PropTypes.func,
  showPreview: PropTypes.bool,
  openPreview: PropTypes.func,
  load: PropTypes.func,
  axios: PropTypes.any,
  handleExportClick: PropTypes.func,
  orderItem: PropTypes.object,
  formatters: PropTypes.object,
};

const mapStateToProps = (state) => {
  return {
    layout: state.layout,
    items: layoutSelectors.itemsAsArray(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      resetLayout: actions.resetLayout,
      load: actions.load,
    },
    dispatch
  );
};

const ConnectedNavbar = withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(NavBar)
);

const FinalNavbar = forwardRef(function finalNavbar(props, ref) {
  return <ConnectedNavbar {...props} navbarForwardedRef={ref} />;
});

export default FinalNavbar;

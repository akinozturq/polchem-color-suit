import React, { Component } from 'react';
import {
  Button,
  Card,
  CardHeader,
  Row,
  Col,
  Label,
  CardBody,
  Container,
} from 'reactstrap';
import PropTypes from 'prop-types';
import { EasyPrint, Preview } from 'e-p';
import SlidingPane from 'react-sliding-pane';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { CustomScrollbars, rightToLeft } from '../../../mylib/Utils';
import { INITIAL_EP_LAYOUT, PRINTING_LABEL } from '../../../Constants';
import { EXAMPLE_ORDERITEM_STATE } from 'js/ExampleOrderitem';
import _ from 'lodash';
import configActions from 'js/redux/reducers/Configuration';
import { confirmAlert } from 'js/ext/react-confirm-alert/index';
import ErrorBoundary from '../../shared/ErrorBoundaryModal'; // Import
import {
  EPvariableTree,
  EP_TYPE_TEXT,
  EP_TYPE_BARCODE,
} from 'polchem_base/common/EPVariables';
import EPValues from 'js/redux/selectors/EPValues';
import axios from 'axios';
import log from '../../../api/Logger';

class PrintLabel extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      show_easyprint: false,
      selected_layout: {},
    };
  }

  editLabel = (layout) => {
    this.setState({ selected_layout: layout });
    this.toggleShowEasyPrint();
  };

  toggleShowEasyPrint = () => {
    this.setState((st) => ({
      show_easyprint: !st.show_easyprint,
    }));
  };

  handleSaveToDB = (name, layout) => {
    const { node } = this.props;
    if (node.type === PRINTING_LABEL) {
      node.config = { ...node.config, data: layout };
      node.name = name;
      this.forceUpdate();
    }

    this.toggleShowEasyPrint();
    // Copy the original data and
    let clone = _.cloneDeep(this.props.configurations.print_labels);
    // Find label
    let idx = _.findIndex(clone, (o) => o.id === layout.labelid);
    if (idx > -1) {
      // Found only one so update that one
      clone[idx] = { data: layout, id: layout.labelid, name: name };
    } else {
      // Adding new label
      clone.push({ data: layout, id: -1 * clone.length - 1, name: name });
    }
    this.props.savePrintLabels(clone);
  };

  handleCopyToDb = (node) => {
    const clone = _.cloneDeep(this.props.configurations.print_labels);
    clone.push({
      data: node.config?.data,
      id: -1 * clone.length - 1,
      name: `${node.name}_clone`.replace('🌐', ''),
    });
    this.props.savePrintLabels(clone);
  };

  handleRemoveFromDB = (label) => {
    // Copy the original data and
    let clone = _.cloneDeep(this.props.configurations.print_labels);
    // Find label
    let idx = _.findIndex(clone, (o) => o.id === label.config.id);
    if (idx > -1) {
      clone[idx] = { ...clone[idx], remove: true };
    }
    this.props.savePrintLabels(clone);
  };

  getLayout = () => {
    const { node } = this.props;
    try {
      if (node.type === PRINTING_LABEL) {
        if (node.config) {
          if (_.has(node.config.data, 'items')) {
            return {
              ...node.config.data,
              labelid: node.config.id,
              labelname: node.config.name,
            };
          }
        }
      } else {
        const lay = this.state.selected_layout;

        if (lay.config) {
          return {
            ...lay.config.data,
            labelid: lay.config.id,
            labelname: lay.config.name,
          };
        }
      }
    } catch (e) {
      log.error(e);
    }
    return {
      ...INITIAL_EP_LAYOUT,
      labelid: node.config.id,
      labelname: node.config.name,
    };
  };

  getPreviewData = () =>
    EPValues({
      ...EXAMPLE_ORDERITEM_STATE,
      configurations: this.props.configurations,
      user: this.props.user,
      cache: this.props.cache,
    });

  getPrintingLabel = () => {
    const { t, node } = this.props;
    return (
      <>
        <Row className="mt-20">
          <Col className="ml-40 pl-12">
            <Label>{t('fn.preview', 'Preview')}</Label>
          </Col>
        </Row>
        <Row>
          <Col xs={'auto'} className="ml-40 pl-12">
            <ErrorBoundary>
              <div style={{ border: '2px solid black' }}>
                <Preview
                  standAlone
                  layout={this.getLayout()}
                  pWidth={460}
                  pHeight={200}
                  orderItem={this.getPreviewData()}
                />
              </div>
            </ErrorBoundary>
          </Col>
          <Col style={{ margin: 'auto', textAlign: 'center' }}>
            <Button
              color="danger"
              key="trash"
              className="btn btn-primary btn-left btn-top"
              disabled={this.props.accessDenied('print_tasks_template')}
              data-denied={this.props.accessDenied('print_tasks_template')}
              onClick={() => this.removeLabel(node)}
            >
              <FontAwesomeIcon icon="trash-alt" />
            </Button>
          </Col>
        </Row>
      </>
    );
  };

  getPrintLabelOverview = () => {
    const { t, node } = this.props;
    const labels = node.children ? (
      node.children.map((x, i) => (
        <Row
          key={i}
          className="pb-2 pt-2"
          style={{ borderBottom: '2px solid white' }}
        >
          <Col>
            <div className="mt-2" data-testid={`label_${i}`}>
              {x.name}
            </div>
          </Col>
          <Col>
            <Row>
              <Col xs={4}>
                <Button
                  data-cy={`copy_label_${x.name}`}
                  onClick={() => this.handleCopyToDb(x)}
                  disabled={this.props.accessDenied('print_tasks_template')}
                  data-denied={this.props.accessDenied('print_tasks_template')}
                >
                  <FontAwesomeIcon icon="copy" />
                </Button>
              </Col>
              <Col xs={4}>
                <Button
                  onClick={() => this.editLabel(x)}
                  disabled={this.props.accessDenied('print_tasks_template')}
                  data-denied={this.props.accessDenied('print_tasks_template')}
                >
                  <FontAwesomeIcon icon="pencil-alt" />
                </Button>
              </Col>
              <Col xs={4}>
                <Button
                  onClick={() => this.removeLabel(x)}
                  disabled={this.props.accessDenied('print_tasks_template')}
                  data-denied={this.props.accessDenied('print_tasks_template')}
                >
                  <FontAwesomeIcon icon="trash-alt" />
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      ))
    ) : (
      <Row>
        <Col>{t('lbl.noLabels', 'No labels')}</Col>
      </Row>
    );

    return <Container>{labels}</Container>;
  };

  removeLabel = (label) => {
    const { t } = this.props;

    confirmAlert({
      title: t('msg.confirmRemoveTemplate.title', 'Confirm label deletion'),
      message: t(
        'msg.confirmRemoveTemplate',
        'Are you sure you want to remove template "{{label.name}}"?',
        {
          label,
        }
      ),
      buttons: [
        {
          label: t('fn.yes', 'Yes'),
          onClick: () => this.handleRemoveFromDB(label),
        },
        {
          label: t('fn.no', 'No'),
        },
      ],
    });
  };

  render() {
    const { t, node } = this.props;
    const layout = this.getLayout();
    const direction = rightToLeft() ? 'rtl' : 'ltr';
    return (
      <>
        <Card
          style={{ height: 'calc((100vh - 102px) - 6rem)' }}
          className="config-card"
          dir={direction}
        >
          <CardHeader className="config-card-header" dir={direction}>
            {node.type === PRINTING_LABEL ? (
              <Row>
                <Col>
                  {t('lbl.labelTemplate', 'Label template')} ({node.name})
                </Col>
                <Col>
                  <Button
                    onClick={this.toggleShowEasyPrint}
                    disabled={this.props.accessDenied('print_tasks_template')}
                    data-denied={this.props.accessDenied(
                      'print_tasks_template'
                    )}
                  >
                    {t('fn.editTemplate', 'Edit template')}
                  </Button>
                </Col>
              </Row>
            ) : (
              <Row>
                <Col>{t('lbl.labelTemplates', 'Label templates')}</Col>
                <Col>
                  <Button
                    data-testid="add_new_label"
                    onClick={this.toggleShowEasyPrint}
                    disabled={this.props.accessDenied('print_tasks_template')}
                    data-denied={this.props.accessDenied(
                      'print_tasks_template'
                    )}
                  >
                    {t('fn.addNewLabel', 'Add new label')}
                  </Button>
                </Col>
              </Row>
            )}
          </CardHeader>
          <CustomScrollbars>
            <CardBody className="m-8 config-card-body" dir={direction}>
              {node.type === PRINTING_LABEL
                ? this.getPrintingLabel()
                : this.getPrintLabelOverview()}
            </CardBody>
          </CustomScrollbars>
        </Card>

        <SlidingPane
          isOpen={this.state.show_easyprint}
          onRequestClose={this.toggleShowEasyPrint}
          className="ml-16 mr-16 mt-1 height-100"
          closeIcon={<FontAwesomeIcon icon="times" color="red" />}
          title={
            layout.labelname
              ? 'EasyPrint (' + layout.labelname + ')'
              : 'EasyPrint'
          }
          from="bottom"
          width="calc(100%-2rem)"
        >
          <ErrorBoundary>
            {/**variable group: loggaa consoleen ja kato mitä tulee, nää pitäis saada menuitemsiin */}
            <EasyPrint
              initialLayout={layout}
              handleSaveDB={this.handleSaveToDB}
              variableGroup={EPvariableTree(EP_TYPE_TEXT)}
              barcodeVariables={EPvariableTree(EP_TYPE_BARCODE)}
              orderItem={this.getPreviewData()}
              axios={axios}
              isNewLabel={Boolean(!layout.labelname)}
            />
          </ErrorBoundary>
        </SlidingPane>
      </>
    );
  }
}

PrintLabel.propTypes = {
  t: PropTypes.func.isRequired,
  node: PropTypes.shape({
    type: PropTypes.string,
    name: PropTypes.string,
    children: PropTypes.arrayOf(PropTypes.shape()),
    config: PropTypes.oneOfType([
      PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        data: PropTypes.shape(),
      }),
      PropTypes.array,
    ]),
  }),

  cache: PropTypes.object,
  configurations: PropTypes.shape({
    config: PropTypes.shape(),
    print_labels: PropTypes.array,
  }),
  user: PropTypes.object,
  savePrintLabels: PropTypes.func.isRequired,
  accessDenied: PropTypes.func.isRequired,
};

function mapStateToProps(store) {
  return {
    cache: store.cache,
    configurations: store.configurations,
    user: store.user,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      savePrintLabels: configActions.savePrintLabels,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(PrintLabel)
);

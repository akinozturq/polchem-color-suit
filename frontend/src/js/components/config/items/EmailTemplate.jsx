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
  Input,
} from 'reactstrap';
import PropTypes from 'prop-types';
import SlidingPane from 'react-sliding-pane';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { CustomScrollbars, rightToLeft } from '../../../mylib/Utils';
import { EMAIL_TEMPLATE } from '../../../Constants';
import { EXAMPLE_ORDERITEM_STATE } from 'js/ExampleOrderitem';
import _ from 'lodash';
import configActions from 'js/redux/reducers/Configuration';
import { confirmAlert } from 'js/ext/react-confirm-alert/index';
import ErrorBoundary from '../../shared/ErrorBoundaryModal'; // Import
import EPValues from 'js/redux/selectors/EPValues';
import {
  MailEditor,
  MailTemplateToHtml,
  EM_TYPE_BARCODE,
  EM_TYPE_TEXT,
} from 'easy-mail';
import {
  EPvariableTree,
  EP_TYPE_TEXT,
  EP_TYPE_BARCODE,
  EP_GROUP_BARCODE_PRICES,
} from 'polchem_base/common/EPVariables';

class EmailTemplate extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      show_easymail: false,
      selected_layout: {},
    };
  }

  editLabel = (layout) => {
    this.setState((st) => ({
      show_easymail: !st.show_easymail,
      selected_layout: layout,
    }));
  };

  toggleShowEasyMail = () => {
    this.setState((st) => ({
      show_easymail: !st.show_easymail,
      selected_layout: {},
    }));
  };

  handleSaveToDB = (name, layout) => {
    const { node } = this.props;
    if (node.type === EMAIL_TEMPLATE) {
      node.config = { ...node.config, data: layout };
      node.name = name;
      this.forceUpdate();
    }

    this.toggleShowEasyMail();
    // Copy the original data and
    let clone = _.cloneDeep(this.props.email_templates);
    // Find label
    let idx = _.findIndex(clone, (o) => o.id === this.state.selected_layout.id);
    if (idx > -1) {
      // Found only one so update that one
      clone[idx] = {
        data: layout,
        id: this.state.selected_layout.id,
        name: name,
      };
    } else {
      // Adding new label
      clone.push({ data: layout, id: -1 * clone.length - 1, name: name });
    }
    this.props.saveEmailTemplates(clone);
  };

  handleCopyToDb = (node) => {
    const clone = _.cloneDeep(this.props.email_templates);
    clone.push({
      data: node.data,
      id: -1 * clone.length - 1,
      name: `${node.name}_clone`,
    });
    this.props.saveEmailTemplates(clone);
  };

  handleRemoveFromDB = (label) => {
    // Copy the original data and
    let clone = _.cloneDeep(this.props.email_templates);
    // Find label
    let idx = _.findIndex(clone, (o) => o.id === label.id);
    if (idx > -1) {
      clone[idx] = { ...clone[idx], remove: true };
    }
    this.props.saveEmailTemplates(clone);
  };

  getTemplate = () => {
    const { node, email_templates } = this.props;

    const template = email_templates.find((x) => x.id === node?.config?.id);

    return template;
  };

  getPreviewData = () =>
    EPValues({
      ...EXAMPLE_ORDERITEM_STATE,
      configurations: this.props.configurations,
      user: this.props.user,
      cache: this.props.cache,
    });

  getEmailTemplate = () => {
    const { t } = this.props;

    const template = this.getTemplate();

    const ei_values = Object.entries(this.getPreviewData()).map(
      ([key, value]) => ({
        key: key,
        value: value,
      })
    );
    const preview = MailTemplateToHtml(template.data.template, ei_values);

    return (
      <>
        <Row className="ml-40 pl-12 mt-20 mb-2">
          <Col xs={3} className="p-0">
            <Label>{t('lbl.subject.colon', 'Subject:')}</Label>
          </Col>
          <Col xs={6} className="p-0">
            <Input readOnly value={template?.data?.subject} />
          </Col>
          <Col xs={3} style={{ margin: 'auto', textAlign: 'center' }}>
            {!template.zoneid && (
              <Button
                color="danger"
                key="trash"
                className="btn btn-primary btn-left btn-top"
                disabled={this.props.accessDenied('print_tasks_template')}
                data-denied={this.props.accessDenied('print_tasks_template')}
                onClick={() => this.removeLabel(template)}
              >
                <FontAwesomeIcon icon="trash-alt" />
              </Button>
            )}
          </Col>
        </Row>
        <Row className="mt-2">
          <Col className="ml-40 pl-12">
            <Label>{t('fn.preview', 'Preview')}</Label>
          </Col>
        </Row>
        <Row>
          <Col className="ml-40 pl-12">
            <ErrorBoundary>
              <div
                style={{
                  border: '2px solid black',
                  backgroundColor: 'white',
                  color: 'black',
                }}
                dangerouslySetInnerHTML={{ __html: preview }}
              ></div>
            </ErrorBoundary>
          </Col>
        </Row>
      </>
    );
  };

  getEmailTemplateOverview = () => {
    const { t, email_templates } = this.props;
    const labels = email_templates ? (
      email_templates.map((x, i) => (
        <Row
          key={i}
          className="pb-2 pt-2"
          style={{ borderBottom: '2px solid white' }}
        >
          <Col>
            <div className="mt-2">{x.name}</div>
          </Col>
          <Col>
            <Row>
              <Col xs={4}>
                <Button
                  data-testid={`copy ${i}`}
                  onClick={() => this.handleCopyToDb(x)}
                  disabled={this.props.accessDenied('print_tasks_template')}
                  data-denied={this.props.accessDenied('print_tasks_template')}
                >
                  <FontAwesomeIcon icon="copy" />
                </Button>
              </Col>
              <Col xs={4}>
                <Button
                  data-testid={`edit ${i}`}
                  onClick={() => this.editLabel(x)}
                  disabled={this.props.accessDenied('print_tasks_template')}
                  data-denied={this.props.accessDenied('print_tasks_template')}
                >
                  <FontAwesomeIcon icon="pencil-alt" />
                </Button>
              </Col>
              <Col xs={4}>
                <Button
                  data-testid={`delete ${i}`}
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
        <Col>{t('lbl.noTemplates', 'No templates')}</Col>
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

  onSave = (data) => {
    this.handleSaveToDB(data.name, data);
  };

  onCancel = () => {
    this.setState((st) => ({
      show_easymail: !st.show_easymail,
    }));
  };

  render() {
    const { t, node } = this.props;
    const direction = rightToLeft() ? 'rtl' : 'ltr';
    const ei_values = Object.entries(this.getPreviewData()).map(
      ([key, value]) => ({
        key: key,
        value: value,
      })
    );
    const menuItems = EPvariableTree(EP_TYPE_TEXT)
      .map((x) => ({
        label: x.label,
        value: x.code,
        variables: x.variables.map((y) => ({
          label: y.label,
          value: y.code,
          type: EM_TYPE_TEXT,
        })),
      }))
      .concat(
        EPvariableTree(EP_TYPE_BARCODE).map((x) => ({
          label:
            x.code === EP_GROUP_BARCODE_PRICES
              ? t('lbl.prices_barcode', 'Prices (barcodes)')
              : x.label,
          value: x.code,
          variables: x.variables.map((y) => ({
            label: y.label,
            value: y.code,
            type: EM_TYPE_BARCODE,
            barcode_types: y.barcode_types,
          })),
        }))
      );

    return (
      <>
        <Card
          style={{ height: 'calc((100vh - 102px) - 6rem)' }}
          className="config-card"
          dir={direction}
        >
          <CardHeader className="config-card-header" dir={direction}>
            {node.type === EMAIL_TEMPLATE ? (
              <Row>
                <Col>
                  {t('lbl.labelTemplate', 'Label template')} ({node.name})
                </Col>
                <Col>
                  <Button
                    onClick={() => this.editLabel(this.getTemplate())}
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
                <Col>{t('lbl.emailTemplates', 'Email templates')}</Col>
                <Col>
                  <Button
                    data-testid="add_new_label"
                    onClick={this.toggleShowEasyMail}
                    disabled={this.props.accessDenied('print_tasks_template')}
                    data-denied={this.props.accessDenied(
                      'print_tasks_template'
                    )}
                  >
                    {t('fn.addNewTemplate', 'Add new Template')}
                  </Button>
                </Col>
              </Row>
            )}
          </CardHeader>
          <CustomScrollbars>
            <CardBody className="m-8 config-card-body" dir={direction}>
              {node.type === EMAIL_TEMPLATE
                ? this.getEmailTemplate()
                : this.getEmailTemplateOverview()}
            </CardBody>
          </CustomScrollbars>
        </Card>

        <SlidingPane
          isOpen={this.state.show_easymail}
          onRequestClose={this.toggleShowEasyMail}
          className="ml-16 mr-16 mt-1 height-100"
          closeIcon={<FontAwesomeIcon icon="times" color="red" />}
          title={'EasyMail'}
          from="bottom"
          width="calc(100%-2rem)"
        >
          <ErrorBoundary>
            <MailEditor
              onSave={this.onSave}
              initialValue={this.state.selected_layout.data || undefined}
              menuItems={menuItems}
              onCancel={this.onCancel}
              variables={ei_values}
            />
          </ErrorBoundary>
        </SlidingPane>
      </>
    );
  }
}

EmailTemplate.propTypes = {
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

  configurations: PropTypes.shape({
    config: PropTypes.shape(),
    print_labels: PropTypes.array,
  }),
  cache: PropTypes.object,
  user: PropTypes.object,
  email_templates: PropTypes.array,
  saveEmailTemplates: PropTypes.func.isRequired,
  accessDenied: PropTypes.func.isRequired,
};

function mapStateToProps(store) {
  return {
    configurations: store.configurations,
    email_templates: store.configurations.email_templates,
    user: store.user,
    cache: store.cache,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      saveEmailTemplates: configActions.saveEmailTemplates,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(EmailTemplate)
);

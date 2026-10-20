import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Button,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  Row,
} from 'reactstrap';
import { selectors as configSelectors } from 'js/redux/reducers/Configuration';
import { selectors as orderSelectors } from 'js/redux/reducers/Order';
import pluginActions from 'js/redux/reducers/Plugins';
import PropTypes from 'prop-types';

class AXmodal extends Component {
  constructor(props) {
    super(props);
    const { colourcode, productname } = props;
    this.state = {
      numLabels: 1,
      axProductName: [productname, colourcode].join(' '),
      includeColorName: false,
      facility: '',
      user: '',
    };
  }

  handleSubmit = (event) => {
    this.props.axSendFormula(this.state);
    event.preventDefault();
    this.props.closeModal();
  };

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleCheckboxChange = (event) => {
    this.setState({ [event.target.name]: event.target.checked });
  };

  render() {
    const { t, ax_title, closeModal } = this.props;

    return (
      <Modal isOpen centered>
        <ModalHeader>{ax_title || t('plugin.ax.title')}</ModalHeader>
        <ModalBody>
          <Form onSubmit={this.handleSubmit}>
            <FormGroup>
              <Label for="numLabels">{t('lbl.numOfLabels')}</Label>
              <Input
                type="number"
                name="numLabels"
                min="0"
                value={this.state.numLabels}
                onChange={this.handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label for="axProductName">{t('lbl.productName')}</Label>
              <Input
                type="text"
                name="axProductName"
                value={this.state.axProductName}
                onChange={this.handleChange}
              />
            </FormGroup>
            <FormGroup check>
              <Label check>
                <Input
                  type="checkbox"
                  name="includeColorName"
                  checked={this.state.includeColorName}
                  onChange={this.handleCheckboxChange}
                />
                {t('plugin.ax.includeColorName', 'Include color name')}
              </Label>
            </FormGroup>
            <FormGroup>
              <Label for="facility">{t('plugin.ax.facility')}</Label>
              <Input
                type="text"
                name="facility"
                value={this.state.facility}
                onChange={this.handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label for="user">{t('lbl.username')}</Label>
              <Input
                type="text"
                name="user"
                value={this.state.user}
                onChange={this.handleChange}
              />
            </FormGroup>

            <FormGroup>
              <Row>
                <Col>
                  <Button type="submit">{t('fn.ok')}</Button>
                </Col>
                <Col>
                  <Button type="button" onClick={closeModal}>
                    {t('fn.cancel')}
                  </Button>
                </Col>
              </Row>
            </FormGroup>
          </Form>
        </ModalBody>
      </Modal>
    );
  }
}

AXmodal.propTypes = {
  t: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired,
  axSendFormula: PropTypes.func.isRequired,
  ax_title: PropTypes.string,
  productname: PropTypes.string,
  colourcode: PropTypes.string,
};

function mapStateToProps(state) {
  const { plugins } = configSelectors.config_values(state);
  const { item } = orderSelectors.order(state);
  return {
    ax_title: plugins?.ax_title,
    colourcode: item.colourcode,
    productname: item.productname,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    { axSendFormula: pluginActions.axSendFormula },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(AXmodal)
);

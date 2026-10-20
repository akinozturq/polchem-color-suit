import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  ModalBody,
  Row,
  Col,
  CustomInput,
  Alert,
  Button,
  Input,
  InputGroup,
  FormFeedback,
} from 'reactstrap';
import isEmail from 'validator/es/lib/isEmail'; // Tree-shakeable import
import isMobilePhone from 'validator/es/lib/isMobilePhone';
import isPostalCode from 'validator/es/lib/isPostalCode';
import NumberInput from '../../mylib/NumberInput';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withTranslation } from 'react-i18next';
import orderActions from 'js/redux/reducers/Order';
import customerActions, {
  propType as customerType,
} from 'js/redux/reducers/Customer';
import _ from 'lodash';
import CountrySelect from './CountrySelect';
import CustomerSelect from './CustomerSelect';
import { rightToLeft } from '../../mylib/Utils';

const customer_type = PropTypes.shape({
  customerid: PropTypes.number,
  customername: PropTypes.string,
  companyname: PropTypes.string,
  address1: PropTypes.string,
  address2: PropTypes.string,
  postcode: PropTypes.string,
  country: PropTypes.string,
  phone: PropTypes.string,
  email: PropTypes.string,
  marketing: PropTypes.bool,
  discountrate: PropTypes.any,
  customernotes: PropTypes.string,
});

const STRING_FIELDS = [
  'customername',
  'companyname',
  'address1',
  'address2',
  'postcode',
  'country',
  'phone',
  'email',
  'customernotes',
];

const validateInput = (input, type, t, config) => {
  const mandatory =
    type === 'customername'
      ? true
      : _.get(config, `mandatory_customer_${type}.value`, false);

  if (!input || input.trim() === '') {
    if (mandatory) {
      return t('msg.fieldIsRequired', 'Field is required');
    } else {
      return '';
    }
  }

  switch (type) {
    case 'email':
      return !isEmail(input) ? t('msg.invalidEmail', 'Invalid Email') : '';
    case 'phone':
      return !isMobilePhone(input)
        ? t('msg.invalidPhone', 'Invalid phone number')
        : '';
    case 'postcode':
      return !isPostalCode(input, 'any')
        ? t('msg.invalidPostalCode', 'Invalid postal code')
        : '';
    default:
      return '';
  }
};

const empty_customer = {};

class CustomerModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isEdit: false,
      customer: empty_customer,
      unmodified_customer: empty_customer,
      consent: false,
      value: '',
      ordernotes: '',
      props_customer: null,
    };
  }

  static getDerivedStateFromProps(props, state) {
    const props_customer = props.selectedCustomer || props.order.customer;
    if (props_customer !== state.props_customer) {
      if (props_customer) {
        let { discountrate } = props_customer;
        // Should be number 0..1 or null, but previous it4 saved string 1..100
        if (typeof discountrate === 'string') {
          discountrate = parseFloat(discountrate) / 100;
        }
        const customer = {
          ...props_customer,
          discountrate: discountrate || 0,
        };

        return {
          ordernotes: props.order.notes,
          customer,
          unmodified_customer: customer,
          props_customer,
        };
      } else {
        return { props_customer: null };
      }
    }
    return null;
  }

  validateAllFields() {
    const { t, config } = this.props;
    const tmp = { invalid_data: false };

    STRING_FIELDS.forEach((x) => {
      let message = validateInput(this.state.customer[x] || '', x, t, config);
      tmp[x] = { valid: !message, error: message || '' };
      if (message) {
        tmp.invalid_data = true;
      }
    });

    return tmp;
  }

  componentDidMount() {
    this.handleShow();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.order.notes !== this.props.order.notes) {
      this.setState({
        ordernotes: this.props.order.notes,
      });
    }
    if (this.props.show !== prevProps.show) {
      this.handleShow();
    }
  }

  handleShow() {
    if (this.props.show) {
      this.setState({
        isEdit: !this.props.allowSearch,
      });
    } else {
      this.props.clearSearchCustomers();
    }
  }

  setCustomerState(obj) {
    this.setState((state) => ({
      customer: {
        ...state.customer,
        ...obj,
      },
    }));
  }

  toggleEditMode = () => {
    this.setState((state) =>
      state.isEdit
        ? state.customer !== state.unmodified_customer
          ? { customer: state.unmodified_customer, isEdit: true }
          : {
              customer: empty_customer,
              unmodified_customer: empty_customer,
              isEdit: false,
            }
        : { isEdit: true }
    );
  };

  handleCreate = (inputValue) => {
    this.setState({
      customer: { customername: inputValue },
      isEdit: true,
    });
  };

  handleCustomerChange = (newCustomer) => {
    const customer = newCustomer || empty_customer;
    this.setState({ customer, unmodified_customer: customer });
  };

  getCustomer = () => {
    const result = { ...this.state.customer };
    for (const key of STRING_FIELDS) {
      result[key] = (result[key] || '').trim();
    }
    return result;
  };

  formValueChanged = (e, key) => {
    this.setCustomerState({ [key]: e.target.value });
  };

  handleCountryChange = (newValue) => {
    const { code } = newValue;
    this.setCustomerState({ country: code });
  };

  save = () => {
    const customer = this.getCustomer();

    // setOrderNotes prop only set from TopActions
    this.props.setOrderNotes?.(this.state.ordernotes);

    if (customer.customername) {
      this.props.onSave(customer);
    }
    this.props.toggleShow();
  };

  cancel = () => {
    this.setState({
      isEdit: false,
      customer: empty_customer,
      unmodified_customer: empty_customer,
      consent: false,
      props_customer: null,
    });
    this.props.toggleShow();
  };

  render() {
    const { t, config, allowSearch, show, showOrderNotes } = this.props;
    const isRtl = rightToLeft();
    const fieldAlignStyle = {
      textAlign: isRtl ? 'right' : 'left',
      direction: isRtl ? 'rtl' : 'ltr',
    };

    const { customer, isEdit } = this.state;
    const validation = this.validateAllFields();
    const isExisting = customer.customerid != null;
    const isModified = customer !== this.state.unmodified_customer;

    const enable_gdpr = _.get(config, 'enable_gdpr.value', true);

    return (
      <Modal
        size="sm"
        data-testid="customerModal"
        className="customer-width"
        isOpen={show}
        toggle={this.cancel}
        centered
        fade={true}
      >
        <ModalBody
          style={{
            padding: '0.5rem 1rem 0 1rem',
            ...fieldAlignStyle,
          }}
        >
          <div className="customer-bb" style={{ display: 'flex' }}>
            <h4
              style={{ borderBottom: 'none', marginBottom: '0' }}
              className="pt-0 pb-0 w-100"
            >
              {t('lbl.customerInformation', 'Customer information')}
            </h4>
            {allowSearch && isExisting && (
              <Button
                data-testid="mode-button"
                onClick={this.toggleEditMode}
                style={{ width: '20%', height: '10%' }}
              >
                {isEdit
                  ? isModified
                    ? t('fn.reset')
                    : t('fn.search', 'Search')
                  : t('fn.edit', 'Edit')}
              </Button>
            )}
          </div>
          {allowSearch && show && (
            <div
              style={{
                marginLeft: isRtl ? 0 : '0.5em',
                marginRight: isRtl ? '0.5em' : 0,
                ...fieldAlignStyle,
              }}
              className="col col-7 mt-2 mb-2"
            >
              <CustomerSelect
                onCreateOption={this.handleCreate}
                onChange={this.handleCustomerChange}
                disabled={isEdit && isExisting}
                disabledLabel={this.state.unmodified_customer.customername}
              />
            </div>
          )}
          <div className="row  br-8 mr-0 ml-0">
            <div className="col p-0">
              <form className=" p-0 mb-16">
                <div className="form-row mr-5 ml-5">
                  {/** Customer name */}
                  <Col md={7}>
                    <label style={fieldAlignStyle}>
                      {t(
                        'lbl.customerOrProject.colon',
                        'Customer name / Project number:'
                      )}
                    </label>
                    <InputGroup>
                      <Input
                        data-testid="customer-name"
                        maxLength={200}
                        invalid={!validation.customername.valid && isEdit}
                        disabled={!isEdit}
                        required
                        className="form-control h-25rem"
                        style={fieldAlignStyle}
                        value={customer.customername || ''}
                        onChange={(e) =>
                          this.formValueChanged(e, 'customername')
                        }
                      />
                      <FormFeedback valid={validation.customername.valid}>
                        {validation.customername.error}
                      </FormFeedback>
                    </InputGroup>
                  </Col>
                  {/** Company name */}
                  <Col md={5}>
                    <label style={fieldAlignStyle}>
                      {t('lbl.companyName.colon', 'Company name:')}
                    </label>
                    <InputGroup>
                      <Input
                        data-testid="company-name"
                        maxLength={200}
                        invalid={!validation.companyname.valid && isEdit}
                        disabled={!isEdit}
                        type="search"
                        className="form-control h-25rem"
                        style={fieldAlignStyle}
                        value={customer.companyname || ''}
                        onChange={(e) =>
                          this.formValueChanged(e, 'companyname')
                        }
                      />

                      <FormFeedback valid={validation.companyname.valid}>
                        {validation.companyname.error}
                      </FormFeedback>
                    </InputGroup>
                  </Col>
                </div>
                <div className="form-row mr-5 ml-5">
                  <Col md={7}>
                    <label style={fieldAlignStyle}>
                      {t('lbl.email.colon', 'Email:')}
                    </label>
                    <InputGroup>
                      <Input
                        data-testid="email"
                        invalid={!validation.email.valid && isEdit}
                        disabled={!isEdit}
                        type="email"
                        maxLength={200}
                        className="form-control h-25rem"
                        style={fieldAlignStyle}
                        value={customer.email || ''}
                        onChange={(e) => this.formValueChanged(e, 'email')}
                      />
                      <FormFeedback valid={validation.email.valid}>
                        {validation.email.error}
                      </FormFeedback>
                    </InputGroup>
                  </Col>
                  <Col md={5}>
                    <label style={fieldAlignStyle}>
                      {t('lbl.phone.colon', 'Phone number:')}
                    </label>
                    <InputGroup>
                      <Input
                        data-testid="phoneno"
                        invalid={!validation.phone.valid && isEdit}
                        disabled={!isEdit}
                        type="tel"
                        maxLength={200}
                        className="form-control h-25rem"
                        style={fieldAlignStyle}
                        value={customer.phone || ''}
                        onChange={(e) => this.formValueChanged(e, 'phone')}
                      />

                      <FormFeedback valid={validation.phone.valid}>
                        {validation.phone.error}
                      </FormFeedback>
                    </InputGroup>
                  </Col>
                </div>
                <div className="form-row mr-5 ml-5">
                  <Col md={7}>
                    <label style={fieldAlignStyle}>
                      {t('lbl.address.colon', 'Address:')}
                    </label>
                    <InputGroup>
                      <Input
                        data-testid="address"
                        invalid={!validation.address1.valid && isEdit}
                        required
                        disabled={!isEdit}
                        type="text"
                        maxLength={200}
                        className="form-control h-25rem"
                        style={fieldAlignStyle}
                        value={customer.address1 || ''}
                        onChange={(e) => this.formValueChanged(e, 'address1')}
                      />

                      <FormFeedback valid={validation.address1.valid}>
                        {validation.address1.error}
                      </FormFeedback>
                    </InputGroup>
                  </Col>
                  <Col md={5}>
                    <label style={fieldAlignStyle}>
                      {t('lbl.city.colon', 'City:')}
                    </label>
                    <InputGroup>
                      <Input
                        data-testid="city"
                        invalid={!validation.address2.valid && isEdit}
                        disabled={!isEdit}
                        type="text"
                        maxLength={200}
                        className="form-control h-25rem"
                        style={fieldAlignStyle}
                        value={customer.address2 || ''}
                        onChange={(e) => this.formValueChanged(e, 'address2')}
                      />

                      <FormFeedback valid={validation.address2.valid}>
                        {validation.address2.error}
                      </FormFeedback>
                    </InputGroup>
                  </Col>
                </div>
                <div className="form-row mr-5 ml-5">
                  <Col md={3}>
                    <label style={fieldAlignStyle}>
                      {t('lbl.zipCode.colon', 'Zip:')}
                    </label>
                    <InputGroup>
                      <Input
                        data-testid="zip"
                        invalid={!validation.postcode.valid && isEdit}
                        disabled={!isEdit}
                        type="text"
                        maxLength={200}
                        className="form-control h-25rem"
                        style={fieldAlignStyle}
                        value={customer.postcode || ''}
                        onChange={(e) => this.formValueChanged(e, 'postcode')}
                      />
                      <FormFeedback valid={validation.postcode.valid}>
                        {validation.postcode.error}
                      </FormFeedback>
                    </InputGroup>
                  </Col>
                  <Col md={6}>
                    <label className="w-100" style={fieldAlignStyle}>
                      {t('lbl.country.colon', 'Country:')}
                    </label>
                    <InputGroup style={{ display: 'contents', ...fieldAlignStyle }}>
                      <CountrySelect
                        isDisabled={!isEdit}
                        value={customer.country}
                        onChange={this.handleCountryChange}
                      />
                      <FormFeedback
                        valid={validation.country.valid}
                        style={{ display: 'unset' }}
                      >
                        {validation.country.error}
                      </FormFeedback>
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <label style={fieldAlignStyle}>
                      {t('lbl.discountRate.colon', 'Discount rate [%]:')}
                    </label>
                    <InputGroup>
                      <NumberInput
                        dataTestid="discount"
                        disabled={!isEdit}
                        className="form-control h-25rem"
                        style={fieldAlignStyle}
                        min={0}
                        max={100}
                        decimals={2}
                        value={(customer.discountrate || 0) * 100}
                        onChange={(value) =>
                          this.setCustomerState({ discountrate: value / 100 })
                        }
                      />
                      <FormFeedback valid={true}></FormFeedback>
                    </InputGroup>
                  </Col>
                </div>
              </form>
              <form className=" p-0 mb-16 customer-bt">
                <div className="form-row ml-16 mr-16">
                  <Col md={6}>
                    <label style={fieldAlignStyle}>
                      {t('lbl.customerNotes.colon', 'Customer notes:')}
                    </label>
                    <textarea
                      disabled={!isEdit}
                      className="form-control"
                      style={fieldAlignStyle}
                      value={customer.customernotes || ''}
                      onChange={(e) =>
                        this.formValueChanged(e, 'customernotes')
                      }
                    />
                  </Col>
                  {showOrderNotes && (
                    <Col md={6}>
                      <label style={fieldAlignStyle}>
                        {t('lbl.orderNotes.colon', 'Order notes:')}
                      </label>
                      <textarea
                        data-cy={'order_notes'}
                        className="form-control"
                        style={fieldAlignStyle}
                        value={this.state.ordernotes || ''}
                        onChange={(e) =>
                          this.setState({ ordernotes: e.target.value })
                        }
                      />
                    </Col>
                  )}
                </div>
              </form>
              <form className="mb-10 mt-10">
                <div className="mt-10 pb-0 pt-0 mr-0 ml-0 h-100 customer-bt">
                  <div
                    className="col col-12 p-0 mt-10 customer-bb"
                    style={{ zIndex: '0', ...fieldAlignStyle }}
                  >
                    <div
                      className="form-check mx-5 mb-4 pr-20"
                      style={fieldAlignStyle}
                    >
                      <CustomInput
                        disabled={!isEdit}
                        type="switch"
                        id="cnt_batch"
                        label={t(
                          'prompt.marketing',
                          'Receive marketing offers?'
                        )}
                        checked={Boolean(customer.marketing)}
                        onChange={(e) =>
                          this.setCustomerState({ marketing: e.target.checked })
                        }
                      />
                    </div>
                  </div>
                  <Alert
                    isOpen={enable_gdpr}
                    className="mt-10"
                    style={fieldAlignStyle}
                  >
                    <p>
                      {t(
                        'prompt.personalData',
                        'May we store your personal data into the database?'
                      )}
                    </p>
                    <CustomInput
                      type="checkbox"
                      id="customerConsentRecievedBox"
                      label={t(
                        'lbl.personalDataConsent',
                        'Customer consent to store data received'
                      )}
                      onChange={(e) => {
                        this.setState({ consent: e.target.checked });
                      }}
                      value={this.state.consent}
                    />
                  </Alert>

                  <div className="col p-0 mb-10 mt-10">
                    <Row>
                      <Col xs="4">
                        <Button
                          data-testid="customerCancelBtn"
                          color="warning"
                          onClick={this.cancel}
                        >
                          {t('fn.cancel', 'Cancel')}
                        </Button>
                      </Col>
                      <Col xs="4" />
                      <Col xs="4">
                        <Button
                          data-testid="customerSaveBtn"
                          disabled={
                            (!this.state.consent && enable_gdpr) ||
                            (validation.invalid_data && isEdit)
                          }
                          color="primary"
                          onClick={this.save}
                        >
                          {t('fn.save', 'Save')}
                        </Button>
                      </Col>
                    </Row>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </ModalBody>
      </Modal>
    );
  }
}

CustomerModal.propTypes = {
  t: PropTypes.func.isRequired,
  config: PropTypes.object,
  show: PropTypes.bool.isRequired,
  showOrderNotes: PropTypes.bool.isRequired,
  toggleShow: PropTypes.func.isRequired,
  clearSearchCustomers: PropTypes.func.isRequired,
  allowSearch: PropTypes.bool,
  order: PropTypes.shape({
    customer: customer_type,
    item: PropTypes.object,
    notes: PropTypes.string,
  }),
  customer: customerType,
  onSave: PropTypes.func.isRequired,
  setOrderNotes: PropTypes.func,

  selectedCustomer: customer_type,
};

CustomerModal.defaultProps = {
  allowSearch: true,
  showOrderNotes: false,
};

function mapStateToProps(store) {
  return {
    order: store.order,
    customer: store.customer,
    config: store.configurations.config,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setCustomer: orderActions.setCustomer,
      saveOrderCustomer: orderActions.saveCustomer,
      setDiscount: orderActions.setDiscount,
      setOrderNotes: orderActions.setOrderNotes,
      clearSearchCustomers: customerActions.clearSearchCustomers,
      saveCustomer: customerActions.saveCustomer,
      applyCustomer: orderActions.applyCustomer,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(CustomerModal)
);

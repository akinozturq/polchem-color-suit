import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import CreatableSelect from 'react-select/creatable';
import customerActions, {
  propType as customerType,
} from 'js/redux/reducers/Customer';
import { bindActionCreators } from 'redux';

const Option = (props) => {
  const {
    children,
    isFocused,
    isSelected,
    innerRef,
    innerProps,
    options,
    data: option,
  } = props;
  const isNew = option.customerid == undefined;
  const lastOption = options[options.length - 1];
  const lastValue = lastOption.customerid == undefined ? lastOption.value : '';
  return (
    <div
      data-testid={isNew ? 'new_customer' : `customer_${option.label}`}
      ref={innerRef}
      {...innerProps}
      style={{
        backgroundColor: isNew
          ? '#28a745'
          : isFocused
            ? '#DEEBFF'
            : isSelected
              ? '#2684FF'
              : 'transparent',
        color: isNew ? 'white' : 'inherit',
        cursor: isNew ? 'pointer' : 'default',
        display: 'block',
        fontSize: isNew && isFocused ? '1.2rem' : 'inherit',
        padding: '8px 12px',
        width: '100%',
        userSelect: 'none',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
      }}
    >
      <p style={{ fontStyle: 'italic', fontWeight: '800', margin: '0' }}>
        {children}
      </p>
      <OptionInfo
        value={
          (option.address || option.postcode || option.city) &&
          `${option.address}, ${option.postcode} ${option.city}`
        }
      />
      <OptionInfo value={option.company} searchValue={lastValue} />
      <OptionInfo value={option.email} searchValue={lastValue} />
      <OptionInfo value={option.phone} searchValue={lastValue} />
    </div>
  );
};

Option.propTypes = {
  t: PropTypes.func.isRequired,
  children: PropTypes.node,
  isDisabled: PropTypes.bool,
  isFocused: PropTypes.bool,
  isSelected: PropTypes.bool,
  innerRef: PropTypes.any,
  innerProps: PropTypes.object,
  options: PropTypes.array,
  data: PropTypes.object,
};

const OptionInfo = ({ value, searchValue }) =>
  !!value && (
    <p
      style={{
        margin: '0 0 0 0.8em',
        fontWeight:
          searchValue && value.includes(searchValue) ? 'bold' : 'normal',
      }}
    >
      {value}
    </p>
  );

OptionInfo.propTypes = {
  value: PropTypes.string,
  searchValue: PropTypes.string,
};

class CustomerSelect extends React.Component {
  constructor(props) {
    super(props);
    this.timeout = null;
    this.focused = false;
    this.selectRef = null;
    this.state = { value: null };
  }

  componentDidMount() {
    this.props.searchCustomers('', 0);
    this.focused = false;
  }

  componentDidUpdate(prevProps) {
    if (
      !this.focused &&
      !this.props.customer.search_results.pending &&
      this.selectRef
    ) {
      this.selectRef?.focus();
      this.focused = true;
    }
    if (!this.props.disabled && prevProps.disabled) {
      this.setState({ value: null });
    }
    if (this.props.disabled && !prevProps.disabled) {
      this.setState({ value: { label: this.props.disabledLabel } });
    }
  }

  handleSearch = (value) => {
    if (value !== this.props.customer.search_results.params?.search) {
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.props.searchCustomers(value, 0);
      }, 300);
    }
    return value;
  };

  handleChange = (option) => {
    if (option) {
      const customer_data =
        this.props.customer.search_results.data?.customers || [];
      const customer = customer_data.find((x) => x.customerid === option.value);
      this.props.onChange(customer);
    } else {
      this.props.onChange(null);
    }
    this.setState({ value: option });
  };

  render() {
    const { t, customer } = this.props;

    const customer_data = customer.search_results.data?.customers || [];

    const opts = customer_data.map((cust) => ({
      label: cust.customername,
      value: cust.customerid,
      customerid: cust.customerid,
      company: cust.companyname,
      address: cust.address1,
      city: cust.address2,
      postcode: cust.postcode,
      email: cust.email,
      phone: cust.phone,
    }));

    const allowCreate = this.props.onCreateOption ? true : undefined;

    return (
      <CreatableSelect
        id={'select_customer'}
        isClearable
        isSearchable
        isDisabled={this.props.disabled}
        ref={(r) => (this.selectRef = r)}
        components={{ Option: (props) => <Option {...props} t={t} /> }}
        onInputChange={this.handleSearch}
        isLoading={customer.search_results.pending}
        options={opts}
        value={this.state.value}
        onCreateOption={allowCreate && this.props.onCreateOption}
        onChange={this.handleChange}
        filterOption={
          () => true // disables built-in filtering
        }
        isValidNewOption={() => allowCreate}
        placeholder={t(
          'lbl.searchOrCreateCustomer',
          'Search or create customer...'
        )}
        formatCreateLabel={
          allowCreate &&
          ((value) =>
            `${t(
              'fn.addNewCustomerProject',
              'Add new customer / project'
            )} ${value}`)
        }
        noOptionsMessage={() =>
          t(
            'prompt.typeCustomerNameOrProjectNumber',
            'Type customer name or project number'
          )
        }
      />
    );
  }
}

CustomerSelect.propTypes = {
  t: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onCreateOption: PropTypes.func,
  customer: customerType,
  searchCustomers: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  disabledLabel: PropTypes.string,
};

CustomerSelect.defaultProps = {
  disabled: false,
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
      searchCustomers: customerActions.searchCustomers,
      clearSearchCustomers: customerActions.clearSearchCustomers,
    },
    dispatch
  );
}

export default withTranslation('translations')(
  connect(mapStateToProps, mapDispatchToProps)(CustomerSelect)
);

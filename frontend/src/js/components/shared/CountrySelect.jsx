import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Select from 'react-select';

const countries = {
  AF: 'Afghanistan',
  AL: 'Albania',
  DZ: 'Algeria',
  AS: 'American Samoa',
  AD: 'Andorra',
  AO: 'Angola',
  AI: 'Anguilla',
  AG: 'Antigua and Barbuda',
  AR: 'Argentina',
  AM: 'Armenia',
  AW: 'Aruba',
  AU: 'Australia',
  AT: 'Austria',
  AZ: 'Azerbaijan',
  BS: 'Bahamas',
  BH: 'Bahrain',
  BD: 'Bangladesh',
  BB: 'Barbados',
  BY: 'Belarus',
  BE: 'Belgium',
  BZ: 'Belize',
  BJ: 'Benin',
  BM: 'Bermuda',
  BT: 'Bhutan',
  BO: 'Bolivia, Plurinational State of',
  BA: 'Bosnia and Herzegovina',
  BW: 'Botswana',
  BR: 'Brazil',
  IO: 'British Indian Ocean Territory',
  BG: 'Bulgaria',
  BF: 'Burkina Faso',
  BI: 'Burundi',
  KH: 'Cambodia',
  CM: 'Cameroon',
  CA: 'Canada',
  CV: 'Cape Verde',
  KY: 'Cayman Islands',
  CF: 'Central African Republic',
  TD: 'Chad',
  CL: 'Chile',
  CN: 'China',
  CO: 'Colombia',
  KM: 'Comoros',
  CG: 'Congo',
  CD: 'Democratic Republic of the Congo',
  CK: 'Cook Islands',
  CR: 'Costa Rica',
  CI: "Côte d'Ivoire",
  HR: 'Croatia',
  CU: 'Cuba',
  CW: 'Curaçao',
  CY: 'Cyprus',
  CZ: 'Czech Republic',
  DK: 'Denmark',
  DJ: 'Djibouti',
  DM: 'Dominica',
  DO: 'Dominican Republic',
  EC: 'Ecuador',
  EG: 'Egypt',
  SV: 'El Salvador',
  GQ: 'Equatorial Guinea',
  ER: 'Eritrea',
  EE: 'Estonia',
  ET: 'Ethiopia',
  FK: 'Falkland Islands (Malvinas)',
  FO: 'Faroe Islands',
  FJ: 'Fiji',
  FI: 'Finland',
  FR: 'France',
  PF: 'French Polynesia',
  GA: 'Gabon',
  GM: 'Gambia',
  GE: 'Georgia',
  DE: 'Germany',
  GH: 'Ghana',
  GI: 'Gibraltar',
  GR: 'Greece',
  GL: 'Greenland',
  GD: 'Grenada',
  GU: 'Guam',
  GT: 'Guatemala',
  GG: 'Guernsey',
  GN: 'Guinea',
  GW: 'Guinea-Bissau',
  HT: 'Haiti',
  HN: 'Honduras',
  HK: 'Hong Kong',
  HU: 'Hungary',
  IS: 'Iceland',
  IN: 'India',
  ID: 'Indonesia',
  IR: 'Iran, Islamic Republic of',
  IQ: 'Iraq',
  IE: 'Ireland',
  IM: 'Isle of Man',
  IL: 'Israel',
  IT: 'Italy',
  JM: 'Jamaica',
  JP: 'Japan',
  JE: 'Jersey',
  JO: 'Jordan',
  KZ: 'Kazakhstan',
  KE: 'Kenya',
  KI: 'Kiribati',
  KP: 'North Korea',
  KR: 'South Korea',
  KW: 'Kuwait',
  KG: 'Kyrgyzstan',
  LA: "Lao People's Democratic Republic",
  LV: 'Latvia',
  LB: 'Lebanon',
  LS: 'Lesotho',
  LR: 'Liberia',
  LY: 'Libya',
  LI: 'Liechtenstein',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  MO: 'Macao',
  MK: 'Republic of Macedonia',
  MG: 'Madagascar',
  MW: 'Malawi',
  MY: 'Malaysia',
  MV: 'Maldives',
  ML: 'Mali',
  MT: 'Malta',
  MH: 'Marshall Islands',
  MQ: 'Martinique',
  MR: 'Mauritania',
  MU: 'Mauritius',
  MX: 'Mexico',
  FM: 'Micronesia, Federated States of',
  MD: 'Republic of Moldova',
  MC: 'Monaco',
  MN: 'Mongolia',
  ME: 'Montenegro',
  MS: 'Montserrat',
  MA: 'Morocco',
  MZ: 'Mozambique',
  MM: 'Myanmar',
  NA: 'Namibia',
  NR: 'Nauru',
  NP: 'Nepal',
  NL: 'Netherlands',
  NZ: 'New Zealand',
  NI: 'Nicaragua',
  NE: 'Niger',
  NG: 'Nigeria',
  NU: 'Niue',
  NF: 'Norfolk Island',
  MP: 'Northern Mariana Islands',
  NO: 'Norway',
  OM: 'Oman',
  PK: 'Pakistan',
  PW: 'Palau',
  PS: 'Palestinian Territory',
  PA: 'Panama',
  PG: 'Papua New Guinea',
  PY: 'Paraguay',
  PE: 'Peru',
  PH: 'Philippines',
  PN: 'Pitcairn',
  PL: 'Poland',
  PT: 'Portugal',
  PR: 'Puerto Rico',
  QA: 'Qatar',
  RO: 'Romania',
  RU: 'Russian',
  RW: 'Rwanda',
  KN: 'Saint Kitts and Nevis',
  WS: 'Samoa',
  SM: 'San Marino',
  ST: 'Sao Tome and Principe',
  SA: 'Saudi Arabia',
  SN: 'Senegal',
  RS: 'Serbia',
  SC: 'Seychelles',
  SL: 'Sierra Leone',
  SG: 'Singapore',
  SX: 'Sint Maarten',
  SK: 'Slovakia',
  SI: 'Slovenia',
  SB: 'Solomon Islands',
  SO: 'Somalia',
  ZA: 'South Africa',
  SS: 'South Sudan',
  ES: 'Spain',
  LK: 'Sri Lanka',
  SD: 'Sudan',
  SR: 'Suriname',
  SZ: 'Swaziland',
  SE: 'Sweden',
  CH: 'Switzerland',
  SY: 'Syria',
  TW: 'Taiwan, Province of China',
  TJ: 'Tajikistan',
  TZ: 'Tanzania',
  TH: 'Thailand',
  TG: 'Togo',
  TK: 'Tokelau',
  TO: 'Tonga',
  TT: 'Trinidad and Tobago',
  TN: 'Tunisia',
  TR: 'Turkey',
  TM: 'Turkmenistan',
  TC: 'Turks and Caicos Islands',
  TV: 'Tuvalu',
  UG: 'Uganda',
  UA: 'Ukraine',
  AE: 'United Arab Emirates',
  GB: 'United Kingdom',
  US: 'United States',
  UY: 'Uruguay',
  UZ: 'Uzbekistan',
  VU: 'Vanuatu',
  VE: 'Venezuela, Bolivarian Republic of',
  VN: 'Viet Nam',
  VI: 'Virgin Islands',
  YE: 'Yemen',
  ZM: 'Zambia',
  ZW: 'Zimbabwe',
};

const arrayCountries = Object.keys(countries).map((key) => ({
  label: countries[key],
  code: key,
}));

function getFlagUrl(name) {
  // See https://vite.dev/guide/assets.html#new-url-url-import-meta-url
  return new URL(`/src/img/flags/${name}.svg`, import.meta.url).href;
}

const countryOption = (props) => {
  const { children, isFocused, innerRef, innerProps, data } = props;
  return (
    <div
      ref={innerRef}
      {...innerProps}
      style={{
        backgroundColor: isFocused ? '#DEEBFF' : 'transparent',
        color: 'inherit',
        cursor: 'default',
        display: 'flex',
        fontSize: 'inherit',
        padding: '8px 12px',
        width: '100%',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      <img
        style={{
          width: '1.3em',
          height: '1.3em',
          position: 'relative',
          top: '0.3em',
        }}
        src={getFlagUrl(data.code.toLowerCase())}
        alt={children}
      />
      <span style={{ marginLeft: '1em' }}>{children}</span>
    </div>
  );
};

countryOption.propTypes = {
  children: PropTypes.node,
  isDisabled: PropTypes.bool,
  isFocused: PropTypes.bool,
  isSelected: PropTypes.bool,
  innerRef: PropTypes.any,
  innerProps: PropTypes.object,
  data: PropTypes.object,
};

class CountrySelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showCountryOptions: { value: '', show: false },
    };
  }

  handleCountryInputChange = (newValue) => {
    if (newValue.length > 1) {
      this.setState({
        showCountryOptions: { value: newValue, show: true },
      });
    } else {
      this.setState({
        showCountryOptions: { value: '', show: false },
      });
    }
  };

  render() {
    const code = this.props.value;
    return (
      <Select
        isDisabled={this.props.isDisabled}
        value={{ code, label: countries[code] }}
        options={
          this.state.showCountryOptions.show
            ? arrayCountries.filter((country) =>
                country.label
                  .toLowerCase()
                  .includes(this.state.showCountryOptions.value)
              )
            : arrayCountries
        }
        isSearchable
        name="country"
        components={{ Option: countryOption }}
        onChange={this.props.onChange}
        onInputChange={this.handleCountryInputChange}
        styles={{
          container: (base) => ({
            ...base,
            marginTop: '0.2rem',
          }),
          option: (base) => ({ ...base, color: 'black' }),
          control: (base) => ({
            ...base,
            minHeight: '41px',
            bottom: '2px',
          }),
          menu: (base) => ({ ...base, color: 'black' }),
        }}
      />
    );
  }
}

CountrySelect.propTypes = {
  value: PropTypes.string,
  isDisabled: PropTypes.bool,
  onChange: PropTypes.func,
};

export default withTranslation('translations')(CountrySelect); // TODO: translate country names

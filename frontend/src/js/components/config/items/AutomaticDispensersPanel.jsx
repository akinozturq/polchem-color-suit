import React, { useMemo, useState } from 'react';
import {
  Badge as RBadge,
  Card,
  CardBody,
  CardHeader,
  Col as RSCol,
  Collapse,
  CustomInput,
  FormGroup,
  Input as RSInput,
  Label,
  Row as RSRow,
} from 'reactstrap';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  selectors as machineSelectors,
  default as machineActions,
} from '../../../redux/reducers/Machine.js';
import { useDispatch, useSelector } from 'react-redux';
import { rightToLeft } from '../../../mylib/Utils';

// ---------- UI Primitives (reactstrap v8.10.1) ----------

const Input = ({
  placeholder,
  type = 'text',
  className = '',
  onChange,
  value,
  ...props
}) => {
  const [ivalue, setiValue] = React.useState(value ?? '');

  const handleChange = (e) => {
    setiValue(e.target.value);
  };

  return (
    <RSInput
      type={type}
      placeholder={placeholder}
      className={className}
      value={onChange ? value : ivalue}
      onChange={onChange ? onChange : handleChange}
      {...props}
    />
  );
};

Input.propTypes = {
  placeholder: PropTypes.string,
  type: PropTypes.string,
  className: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.string,
};

const Select = ({ options = [], value, onChange, disabled }) => (
  <RSInput type="select" value={value} onChange={onChange} disabled={disabled}>
    {options.map((o) => (
      <option key={(o && o.value) ?? o} value={(o && o.value) ?? o}>
        {(o && o.label) ?? o}
      </option>
    ))}
  </RSInput>
);

Select.propTypes = {
  options: PropTypes.array,
  value: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

const Field = ({ label, helper, children }) => (
  <FormGroup className={'h-100'}>
    {label && (
      <Label className="mb-1">
        <small className="text-muted">{label}</small>
      </Label>
    )}
    {children}
    {helper && <small className="form-text text-muted mt-1">{helper}</small>}
  </FormGroup>
);
Field.propTypes = {
  label: PropTypes.string,
  helper: PropTypes.string,
  children: PropTypes.node,
};

const Switch = ({ checked, onChange, label, disabled }) => {
  const id = useMemo(
    () =>
      `sw_${label?.toString().replace(/\s+/g, '_')}_${Math.random().toString(36).slice(2, 7)}`,
    [label]
  );
  return (
    <div data-denied={disabled}>
      <CustomInput
        disabled={disabled}
        type="switch"
        id={id}
        name={id}
        label={label}
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
};

Switch.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  label: PropTypes.string,
};

const Chevron = ({ open }) => (
  <span
    className="mr-2"
    style={{
      display: 'inline-block',
      transform: `rotate(${open ? 90 : 0}deg)`,
      transition: 'transform .2s',
    }}
    aria-hidden
  >
    ▶
  </span>
);
Chevron.propTypes = {
  open: PropTypes.bool,
};

const Disclosure = ({ title, icon, defaultOpen = true, children, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  const direction = rightToLeft() ? 'rtl' : 'ltr';
  return (
    <Card className={'m-2 pb-2'} dir={direction}>
      <CardHeader className="p-0" dir={direction}>
        <div
          color="secondary"
          className="btn-block text-left d-flex align-items-center p-1 mb-1 cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <Chevron open={open} />
          {icon}
          <span className="mr-2">{title}</span>
          {badge}
        </div>
      </CardHeader>
      <Collapse isOpen={open}>
        <CardBody dir={direction}>{children}</CardBody>
      </Collapse>
    </Card>
  );
};

Disclosure.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.string,
  defaultOpen: PropTypes.bool,
  children: PropTypes.node,
  badge: PropTypes.element,
};

// Shared row layout

const Row = ({
  t,
  name,
  checked,
  onChange,
  note,
  children,
  badge,
  disabled,
}) => (
  <div className="py-3 border-bottom">
    <RSRow className="align-items-start">
      <RSCol md={4} className="p-0 align-items-center mb-2 mb-md-0">
        <div style={{ display: 'inline-block' }}>
          <span className="mr-2">{name}</span>
          {badge && (
            <RBadge color={'success'} className={'machine_config-badge'}>
              {badge}
            </RBadge>
          )}
        </div>
        {note && (
          <span className="text-muted small d-inline-flex align-items-center mt-1">
            <span className="mr-1" aria-hidden>
              ⚠️
            </span>
            {note}
          </span>
        )}
      </RSCol>
      <RSCol md={3} className="d-flex align-items-center">
        <Switch
          disabled={disabled}
          checked={checked}
          onChange={onChange}
          label={checked ? t('Enabled') : t('Disabled')}
        />
      </RSCol>
      <RSCol md={5} className="mt-2 mt-md-0">
        {children}
      </RSCol>
    </RSRow>
  </div>
);

Row.propTypes = {
  t: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  note: PropTypes.string,
  children: PropTypes.node,
  badge: PropTypes.string,
  disabled: PropTypes.bool,
};

// Producer card; primary optional
const ProducerCard = ({ producer, config, update_config, disabled }) => {
  const { t } = useTranslation();
  const direction = rightToLeft() ? 'rtl' : 'ltr';
  const add = producer.additional ?? [];

  return (
    <Card
      className="shadow-sm p-0 bordered"
      dir={direction}
    >
      <CardHeader
        className="d-flex align-items-center justify-content-between"
        dir={direction}
      >
        <h3 className="h5 mb-0">{producer.name}</h3>
      </CardHeader>
      <CardBody dir={direction}>
        {/* Primary (optional) */}
        {producer.primary && (
          <div className={'ml-2'}>
            <Row
              disabled={disabled}
              name={producer.primary}
              checked={config[`${producer.config_name}_enabled`] ?? false}
              onChange={(v) =>
                update_config(`${producer.config_name}_enabled`, v)
              }
              t={t}
              badge={
                add.length > 0 ? t('badge.recommended', 'Recommended') : null
              }
            >
              {producer.primaryFields}
            </Row>
          </div>
        )}

        {/* Additional */}
        {producer.primary && add.length > 0 && (
          <Disclosure
            title={t('lbl.alternative_connections', 'Alternative connections')}
            defaultOpen={
              add.find((a) => config[`${a.config_name}_enabled`] === true) ??
              false
            }
          >
            <div>
              {add.map((a) => (
                <Row
                  disabled={disabled}
                  key={a.name}
                  name={a.name}
                  checked={config[`${a.config_name}_enabled`] ?? false}
                  onChange={(v) => update_config(`${a.config_name}_enabled`, v)}
                  note={
                    a.unsupported
                      ? t(
                          'note.may_not_be_producer_supported',
                          'May not be producer-supported'
                        )
                      : undefined
                  }
                  t={t}
                >
                  {a.children}
                </Row>
              ))}
            </div>
            <p className="small text-muted mt-3">
              {t(
                'note.additional_connections',
                'Additional connections are available as alternatives to the primary connection. Some may be legacy protocols and might not be supported by the producer.'
              )}
            </p>
          </Disclosure>
        )}
        {!producer.primary && (
          <div className={'ml-2 mr-2'}>
            {add.map((a) => (
              <Row
                disabled={disabled}
                key={a.name}
                name={a.name}
                checked={config[`${a.config_name}_enabled`] ?? false}
                onChange={(v) => update_config(`${a.config_name}_enabled`, v)}
                note={
                  a.unsupported
                    ? t(
                        'note.may_not_be_producer_supported',
                        'May not be producer-supported'
                      )
                    : undefined
                }
                t={t}
              >
                {a.children}
              </Row>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

ProducerCard.propTypes = {
  producer: PropTypes.shape({
    name: PropTypes.string,
    primary: PropTypes.string,
    config_name: PropTypes.string,
    secondary: PropTypes.string,
    primaryFields: PropTypes.object,
    additional: PropTypes.array,
  }),
  config: PropTypes.shape({}),
  update_config: PropTypes.func,
  disabled: PropTypes.bool,
};

export default function AutomaticDispensersPanel({ access_denied }) {
  const { t } = useTranslation();
  const direction = rightToLeft() ? 'rtl' : 'ltr';

  const driver_config = useSelector(machineSelectors.driver_config);

  const [alphaIp, setAlphaIp] = React.useState(
    driver_config?.alfa_dispensers.length > 0
      ? driver_config?.alfa_dispensers[0]
      : ''
  );
  const dispatch = useDispatch();

  const ipRegex =
    /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

  const update_config = (key, value) => {
    dispatch(
      machineActions.setDriverConfig({ ...driver_config, [key]: value })
    );
  };

  // ------- Data model including file/port fields from your screenshot -------
  const data = [
    // 1) Pearls BEFORE Corob
    {
      name: 'Pearls',
      primary: 'Pearls',
      config_name: 'pearls',
      primaryFields: (
        <RSRow form>
          <RSCol xs={12}>
            <Field label={t('lbl.port', 'Port')}>
              <Select
                disabled={access_denied}
                value={driver_config?.pearls_port}
                options={[''].concat(driver_config?.ports)}
                onChange={(e) => {
                  const port = driver_config?.ports.find(
                    (p) => p === e.target.value
                  );
                  update_config('pearls_port', port);
                }}
              />
            </Field>
          </RSCol>
        </RSRow>
      ),
      additional: [],
    },

    // 2) Corob (unchanged)
    {
      name: 'Corob',
      primary: 'Next-Driver',
      config_name: 'next_driver',

      additional: [
        { name: 'Corob legacy', unsupported: true, config_name: 'd300' },
        { name: 'Slave', unsupported: false, config_name: 'slave' },
        { name: 'E4G', unsupported: false, config_name: 'e4g' },
        { name: 'E5G', unsupported: false, config_name: 'e5g' },
      ],
    },

    // 3) Fast & Fluid
    {
      name: 'Fast & Fluid',
      primary: 'UIDD',
      config_name: 'uidd',
      primaryFields: (
        <RSRow form>
          <RSCol xs={12}>
            <Field label={t('lbl.host', 'Host')}>
              <Input
                value={driver_config?.uidd_host}
                disabled={access_denied}
                onBlur={(e) => update_config('uidd_host', e.target.value)}
              />
            </Field>
          </RSCol>
          <RSCol xs={12}>
            <Field label={t('lbl.port', 'Port')}>
              <Input
                disabled={access_denied}
                value={driver_config?.uidd_port ?? ''}
                onBlur={(e) => update_config('uidd_port', e.target.value)}
              />
            </Field>
          </RSCol>
          <RSCol xs={12}>
            <Field label={t('lbl.protocol', 'Protocol')}>
              <Select
                disabled={access_denied}
                value={driver_config?.uidd_protocol ?? 'https'}
                options={['http', 'https']}
                onChange={(e) => update_config('uidd_protocol', e.target.value)}
              />
            </Field>
          </RSCol>
          <RSCol xs={12}>
            <Field label={t('lbl.username', 'Username')}>
              <Input
                disabled={access_denied}
                value={driver_config?.uidd_username ?? ''}
                onBlur={(e) => update_config('uidd_username', e.target.value)}
              />
            </Field>
          </RSCol>
          <RSCol xs={12}>
            <Field label={t('lbl.password', 'Password')}>
              <Input
                type="password"
                disabled={access_denied}
                value={driver_config?.uidd_password ?? ''}
                onBlur={(e) => update_config('uidd_password', e.target.value)}
              />
            </Field>
          </RSCol>
        </RSRow>
      ),
      additional: [
        {
          name: 'IDD',
          config_name: 'idd',
          children: (
            <>
              <Field label={t('lbl.fileDirectory', 'File directory')}>
                <Input
                  disabled={access_denied}
                  value={driver_config?.idd_root ?? ''}
                  onBlur={(e) => update_config('idd_root', e.target.value)}
                />
              </Field>
              <CustomInput
                disabled={access_denied}
                type="checkbox"
                id="idd-grav"
                label={t(
                  'fn.enableGravimetricDispensing',
                  'Enable Gravimetric dispensing'
                )}
                checked={driver_config?.idd_gravimetricDispensing ?? false}
                onChange={(e) => {
                  update_config('idd_gravimetricDispensing', e.target.checked);
                }}
              />
            </>
          ),
        },
        {
          name: 'IDD US',
          config_name: 'idd_us',
          children: (
            <Field label={t('lbl.file', 'File')}>
              <Input
                disabled={access_denied}
                value={driver_config?.idd_us_path ?? ''}
                onBlur={(e) => update_config('idd_us_path', e.target.value)}
              />
            </Field>
          ),
        },
      ],
    },

    // 4) Santint AFTER Fast & Fluid
    {
      name: 'Santint',
      primary: 'Santint',
      config_name: 'santint',
      primaryFields: (
        <RSRow form>
          <RSCol xs={12}>
            <Field label={t('lbl.deviceIdColon', 'Device ID:')}>
              <Input value={driver_config?.santint_deviceid} disabled={true} />
            </Field>
          </RSCol>
          <RSCol xs={12}>
            <Field label={t('lbl.registrationCodeColon', 'Registration Code:')}>
              <Input
                disabled={access_denied}
                value={driver_config?.santint_registercode ?? ''}
                onBlur={(e) =>
                  update_config('santint_registercode', e.target.value)
                }
              />
            </Field>
          </RSCol>
        </RSRow>
      ),
      additional: [],
    },

    // 5) Others (without Pearls & Santint)
    {
      name: t('lbl.Others', 'Others'),
      additional: [
        { name: 'HERO', config_name: 'hero' },
        {
          name: 'Italtinto',
          config_name: 'italtinto',
          children: (
            <Field label={t('lbl.fileDirectory', 'File directory')}>
              <Input
                disabled={access_denied}
                value={driver_config?.italtinto_root ?? ''}
                onBlur={(e) => update_config('italtinto_root', e.target.value)}
              />
            </Field>
          ),
        },
        {
          name: 'LLD',
          config_name: 'lld',
          children: (
            <Field label={t('lbl.hld_root_directory', 'HLD root directory')}>
              <Input
                disabled={access_denied}
                value={driver_config?.lld_root ?? ''}
                onBlur={(e) => update_config('lld_root', e.target.value)}
              />
            </Field>
          ),
        },
        {
          name: 'Alfa',
          config_name: 'alfa',
          children: (
            <Field label={t('lbl.ip_address', 'IP address')}>
              <Input
                disabled={access_denied}
                placeholder={'xxx.xxx.xxx.xxx'}
                value={alphaIp}
                onChange={(e) => {
                  const ip = e.target.value;
                  setAlphaIp(ip);
                }}
                onBlur={(e) => {
                  const ip = e.target.value;
                  update_config('alfa_dispensers', [ip]);
                }}
                invalid={!ipRegex.test(alphaIp)}
              />
            </Field>
          ),
        },
        { name: 'UDCP', config_name: 'udcp' },
      ],
    },
  ];

  return (
    <div
      className={'scroll'}
      style={{ height: 'calc((100vh - 102px) - 6rem)' }}
      dir={direction}
    >
      <h2 className="clickable-text directly-over-bg mt-8">
        {t('lbl.automaticDispensers', 'Automatic Dispensers')}
      </h2>
      {data.map((producer) => (
        <div key={producer.name} className="m-1 mb-3">
          <ProducerCard
            producer={producer}
            config={driver_config}
            update_config={update_config}
            disabled={access_denied}
          />
        </div>
      ))}
    </div>
  );
}

AutomaticDispensersPanel.propTypes = {
  access_denied: PropTypes.bool.isRequired,
};

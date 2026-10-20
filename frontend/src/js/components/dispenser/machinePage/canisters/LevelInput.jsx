import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Row,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from 'reactstrap';
import {
  getFirstElementBorderRadius,
  getLastElementBorderRadius,
} from '../../../../mylib/Utils';

const propTypes = {
  label: PropTypes.string,
  canister: PropTypes.object,
  prop: PropTypes.string,
  levelFormatter: PropTypes.object,
  readOnly: PropTypes.bool,
  onBlur: PropTypes.func,
  borderBottom: PropTypes.bool,
  dataTestid: PropTypes.string,
};

export default function LevelInput({
  label,
  canister,
  prop,
  levelFormatter,
  readOnly,
  onBlur,
  borderBottom,
  dataTestid,
}) {
  const unitName = levelFormatter?.getUnitName();
  const formatValue = () => {
    let value = canister?.[prop] ?? '';
    if (levelFormatter && value !== '')
      value = levelFormatter.format({
        volume: value,
        specifigravity: canister.specificgravity,
      });
    return value;
  };
  const [value, setValue] = useState(formatValue());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setValue(formatValue()), [canister, unitName]);

  const rowStyle = {
    padding: borderBottom ? '6px 6px 12px 6px' : '0 6px',
    borderBottom: borderBottom ? '.125rem dashed  #e7eff5' : 'none',
  };

  const unformat = (value) =>
    levelFormatter ? levelFormatter.unformat(value) : value;
  const handleBlur = (e) => onBlur?.(unformat(e.target.value));

  return (
    <Row style={rowStyle}>
      <h5 className="canisterProperties">{label}</h5>
      <InputGroup style={{ padding: '0' }} size="sm">
        <Input
          data-testid={dataTestid}
          type="text"
          step="1"
          readOnly={readOnly || !canister}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleBlur(e);
          }}
          style={levelFormatter && getFirstElementBorderRadius()}
        />
        {levelFormatter && (
          <InputGroupAddon addonType="append">
            <InputGroupText style={getLastElementBorderRadius()}>
              {unitName}
            </InputGroupText>
          </InputGroupAddon>
        )}
      </InputGroup>
    </Row>
  );
}
LevelInput.propTypes = propTypes;

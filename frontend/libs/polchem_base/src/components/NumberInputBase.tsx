import { isNumber } from '../common/ObjectUtils';
import React, {
  ChangeEvent,
  FocusEvent,
  FocusEventHandler,
  KeyboardEvent,
  useEffect,
  useState,
} from 'react';

import { InputNumberFormatter } from '../common/formatters/NumberFormatter';

export interface RenderInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export interface NumberInputBaseProps {
  renderInput: (inputProps: RenderInputProps) => JSX.Element;
  value: number | null;
  emptyIsNull?: boolean;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  onChange?: (value: number | null) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  updateOnBlur?: (value: number | null) => void;
}

/**
 * A headless component that implements the logic for a number input,
 * and accepts a render function to render the actual input element.
 */
export const NumberInputBase = ({
  renderInput,
  value,
  emptyIsNull,
  min,
  max,
  step = 1,
  onChange,
  decimals = 6,
  onKeyDown = undefined,
  onBlur = undefined,
  updateOnBlur = undefined,
}: NumberInputBaseProps): JSX.Element => {
  if (!isNumber(value)) {
    value = null;
  }
  const allowNegative = (min ?? -1) < 0;
  const formatter = new InputNumberFormatter(decimals, allowNegative);

  const limitValue = (numericValue: number): number => {
    let limitedValue = numericValue;
    if (min != null) limitedValue = Math.max(limitedValue, min);
    if (max != null) limitedValue = Math.min(limitedValue, max);
    return limitedValue;
  };

  const parseValue = (strValue: string): number | null =>
    strValue
      ? limitValue(formatter.parse(strValue))
      : emptyIsNull
        ? null
        : limitValue(0);
  const formatValue = (val: number | null): string =>
    (emptyIsNull ? val != null : val) ? formatter.format(val) : '';

  const [strValue, setStrValue] = useState<string>(formatValue(value));
  // Update strValue when value changes to a definitely different value
  useEffect(
    () => {
      if (value !== parseValue(strValue)) {
        setStrValue(formatValue(value));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value]
  );

  const addValue = (increment: number): void => {
    const currentValue = parseValue(strValue) || 0;
    const newValue = limitValue(currentValue + increment);
    if (newValue !== currentValue) {
      setStrValue(formatter.format(newValue));
      onChange && onChange(newValue);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    try {
      if (formatter.validate(newValue)) {
        setStrValue(newValue);
        const parsed = parseValue(newValue);
        if (parsed !== value) {
          onChange && onChange(parsed);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        addValue(step);
        break;
      case 'ArrowDown':
        addValue(-step);
        break;
      case 'Enter':
        updateOnBlur && updateOnBlur(parseValue(strValue));
        break;
    }
    onKeyDown?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>): void => {
    setStrValue(formatValue(value));
    onBlur?.(e);
    if (updateOnBlur) {
      const newValue = e.target.value;
      try {
        if (formatter.validate(newValue)) {
          const parsed = parseValue(newValue);
          if (parsed !== value) {
            updateOnBlur && updateOnBlur(parsed);
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
  };

  return (
    <>
      {renderInput({
        value: strValue,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        onBlur: handleBlur,
        placeholder: emptyIsNull || (min || 0) > 0 ? undefined : '0',
      })}
    </>
  );
};

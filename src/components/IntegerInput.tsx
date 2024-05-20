import * as React from 'react';
import { NumberInput } from '@patternfly/react-core';

type Props = {
  setValue: (number) => void;
  value: number;
};

const IntegerInput: React.FC<Props> = ({ setValue, value }) => {
  const onChange = React.useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const newValue = (e.target as HTMLInputElement).value;
      setValue(newValue === '' ? '' : Number(newValue));
    },
    [setValue],
  );

  const onMinus = React.useCallback(() => {
    setValue(value - 1);
  }, [setValue, value]);

  const onPlus = React.useCallback(() => {
    setValue(value + 1);
  }, [setValue, value]);

  return (
    <NumberInput
      inputAriaLabel="number input"
      max={999}
      min={1}
      minusBtnAriaLabel="minus"
      onChange={onChange}
      onMinus={onMinus}
      onPlus={onPlus}
      plusBtnAriaLabel="plus"
      value={value}
      widthChars={3}
    />
  );
};

export default IntegerInput;

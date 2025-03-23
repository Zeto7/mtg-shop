import React from 'react';
import { AddressSuggestions } from 'react-dadata';
import 'react-dadata/dist/react-dadata.css';

interface Props {
  onChange?: (value?: string) => void;
}

export const AdressInput: React.FC<Props> = ({ onChange }) => {
  return <AddressSuggestions token="3fd794272f4946a147c3d2ae4a6f40cb3e3fef6c" onChange={(data) => onChange?.(data?.value)} />;
};

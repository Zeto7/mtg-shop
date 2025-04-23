import React from 'react';
import { AddressSuggestions, DaDataAddressSuggestion } from 'react-dadata';
import 'react-dadata/dist/react-dadata.css';

interface Props {
  onChange?: (suggestion?: DaDataAddressSuggestion) => void;
}

const belarusLocationFilter = [{ "country_iso_code": "BY" }];

export const AdressInput: React.FC<Props> = ({ onChange }) => {
  const handleSuggestionChange = (suggestion?: DaDataAddressSuggestion) => {
    onChange?.(suggestion);
  };

  return (
    <AddressSuggestions
      token="3fd794272f4946a147c3d2ae4a6f40cb3e3fef6c"
      filterLocations={belarusLocationFilter}
      filterRestrictValue={true}
      onChange={handleSuggestionChange}
    />
  );
};
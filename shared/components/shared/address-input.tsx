import React from 'react';
import { AddressSuggestions, DaDataAddressSuggestion } from 'react-dadata';
import 'react-dadata/dist/react-dadata.css';

interface Props {
  onChange?: (suggestion?: DaDataAddressSuggestion) => void;
  query?: string;
  placeholder?: string;
  "aria-invalid"?: "true" | "false";
}

const belarusLocationFilter = [{ "country_iso_code": "BY" }];

export const AdressInput: React.FC<Props> = React.memo(({
    onChange,
    query,
    placeholder = "Введите адрес доставки",
    "aria-invalid": ariaInvalid
}) => {

  return (
    <AddressSuggestions
      token="3fd794272f4946a147c3d2ae4a6f40cb3e3fef6c"
      filterLocations={belarusLocationFilter}
      filterRestrictValue={true}
      onChange={onChange}
      query={query}
      placeholder={placeholder}
      inputProps={{
          "aria-invalid": ariaInvalid
      }}
    />
  );
});
AdressInput.displayName = 'AdressInput';
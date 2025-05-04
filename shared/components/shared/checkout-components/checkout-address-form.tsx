import React from "react";
import { WhiteBlock } from "../white-block";
import { FormTextarea } from "../form-components/form-textarea";
import { AdressInput } from "../address-input";
import { Controller, useFormContext } from "react-hook-form";
import { ErrorText } from "../error-text";
import { DaDataAddressSuggestion } from "react-dadata";

interface Props {
    className?: string;
}

export const CheckoutAddressForm: React.FC<Props> = ({ className }) => {
    const {control} = useFormContext();

    const handleAddressChange = (
        suggestion: DaDataAddressSuggestion | undefined,
        reactHookFormOnChange: (...event: any[]) => void
    ) => {
        const addressString = suggestion?.value || '';
        reactHookFormOnChange(addressString);
    };

    return (
        <WhiteBlock title="3. Адрес доставки" className={className}>
            <div className="flex flex-col gap-5">
                <Controller
                    control={control}
                    name="address"
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col">
                            <AdressInput
                                onChange={(suggestion) => handleAddressChange(suggestion, field.onChange)}
                                query={field.value || ''}
                                aria-invalid={fieldState.invalid ? "true" : "false"}
                            />
                            {fieldState.error?.message && <ErrorText text={fieldState.error.message} className="mt-1"/>}
                        </div>
                    )}
                />
                <FormTextarea name="comment" rows={5} className="text-base" placeholder="Комментарий к заказу"/>
            </div>
        </WhiteBlock>
    );
};
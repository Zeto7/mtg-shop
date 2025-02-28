import React from "react";
import { useSearchParams } from "next/navigation";
import { useSet } from "react-use";

interface PriceProps {
    priceFrom?: number;
    priceTo?: number;
}


interface QueryFilters extends PriceProps{
    kitTypes: string;
    amount: string;
    additionals: string;
}

export interface Filters {
    amount: Set<string>;
    kitTypes: Set<string>;
    selectedAdditionals: Set<string>;
    prices: PriceProps
}

interface ReturnProps extends Filters {
    setPrices: (name: keyof PriceProps, value: number) => void;
    setKitTypes: (value: string) => void;
    setAmount: (value: string) => void;
    setSelectedAdditionals: (value: string) => void
}

export const useFilters = (): ReturnProps => {
    const searchParams = useSearchParams() as unknown as Map<keyof QueryFilters, string>;

    // Фильтр коллекции
    const [selectedAdditionals, {toggle: toggleAdditionals}] = useSet(new Set<string>(searchParams.get('additionals')?.split(',')));

    // Фильтр количества
    const [amount, {toggle: toggleAmount}] = useSet(new Set<string>(searchParams.has('amount') ? searchParams.get('amount')?.split(',') : []));

    // Фильтр типа набора (популярное, новинки)
    const [kitTypes, {toggle: toggleKitTypes}] = useSet(new Set<string>(searchParams.has('kitTypes') ? searchParams.get('kitTypes')?.split(',') : []));

    // Фильтр цены
    const [prices, setPrices] = React.useState<PriceProps>({
        priceFrom: Number(searchParams.get('priceFrom')) || undefined,
        priceTo: Number(searchParams.get('priceTo')) || undefined,
    });

    const updatePrice = (name: keyof PriceProps, value: number) => {
        setPrices((prev) => ({
            ...prev,
            [name] : value
        }));
    };

    return {
        amount, 
        kitTypes, 
        selectedAdditionals, 
        prices, 
        setPrices: updatePrice, 
        setKitTypes: toggleKitTypes, 
        setAmount: toggleAmount, 
        setSelectedAdditionals: toggleAdditionals
    };
}
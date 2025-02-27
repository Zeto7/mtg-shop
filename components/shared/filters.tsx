'use client'

import React from "react"
import { Title } from "./title";
import { FilterCheckbox } from "./filter-cehckbox";
import { Input } from "../ui/input";
import { RangeSlider } from "./range-slider";
import { CheckboxFiltersGroup } from "./checkbox-filter-group";
import { useFilterAdditionals } from "@/hooks/useFilterAdditionals";
import { useSet } from "react-use";
import qs from "qs";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
    classname?: string;
}

interface PriceProps {
    priceFrom?: number;
    priceTo?: number;
}

interface QueryFilters extends PriceProps{
    kitTypes: string;
    amount: string;
    additionals: string;
}

export const Filters: React.FC<Props> = ({ classname }) => {
    const searchParams = useSearchParams() as unknown as Map<keyof QueryFilters, string>;
    const router = useRouter();
    const { additionals, loading, onAddId, selectedAdditionals } = useFilterAdditionals();

    const [amount, {toggle: toggleAmount}] = useSet(new Set<string>(searchParams.has('amount') ? searchParams.get('amount')?.split(',') : []));
    const [kitTypes, {toggle: toggleKitTypes}] = useSet(new Set<string>(searchParams.has('kitTypes') ? searchParams.get('kitTypes')?.split(',') : []));
    const items = additionals.map((item) => ({value: String(item.id), text: item.name}))


    const [prices, setPrice] = React.useState<PriceProps>({
        priceFrom: Number(searchParams.get('priceFrom')) || undefined,
        priceTo: Number(searchParams.get('priceTo')) || undefined,
    });

    const updatePrice = (name: keyof PriceProps, value: number) => {
        setPrice({
            ...prices,
            [name] : value
        })
    }

    React.useEffect(() => {
        const filters = {
            ...prices,
            kitTypes: Array.from(kitTypes),
            amount: Array.from(amount),
            additionals: Array.from(selectedAdditionals),
        };
        
        const query = qs.stringify(filters, { 
            arrayFormat: 'comma',
        });

        router.push(`?${query}`, {scroll: false});
    }, [prices, kitTypes, amount, selectedAdditionals, router])

    return (
        <div className={classname}>
            <Title text="Фильтрация" size="sm" className="mb-5 font-bold"/>

            <CheckboxFiltersGroup
                name="kitTypes"
                className="mb-5"
                title=""
                onClickCheckbox={toggleKitTypes}
                selected={kitTypes}
                items={[
                    { text: 'Популярное', value: '1' },
                    { text: 'Новое', value: '2' },
                ]}
            />

            <CheckboxFiltersGroup
                name="amount"
                className="mb-5"
                title="Количество"
                onClickCheckbox={toggleAmount}
                selected={amount}
                items={[
                    { text: '1x', value: '1' },
                    { text: '2x', value: '2' },
                    { text: '3x', value: '3' },
                ]}
            />

            <div className="mt-5 border-y border-y-neutral-100 py-6 pb-7">
                <p className="font-bold mt-3">Цена от и до:</p>
                <div className="flex items-center gap-2 mt-3 mb-3">
                    <Input type="number" placeholder="0" min={0} max={1000} value={String(prices.priceFrom)} onChange={(e) => updatePrice('priceFrom', Number(e.target.value))}/>
                    <Input type="number" min={10} max={1000} defaultValue={0} placeholder="1000" value={String(prices.priceTo)} onChange={(e) => updatePrice('priceTo', Number(e.target.value))}/>
                </div>

                <RangeSlider min={0} max={1000} step={1} value={[prices.priceFrom || 0, prices.priceTo || 1000]} onValueChange={([priceFrom, priceTo]) => setPrice({priceFrom, priceTo})}/>
            </div>

            <CheckboxFiltersGroup
                title="Категории"
                name="additionals"
                className="mt-5"
                limit={5}
                defaultItems={items.slice(0,6)}
                items={items}
                loading={loading}
                onClickCheckbox={onAddId}
                selected={selectedAdditionals}
            />
        </div>
    );
};
'use client'

import React from "react"
import { Title } from "./title";
import { Input } from "../ui/input";
import { RangeSlider } from "./range-slider";
import { CheckboxFiltersGroup } from "./checkbox-filter-group";
import { useQueryFilters, useFilters, useAdditionals } from "@/shared/hooks";

interface Props {
    classname?: string;
}


export const Filters: React.FC<Props> = ({ classname }) => {
    const {additionals, loading} = useAdditionals();
    const filters = useFilters();

    useQueryFilters(filters);

    const items = additionals.map((item) => ({value: String(item.id), text: item.name}))

    const updatePrices = (prices: number[]) => {
        filters.setPrices('priceFrom', prices[0]);
        filters.setPrices('priceTo', prices[1]);
    }

    return (
        <div className={classname}>
            <Title text="Фильтрация" size="sm" className="mb-5 font-bold"/>

            <div className="mt-5 border-y border-y-neutral-100 py-6 pb-7">
                <p className="font-bold mt-3">Цена от и до:</p>
                <div className="flex items-center gap-2 mt-3 mb-3">
                    <Input type="number" placeholder="0" min={0} max={1000} value={String(filters.prices.priceFrom)} onChange={(e) => filters.setPrices('priceFrom', Number(e.target.value))}/>
                    <Input type="number" min={10} max={1000} placeholder="1000" value={String(filters.prices.priceTo)} onChange={(e) => filters.setPrices('priceTo', Number(e.target.value))}/>
                </div>

                <RangeSlider min={0} max={1000} step={1} value={[filters.prices.priceFrom || 0, filters.prices.priceTo || 1000]} onValueChange={updatePrices}/>
            </div>

            <CheckboxFiltersGroup
                title="Выпуски:"
                name="additionals"
                className="mt-5"
                limit={5}
                defaultItems={items.slice(0,6)}
                items={items}
                loading={loading}
                onClickCheckbox={filters.setSelectedAdditionals}
                selected={filters.selectedAdditionals}
            />
        </div>
    );
};
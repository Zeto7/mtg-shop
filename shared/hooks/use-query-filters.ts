import React from "react";
import { Filters } from "./use-filters";
import qs from "qs";
import { useRouter } from "next/navigation";

export const useQueryFilters = (filters: Filters) => {
    const router = useRouter();

    React.useEffect(() => {
        
        const params = {
            ...filters.prices,
            kitTypes: Array.from(filters.kitTypes),
            amount: Array.from(filters.amount),
            additionals: Array.from(filters.selectedAdditionals),
        };
            
        const query = qs.stringify(params, { arrayFormat: 'comma'});
    
        router.push(`?${query}`, {scroll: false});
    }, [filters, router]);
}
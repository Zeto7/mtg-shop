import { Api } from "@/services/api-client"
import { Additional } from "@prisma/client"
import React from "react"
import { useSet } from "react-use";

interface ReturnProps {
    additionals: Additional[];
    loading: boolean;
    selectedAdditionals: Set<string>;
    onAddId: (id: string) => void
}

export const useFilterAdditionals = (): ReturnProps => {
    const [additionals, setAdditionals] = React.useState<Additional[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [selectedIds, {toggle}] = useSet(new Set<string>([]));

    React.useEffect(() => {
        async function fetchAdditionals() {
            try{
                setLoading(true);
                const additionals = await Api.additionals.getAll();
                setAdditionals(additionals)
            }
            catch (error){
                console.log(error);
            }
            finally{
                setLoading(false);
            }
        }

        fetchAdditionals();
    }, [])

    return {additionals, loading, onAddId: toggle, selectedAdditionals: selectedIds};
};
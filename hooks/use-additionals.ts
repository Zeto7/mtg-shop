import React from "react";
import { Api } from "@/services/api-client";
import { Additional } from "@prisma/client";

export const useAdditionals = () => {
    const [additionals, setAdditionals] = React.useState<Additional[]>([]);
    const [loading, setLoading] = React.useState(true);

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
    }, []);

    return {additionals, loading};
}

import { Additional } from "@prisma/client";
import { axiosInstance } from "./axios-instance";
import { ApiRoutes } from "./constants";

export const getAll = async (): Promise<Additional[]> => {
    return (await axiosInstance.get<Additional[]>(ApiRoutes.ADDITIONALS)).data;
};
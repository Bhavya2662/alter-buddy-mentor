import { createApi } from "@reduxjs/toolkit/query/react";
import { ApiBaseQuery, baseQueryMentor } from "../../utils";
import { ICategoryProps } from "../../interface";

const CategoryApi = createApi({
  baseQuery: ApiBaseQuery(baseQueryMentor),
  reducerPath: "categoryApi",
  endpoints: ({ query }) => ({
    GetAllCategory: query<{ data: ICategoryProps[] }, void>({
      query: () => `/category`,
    }),
    GetCategoryById: query<{ data: ICategoryProps }, string>({
      query: (id: string) => `/mentor/category/${id}`,
    }),
  }),
});

export const CategoryApiReducer = CategoryApi.reducer;
export const CategoryApiMiddleware = CategoryApi.middleware;
export const {
  useGetAllCategoryQuery,
  useGetCategoryByIdQuery,
  useLazyGetAllCategoryQuery,
  useLazyGetCategoryByIdQuery,
} = CategoryApi;

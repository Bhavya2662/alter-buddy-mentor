import { createApi } from "@reduxjs/toolkit/query/react";
import { ApiBaseQuery, baseQueryMentor } from "../../utils";
import { ITopMentorProps, IMentorProps, ISessionPackage } from "../../interface";
import { getUserToken } from "../../utils/local-store";

const MentorApi = createApi({
  baseQuery: ApiBaseQuery(baseQueryMentor),
  reducerPath: "mentorApi",
  tagTypes: ["mentor"],
  endpoints: ({ mutation, query }) => ({
    GetMentorsList: query<{ data: IMentorProps[] }, void>({
      query: () => `/mentor`,
    }),
    GetTopMentorList: query<{ data: ITopMentorProps[] }, void>({
      query: () => `/top-mentor`,
    }),
    GetMentorByCategory: query<{ data: IMentorProps[] }, string>({
      query: (id: string) => `/get-mentor/category/${id}`,
    }),
    GetMentorBySubCategory: query<{ data: IMentorProps[] }, string>({
      query: (id: string) => `/get-mentor/sub-category/${id}`,
    }),
    GetMentorUsingId: query<{ data: IMentorProps }, string>({
      query: (id: string) => `/mentor/profile/${id}`,
    }),
    BookMentorSlot: mutation<
      { data: any },
      {
        userId: string;
        slotId: string;
        mentorId: string;
        callType: string;
        type: string;
        time: number;
      }
    >({
      query: ({
        slotId,
        userId,
        mentorId,
        callType,
        type,
        time,
      }: {
        userId: string;
        slotId: string;
        mentorId: string;
        callType: string;
        type: string;
        time: number;
      }) => {
        const token = getUserToken();
        return {
          url: "/slot/book",
          method: "PUT",
          body: {
            userId,
            slotId,
            mentorId,
            callType,
            type,
            time,
          },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        };
      },
      invalidatesTags: ["mentor"],
    }),
    GetMentorPackagesById: query<{ data: ISessionPackage[] }, string>({
      query: (mentorId) => `/packages/mentor/${mentorId}`,
      providesTags: ["mentor"],
    }),
  }),
});

export const {
  useGetMentorsListQuery,
  useGetTopMentorListQuery,
  useGetMentorByCategoryQuery,
  useGetMentorUsingIdQuery,
  useLazyGetMentorUsingIdQuery,
  useGetMentorBySubCategoryQuery,
  useLazyGetMentorByCategoryQuery,
  useLazyGetMentorBySubCategoryQuery,
  useBookMentorSlotMutation,
  useGetMentorPackagesByIdQuery,
} = MentorApi;
export const MentorApiReducer = MentorApi.reducer;
export const MentorApiMiddleware = MentorApi.middleware;

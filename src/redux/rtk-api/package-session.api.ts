import { createApi } from "@reduxjs/toolkit/query/react";
import { ApiBaseQuery, baseQueryMentor, baseQueryUser } from "../../utils";
import { ISessionPackage } from "../../interface";
import { getUserToken } from "../../utils/local-store";

const SessionPackageApi = createApi({
  baseQuery: ApiBaseQuery(baseQueryMentor),
  reducerPath: "sessionPackageApi",
  tagTypes: ["sessionPackagesApi", "mentor"],
  endpoints: ({ query, mutation }) => ({
    // Get all session packages for a specific mentor (mentor-side)
    GetMentorSessionPackages: query<{ data: ISessionPackage[] }, string>({
      query: (mentorId) => `/mentor/packages/${mentorId}`,
      providesTags: ["sessionPackagesApi"],
    }),

    // Get all template packages available for purchase (user-side)
    GetAllTemplatePackages: query<{ data: ISessionPackage[] }, { categoryId?: string; type?: string }>({
      query: ({ categoryId, type }) => {
        const params = new URLSearchParams();
        if (categoryId) params.append('categoryId', categoryId);
        if (type) params.append('type', type);
        const token = getUserToken();
        return {
          url: `/session/packages/all${params.toString() ? `?${params.toString()}` : ''}`,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        };
      },
      providesTags: ["sessionPackagesApi"],
    }),

    // Get user packages with optional type filtering (user-side)
    GetUserPackages: query<{ data: ISessionPackage[] }, { userId: string; type?: string }>({
      query: ({ userId, type }) => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        const token = getUserToken();
        return {
          url: `/session/package/${userId}${params.toString() ? `?${params.toString()}` : ''}`,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        };
      },
      providesTags: ["sessionPackagesApi"],
    }),

    // Create a new session package (mentor-side)
    CreateMentorSessionPackage: mutation<{ data: string }, ISessionPackage>({
      query: (payload) => ({
        url: "/session/package",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["sessionPackagesApi", "mentor"],
    }),

    // Update an existing session package (mentor-side)
    UpdateMentorSessionPackage: mutation<
      { data: string },
      { id: string; body: Partial<ISessionPackage> }
    >({
      query: ({ id, body }) => ({
        url: `/session/package/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["sessionPackagesApi", "mentor"],
    }),

    // Delete a session package (mentor-side)
    DeleteMentorSessionPackage: mutation<{ data: string }, string>({
      query: (id) => ({
        url: `/session/package/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["sessionPackagesApi", "mentor"],
    }),

    // Use/reduce session from a package (user-side)
    UseMentorSessionPackage: mutation<{ data: string }, { packageId: string }>({
      query: ({ packageId }) => {
        const token = getUserToken();
        return {
          url: `/session/package/use/${packageId}`,
          method: "PATCH",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        };
      },
      invalidatesTags: ["sessionPackagesApi"],
    }),
  }),
});

export const SessionPackageApiReducer = SessionPackageApi.reducer;
export const SessionPackageApiMiddleware = SessionPackageApi.middleware;

export const {
  useGetMentorSessionPackagesQuery,
  useGetAllTemplatePackagesQuery,
  useGetUserPackagesQuery,
  useCreateMentorSessionPackageMutation,
  useUpdateMentorSessionPackageMutation,
  useDeleteMentorSessionPackageMutation,
  useUseMentorSessionPackageMutation,
} = SessionPackageApi;

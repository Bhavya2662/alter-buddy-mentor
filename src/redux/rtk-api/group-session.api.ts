import { createApi } from "@reduxjs/toolkit/query/react";
import { ApiBaseQuery, baseQueryMentor } from "../../utils";
import { IGroupSession } from "../../interface";
import { getUserToken } from "../../utils/local-store";

const GroupSessionApi = createApi({
  baseQuery: ApiBaseQuery(baseQueryMentor),
  reducerPath: "groupSessionApi",
  tagTypes: ["groupSessionApi"],
  endpoints: ({ query, mutation }) => ({
    // Get group sessions for a mentor (mentor-side)
    GetMentorGroupSessions: query<{ data: IGroupSession[] }, string>({
      query: (mentorId) => `/group-session/mentor/${mentorId}`,
      providesTags: ["groupSessionApi"],
    }),

    // Create a group session (mentor-side)
    CreateGroupSession: mutation<{ data: IGroupSession }, Partial<IGroupSession>>({
      query: (payload) => ({
        url: "/group-session",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["groupSessionApi"],
    }),

    // Update a group session (mentor-side)
    UpdateGroupSession: mutation<
      { data: IGroupSession },
      { id: string; body: Partial<IGroupSession> }
    >({
      query: ({ id, body }) => ({
        url: `/group-session/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["groupSessionApi"],
    }),

    // Delete a group session (mentor-side)
    DeleteGroupSession: mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/group-session/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["groupSessionApi"],
    }),

    // Book a group session (user-side)
    BookGroupSession: mutation<{ data: IGroupSession }, { sessionId: string; userId: string }>({
      query: ({ sessionId, userId }) => {
        const token = getUserToken();
        return {
          url: `/group-session/book/${sessionId}`,
          method: "PUT",
          body: { userId },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        };
      },
      invalidatesTags: ["groupSessionApi"],
    }),

    // Get group session by room ID (public/user-side)
    GetGroupSessionByRoomId: query<{ data: IGroupSession }, string>({
      query: (roomId) => `/group-session/join/${roomId}`,
      providesTags: ["groupSessionApi"],
    }),

    // Get all group sessions (public/user-side)
    GetAllGroupSessions: query<{ data: IGroupSession[] }, void>({
      query: () => "/group-session/all",
      providesTags: ["groupSessionApi"],
    }),
  }),
});

export const GroupSessionApiReducer = GroupSessionApi.reducer;
export const GroupSessionApiMiddleware = GroupSessionApi.middleware;

export const {
  useGetMentorGroupSessionsQuery,
  useCreateGroupSessionMutation,
  useUpdateGroupSessionMutation,
  useDeleteGroupSessionMutation,
  useBookGroupSessionMutation,
  useGetGroupSessionByRoomIdQuery,
  useGetAllGroupSessionsQuery,
} = GroupSessionApi;

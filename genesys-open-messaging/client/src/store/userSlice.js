import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export const useUserStore = create(
  devtools(
    persist(
      (set) => ({
        isAuth: false,
        accessToken: "",
        refreshToken: "",
        tokenExpiresIn: "",
        gcId: "",
        userId: "",
        userName: "",
        queues: [],
        notificationChannel: {},

        setIsAuth: (isAuth) => set({ isAuth }),
        setAccessToken: (accessToken) => set({ accessToken }),
        setRefreshToken: (refreshToken) => set({ refreshToken }),
        setTokenExpiresIn: (tokenExpiresIn) => set({ tokenExpiresIn }),
        setUserId: (userId) => set({ userId }),
        setUserName: (userName) => set({ userName }),
        setQueues: (queues) => set({ queues }),
        setNotificationChannel: (notificationChannel) =>
          set({ notificationChannel }),
        setGCId: (gcId) => set({ gcId }),

        clearUserStore: () =>
          set({
            isAuth: false,
            accessToken: "",
            refreshToken: "",
            tokenExpiresIn: "",
            gcId: "",
            userId: "",
            userName: "",
            queues: [],
            notificationChannel: {},
          }),
      }),
      {
        name: "telnyx-user-store",
        // enabled: process.env.REACT_APP_ENV === "PRODUCTION" ? false : true,
      }
    )
  )
);

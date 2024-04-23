import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useNLStore = create(
  devtools(
    (set) => ({
      activeStep: "Number Lookup",
      nlNumber: "",
      carrierLookup: false,
      callerLookup: false,
      payload: {},
      isLoading: false,
      contactLists: [],
      selectedContactList: "",
      selectedContactListName: "",
      contactListUri: "",
      contacts: [],

      setActiveStep: (activeStep) => set({ activeStep }),
      setNLNumber: (nlNumber) => set({ nlNumber }),
      setCarrierLookup: (carrierLookup) => set({ carrierLookup }),
      setCallerLookup: (callerLookup) => set({ callerLookup }),
      setPayload: (payload) => set({ payload }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setContactLists: (contactLists) =>
        set({
          contactLists,
        }),
      setSelectedContactList: (selectedContactList) =>
        set({ selectedContactList }),
      setSelectedContactListName: (selectedContactListName) =>
        set({ selectedContactListName }),
      setContactListUri: (contactListUri) => set({ contactListUri }),
      setContacts: (contacts) => set({ contacts }),

      clearNLStore: () =>
        set({
          nlNumber: "",
          carrierLookup: true,
          callerLookup: false,
          payload: {},
          contactLists: [],
          selectedContactList: "",
          selectedContactListName: "",
          contactListUri: "",
          contacts: [],
        }),
    }),
    {
      name: "telnyx-nl-store",
      // enabled: process.env.REACT_APP_ENV === "PRODUCTION" ? false : true,
    }
  )
);

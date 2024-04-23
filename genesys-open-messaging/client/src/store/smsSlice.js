import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export const useSMSStore = create(
  devtools(
    persist(
      (set) => ({
        activeStep: "Send SMS",
        isLoading: false,
        isSending: false,
        senderId: "Telnyx",
        number: "",
        content: "",
        stopMessage: "Reply STOP to unsubscribe.",
        status: "",
        payload: {},
        smsResponseLibraries: [],
        smsResponseTemplates: [],
        smsResponses: [],
        smsTemplates: [],
        smsTemplateLibraries: [],
        smsResponseLibrarySelected: "",
        smsTemplateLibrarySelected: "",
        smsResponseSelected: "",
        smsTemplateSelected: "",
        smsResponseContent: "",
        smsTemplateContent: "",
        smsFrom: [],
        smsFromSelected: "",

        contactLists: [],
        selectedContactList: "",
        selectedContactListName: "",
        contactListColumns: [],
        selectedContact: "",
        contactListUri: "",
        contacts: [],
        message: "",
        substitutions: [],
        substCheck: false,

        setActiveStep: (activeStep) => set({ activeStep }),
        setIsLoading: (isLoading) => set({ isLoading }),
        setIsSending: (isSending) => set({ isSending }),
        setSenderId: (senderId) => set({ senderId }),
        setNumber: (number) => set({ number }),
        setContent: (content) => set({ content }),
        setStopMessage: (stopMessage) => set({ stopMessage }),
        setStatus: (status) => set({ status }),
        setPayload: (payload) => set({ payload }),
        setSMSResponseLibraries: (smsResponseLibraries) =>
          set({ smsResponseLibraries }),
        setSMSResponseTemplates: (smsResponseTemplates) =>
          set({ smsResponseTemplates }),
        setSMSResponses: (smsResponses) => set({ smsResponses }),
        setSMSTemplates: (smsTemplates) => set({ smsTemplates }),
        setSMSTemplateLibraries: (smsTemplateLibraries) =>
          set({ smsTemplateLibraries }),
        setSMSResponseLibrarySelected: (smsResponseLibrarySelected) =>
          set({ smsResponseLibrarySelected }),
        setSMSTemplateLibrarySelected: (smsTemplateLibrarySelected) =>
          set({ smsTemplateLibrarySelected }),
        setSMSResponseSelected: (smsResponseSelected) =>
          set({ smsResponseSelected }),
        setSMSTemplateSelected: (smsTemplateSelected) =>
          set({ smsTemplateSelected }),
        setSMSResponseContent: (smsResponseContent) =>
          set({ smsResponseContent }),
        setSMSTemplateContent: (smsTemplateContent) =>
          set({ smsTemplateContent }),
        setSMSFrom: (smsFrom) => set({ smsFrom }),
        setSMSFromSelected: (smsFromSelected) => set({ smsFromSelected }),

        setContactLists: (contactLists) =>
          set({
            contactLists,
          }),
        setSelectedContactList: (selectedContactList) =>
          set({ selectedContactList }),
        setSelectedContactListName: (selectedContactListName) =>
          set({ selectedContactListName }),
        setContactListColumns: (contactListColumns) =>
          set({ contactListColumns }),
        setSelectedContact: (selectedContact) => set({ selectedContact }),
        setContactListUri: (contactListUri) => set({ contactListUri }),
        setContacts: (contacts) => set({ contacts }),
        setMessage: (message) => set({ message }),
        setSubstitutions: (substitutions) => set({ substitutions }),
        setSubstCheck: (substCheck) => set({ substCheck }),

        clearSMSStore: () =>
          set({
            senderId: "Telnyx",
            isLoading: false,
            isSending: false,
            number: "",
            content: "",
            stopMessage: "Reply STOP to unsubscribe.",
            status: "",
            payload: {},
            smsResponseLibraries: [],
            smsResponseTemplates: [],
            smsResponses: [],
            smsTemplates: [],
            smsTemplateLibraries: [],
            smsResponseLibrarySelected: "",
            smsTemplateLibrarySelected: "",
            smsResponseSelected: "",
            smsTemplateSelected: "",
            smsResponseContent: "",
            smsTemplateContent: "",
            smsFrom: [],
            smsFromSelected: "",

            contactLists: [],
            selectedContactList: "",
            selectedContactListName: "",
            contactListColumns: [],
            selectedContact: "",
            contactListUri: "",
            contacts: [],
            message: "",
            substitutions: [],
            substCheck: false,
          }),
      }),
      {
        name: "telnyx-sms-store",
        // enabled: process.env.REACT_APP_ENV === "PRODUCTION" ? false : true,
      }
    )
  )
);

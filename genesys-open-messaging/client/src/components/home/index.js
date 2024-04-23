import React, { useEffect } from "react";
import Error from "./Error";
import SMSMenu from "../sms";
import SMS from "../sms/SMS";
import SMSCampaign from "../sms/SMSCampaign";
import NLMenu from "../numberlookup";
import NL from "../numberlookup/NL";
import NLCampaign from "../numberlookup/NLCampaign";
import { useSMSStore } from "../../store/smsSlice";
import { useSearchParams } from "react-router-dom";
import { getUserMe } from "../../services/user.service";
import { gcGetToken } from "../../services/auth.service";
import { createNotificationChannel } from "../../services/notification.service";
import { useUserStore } from "../../store/userSlice";
import {
  gcApiInstance,
  apiInstance,
  axiosInterceptor,
} from "../../utils/axios";

const App = () => {
  const setContactListUri = useSMSStore((state) => state.setContactListUri);

  const [searchParams] = useSearchParams();
  const authCode = searchParams.get("code");
  const state = searchParams.get("state");

  const isAuth = useUserStore((state) => state.isAuth);
  const accessToken = useUserStore((state) => state.accessToken);
  const refreshToken = useUserStore((state) => state.refreshToken);
  const userId = useUserStore((state) => state.userId);

  const setIsAuth = useUserStore((state) => state.setIsAuth);
  const setAccessToken = useUserStore((state) => state.setAccessToken);
  const setRefreshToken = useUserStore((state) => state.setRefreshToken);
  const setTokenExpiresIn = useUserStore((state) => state.setTokenExpiresIn);

  const setUserName = useUserStore((state) => state.setUserName);
  const setGCId = useUserStore((state) => state.setGCId);
  const setUserId = useUserStore((state) => state.setUserId);

  const setNotificationChannel = useUserStore(
    (state) => state.setNotificationChannel
  );

  const getToken = async (authCode, refreshToken) => {
    try {
      console.log(
        refreshToken
          ? "Refreshing authentication token..."
          : "Getting authentication token..."
      );
      const redirectUri =
        window.location.protocol + "//" + window.location.host;
      console.log("Redirect URI:", redirectUri);
      const token = await gcGetToken(authCode, redirectUri, refreshToken);
      console.log("Authentication token received");
      setIsAuth(true);
      setAccessToken(token.data.access_token);
      setRefreshToken(token.data.refresh_token);
      setTokenExpiresIn(token.data.expires_in);
      await axiosInterceptor(gcApiInstance, token.data.access_token);
      await axiosInterceptor(apiInstance, token.data.access_token);
    } catch (error) {
      console.log(
        "Error getting authentication token:",
        error?.response?.data ? error.response.data.description : error.message
      );
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (authCode && !isAuth) {
        await getToken(authCode, null);
      } else {
        await axiosInterceptor(gcApiInstance, accessToken);
        await axiosInterceptor(apiInstance, accessToken);
      }
    };
    checkAuth();
  }, []); // eslint-disable-line

  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log("Getting user data...");
        const user = await getUserMe();
        console.log("User data:", user.data);
        setUserName(user.data.name);
        setGCId(user.data.id);
        setUserId(user.data.username);
      } catch (error) {
        console.log(
          "Error getting user data:",
          error?.response?.data
            ? error.response.data.description
            : error.message
        );
      }
    };

    const createNewNotificationChannel = async () => {
      try {
        console.log("Creating notification channel...");
        const channel = await createNotificationChannel();
        setNotificationChannel(channel.data);
        console.log("Notification channel:", channel.data);

        const ws = new WebSocket(channel.data.connectUri);

        ws.addEventListener("open", () => {
          console.log("Connected to the websocket server!");
          ws.send("Hello!");
        });

        ws.addEventListener("message", async (event) => {
          const data = JSON.parse(event.data);
          console.log("Received websocket notification:", data);
          if (data.topicName !== "channel.metadata") {
            setContactListUri(data.eventBody.uri);
          }
        });
      } catch (error) {
        console.log(
          "Error creating notification channel:",
          error?.response?.data
            ? error.response.data.description
            : error.message
        );
      }
    };

    if (isAuth && userId === "") {
      loadUserData();
      createNewNotificationChannel();
    }
  }, [accessToken]); // eslint-disable-line

  useEffect(() => {
    const interval = setInterval(async () => {
      console.log("Refreshing token...");
      await getToken(null, refreshToken);
    }, 12 * 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [refreshToken]); // eslint-disable-line

  const components = () => {
    switch (state) {
      case "smsmenu":
        return <SMSMenu />;
      case "sms":
        return <SMS />;
      case "smscampaign":
        return <SMSCampaign />;
      case "nlmenu":
        return <NLMenu />;
      case "nl":
        return <NL />;
      case "nlcampaign":
        return <NLCampaign />;
      default:
        return <Error />;
    }
  };

  return <div>{accessToken !== "" && components()}</div>;
};

export default App;

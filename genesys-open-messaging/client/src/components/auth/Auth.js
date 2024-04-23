import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header, Image } from "semantic-ui-react";
import { gcRedirectUri } from "../../services/auth.service";
import "react-toastify/dist/ReactToastify.css";
import { useSMSStore } from "../../store/smsSlice";
import { useNLStore } from "../../store/nlSlice";
import { useUserStore } from "../../store/userSlice";

const App = () => {
  const [searchParams] = useSearchParams();
  const state = searchParams.get("state");
  console.log("State: ", state);

  const clearSMSStore = useSMSStore((state) => state.clearSMSStore);
  const clearNLStore = useNLStore((state) => state.clearNLStore);
  const clearUserStore = useUserStore((state) => state.clearUserStore);

  useEffect(() => {
    clearSMSStore();
    clearNLStore();
    clearUserStore();
    const authenticate = async () => {
      const redirectUri = gcRedirectUri(
        window.location.protocol + "//" + window.location.host,
        state
      );
      console.log("Redirect URI: ", redirectUri);
      window.location.replace(redirectUri);
    };

    authenticate();
  }, []); // eslint-disable-line

  return (
    <div style={{ margin: "0.8rem" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Header as="h1" icon textAlign="center" color="grey">
          <Image
            src="/images/Telnyx_Lockup_Primary_One-color_Green_Large.png"
            style={{ width: 400, margin: "2rem" }}
          />
          <Header.Content>Authenticating in Genesys Cloud ...</Header.Content>{" "}
        </Header>
      </div>
    </div>
  );
};

export default App;

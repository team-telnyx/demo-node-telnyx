import React from "react";
import { useSearchParams } from "react-router-dom";
import { Header, Image } from "semantic-ui-react";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const [searchParams] = useSearchParams();
  const state = searchParams.get("state");
  console.log("Not existing path in state parameter: ", state);

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
          <Header.Content>
            Provided URL path <b>"{state}"</b> does not exist
          </Header.Content>{" "}
        </Header>
      </div>
    </div>
  );
};

export default App;

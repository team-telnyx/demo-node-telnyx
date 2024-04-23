import React from "react";
import JSONView from "@microlink/react-json-view";
import { checkNumber } from "../../services/nl.service";
import { Form, Segment, Grid } from "semantic-ui-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNLStore } from "../../store/nlSlice";

const App = () => {
  const nlNumber = useNLStore((state) => state.nlNumber);
  const carrierLookup = useNLStore((state) => state.carrierLookup);
  const callerLookup = useNLStore((state) => state.callerLookup);
  const payload = useNLStore((state) => state.payload);
  const isLoading = useNLStore((state) => state.isLoading);

  const setNLNumber = useNLStore((state) => state.setNLNumber);
  const setCarrierLookup = useNLStore((state) => state.setCarrierLookup);
  const setCallerLookup = useNLStore((state) => state.setCallerLookup);
  const setPayload = useNLStore((state) => state.setPayload);
  const setIsLoading = useNLStore((state) => state.setIsLoading);

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await checkNumber(nlNumber, carrierLookup, callerLookup);
      setPayload(response.data);
    } catch (error) {
      console.log("Number Lookup error:", error.message);
      toast.error(error.message);
    }
    setIsLoading(false);
  };

  return (
    <div style={{ margin: "0.8rem" }}>
      <Segment color="green">
        <Form size="small">
          <Form.Group widths="2">
            <Form.Input
              fluid
              label="Phone Number"
              placeholder="Phone Number"
              value={nlNumber}
              onChange={(e) => setNLNumber(e.currentTarget.value)}
            />
          </Form.Group>
          <Form.Group widths="1">
            <Form.Checkbox
              toggle
              onChange={() => setCarrierLookup(!carrierLookup)}
              checked={carrierLookup}
              label="Carrier Data"
            ></Form.Checkbox>
            <Form.Checkbox
              toggle
              onChange={() => setCallerLookup(!callerLookup)}
              checked={callerLookup}
              label="Caller Name"
            ></Form.Checkbox>
          </Form.Group>

          <Form.Button
            size="mini"
            onClick={submitHandler}
            style={{
              background: "#00C08B",
              color: "white",
            }}
            disabled={isLoading || nlNumber === ""}
          >
            {!isLoading ? "QUERY" : "Loading"}
          </Form.Button>
        </Form>
      </Segment>
      {!isLoading && (
        <Segment color="teal">
          <Grid>
            <Grid.Column width={16}>
              <JSONView
                src={payload}
                // theme={"harmonic"}
                name={"Number Lookup"}
                iconStyle={"triangle"}
                collapsed={false}
              />
            </Grid.Column>
          </Grid>
        </Segment>
      )}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default App;

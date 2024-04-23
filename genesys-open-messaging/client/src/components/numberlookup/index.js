import React from "react";
import Stepper from "../stepper";
import NL from "./NL";
import NLCampaign from "./NLCampaign";
import { useNLStore } from "../../store/nlSlice";

const App = () => {
  const activeStep = useNLStore((state) => state.activeStep);
  const setActiveStep = useNLStore((state) => state.setActiveStep);

  return (
    <div style={{ margin: "0.8rem" }}>
      <Stepper
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        fromComponent="numberlookup"
      />
      {activeStep === "Number Lookup" && <NL />}
      {activeStep === "Number Lookup Campaign" && <NLCampaign />}
    </div>
  );
};

export default App;

import React from "react";
import Stepper from "../stepper";
import SMS from "./SMS";
import SMSCampaign from "./SMSCampaign";
import { useSMSStore } from "../../store/smsSlice";

const App = () => {
  const activeStep = useSMSStore((state) => state.activeStep);
  const setActiveStep = useSMSStore((state) => state.setActiveStep);

  return (
    <div style={{ margin: "0.8rem" }}>
      <Stepper
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        fromComponent="sms"
      />
      {activeStep === "Send SMS" && <SMS />}
      {activeStep === "SMS Campaign" && <SMSCampaign />}
    </div>
  );
};

export default App;

import React, { useState, useEffect } from "react";
import { Icon, Step, Progress } from "semantic-ui-react";
import { menuItems } from "../../config/menu";

import styles from "../../styles/PrivateAppLayout.module.scss";

const App = ({ activeStep, setActiveStep, fromComponent }) => {
  const [stepperItems, setStepperItems] = useState([]);

  const selectStepper = () => {
    for (let i = 0; i < menuItems.length; i++) {
      const subMenuArr = menuItems[i].submenu;
      const subMenu = subMenuArr.filter(
        (subMenu) => subMenu.name === fromComponent
      );
      if (subMenu.length > 0) {
        const stepperItems = subMenu[0].stepper;
        setStepperItems(stepperItems);
        break;
      }
    }
  };

  useEffect(() => {
    selectStepper(); // eslint-disable-next-line
  }, []);

  return (
    stepperItems.length > 0 && (
      <div style={{ margin: "0.8rem" }}>
        <Step.Group widths={stepperItems.length} size="small">
          {stepperItems.map((item) => (
            <Step
              key={item.id}
              value={item.component}
              active={activeStep === item.component}
              link
              onClick={() => setActiveStep(item.component)}
            >
              <Icon name={item.icon} />
              <Step.Content>
                <Step.Title>{item.title}</Step.Title>
                <Step.Description>
                  {item.description}
                  <Progress
                    className={styles.progress}
                    size="tiny"
                    percent={100}
                    success={activeStep === item.component}
                    style={{ margin: 0 }}
                  ></Progress>
                </Step.Description>
              </Step.Content>
            </Step>
          ))}
        </Step.Group>
      </div>
    )
  );
};

export default App;

import React, { useEffect, useState } from "react";

import {
  Form,
  Segment,
  Grid,
  Label,
  Divider,
  Header,
  Icon,
} from "semantic-ui-react";
import { gcApiInstance, axiosInterceptor } from "../../utils/axios";
import { count } from "sms-length";
import { getQueuesMe } from "../../services/user.service";
import { sendSMS } from "../../services/sms.service";
// import { sendAgentlessMessage } from "../../services/sms.service";
import { getSMSLibrary, getSMSResponse } from "../../services/response.service";
import { getConversations } from "../../services/conversation.service";
import { getDataTables, getTableRows } from "../../services/architect.service";
import Picker from "emoji-picker-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSMSStore } from "../../store/smsSlice";
import { useUserStore } from "../../store/userSlice";

const App = () => {
  const [smsResponseLibraryOptions, setSMSResponseLibraryOptions] = useState(
    []
  );
  const [smsResponseOptions, setSMSResponseOptions] = useState([]);
  const [smsFromOptions, setSMSFromOptions] = useState([]);

  const accessToken = useUserStore((state) => state.accessToken);
  const setQueues = useUserStore((state) => state.setQueues);

  const isLoading = useSMSStore((state) => state.isLoading);
  const setIsLoading = useSMSStore((state) => state.setIsLoading);
  const isSending = useSMSStore((state) => state.isSending);
  const setIsSending = useSMSStore((state) => state.setIsSending);

  const senderId = useSMSStore((state) => state.senderId);
  const setSenderId = useSMSStore((state) => state.setSenderId);
  const number = useSMSStore((state) => state.number);
  const content = useSMSStore((state) => state.content);
  const stopMessage = useSMSStore((state) => state.stopMessage);
  const status = useSMSStore((state) => state.status);
  const smsFrom = useSMSStore((state) => state.smsFrom);
  const setSMSFrom = useSMSStore((state) => state.setSMSFrom);

  const setNumber = useSMSStore((state) => state.setNumber);
  const setContent = useSMSStore((state) => state.setContent);
  const [chosenEmoji, setChosenEmoji] = useState(null);

  const smsResponseLibraries = useSMSStore(
    (state) => state.smsResponseLibraries
  );
  const setSMSResponseLibraries = useSMSStore(
    (state) => state.setSMSResponseLibraries
  );
  const smsResponseLibrarySelected = useSMSStore(
    (state) => state.smsResponseLibrarySelected
  );
  const setSMSResponseLibrarySelected = useSMSStore(
    (state) => state.setSMSResponseLibrarySelected
  );
  const smsResponses = useSMSStore((state) => state.smsResponses);
  const setSMSResponses = useSMSStore((state) => state.setSMSResponses);
  const smsResponseSelected = useSMSStore((state) => state.smsResponseSelected);
  const setSMSResponseSelected = useSMSStore(
    (state) => state.setSMSResponseSelected
  );
  const responseContent = useSMSStore((state) => state.smsResponseContent);
  const setResponseContent = useSMSStore(
    (state) => state.setSMSResponseContent
  );
  const smsFromSelected = useSMSStore((state) => state.smsFromSelected);
  const setSMSFromSelected = useSMSStore((state) => state.setSMSFromSelected);

  useEffect(() => {
    const getSMSLibraryData = async () => {
      try {
        const response = await getSMSLibrary(
          process.env.REACT_APP_SMS_RESPONSES_PREFIX
        );
        setSMSResponseLibraries(response.data.entities);
        console.log("SMS response libraries:", response.data.entities);
      } catch (error) {
        console.log(
          "Get SMS response libraries error:",
          error?.response?.data?.message
            ? error.response.data.message
            : error.message
        );
        toast.error(
          error?.response?.data?.message
            ? error.response.data.message
            : error.message
        );
      }
    };

    const loadFromNumbers = async (queueName) => {
      try {
        console.log("Getting config data...");
        const dataTables = await getDataTables(
          process.env.REACT_APP_SMS_FROM_TABLE
        );
        const tableId = dataTables.data?.entities[0]?.id;
        const config = await getTableRows(tableId);
        console.log("SMS From data:", config.data.entities);
        const fromNumbers = config.data.entities.filter(
          (item) => item.queue === queueName
        );
        console.log(`From numbers for queue ${queueName}:`, fromNumbers);
        setSMSFrom(fromNumbers);
      } catch (error) {
        console.log(
          "Error getting config data:",
          error?.response?.data
            ? error.response.data.description
            : error.message
        );
      }
    };

    const getUserConversations = async () => {
      try {
        const queues = await getQueuesMe();
        console.log("User queues:", queues.data.entities);
        setQueues(queues.data.entities);
        const response = await getConversations();
        if (response.data.entities.length === 0) {
          console.log("No active conversations");
          setSMSFrom([
            { key: "1", from: process.env.REACT_APP_SMS_FROM_DEFAULT_ID },
          ]);
          return;
        }
        console.log("Active conversations:", response.data.entities);
        const participant = response.data.entities[0].participants.filter(
          (item) => item.participantType === "External"
        );
        console.log("External participant:", participant);
        setNumber(participant[0].ani.split(":")[1]);
        const queueId = participant[0].queueId;
        const queue = queues.data.entities.filter(
          (item) => item.id === queueId
        );
        await loadFromNumbers(queue[0].name);
      } catch (error) {
        console.log(
          "Get conversations error:",
          error?.response?.data?.message
            ? error.response.data.message
            : error.message
        );
      }
    };

    if (smsResponseLibraries.length === 0) getSMSLibraryData();
    getUserConversations();
  }, []); // eslint-disable-line

  useEffect(() => {
    const options = smsResponseLibraries.map((option) => ({
      key: option.id,
      value: option.id,
      text: option.name,
    }));
    setSMSResponseLibraryOptions(options);
  }, [smsResponseLibraries]); // eslint-disable-line

  useEffect(() => {
    const options = smsFrom.map((option) => ({
      key: option.key,
      value: option.from,
      text: option.from,
    }));
    setSMSFromOptions(options);
  }, [smsFrom]); // eslint-disable-line

  useEffect(() => {
    setSenderId(smsFromSelected);
  }, [smsFromSelected]); // eslint-disable-line

  useEffect(() => {
    const getSMSResponseData = async () => {
      setIsLoading(true);
      try {
        await axiosInterceptor(gcApiInstance, accessToken);
        const response = await getSMSResponse(smsResponseLibrarySelected);
        setSMSResponses(response.data.entities);
        console.log("SMS responses:", response.data.entities);
      } catch (error) {
        console.log(
          "Get SMS responses error:",
          error?.response?.data?.message
            ? error.response.data.message
            : error.message
        );
        toast.error(
          error?.response?.data?.message
            ? error.response.data.message
            : error.message
        );
      }
      setIsLoading(false);
    };
    if (smsResponseLibrarySelected !== "") getSMSResponseData();
    setResponseContent("");
    setSMSResponseSelected("");
  }, [smsResponseLibrarySelected]); // eslint-disable-line

  useEffect(() => {
    const options = smsResponses.map((option) => ({
      key: option.id,
      value: option.id,
      text: option.name,
    }));
    setSMSResponseOptions(options);
  }, [smsResponses]); // eslint-disable-line

  useEffect(() => {
    const selectedResponse = smsResponses.filter(
      (item) => item.id === smsResponseSelected
    );
    const responseContent = selectedResponse[0]?.texts[0]?.content;
    setResponseContent(responseContent);
  }, [smsResponseSelected]); // eslint-disable-line

  useEffect(() => {
    if (chosenEmoji) {
      const newContent = content + chosenEmoji.emoji;
      setContent(newContent);
    }
  }, [chosenEmoji]); // eslint-disable-line

  const onEmojiClick = (emojiObject) => {
    setChosenEmoji(emojiObject);
  };

  const insertTemplateHandler = async (e) => {
    e.preventDefault();
    const template = smsResponses.filter(
      (item) => item.id === smsResponseSelected
    )[0].texts[0].content;
    const newContent = content + (content.length === 0 ? "" : "\n") + template;
    setContent(newContent);
  };

  const stopMessageHandler = async (e) => {
    e.preventDefault();
    const newContent =
      content + (content.length === 0 ? "" : "\n") + stopMessage;
    setContent(newContent);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const response = await sendSMS(senderId, number, content);
      // const response = await sendAgentlessMessage(senderId, number, content);
      if (response.status === 200) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(
        "Send SMS error:",
        error?.response?.data?.message
          ? error.response.data.message
          : error.message
      );
      toast.error(
        error?.response?.data?.message
          ? error.response.data.message
          : error.message
      );
    }
    setIsSending(false);
  };

  return (
    <div style={{ margin: "0.8rem" }}>
      <Segment color="teal">
        <Grid>
          <Grid.Column width={10}>
            <Form size="small">
              <Form.Group widths="equal">
                <Form.Select
                  fluid
                  selection
                  label="Number From"
                  options={smsFromOptions}
                  value={smsFromSelected}
                  placeholder="Select Number From"
                  onChange={(e, data) => {
                    setSMSFromSelected(data.value);
                  }}
                />
                <Form.Input
                  fluid
                  label="Number To"
                  placeholder="Number To"
                  value={number}
                  onChange={(e) => setNumber(e.currentTarget.value)}
                />
              </Form.Group>

              <Form.TextArea
                label="Message"
                rows={5}
                placeholder="Message you would like to send"
                value={content}
                onChange={(e) => setContent(e.currentTarget.value)}
              ></Form.TextArea>
              <Grid>
                <Grid.Column width={16} textAlign="left">
                  <Header as={"h5"}>
                    Length:{" "}
                    <Label color={"blue"}>{count(content).length}</Label> |
                    Encoding:{" "}
                    <Label color={"green"}>{count(content).encoding}</Label> |
                    Max chars:{" "}
                    <Label color={"yellow"}>
                      {count(content).characterPerMessage}
                    </Label>{" "}
                    | Parts:{" "}
                    <Label
                      color={count(content).messages > 1 ? "red" : "purple"}
                    >
                      {count(content).messages}
                    </Label>
                  </Header>
                </Grid.Column>
              </Grid>

              {status !== "" && (
                <div>
                  <Divider horizontal></Divider>
                  <Divider horizontal>Message Status</Divider>
                  <Grid columns="equal">
                    <Grid.Row>
                      <Grid.Column textAlign="left">
                        {(status === "queued" ||
                          status === "sent" ||
                          status === "delivered") && (
                          <Label as="a" color="blue" tag>
                            QUEUED
                          </Label>
                        )}{" "}
                        {(status === "sent" || status === "delivered") && (
                          <Label as="a" color="yellow" tag>
                            SENT
                          </Label>
                        )}{" "}
                        {status === "delivered" && (
                          <Label as="a" color="teal" tag>
                            DELIVERED
                          </Label>
                        )}
                        {status === "sending_failed" && (
                          <Label as="a" color="red" tag>
                            NOT DELIVERED
                          </Label>
                        )}
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </div>
              )}
              <Divider horizontal></Divider>
              <div className="ui divider"></div>
              <Divider horizontal></Divider>
              <Form.Group widths="equal">
                <Form.Select
                  fluid
                  selection
                  label="Response Library"
                  options={smsResponseLibraryOptions}
                  value={smsResponseLibrarySelected}
                  placeholder="Select response library"
                  onChange={(e, data) => {
                    setSMSResponseLibrarySelected(data.value);
                  }}
                />
                <Form.Select
                  fluid
                  search
                  selection
                  label="Canned Responses"
                  options={smsResponseOptions}
                  value={smsResponseSelected}
                  placeholder="Select response"
                  onChange={(e, data) => {
                    setSMSResponseSelected(data.value);
                  }}
                />
              </Form.Group>
              <Form.Group widths="equal">
                <Form.TextArea
                  label="Response"
                  rows={5}
                  placeholder="Canned response selected from the library"
                  value={responseContent}
                ></Form.TextArea>
              </Form.Group>
              <Form.Group widths="4">
                <Form.Button
                  fluid
                  icon
                  labelPosition="left"
                  onClick={insertTemplateHandler}
                  size="mini"
                  style={{
                    background: "purple",
                    color: "white",
                  }}
                  disabled={isLoading || smsResponseSelected === ""}
                >
                  {"INSERT"}
                  <Icon name="arrow alternate circle up outline" />
                </Form.Button>
                <Form.Button
                  fluid
                  icon
                  labelPosition="left"
                  onClick={stopMessageHandler}
                  size="mini"
                  style={{
                    background: "orange",
                    color: "white",
                  }}
                >
                  {"STOP MESSAGE"}
                  <Icon name="stop circle outline" />
                </Form.Button>
                <Form.Button
                  fluid
                  icon
                  labelPosition="left"
                  onClick={(e) => {
                    setContent("");
                  }}
                  // onClick={tokenDataHandler}
                  size="mini"
                  style={{
                    background: "red",
                    color: "white",
                  }}
                >
                  {"CLEAR"}
                  <Icon name="close" />
                </Form.Button>
                <Form.Button
                  fluid
                  icon
                  labelPosition="left"
                  onClick={submitHandler}
                  size="mini"
                  style={{
                    background: "#00C08B",
                    color: "white",
                  }}
                  disabled={
                    !smsFromSelected ||
                    number.length === 0 ||
                    content.length === 0 ||
                    isSending
                  }
                >
                  {isSending ? "SENDING..." : "SEND SMS"}
                  <Icon
                    name={isSending ? "spinner" : "chat"}
                    loading={isSending ? true : false}
                  />
                </Form.Button>
              </Form.Group>
            </Form>
          </Grid.Column>

          <Grid.Column width={6} verticalAlign="middle">
            <Picker
              emojiStyle="apple"
              disableSkinTonePicker={true}
              onEmojiClick={onEmojiClick}
              height={550}
              width={300}
            />
          </Grid.Column>
        </Grid>
      </Segment>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        // pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default App;

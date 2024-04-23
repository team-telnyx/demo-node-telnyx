import React, { useEffect } from "react";
import {
  createContactListExport,
  getContactListFile,
} from "../../services/contactlist.service";
import { Form, Grid, Message, Divider } from "semantic-ui-react";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import { styled } from "@mui/material/styles";
import { useUserStore } from "../../store/userSlice";
import { useSMSStore } from "../../store/smsSlice";
import {
  createChannelSubscriptions,
  deleteChannelSubscriptions,
} from "../../services/notification.service";

const StyledBox = styled(Box)(() => ({
  height: 300,
  width: "100%",
  "& .header-class": {
    backgroundColor: "#777777",
    color: "white",
    fontWeight: "600",
    alignItems: "center",
  },
}));

const App = (props) => {
  const selectedContact = useSMSStore((state) => state.selectedContact);
  const setSelectedContact = useSMSStore((state) => state.setSelectedContact);
  const contactListUri = useSMSStore((state) => state.contactListUri);
  const setContactListUri = useSMSStore((state) => state.setContactListUri);
  const contacts = useSMSStore((state) => state.contacts);
  const setContacts = useSMSStore((state) => state.setContacts);
  const message = useSMSStore((state) => state.message);
  const setMessage = useSMSStore((state) => state.setMessage);
  const isLoading = useSMSStore((state) => state.isLoading);
  const setIsLoading = useSMSStore((state) => state.setIsLoading);

  const gcId = useUserStore((state) => state.gcId);
  const notificationChannel = useUserStore(
    (state) => state.notificationChannel
  );

  let contactTableColumns = [];

  for (let i = 0; i < props.columns.length; i++) {
    contactTableColumns.push({
      field: props.columns[i],
      headerName: props.columns[i],
      // width: 250,
      flex: 1,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{props.columns[i]}</strong>,
    });
  }

  contactTableColumns.push({
    field: "TELNYX_MESSAGE_ID",
    headerName: "Message ID",
    width: 200,
    editable: false,
    headerClassName: "header-class",
    renderHeader: () => <strong>Message ID</strong>,
  });

  contactTableColumns.push({
    field: "TELNYX_PRICE",
    headerName: "Price",
    width: 100,
    editable: false,
    headerClassName: "header-class",
    renderHeader: () => <strong>Price</strong>,
  });

  contactTableColumns.push({
    field: "TELNYX_TIME",
    headerName: "Time",
    width: 200,
    editable: false,
    headerClassName: "header-class",
    renderHeader: () => <strong>Time</strong>,
  });

  contactTableColumns.push({
    field: "TELNYX_STATUS",
    headerName: "Status",
    width: 100,
    editable: false,
    headerClassName: "header-class",
    renderHeader: () => <strong>Status</strong>,
  });

  useEffect(() => {
    const createNewChannelSubscriptions = async (id, subscriptions) => {
      try {
        console.log("Creating new channel subscriptions...");
        const response = await createChannelSubscriptions(id, subscriptions);
        console.log("New channel subscriptions:", response.data);
      } catch (error) {
        console.log(
          "Error creating channel subscriptions:",
          error?.response?.data
            ? error.response.data.description
            : error.message
        );
      }
    };

    const getContacts = async () => {
      setIsLoading(true);
      try {
        console.log("Getting contacts...");
        const subscriptions = [
          {
            id: `v2.users.${gcId}.outbound.contactlists.${props.contactListId}.export`,
          },
        ];
        await createNewChannelSubscriptions(
          notificationChannel.id,
          subscriptions
        );
        const contactListUri = await createContactListExport(
          props.contactListId
        );
        console.log("Export contact list response:", contactListUri.data);
      } catch (error) {
        console.log(
          "Get contacts error:",
          error?.response?.data?.message
            ? error.response.data.message
            : error.message
        );
      }
    };
    getContacts();
  }, []); // eslint-disable-line

  useEffect(() => {
    const getContactList = async () => {
      try {
        console.log("Getting contacts from file...");
        const response = await getContactListFile(contactListUri);
        setContacts(response);
        console.log("Deleting channel subscriptions...");
        await deleteChannelSubscriptions(notificationChannel.id);
      } catch (error) {
        console.log(
          "Get contacts error:",
          error?.response?.data
            ? error.response.data.description
            : error.message
        );
      }
      setIsLoading(false);
      setContactListUri("");
    };

    if (contactListUri !== "") getContactList();
  }, [contactListUri]); // eslint-disable-line

  const onContactRowClicked = async (params) => {
    setSelectedContact(params.row["inin-outbound-id"]);
    setMessage(params.row.TELNYX_MESSAGE);
  };

  return (
    <div>
      <Form size="small">
        <div>
          <Grid>
            <Grid.Column>
              <StyledBox>
                <DataGrid
                  getRowId={(row) => row["inin-outbound-id"]}
                  rows={contacts}
                  columns={contactTableColumns}
                  density={"compact"}
                  loading={isLoading}
                  onRowClick={(params) => {
                    onContactRowClicked(params);
                  }}
                  rowSelectionModel={props.selectedContactList}
                  sx={{
                    boxShadow: 3,
                    border: 0,
                    borderColor: "#CCCCCC",
                    "& .MuiDataGrid-cell:hover": {
                      color: "black",
                    },
                    ".MuiDataGrid-columnSeparator": {
                      display: "none",
                    },
                    "&.MuiDataGrid-root": {
                      border: "1px  solid #CCCCCC",
                    },
                  }}
                />
              </StyledBox>
            </Grid.Column>
          </Grid>
        </div>
        <Divider hidden />
        {selectedContact !== "" && message !== "" && (
          <div style={{ whiteSpace: "pre-wrap" }}>
            <Message icon="chat" size="tiny" header={message} />
          </div>
        )}
      </Form>
    </div>
  );
};

export default App;

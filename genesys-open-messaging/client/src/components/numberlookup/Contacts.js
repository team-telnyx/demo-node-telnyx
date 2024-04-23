import React, { useEffect } from "react";
import {
  createContactListExport,
  getContactListFile,
} from "../../services/contactlist.service";
import { Form, Grid } from "semantic-ui-react";
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
  const setSelectedContact = useSMSStore((state) => state.setSelectedContact);
  const contactListUri = useSMSStore((state) => state.contactListUri);
  const setContactListUri = useSMSStore((state) => state.setContactListUri);
  const contacts = useSMSStore((state) => state.contacts);
  const setContacts = useSMSStore((state) => state.setContacts);
  const isLoading = useSMSStore((state) => state.isLoading);
  const setIsLoading = useSMSStore((state) => state.setIsLoading);

  const gcId = useUserStore((state) => state.gcId);
  const notificationChannel = useUserStore(
    (state) => state.notificationChannel
  );

  const contactTableColumns = [
    {
      field: "Number",
      headerName: "Number",
      width: 120,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"Number"}</strong>,
    },
    {
      field: "NationalFormat",
      headerName: "National Format",
      width: 120,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"National Format"}</strong>,
    },
    {
      field: "CountryCode",
      headerName: "Country Code",
      width: 120,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"Country Code"}</strong>,
    },
    {
      field: "MobileCountryCode",
      headerName: "Mobile Country Code",
      width: 150,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"Mobile Country Code"}</strong>,
    },
    {
      field: "MobileNetworkCode",
      headerName: "Mobile Network Code",
      width: 150,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"Mobile Network Code"}</strong>,
    },
    {
      field: "CarrierName",
      headerName: "Carrier Name",
      width: 200,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"Carrier Name"}</strong>,
    },
    {
      field: "Type",
      headerName: "Type",
      width: 100,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"Type"}</strong>,
    },
    {
      field: "ValidNumber",
      headerName: "Valid Number",
      width: 100,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"Valid Number"}</strong>,
    },
    {
      field: "CallerName",
      headerName: "Caller Name",
      width: 300,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"Caller Name"}</strong>,
    },
  ];

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
    console.log("Contact selected:", params.row["inin-outbound-id"]);
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
      </Form>
    </div>
  );
};

export default App;

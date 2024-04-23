import React, { useEffect, useState } from "react";
import Contacts from "./Contacts";
import { getContactLists } from "../../services/contactlist.service";
import { startCampaign } from "../../services/campaign.service";
import {
  Form,
  Segment,
  Icon,
  Grid,
  ModalContent,
  ModalActions,
  Button,
  Header,
  Modal,
} from "semantic-ui-react";

import Box from "@mui/material/Box";
import { ToastContainer, toast } from "react-toastify";
import { DataGrid } from "@mui/x-data-grid";
import { styled } from "@mui/material/styles";

import "react-toastify/dist/ReactToastify.css";
import { useNLStore } from "../../store/nlSlice";

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

const App = () => {
  const [open, setOpen] = useState(false);
  const [openContacts, setOpenContacts] = useState(false);

  const contactLists = useNLStore((state) => state.contactLists);
  const setContactLists = useNLStore((state) => state.setContactLists);
  const selectedContactList = useNLStore((state) => state.selectedContactList);
  const setSelectedContactList = useNLStore(
    (state) => state.setSelectedContactList
  );
  const selectedContactListName = useNLStore(
    (state) => state.selectedContactListName
  );
  const setSelectedContactListName = useNLStore(
    (state) => state.setSelectedContactListName
  );

  const setContacts = useNLStore((state) => state.setContacts);
  const isLoading = useNLStore((state) => state.isLoading);
  const setIsLoading = useNLStore((state) => state.setIsLoading);

  const contactListColumns = [
    {
      field: "id",
      headerName: "Contact List ID",
      width: 300,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"Contact List ID"}</strong>,
    },
    {
      field: "name",
      headerName: "Contact List Name",
      width: 300,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"Contact List Name"}</strong>,
    },
    {
      field: "columnNames",
      headerName: "Columns",
      flex: 1,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"Columns"}</strong>,
    },
    {
      field: "size",
      headerName: "Size",
      width: 50,
      editable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"Size"}</strong>,
    },
    {
      field: "action",
      headerName: "Action",
      sortable: false,
      headerClassName: "header-class",
      renderHeader: () => <strong>{"Action"}</strong>,
      renderCell: (params) => {
        const onClick = (e) => {
          setContacts([]);
          setOpenContacts(true);
        };
        return (
          <Button icon size="mini" color="orange" onClick={onClick}>
            <Icon name="users" />
          </Button>
        );
      },
    },
  ];

  useEffect(() => {
    if (!contactLists[0]?.name) {
      getContactListsHandler();
    }
  }, []); // eslint-disable-line

  const getContactListsHandler = async (e) => {
    setIsLoading(true);
    try {
      const response = await getContactLists(
        process.env.REACT_APP_NL_CONTACT_LISTS_PREFIX
      );
      setContactLists(response.data.entities);
      setSelectedContactList("");
      setContacts([]);
      toast.success("Contact lists retrieved successfully");
      console.log("Contact lists:", response.data);
    } catch (error) {
      console.log("Get contact lists error:", error.message);
      toast.error(error.message);
    }
    setIsLoading(false);
  };

  const startCampaignHandler = async (e) => {
    setOpen(false);
    setIsLoading(true);
    try {
      const response = await startCampaign(selectedContactList, "NL");
      toast.success(response.data.message);
      console.log(response.data.message);
    } catch (error) {
      console.log("Start campaign error", error.message);
      toast.error(error.message);
    }
    setIsLoading(false);
  };

  const onContactListRowClicked = async (params) => {
    setSelectedContactList(params.row.id);
    setSelectedContactListName(params.row.name);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseContacts = () => {
    setOpenContacts(false);
  };

  return (
    <div style={{ margin: "0.8rem" }}>
      <Form size="small">
        <Form.Group inline widths={4}>
          <Form.Button
            fluid
            icon
            labelPosition="left"
            size="mini"
            onClick={getContactListsHandler}
            style={{
              background: "#00C08B",
              color: "white",
            }}
            disabled={isLoading}
          >
            {"Get Contact Lists"}
            <Icon name="address book outline" />
          </Form.Button>
          <Form.Field></Form.Field>
          <Form.Field></Form.Field>
          <Form.Button
            fluid
            icon
            labelPosition="left"
            size="mini"
            onClick={handleClickOpen}
            style={{
              background: "red",
              color: "white",
            }}
            disabled={selectedContactList === ""}
          >
            {"Start Campaign"}
            <Icon name="list ol" />
          </Form.Button>
        </Form.Group>
      </Form>

      <Segment color="green" className="m-6">
        <div>
          <Grid>
            <Grid.Column>
              <StyledBox>
                <DataGrid
                  rows={contactLists}
                  columns={contactListColumns}
                  // pageSizeOptions={[10, 50, 100]}
                  experimentalFeatures={
                    ({ newEditingApi: true }, { columnGrouping: true })
                  }
                  density={"compact"}
                  initialState={{
                    sorting: {
                      sortModel: [{ field: "name", sort: "asc" }],
                    },
                  }}
                  loading={isLoading}
                  onRowClick={(params) => {
                    onContactListRowClicked(params);
                  }}
                  rowSelectionModel={selectedContactList}
                  sx={{
                    boxShadow: 0,
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

      <Modal
        open={open}
        dimmer="blurring"
        size="small"
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
      >
        <Header
          icon="question circle outline"
          content={"START NUMBER LOOKUP CAMPAIGN"}
        />
        <ModalContent>
          <p>
            Please confirm starting of the <b>{selectedContactListName}</b>{" "}
            campaign usign the selected contact list?<br></br> It will send the
            message to all the contacts in the list and may incur significant
            charges.
          </p>
        </ModalContent>
        <ModalActions>
          <Button color="red" size="mini" onClick={() => handleClose(false)}>
            <Icon name="remove" /> No
          </Button>
          <Button
            color="green"
            size="mini"
            onClick={() => startCampaignHandler(false)}
          >
            <Icon name="checkmark" /> Yes
          </Button>
        </ModalActions>
      </Modal>

      <Modal
        open={openContacts}
        dimmer="blurring"
        size="fullscreen"
        onClose={() => setOpenContacts(false)}
        onOpen={() => setOpenContacts(true)}
      >
        <Header icon="list ol" content={"CONTACTS PREVIEW"} />
        <ModalContent>
          <Contacts
            contactListId={selectedContactList}
            columns={contactListColumns}
          />
        </ModalContent>
        <ModalActions>
          <Button
            color="red"
            size="mini"
            onClick={() => handleCloseContacts(false)}
          >
            Close
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
};

export default App;

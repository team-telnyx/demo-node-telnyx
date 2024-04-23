import React, { useEffect, useState } from "react";
import { getContactLists } from "../../services/contactlist.service";
import Contacts from "./Contacts";
import { startCampaign } from "../../services/campaign.service";
import { getSMSLibrary, getSMSResponse } from "../../services/response.service";
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
  Message,
  GridColumn,
} from "semantic-ui-react";

import Box from "@mui/material/Box";
import { ToastContainer, toast } from "react-toastify";
import { DataGrid } from "@mui/x-data-grid";
import { styled } from "@mui/material/styles";
import Highlighter from "react-highlight-words";
import "react-toastify/dist/ReactToastify.css";
import { useSMSStore } from "../../store/smsSlice";

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

  const [smsTemplateLibraryOptions, setSMSTemplateLibraryOptions] = useState(
    []
  );
  const [smsTemplateOptions, setSMSTemplateOptions] = useState([]);

  const setSelectedContact = useSMSStore((state) => state.setSelectedContact);
  const contactLists = useSMSStore((state) => state.contactLists);
  const setContactLists = useSMSStore((state) => state.setContactLists);
  const selectedContactList = useSMSStore((state) => state.selectedContactList);
  const setSelectedContactList = useSMSStore(
    (state) => state.setSelectedContactList
  );
  const selectedContactListName = useSMSStore(
    (state) => state.selectedContactListName
  );
  const setSelectedContactListName = useSMSStore(
    (state) => state.setSelectedContactListName
  );
  const contactListColumns = useSMSStore((state) => state.contactListColumns);
  const setContactListColumns = useSMSStore(
    (state) => state.setContactListColumns
  );
  const setContacts = useSMSStore((state) => state.setContacts);

  const smsTemplates = useSMSStore((state) => state.smsTemplates);
  const setSMSTemplates = useSMSStore((state) => state.setSMSTemplates);
  const smsTemplateLibraries = useSMSStore(
    (state) => state.smsTemplateLibraries
  );
  const setSMSTemplateLibraries = useSMSStore(
    (state) => state.setSMSTemplateLibraries
  );
  const smsTemplateLibrarySelected = useSMSStore(
    (state) => state.smsTemplateLibrarySelected
  );
  const setSMSTemplateLibrarySelected = useSMSStore(
    (state) => state.setSMSTemplateLibrarySelected
  );
  const smsTemplateSelected = useSMSStore((state) => state.smsTemplateSelected);
  const setSMSTemplateSelected = useSMSStore(
    (state) => state.setSMSTemplateSelected
  );
  const templateContent = useSMSStore((state) => state.smsTemplateContent);
  const setSMSTemplateContent = useSMSStore(
    (state) => state.setSMSTemplateContent
  );
  const substitutions = useSMSStore((state) => state.substitutions);
  const setSubstitutions = useSMSStore((state) => state.setSubstitutions);
  const substCheck = useSMSStore((state) => state.substCheck);
  const setSubstCheck = useSMSStore((state) => state.setSubstCheck);

  const isLoading = useSMSStore((state) => state.isLoading);
  const setIsLoading = useSMSStore((state) => state.setIsLoading);

  const contactListTableColumns = [
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
      valueFormatter: (params) => {
        const columnNames = params.value.filter((column) => {
          return !column.startsWith("TELNYX_");
        });
        return columnNames.join(", ");
      },
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
    const getSMSTemplateData = async () => {
      try {
        const response = await getSMSLibrary(
          process.env.REACT_APP_SMS_TEMPLATES_PREFIX
        );
        setSMSTemplateLibraries(response.data.entities);
        console.log("SMS template libraries:", response.data.entities);
        toast.success("SMS template libraries retrieved successfully");
      } catch (error) {
        console.log(
          "Get SMS template libraries error:",
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
    if (smsTemplateLibraries.length === 0) getSMSTemplateData();
    if (!contactLists[0]?.name) {
      getContactListsHandler();
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    const options = smsTemplateLibraries.map((option) => ({
      key: option.id,
      value: option.id,
      text: option.name,
    }));
    setSMSTemplateLibraryOptions(options);
    console.log("SMS template library options:", options);
  }, [smsTemplateLibraries]); // eslint-disable-line

  useEffect(() => {
    const getSMSResponseData = async () => {
      setIsLoading(true);
      try {
        const response = await getSMSResponse(smsTemplateLibrarySelected);
        setSMSTemplates(response.data.entities);
        console.log("SMS templates:", response.data.entities);
        toast.success("SMS templates retrieved successfully");
      } catch (error) {
        console.log(
          "Get SMS templates error:",
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
    if (smsTemplateLibrarySelected !== "") getSMSResponseData();
  }, [smsTemplateLibrarySelected]); // eslint-disable-line

  useEffect(() => {
    const options = smsTemplates.map((option) => ({
      key: option.id,
      value: option.id,
      text: option.name,
    }));
    setSMSTemplateOptions(options);
    console.log("SMS template options:", options);
  }, [smsTemplates]); // eslint-disable-line

  useEffect(() => {
    if (smsTemplateSelected === "") return;
    const selectedTemplate = smsTemplates.filter(
      (item) => item.id === smsTemplateSelected
    );
    console.log("Filtered template:", selectedTemplate);
    const templateContent = selectedTemplate[0]?.texts[0]?.content;
    setSMSTemplateContent(templateContent);
    const substitutions = selectedTemplate[0]?.substitutions;
    const substitutionsArr = substitutions.map((item) => {
      return item["id"];
    });
    setSubstitutions(substitutionsArr);
  }, [smsTemplateSelected]); // eslint-disable-line

  useEffect(() => {
    checkTemplateSubstitutions();
  }, [substitutions, contactListColumns]); // eslint-disable-line

  const checkTemplateSubstitutions = () => {
    if (smsTemplateSelected === "") return;
    const check = substitutions.every((r) => contactListColumns.includes(r));
    setSubstCheck(check);
  };

  const getContactListsHandler = async (e) => {
    // e.preventDefault();
    setIsLoading(true);
    try {
      const response = await getContactLists("SMS");
      setContactLists(response.data.entities);
      setSelectedContactList("");
      toast.success("Contact lists retrieved successfully");
      console.log("Contact lists:", response.data);
    } catch (error) {
      console.log(
        "Get contact lists error:",
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

  const startCampaignHandler = async (e) => {
    setOpen(false);
    setIsLoading(true);
    try {
      const response = await startCampaign(
        selectedContactList,
        "SMS",
        templateContent,
        contactListColumns
      );
      toast.success(response.data.message);
      console.log(response.data.message);
    } catch (error) {
      console.log(
        "Start campaign error",
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

  const onContactListRowClicked = async (params) => {
    setSelectedContactList(params.row.id);
    setSelectedContactListName(params.row.name);
    const columnNameArr = params.row.columnNames;
    const columnNames = columnNameArr.filter((column) => {
      return !column.startsWith("TELNYX_");
    });
    setContactListColumns(columnNames);
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

  useEffect(() => {
    if (!openContacts) setSelectedContact("");
  }, [openContacts]); // eslint-disable-line

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
            disabled={
              selectedContactList === "" ||
              smsTemplateSelected === "" ||
              !substCheck
            }
          >
            {"Start Campaign"}
            <Icon name="list ol" />
          </Form.Button>
        </Form.Group>

        <Segment color="green" className="m-6">
          <div>
            <Grid>
              <Grid.Column>
                <StyledBox>
                  <DataGrid
                    rows={contactLists}
                    columns={contactListTableColumns}
                    density={"compact"}
                    // slots={{ toolbar: GridToolbarQuickFilter }}
                    slotProps={{
                      toolbar: {
                        showquickfilter: "true",
                        quickfilterprops: { debounceMs: 500 },
                      },
                    }}
                    disableRowSelectionOnClick
                    // checkboxSelection
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
        <Segment color="orange" className="m-6">
          <Grid columns={2}>
            <GridColumn>
              <Form.Select
                fluid
                selection
                label="Template Libraries"
                options={smsTemplateLibraryOptions}
                value={smsTemplateLibrarySelected}
                placeholder="Select response library"
                onChange={(e, data) => {
                  setSMSTemplateLibrarySelected(data.value);
                }}
              />
              <Form.Select
                fluid
                search
                selection
                label="Templates"
                options={smsTemplateOptions}
                value={smsTemplateSelected}
                placeholder="Select response"
                onChange={(e, data) => {
                  setSMSTemplateSelected(data.value);
                }}
              />
            </GridColumn>
            <GridColumn>
              {smsTemplateSelected !== "" && (
                <Message
                  style={{ color: "black" }}
                  color={substCheck ? "green" : "red"}
                  size="small"
                  // icon="newspaper"
                  floating
                  // header="Have you heard about our mailing list?"
                  content={
                    <Highlighter
                      style={{ whiteSpace: "pre-wrap", fontWeight: "600" }}
                      highlightStyle={{
                        color: "red",
                        fontWeight: "800",
                        backgroundColor: "yellow",
                      }}
                      searchWords={contactListColumns}
                      autoEscape={true}
                      textToHighlight={templateContent}
                    />
                  }
                />
              )}
            </GridColumn>
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
        <Modal
          open={open}
          dimmer="blurring"
          size="small"
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
        >
          <Header
            icon="question circle outline"
            content={"START SMS CAMPAIGN"}
          />
          <ModalContent>
            <p>
              Please confirm starting of the <b>{selectedContactListName}</b>{" "}
              campaign usign the selected contact list?<br></br> It will send
              the message to all the contacts in the list and may incur
              significant charges.
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
      </Form>
    </div>
  );
};

export default App;

export const menuItems = [
  {
    id: 0,
    name: "messaging",
    display: "MESSAGING",
    submenu: [
      {
        id: 0,
        name: "sms",
        display: "SMS",
        roles: ["guest", "internal", "admin"],
        stepper: [
          {
            id: 0,
            component: "Send SMS",
            title: "Send SMS",
            description: "Send individual message to a phone number",
            icon: "mobile alternate",
          },
          {
            id: 1,
            component: "SMS Campaign",
            title: "SMS Campaigns",
            description: "Manage contact lists and run SMS campaigns",
            icon: "database",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "numberlookup",
    display: "NUMBER LOOKUP",
    submenu: [
      {
        id: 0,
        name: "numberlookup",
        display: "Check Number",
        roles: ["guest", "internal", "admin"],
        stepper: [
          {
            id: 0,
            component: "Number Lookup",
            title: "Number Lookup",
            description: "Check information about individual number",
            icon: "address book outline",
            color: "warning",
          },
          {
            id: 1,
            component: "Number Lookup Campaign",
            title: "Number Lookup Campaign",
            description: "Run Number Lookup Campaigns",
            icon: "database",
            color: "success",
          },
        ],
      },
    ],
  },
];

import { useState } from "react";
import {
  AppBar,
  Box,
  CssBaseline,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";

import { NotificationsPage } from "./pages/NotificationsPage";
import { PriorityInboxPage } from "./pages/PriorityInboxPage";

export default function App() {
  const [tab, setTab] = useState("all");

  return (
    <>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ minHeight: 56 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Notifications App
          </Typography>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="All" value="all" />
            <Tab label="Priority Inbox" value="priority" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box sx={{ pb: 4 }}>
        {tab === "all" && <NotificationsPage />}
        {tab === "priority" && <PriorityInboxPage />}
      </Box>
    </>
  );
}

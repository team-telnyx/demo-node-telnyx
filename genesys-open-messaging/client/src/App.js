import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "./components/home";
import Error from "./components/home/Error";
import Auth from "./components/auth";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route element={<Home />} path="/" exact />
        <Route element={<Error />} path="*" />
        <Route element={<Auth />} path="/auth" />
      </Routes>
    </Router>
  );
};

export default App;

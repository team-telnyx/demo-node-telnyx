import "dotenv/config";
import http from "http";
import express from "express";
import dtmfDialController from "./controllers/dtmfDialController";

const app = express();
const httpServer = http.createServer(app);

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Hello World 👋 🌎");
});

const dtmfDialPath = "/dtmfDial";
app.use(
  dtmfDialPath,
  express.urlencoded({ extended: true }),
  dtmfDialController
);

const port = process.env.PORT || 3000;
httpServer.listen(port);
console.log(`Server listening on port: ${port}`);

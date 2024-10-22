import "dotenv/config";
import http from "http";
import express from "express";
import texmlController from "./controllers/texmlController";

const app = express();
const httpServer = http.createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World 👋 🌎");
});

const texmlPath = "/texml";
app.use(texmlPath, express.urlencoded({ extended: true }), texmlController);

const port = process.env.PORT || 3000;
httpServer.listen(port);
console.log(`Server listening on port: ${port}`);

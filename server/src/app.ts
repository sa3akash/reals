import express from "express";
import cors from "cors";
import "dotenv/config";

import { globalErrorHandler } from "error-express";

import { uploadRoutes } from "./routes/upload.routes";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*", // Allow all origins, adjust as necessary for security
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/upload", uploadRoutes.getRoutes());

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

import express from "express";
import cors from "cors";
import apiRoutes from "./routes/apiRoutes.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({
  // origin: "http://localhost:5173",
  origin: "https://navifymodel.netlify.app",
  // origin: ["http://localhost:5173", "https://navifymodel.netlify.app"],
  credentials: true,
}));

app.use(express.json());
app.use("/api/v1", apiRoutes);

export default app;

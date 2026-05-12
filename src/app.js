import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.middleware.js";
import {env} from "./configs/env.js"

const app = express();

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// Logger middleware
app.use(morgan("dev"));

// CORS
app.use(cors({
    // origin:process.env.CORS_ORIGIN,
    origin:env.CORS_ORIGIN,
    credentials:true
}))

// Body parsers
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))

// Static files
app.use(express.static("public"));

// Cookie parser
app.use(cookieParser());

/*
========================
Routes will go here
========================
*/

// Example:
// app.use("/api/v1/users", userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(errorHandler);

export {app}
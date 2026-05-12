import mongoose from "mongoose";
import {DB_NAME} from "../constants/index.js"
import {env} from "./env.js"

const connectDB = async () =>{
  try {
    const connectionInstance = await mongoose.connect(`${env.MONGODB_URI}/${DB_NAME}`);
    console.log(`\n MongoDB Connected !! Host: ${connectionInstance.connection.host}`)
  } catch (error) {
    console.log("MongoDB connection failed:", error);
    throw error;
  }
}

export default connectDB;
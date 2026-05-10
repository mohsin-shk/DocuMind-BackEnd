import dotenv from "dotenv"
import connectDB from "./configs/db.js"

dotenv.config({
    path:"./env"
})

connectDB()

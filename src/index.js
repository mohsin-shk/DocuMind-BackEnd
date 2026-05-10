import dotenv from "dotenv"
import connectDB from "./configs/db.js"
import { app } from "./app.js"

dotenv.config({
    path:"./env"
})

connectDB()
.then(()=>{
    app.on((err)=>{
        console.log(`Server Connection Failed:`, err)
    });

    app.listen(process.env.PORT || 8000,()=>{
        console.log(`🛠️ Server is listening on port: ${process.env.PORT || 8000}`)
    })
})
.catch((err)=>{
    console.log("Mongo DB connection failed!!!:",err)
})
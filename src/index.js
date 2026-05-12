// import dotenv from "dotenv"
import connectDB from "./configs/db.js"
import { app } from "./app.js"
import {env} from "./configs/env.js"

// dotenv.config({
//     path:"./.env"
// })

connectDB()
.then(()=>{
    app.listen(env.PORT || 8000,()=>{
        console.log(`🛠️ Server is listening on port: ${env.PORT || 8000}`)
    })
})
.catch((err)=>{
    console.log("Mongo DB connection failed!!!:",err)
})
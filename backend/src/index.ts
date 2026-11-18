import "dotenv/config";
import express from "express";
import cors from "cors";
import {sync} from "./db.ts"

const port = process.env.PORT;
const host = "localhost";

const app = express();

app.use(cors());
app.use(express.json())

app.listen(port, async() => {
    if (process.env.SYNC === "true") {
        await sync()
        
    }
    console.log(`api jooskeb http://${host}:${port}`);
})
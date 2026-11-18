import { Sequelize, DataTypes } from "sequelize";
import { initModels } from "../models/index.ts";


const sequelize = new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USERNAME!,
    process.env.DB_PASSWORD!,
    {
        host: process.env.DB_HOSTNAME!,
        port: Number(process.env.DB_PORT) || 3306,
        dialect: "mariadb",
        logging: console.log
    }
);

const { User, Category, Material } = initModels(sequelize); //add tables to db

// Andmebaasiühenduse kontroll
const connect = async (): Promise<void> => {
    try{
        await sequelize.authenticate();
        console.log("Connection established");
    }
    catch (error)
    {
        console.log("db connection error", error)
        throw error; //block start if bd down
    }
}

const db = {
    Sequelize, sequelize, User, Category, Material //(modelobj)
}
const sync = async(): Promise<void> => {
    await sequelize.sync({alter:true})
    console.log("Sync")
}
export {db, sync, connect, sequelize}
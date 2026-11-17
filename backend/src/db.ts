import { Sequelize, DataTypes } from "sequelize";


const sequalize = new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USERNAME!,
    process.env.DB_PASSWORD!,
    {
        host: process.env.DB_HOSTNAME!,
        dialect: "mariadb",
        logging: console.log
    }
)

// admebasimigraatorr
const connect = async (): Promise<void> => {
    try{
        await sequalize.authenticate();
        console.log("Connection established");
    }
    catch (error)
    {
        console.log("db connection eror", error)

    }
}

const db = {
    Sequelize, sequalize, //(modelobj)
}
const sync = async(): Promise<void> => {
    await sequalize.sync({alter:true})
    console.log("Sync")
}
export {db, sync, connect}
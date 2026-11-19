import "dotenv/config";
import express from "express";
import cors from "cors";
import {sync, sequelize} from "./config/db.ts"
import authRoutes from "./routes/authRoutes.ts";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.ts";
import categoryRoutes from "./routes/categoryRoutes.ts";

const port = Number(process.env.PORT) || 3000; //numeric port and reserve
const host = "localhost";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })); // cors lol not (*)
app.use(express.json())

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);

// Temp. test for server and cors
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

/* app.listen(port, async() => {
    if (process.env.SYNC === "true") {
        await sync()
        
    }
    console.log('api jookseb http://${host}:${port}');
}) */
const startServer = async () => {
  try {
    // Check MariaDB connection on start
    await sequelize.authenticate();
    console.log("MariaDB connection established successfully.");

    // Check SYNC=true in .env
    if (process.env.SYNC === "true") {
      await sync();
      console.log("Database models synchronized.");
    }

    // 3. Start HTTP-server only after connection to db
    app.listen(port, host, () => {
      console.log(`API jookseb: http://${host}:${port}`);
    });
  } catch (error) {
    console.error("Unable to connect to MariaDB:", error);
    process.exit(1);
  }
};

startServer();
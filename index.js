import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./database.js";
import AuthRouter from "./routes/AuthRouter.js";
import ExpenseRouter from "./routes/ExpenseRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

pool.connect()
    .then((client) => {
        console.log(`Connected to database: ${process.env.DB_NAME}`);
        client.release();
    })
    .catch((error) => {
        console.error("Database connection error: ", error);
    });

app.use("/auth", AuthRouter);
app.use("/expense", ExpenseRouter);

app.use((req, res) => {
    res.status(404).send("<h1>Not Found</h1>");
});

app.listen(PORT, () =>
    console.log(`Server is running on http://localhost:${PORT}`)
);

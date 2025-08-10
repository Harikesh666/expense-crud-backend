import express from "express";
import bcrypt from "bcrypt";
import pool from "../database.js";
import jwt from "jsonwebtoken";

const AuthRouter = express.Router();

AuthRouter.post("/register", async (req, res) => {
    const { name, password, confirmPassword } = req.body;

    if (!name || !password) {
        return res
            .status(400)
            .json({ error: "Name and password are required" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
    }

    try {
        const existingUser = await pool.query(
            `SELECT id FROM users WHERE name = $1`,
            [name]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                error: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (name, password) VALUES ($1, $2) RETURNING id, name, create_dt`,
            [name, hashedPassword]
        );

        res.status(201).json({
            message: "User Registered Successfully!",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Error registering user: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

AuthRouter.post("/login", async (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res
            .status(400)
            .json({ error: "Name and Password are required" });
    }

    try {
        const userResult = await pool.query(
            `SELECT * FROM users WHERE name = $1`,
            [name]
        );

        if (userResult.rows.length === 0) {
            return res
                .status(400)
                .json({ error: "Invalid username or password" });
        }

        const user = userResult.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res
                .status(400)
                .json({ error: "Invalid username or password" });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Login successful", user, token });
    } catch (error) {
        console.error("Error logging in user: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default AuthRouter;

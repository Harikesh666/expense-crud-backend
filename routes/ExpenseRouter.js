import express from "express";
import pool from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const ExpenseRouter = express.Router();

ExpenseRouter.post("/add-expense", authenticateToken, async (req, res) => {
    let { user_id, amount, description, category, date } = req.body;
    user_id = parseInt(user_id, 10);

    if (!user_id || !amount || !description || !category || !date) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO expenses (user_id, amount, description, category, expense_date) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [user_id, amount, description, category, date]
        );
        res.status(201).json({ expense: result.rows[0] });
    } catch (error) {
        console.error("Error adding expense:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

ExpenseRouter.get(
    "/get-expenses/:user_id",
    authenticateToken,
    async (req, res) => {
        const user_id = parseInt(req.params.user_id, 10);

        if (isNaN(user_id)) {
            return res.status(400).json({ error: "Invalid User ID" });
        }

        try {
            const result = await pool.query(
                "SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC",
                [user_id]
            );
            res.status(200).json({ expenses: result.rows });
        } catch (error) {
            console.error("Error fetching expenses:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
);

ExpenseRouter.put(
    "/edit-expense/:expenseId",
    authenticateToken,
    async (req, res) => {
        const expenseId = parseInt(req.params.expenseId, 10);
        const { amount, description, category, date } = req.body;

        if (!expenseId || !amount || !description || !category || !date) {
            return res.status(400).json({ error: "All fields are required" });
        }

        try {
            const result = await pool.query(
                `UPDATE expenses 
             SET amount = $1, description = $2, category = $3, expense_date = $4 
             WHERE id = $5 RETURNING *`,
                [amount, description, category, date, expenseId]
            );
            res.status(200).json({ expense: result.rows[0] });
        } catch (error) {
            console.error("Error editing expense:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
);

ExpenseRouter.delete(
    "/delete-expense/:expenseId",
    authenticateToken,
    async (req, res) => {
        const expenseId = parseInt(req.params.expenseId, 10);

        if (!expenseId) {
            return res.status(400).json({ error: "Expense ID is required" });
        }

        try {
            await pool.query("DELETE FROM expenses WHERE id = $1", [expenseId]);
            return res
                .status(200)
                .json({ message: "Expense Deleted Successfully" });
        } catch (error) {
            console.error("Error deleting expense:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
);

export default ExpenseRouter;

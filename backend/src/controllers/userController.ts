import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { Op, UniqueConstraintError, ValidationError } from "sequelize";
import { User } from "../models/User.ts";
import type { UserRole } from "../models/User.ts";

const ALLOWED_ROLES: UserRole[] = ["guest", "user", "curator", "admin"];

export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "role"],
      order: [["username", "ASC"]],
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const user = await User.findByPk(id, {
      attributes: ["id", "username", "email", "role"],
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get user by id error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ message: "username, email, and password are required" });
      return;
    }

    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters long" });
      return;
    }

    const assignedRole: UserRole = role ?? "user";
    if (!ALLOWED_ROLES.includes(assignedRole)) {
      res.status(400).json({
        message: `Invalid role. Allowed values: ${ALLOWED_ROLES.join(", ")}`,
      });
      return;
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      res.status(409).json({ message: "User with this email or username already exists" });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username: String(username).trim(),
      email: String(email).trim(),
      password_hash,
      role: assignedRole,
    });

    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      res.status(409).json({ message: "Username or email already exists" });
      return;
    }
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.errors.map((e) => e.message).join(", ") });
      return;
    }
    console.error("Create user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { username, email, password, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (username !== undefined) {
      if (typeof username !== "string" || username.trim().length === 0) {
        res.status(400).json({ message: "username cannot be empty" });
        return;
      }
      user.username = username.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || email.trim().length === 0) {
        res.status(400).json({ message: "email cannot be empty" });
        return;
      }
      user.email = email.trim();
    }

    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 6) {
        res.status(400).json({ message: "Password must be at least 6 characters long" });
        return;
      }
      user.password_hash = await bcrypt.hash(password, 10);
    }

    if (role !== undefined) {
      if (!ALLOWED_ROLES.includes(role)) {
        res.status(400).json({
          message: `Invalid role. Allowed values: ${ALLOWED_ROLES.join(", ")}`,
        });
        return;
      }
      if (req.user && req.user.id === user.id && role !== "admin") {
        res.status(400).json({ message: "You cannot remove your own admin role" });
        return;
      }
      user.role = role;
    }

    await user.save();

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      res.status(409).json({ message: "Username or email already exists" });
      return;
    }
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.errors.map((e) => e.message).join(", ") });
      return;
    }
    console.error("Update user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    if (req.user && req.user.id === id) {
      res.status(400).json({ message: "You cannot delete your own account" });
      return;
    }

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await user.destroy();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
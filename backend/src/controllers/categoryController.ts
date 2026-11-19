import type { Request, Response } from "express";
import { UniqueConstraintError, ForeignKeyConstraintError } from "sequelize";
import { Category } from "../models/Category.ts";

export const getAllCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.findAll({
      order: [["name", "ASC"]],
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const category = await Category.findByPk(id);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.status(200).json(category);
  } catch (error) {
    console.error("Get category by id error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ message: "Category name is required" });
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      res.status(400).json({ message: "Category name must be at most 100 characters" });
      return;
    }

    const newCategory = await Category.create({ name: trimmedName });
    res.status(201).json(newCategory);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      res.status(409).json({ message: "Category with this name already exists" });
      return;
    }
    console.error("Create category error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ message: "Category name is required" });
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      res.status(400).json({ message: "Category name must be at most 100 characters" });
      return;
    }

    const category = await Category.findByPk(id);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    category.name = trimmedName;
    await category.save();

    res.status(200).json(category);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      res.status(409).json({ message: "Category with this name already exists" });
      return;
    }
    console.error("Update category error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const category = await Category.findByPk(id);

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    await category.destroy();
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    if (error instanceof ForeignKeyConstraintError) {
      res.status(409).json({ message: "Cannot delete category that has linked materials" });
      return;
    }
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
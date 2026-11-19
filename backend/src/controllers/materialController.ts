import type { Request, Response } from "express";
import { Op, ValidationError } from "sequelize";
import { Material } from "../models/Material.ts";
import type { MaterialType } from "../models/Material.ts";
import { Category } from "../models/Category.ts";
import { User } from "../models/User.ts";

const ALLOWED_TYPES: MaterialType[] = ["video", "text", "presentation", "file", "link"];

export const getAllMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category_id, type, tag, search } = req.query;
    const andConditions: Record<string, unknown>[] = [];

    // 1. Visibility (is_public)
    if (!req.user) {
      // Guest see only public
      andConditions.push({ is_public: true });
    } else if (req.user.role !== "admin" && req.user.role !== "curator") {
      // Обычные пользователи видят публичные + свои приватные
      andConditions.push({
        [Op.or]: [{ is_public: true }, { user_id: req.user.id }],
      });
    }

    // 2. Filter by category
    if (typeof category_id === "string" && category_id.trim()) {
      andConditions.push({ category_id: category_id.trim() });
    }

    // 3. Filter by type of materials
    if (typeof type === "string" && ALLOWED_TYPES.includes(type as MaterialType)) {
      andConditions.push({ type });
    }

    // 4. Filter by tag
    if (typeof tag === "string" && tag.trim()) {
      andConditions.push({
        tags: { [Op.like]: `%${tag.trim()}%` },
      });
    }

    // 5. Search by name, type, category
    if (typeof search === "string" && search.trim()) {
      const q = `%${search.trim()}%`;
      andConditions.push({
        [Op.or]: [
          { title: { [Op.like]: q } },
          { description: { [Op.like]: q } },
          { tags: { [Op.like]: q } },
        ],
      });
    }

    const materials = await Material.findAll({
      ...(andConditions.length > 0 ? { where: { [Op.and]: andConditions } } : {}),
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
        { model: User, as: "author", attributes: ["id", "username"] },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(materials);
  } catch (error) {
    console.error("Get all materials error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMaterialById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const material = await Material.findByPk(id, {
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
        { model: User, as: "author", attributes: ["id", "username"] },
      ],
    });

    if (!material) {
      res.status(404).json({ message: "Material not found" });
      return;
    }

    // Controll of access level
    if (!material.is_public) {
      const isOwner = req.user && req.user.id === material.user_id;
      const isModerator = req.user && (req.user.role === "admin" || req.user.role === "curator");
      if (!isOwner && !isModerator) {
        res.status(403).json({ message: "Forbidden: this material is private" });
        return;
      }
    }

    res.status(200).json(material);
  } catch (error) {
    console.error("Get material by id error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { title, description, type, content_url, tags, is_public, category_id } = req.body;

    if (!title || !description || !type || !content_url || !category_id) {
      res.status(400).json({
        message: "title, description, type, content_url, and category_id are required",
      });
      return;
    }

    if (!ALLOWED_TYPES.includes(type)) {
      res.status(400).json({
        message: `Invalid type. Allowed values: ${ALLOWED_TYPES.join(", ")}`,
      });
      return;
    }

    if (typeof title === "string" && title.trim().length > 100) {
      res.status(400).json({ message: "title must be at most 100 characters" });
      return;
    }

    if (typeof content_url === "string" && content_url.trim().length > 500) {
      res.status(400).json({ message: "content_url must be at most 500 characters" });
      return;
    }

    // Controll exist or not
    const category = await Category.findByPk(String(category_id));
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    const newMaterial = await Material.create({
      title: String(title).trim(),
      description: String(description).trim(),
      type,
      content_url: String(content_url).trim(),
      tags: tags ? String(tags).trim() : null,
      is_public: typeof is_public === "boolean" ? is_public : true,
      user_id: req.user.id,
      category_id: category.id,
    });

    res.status(201).json(newMaterial);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.errors.map((e) => e.message).join(", ") });
      return;
    }
    console.error("Create material error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const id = String(req.params.id);
    const material = await Material.findByPk(id);

    if (!material) {
      res.status(404).json({ message: "Material not found" });
      return;
    }

    // User control author or curator / admin
    const isOwner = material.user_id === req.user.id;
    const isModerator = req.user.role === "admin" || req.user.role === "curator";
    if (!isOwner && !isModerator) {
      res.status(403).json({ message: "Forbidden: you can only edit your own materials" });
      return;
    }

    const { title, description, type, content_url, tags, is_public, category_id } = req.body;

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0 || title.trim().length > 100) {
        res.status(400).json({ message: "title must be 1..100 characters" });
        return;
      }
      material.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.trim().length === 0) {
        res.status(400).json({ message: "description cannot be empty" });
        return;
      }
      material.description = description.trim();
    }

    if (type !== undefined) {
      if (!ALLOWED_TYPES.includes(type)) {
        res.status(400).json({
          message: `Invalid type. Allowed values: ${ALLOWED_TYPES.join(", ")}`,
        });
        return;
      }
      material.type = type;
    }

    if (content_url !== undefined) {
      if (typeof content_url !== "string" || content_url.trim().length === 0 || content_url.trim().length > 500) {
        res.status(400).json({ message: "content_url must be 1..500 characters" });
        return;
      }
      material.content_url = content_url.trim();
    }

    if (tags !== undefined) {
      material.tags = tags ? String(tags).trim() : null;
    }

    if (typeof is_public === "boolean") {
      material.is_public = is_public;
    }

    if (category_id !== undefined) {
      const category = await Category.findByPk(String(category_id));
      if (!category) {
        res.status(404).json({ message: "Category not found" });
        return;
      }
      material.category_id = category.id;
    }

    await material.save();
    res.status(200).json(material);
  } catch (error) {
    console.error("Update material error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const id = String(req.params.id);
    const material = await Material.findByPk(id);

    if (!material) {
      res.status(404).json({ message: "Material not found" });
      return;
    }

    // User control author or curator / admin
    const isOwner = material.user_id === req.user.id;
    const isModerator = req.user.role === "admin" || req.user.role === "curator";
    if (!isOwner && !isModerator) {
      res.status(403).json({ message: "Forbidden: you can only delete your own materials" });
      return;
    }

    await material.destroy();
    res.status(200).json({ message: "Material deleted successfully" });
  } catch (error) {
    console.error("Delete material error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
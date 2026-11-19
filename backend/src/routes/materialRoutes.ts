import { Router } from "express";
import {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "../controllers/materialController.ts";
import { authenticate, optionalAuthenticate } from "../middleware/authMiddleware.ts";

const router = Router();

/**
 * @swagger
 * /api/materials:
 *   get:
 *     summary: Get learning materials with optional filtering and search
 *     tags: [Materials]
 *     security:
 *       - {}
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category UUID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [video, text, presentation, file, link]
 *         description: Filter by material type
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag substring
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, description, or tags
 *     responses:
 *       200:
 *         description: List of matching materials
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Material'
 */
router.get("/", optionalAuthenticate, getAllMaterials);

/**
 * @swagger
 * /api/materials/{id}:
 *   get:
 *     summary: Get a single material by ID
 *     tags: [Materials]
 *     security:
 *       - {}
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Material details
 *       403:
 *         description: Private material access denied
 *       404:
 *         description: Material not found
 */
router.get("/:id", optionalAuthenticate, getMaterialById);

/**
 * @swagger
 * /api/materials:
 *   post:
 *     summary: Create a new learning material (Authenticated users)
 *     tags: [Materials]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, type, content_url, category_id]
 *             properties:
 *               title:
 *                 type: string
 *                 example: TypeScript ja Express 5 sissejuhatus
 *               description:
 *                 type: string
 *                 example: Praktiline juhend REST API loomiseks
 *               type:
 *                 type: string
 *                 enum: [video, text, presentation, file, link]
 *                 example: link
 *               content_url:
 *                 type: string
 *                 example: https://expressjs.com/
 *               tags:
 *                 type: string
 *                 example: typescript,express,backend
 *               is_public:
 *                 type: boolean
 *                 example: true
 *               category_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Material created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.post("/", authenticate, createMaterial);

/**
 * @swagger
 * /api/materials/{id}:
 *   put:
 *     summary: Update a material (Owner, Curator, or Admin)
 *     tags: [Materials]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [video, text, presentation, file, link]
 *               content_url:
 *                 type: string
 *               tags:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *               category_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Material updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Material or Category not found
 */
router.put("/:id", authenticate, updateMaterial);

/**
 * @swagger
 * /api/materials/{id}:
 *   delete:
 *     summary: Delete a material (Owner, Curator, or Admin)
 *     tags: [Materials]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Material deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Material not found
 */
router.delete("/:id", authenticate, deleteMaterial);

export default router;
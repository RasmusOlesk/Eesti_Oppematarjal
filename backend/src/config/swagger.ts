import swaggerJsdoc from "swagger-jsdoc";
import type { Options } from "swagger-jsdoc";

const options: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Eesti IT Õppematerjalide Andmebaas API",
      version: "1.0.0",
      description: "REST API documentation for Estonian IT Learning Materials Database",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8080}`,
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            username: { type: "string", example: "juri_dev" },
            email: { type: "string", format: "email", example: "juri@example.com" },
            role: { type: "string", enum: ["guest", "user", "curator", "admin"], example: "user" },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "TypeScript & Node.js" },
          },
        },
        Material: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string", example: "Express 5 REST API juhend" },
            description: { type: "string", example: "Samm-sammuline juhend" },
            type: { type: "string", enum: ["video", "text", "presentation", "file", "link"] },
            content_url: { type: "string", example: "https://example.com/guide" },
            tags: { type: "string", nullable: true, example: "express,typescript,api" },
            is_public: { type: "boolean", example: true },
            user_id: { type: "string", format: "uuid" },
            category_id: { type: "string", format: "uuid" },
            created_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
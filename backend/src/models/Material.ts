import { DataTypes, Model } from "sequelize";
import type { InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, Sequelize } from "sequelize";
import type { User } from "./User.ts";
import type { Category } from "./Category.ts";

export type MaterialType = "video" | "text" | "presentation" | "file" | "link";

export class Material extends Model<InferAttributes<Material>, InferCreationAttributes<Material>> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare description: string;
  declare type: MaterialType;
  declare content_url: string;
  declare tags: CreationOptional<string | null>;
  declare is_public: CreationOptional<boolean>;
  declare user_id: ForeignKey<User["id"]>;
  declare category_id: ForeignKey<Category["id"]>;
  declare created_at: CreationOptional<Date>;
}

export default function initMaterialModel(sequelize: Sequelize) {
  Material.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("video", "text", "presentation", "file", "link"),
        allowNull: false,
      },
      content_url: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      tags: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      is_public: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      category_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "Materials",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  return Material;
}
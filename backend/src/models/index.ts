import type { Sequelize } from "sequelize";
import initUserModel, { User } from "./User.ts";
import initCategoryModel, { Category } from "./Category.ts";
import initMaterialModel, { Material } from "./Material.ts";

export function initModels(sequelize: Sequelize) {
  initUserModel(sequelize);
  initCategoryModel(sequelize);
  initMaterialModel(sequelize);

  // Users (1) -< (Many) Materials
  User.hasMany(Material, {
    foreignKey: "user_id",
    as: "materials",
    onDelete: "CASCADE",
  });
  Material.belongsTo(User, {
    foreignKey: "user_id",
    as: "author",
  });

  // Categories (1) -< (Many) Materials
  Category.hasMany(Material, {
    foreignKey: "category_id",
    as: "materials",
    onDelete: "RESTRICT",
  });
  Material.belongsTo(Category, {
    foreignKey: "category_id",
    as: "category",
  });

  return { User, Category, Material };
}

export { User, Category, Material };
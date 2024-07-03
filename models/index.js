const Users = require("./users");
const Files = require("./files");

// 定义关联关系
Users.hasMany(Files, { as: "createdFiles", foreignKey: "created_by" });
Users.hasMany(Files, { as: "updatedFiles", foreignKey: "updated_by" });
Users.hasMany(Files, { as: "publicFiles", foreignKey: "public_by" });

Files.belongsTo(Users, { as: "creator", foreignKey: "created_by" });
Files.belongsTo(Users, { as: "updater", foreignKey: "updated_by" });
Files.belongsTo(Users, { as: "publisher", foreignKey: "public_by" });

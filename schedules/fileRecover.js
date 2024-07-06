const cron = require("node-cron");
const { Op } = require("sequelize");
const fs = require("fs").promises;
const Files = require("../models/files");
const Users = require("../models/users");

// 定时任务每天22:52分运行一次
cron.schedule("52 23 * * *", async () => {
  const sevenDaysAgo = new Date(new Date() - 7 * 24 * 60 * 60 * 1000);

  try {
    // 查找需要删除的记录
    const records = await Files.findAll({
      where: {
        is_deleted: true,
        deleted_at: {
          [Op.lt]: sevenDaysAgo, // 查找 deletedAt 字段小于七天前的记录
        },
      },
    });

    // 收集所有文件删除和用户容量更新的Promise
    const fileDeletePromises = [];
    const userUpdates = {};

    for (const record of records) {
      const {
        real_file_location,
        real_file_thumb_location,
        created_by,
        file_size,
      } = record;

      if (real_file_location) {
        fileDeletePromises.push(
          fs.unlink(real_file_location).catch((err) => {
            console.error(`Failed to delete file: ${real_file_location}`, err);
          })
        );
      }

      if (real_file_thumb_location) {
        fileDeletePromises.push(
          fs.unlink(real_file_thumb_location).catch((err) => {
            console.error(
              `Failed to delete thumbnail: ${real_file_thumb_location}`,
              err
            );
          })
        );
      }

      if (userUpdates[created_by]) {
        userUpdates[created_by] -= file_size;
      } else {
        userUpdates[created_by] =
          (
            await Users.findOne({
              where: { id: created_by },
            })
          ).used_capacity - file_size;
      }
    }

    // 批量删除文件
    await Promise.all(fileDeletePromises);

    // 批量更新用户容量
    const userUpdatePromises = [];
    for (const [userId, newCapacity] of Object.entries(userUpdates)) {
      userUpdatePromises.push(
        Users.update({ used_capacity: newCapacity }, { where: { id: userId } })
      );
    }
    await Promise.all(userUpdatePromises);

    // 真实删除数据库记录
    await Files.destroy({
      where: {
        is_deleted: true,
        deleted_at: {
          [Op.lt]: sevenDaysAgo,
        },
      },
      force: true, // 真实删除
    });

    console.log("Old records and associated files deleted successfully.");
  } catch (error) {
    console.error("Error deleting old records and associated files:", error);
  }
});

const path = require("path");
const fs = require("fs");

module.exports = () => {
  const dirs = [
    path.join(__dirname, "..", "provisional"),
    path.join(__dirname, "..", "resource"),
  ];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

const path = require('path');

const formatResponse = (type, filePath) => {
  const fileName = path.basename(filePath);
  const fileUrl = `http://localhost:3000/${fileName}`;

  if (type === 'md') {
    return `![${fileName}](${fileUrl})`;
  } else {
    return { url: fileUrl };
  }
};

module.exports = { formatResponse };

function appendSuffixToFilename(filename, suffix) {
    // 找到最后一个点的位置
    const lastDotIndex = filename.lastIndexOf('.');
    // 如果找到了点，则在点之前插入后缀
    if (lastDotIndex !== -1) {
      return `${filename.substring(
        0,
        lastDotIndex
      )}_${suffix}${filename.substring(lastDotIndex)}`;
    } else {
      // 如果没有点，直接在末尾添加后缀
      return `${filename}_${suffix}`;
    }
  }
  
  module.exports = { appendSuffixToFilename };
  
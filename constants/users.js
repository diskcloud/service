const USER_STATUS = {
  ACTIVE: "ACTIVE", // 用户账号已激活
  INACTIVE: "INACTIVE", // 用户账号未激活
  BANNED: "BANNED", // 用户账号被封禁
  PENDING: "PENDING", // 用户账号待审核
};

const USER_ACTION_TYPES = {
  disabled: {
    label: "disabled",
    value: USER_STATUS.BANNED,
  },
  activated: {
    label: "activated",
    value: USER_STATUS.ACTIVE,
  },
};

module.exports = {
  USER_STATUS,
  USER_ACTION_TYPES,
};

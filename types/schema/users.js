const Joi = require("joi");

const USERS_LOGIN_POST = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

module.exports = {
  USERS_LOGIN_POST,
};

const Joi = require("joi");

const USERS_LOGIN_POST = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const USER_REST_ID = Joi.object({
  id: Joi.string().required(),
});

module.exports = {
  USER_REST_ID,
  USERS_LOGIN_POST,
};

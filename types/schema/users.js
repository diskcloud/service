const Joi = require("joi");
const { USER_ACTION_TYPES } = require("../../constants/users");

const USERS_LOGIN_POST = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const USER_REST_ID = Joi.object({
  id: Joi.string().required(),
  action: Joi.string()
    .valid(...Object.keys(USER_ACTION_TYPES))
    .required(),
});

module.exports = {
  USER_REST_ID,
  USERS_LOGIN_POST,
};

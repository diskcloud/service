const Joi = require("joi");

/**
  业务相关定义 = model business method format
 */
const FILES_UPLOAD_POST_QUERY = Joi.object({
  compress: Joi.string()
    .valid("true", "false").default("false"),
  keepTemp: Joi.string()
    .valid("true", "false").default("false"),
  isThumb: Joi.string()
    .valid("true", "false").default("true"),
  isPublic: Joi.string()
    .valid("true", "false").default("false"),
  type: Joi.string()
    .valid("md", "url").required()
});

const FILES_LIST_GET_QUERY = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
  type: Joi.string().valid('image', 'video', 'file', 'all').default('all')
});


/**
  通用定义 = model format fields
 */

const FILES_REST_ID = Joi.object({
  id: Joi.string().required()
});

const FILES_BODY_BATCH_IDS = Joi.object({
  ids: Joi.array()
  .items(Joi.string().required())
  .required()
  .min(1)
});

module.exports = {
  FILES_UPLOAD_POST_QUERY,
  FILES_LIST_GET_QUERY,
  FILES_REST_ID,
  FILES_BODY_BATCH_IDS
};

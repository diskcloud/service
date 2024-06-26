// 生成用于校验 query 参数的中间件
function validateQuery(schema) {
  return async function(ctx, next) {
    try {
      const validated = await schema.validateAsync(ctx.query, {
        allowUnknown: true,
        convert: true,
        stripUnknown: true
      });
      ctx.query = validated;
      await next();
    } catch (err) {
      console.log(err);

      ctx.status = 400;
      ctx.body = {
        message: "Query Validation Error",
        error: err.details[0].message,
      };
    }
  };
}

// 生成用于校验 body 数据的中间件
function validateBody(schema) {
  return async function(ctx, next) {
    try {
      const validated = await schema.validateAsync(ctx.request.body, {
        allowUnknown: true,
        convert: true,
      });
      ctx.request.body = validated;
      await next();
    } catch (err) {
      ctx.status = 400;
      ctx.body = {
        message: "Body Validation Error",
        error: err.details[0].message,
      };
    }
  };
}

async function validateFormData(ctx, next) {
  try {
    const files = ctx.request.files ? ctx.request.files.file : null;

    // 检查是否上传了文件
    if (!files) {
      ctx.status = 400;
      ctx.body = { message: "File upload is required." };
      return;
    }

    await next();
  } catch (err) {
    ctx.status = 400;
    ctx.body = { message: 'Validation Error', error: err.message };
    return;
  }
}

function validateParams(schema) {
  return async function(ctx, next) {
    try {
      const validated = await schema.validateAsync(ctx.params, {
        allowUnknown: true,
        convert: true,
        stripUnknown: true
      });
      ctx.params = validated;
      await next();
    } catch (err) {
      ctx.status = 400;
      ctx.body = {
        message: "Params Validation Error",
        error: err.details[0].message,
      };
    }
  };
}

module.exports = {
  validateBody,
  validateQuery,
  validateFormData,
  validateParams
};

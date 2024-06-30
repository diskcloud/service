const redis = require("redis");
require("dotenv").config({ path: ".env.local" });

const client = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});
client.on("error", (err) => {
  console.error("Redis error:", err);
});

module.exports = client;

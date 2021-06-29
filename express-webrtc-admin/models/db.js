const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

module.exports.getValueByKey = async key => {
  try {
    const value = await redis.get(key);
    console.log(`Fetched {"${key}": "${value}"} from redis`);
    return {
      ok: !!value,
      value
    }
  }
  catch (error) {
    console.log('Error fetching from Redis');
    console.log(error);
    return {
      ok: false,
      error,
    }
  }
};

module.exports.deleteValueByKey = async key => {
  try {
    const value = await redis.del(key);
    console.log(`Deleted {"${key}": "${value}"} from redis`);
    return {
      ok: true,
      value
    }
  }
  catch (error) {
    console.log('Error deleting from Redis');
    console.log(error);
    return {
      ok: false,
      error,
    }
  }
}

module.exports.saveValueByKey = async (key, value) => {
  try {
    await redis.set(key, value);
    console.log(`Saved {"${key}": "${value}"} to redis`);
    return {
      ok: true,
      value
    }
  }
  catch (error) {
    console.log('Error saving to Redis');
    console.log(error);
    return {
      ok: false,
      error,
    }
  }
}

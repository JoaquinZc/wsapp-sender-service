export default () => {
  return {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6381'),
    },
    mongo: {
      uri: process.env.MONGO_URI || 'mongodb://localhost/wsapp',
    },
    me: {
      url: process.env.ME_URL || 'http://localhost:3000',
    },
  };
};

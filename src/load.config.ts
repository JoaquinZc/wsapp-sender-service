export default () => {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || "6381");
  
  return {
    redis: {
      host, port
    },
  };
};
const getHealthStatus = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Backend is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
};

module.exports = {
  getHealthStatus,
};

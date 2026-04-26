const getTestMessage = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Wholesale e-commerce backend is working",
  });
};

module.exports = {
  getTestMessage,
};

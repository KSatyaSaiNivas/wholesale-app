const sendDeliveredOrderNotification = ({ mobileNumber, orderId }) => {
  const recipient = mobileNumber || "unknown-user";
  console.log(
    `[Mock SMS] Sent to ${recipient}: Your order ${orderId} has been delivered.`
  );
};

module.exports = {
  sendDeliveredOrderNotification,
};

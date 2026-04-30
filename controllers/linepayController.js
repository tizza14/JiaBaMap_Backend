const { requestOnlineAPI } = require("../linepay_api_utils");
const Order = require("../models/orderModel");
require("dotenv").config();

const LINE_PAY_API_URL = process.env.LINE_PAY_API_URL;
const BACKEND_NGROK_URL = process.env.BACKEND_NGROK_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

// 付款請求
const Payment = async (req, res) => {
  const { packages, orderId } = req.body;
  try {
    const response = await requestOnlineAPI({
      method: "POST",
      baseUrl: LINE_PAY_API_URL,
      apiPath: "/v3/payments/request",
      data: {
        amount: packages.amount,
        currency: "TWD",
        orderId,
        packages: [packages],
        redirectUrls: {
          confirmUrl: `${BACKEND_NGROK_URL}/payments/linepay/confirm`,
          cancelUrl: `${BACKEND_NGROK_URL}/payments/linepay/cancel`,
        },
      },
    });
    res.json({ response });
  } catch (error) {
    res.status(500).json({ "Payment Error": error.message });
  }
};

// 付款授權
const Confirm = async (req, res) => {
  const { transactionId, orderId } = req.query;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.redirect(`${FRONTEND_URL}/checkout-detail?orderId=${orderId}&status=failed`);
    }

    const response = await requestOnlineAPI({
      method: "POST",
      baseUrl: LINE_PAY_API_URL,
      apiPath: `/v3/payments/${transactionId}/confirm`,
      data: {
        amount: order.totalAmount,
        currency: "TWD",
      },
    });

    if (response?.returnCode === "0000") {
      await Order.findByIdAndUpdate(orderId, { isPaid: true });
      return res.redirect(`${FRONTEND_URL}/checkout-detail?orderId=${orderId}&status=success`);
    } else {
      return res.redirect(`${FRONTEND_URL}/checkout-detail?orderId=${orderId}&status=failed`);
    }
  } catch (error) {
    res.status(500).json({ "Confirm Error": error.message });
  }
};

// 付款取消
const Cancel = (req, res) => {
  const { orderId } = req.query;
  const target = orderId
    ? `${FRONTEND_URL}/checkout-detail?orderId=${orderId}&status=cancelled`
    : `${FRONTEND_URL}`;
  res.redirect(target);
};

module.exports = { Payment, Confirm, Cancel };

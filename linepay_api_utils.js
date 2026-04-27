const crypto = require("crypto")
require("dotenv").config()

const CHANNEL_ID = process.env.CHANNEL_ID
const CHANNEL_SECRET = process.env.CHANNEL_SECRET

function signKey(clientKey, msg) {
  const encoder = new TextEncoder()
  return crypto
    .createHmac("sha256", encoder.encode(clientKey))
    .update(encoder.encode(msg))
    .digest("base64")
}

function handleBigInteger(text) {
  const largeNumberRegex = /:\s*(\d{16,})\b/g;
  const processedText = text.replace(largeNumberRegex, ': "$1"');

  const data = JSON.parse(processedText);

  return data;
}

async function requestOnlineAPI({
  method,
  baseUrl = "https://sandbox-api-pay.line.me",
  apiPath,
  queryString = "",
  data = null,
  signal = null,
}) {
  const nonce = crypto.randomUUID()
  let signature = ""

  // 根據不同方式(method)生成MAC
  if (method === "GET") {
    signature = signKey(
      CHANNEL_SECRET,
      CHANNEL_SECRET + apiPath + queryString + nonce
    )
  } else if (method === "POST") {
    signature = signKey(
      CHANNEL_SECRET,
      CHANNEL_SECRET + apiPath + JSON.stringify(data) + nonce
    )
  }
  const headers = {
    "X-LINE-ChannelId": CHANNEL_ID,
    "X-LINE-Authorization": signature,
    "X-LINE-Authorization-Nonce": nonce,
  }

  const response = await fetch(
    `${baseUrl}${apiPath}${queryString !== "" ? "&" + queryString : ""}`,
    {
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: data ?JSON.stringify(data) : null,
      signal: signal,
    }
  )

  const processedResponse = handleBigInteger(await response.text())

  return processedResponse
}

module.exports = { requestOnlineAPI };
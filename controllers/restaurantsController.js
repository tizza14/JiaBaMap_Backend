const axios = require("axios");
const { cache, TTL, rateLimiters, dailyQuota } = require("../utils/cache");
const Store = require("../models/storeModel");

const getIP = (req) => req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;

// Per-IP 限速（快取 hit 時不會呼叫）
const checkRateLimit = (req, res, limiterKey) => {
  if (!rateLimiters[limiterKey].check(getIP(req))) {
    res.status(429).json({ message: "請求過於頻繁，請稍後再試" });
    return false;
  }
  return true;
};

// 配額用完時嘗試回傳過期快取（降級）
const staleFallback = (res, cacheKey) => {
  const stale = cache.getStale(cacheKey);
  if (stale) {
    console.warn(`[Quota] 配額用完，回傳快取資料：${cacheKey}`);
    res.set("X-Cache-Status", "STALE");
    return res.json(stale);
  }
  console.warn(`[Quota] 今日 Google API 已達上限 ${dailyQuota.limit} 次`);
  return res.status(503).json({ message: "今日查詢次數已達上限，請明天再試" });
};

// 搜尋
const searchByKeywordAndLocation = async (req, res, _next) => {
  const { keyword, lat, lng } = req.query;

  if (!keyword || !lat || !lng) {
    return res.status(400).json({ message: "Missing parameter" });
  }
  if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
    return res.status(400).json({ message: "Invalid lat/lng" });
  }

  console.log(`[Search Request] keyword: ${keyword}, lat: ${lat}, lng: ${lng}`);

  const roundedLat = parseFloat(lat).toFixed(2);
  const roundedLng = parseFloat(lng).toFixed(2);
  const cacheKey = `search:${keyword}:${roundedLat}:${roundedLng}`;

  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  if (!checkRateLimit(req, res, "search")) return;
  if (!dailyQuota.consume()) return staleFallback(res, cacheKey);

  try {
    const body = {
      textQuery: keyword,
      includedType: "restaurant",
      languageCode: "zh-TW",
      pageSize: 20,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 2000.0,
        },
      },
    };
    const headers = {
      "X-Goog-Api-Key": process.env.API_KEY,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.photos",
        "places.priceRange",
        "places.rating",
        "places.userRatingCount",
        "places.currentOpeningHours",
        "places.location",
      ].join(","),
    };
    const response = await axios.post(
      "https://places.googleapis.com/v1/places:searchText",
      body,
      { headers },
    );

    const places = [];
    if (response.data.places && Array.isArray(response.data.places)) {
      for (const ele of response.data.places) {
        places.push({
          id: ele.id,
          name: ele.displayName.text,
          rating: ele.rating ?? null,
          userRatingCount: ele.userRatingCount ?? null,
          openNow: ele.currentOpeningHours?.openNow ?? null,
          address: ele.formattedAddress ?? null,
          startPrice: ele.priceRange?.startPrice?.units ?? null,
          endPrice: ele.priceRange?.endPrice?.units ?? null,
          photoId: ele.photos?.length > 0 ? encodeURIComponent(ele.photos[0].name) : null,
          lat: ele.location.latitude,
          lng: ele.location.longitude,
        });
      }
    }

    // 查哪些 placeId 已在 JiaBaMap 完成店家註冊（可線上訂購）
    const placeIds = places.map((p) => p.id);
    const registeredStores = await Store.find({ placeId: { $in: placeIds } }).select("placeId").lean();
    const orderableSet = new Set(registeredStores.map((s) => s.placeId));
    const result = places.map((p) => ({ ...p, isOrderable: orderableSet.has(p.id) }));

    cache.set(cacheKey, result, TTL.SEARCH);
    res.json(result);
  } catch (err) {
    console.error("[Search Error]:", err.response?.data || err.message);
    const statusCode = err.response?.status || 500;
    res.status(statusCode).json({
      message: "搜尋失敗",
      error: err.response?.data?.error?.message || err.message,
    });
  }
};

// Static map
const getStaticmap = async (req, res, _next) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    res.status(400).json({ message: "Missing lat or lng" });
    return;
  }

  const cacheKey = `staticmap:${parseFloat(lat).toFixed(3)}:${parseFloat(lng).toFixed(3)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.contentType("image/png").send(cached);
    return;
  }

  if (!checkRateLimit(req, res, "staticmap")) return;
  if (!dailyQuota.consume()) return staleFallback(res, cacheKey);

  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/staticmap",
      {
        responseType: "arraybuffer",
        params: {
          key: process.env.API_KEY,
          center: `${lat},${lng}`,
          zoom: 15,
          size: "400x400",
          markers: `color:red|${lat},${lng}`,
        },
      },
    );
    cache.set(cacheKey, Buffer.from(response.data), TTL.STATIC_MAP);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.contentType("image/png").send(response.data);
  } catch (err) {
    res.status(404).json({});
  }
};

// 餐廳詳情
const detailOfRestaurant = async (req, res, _next) => {
  const id = req.params.id;
  const cacheKey = `detail:${id}`;

  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  if (!checkRateLimit(req, res, "detail")) return;
  if (!dailyQuota.consume()) return staleFallback(res, cacheKey);

  try {
    const response = await axios.get(
      `https://places.googleapis.com/v1/places/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.API_KEY,
          "X-Goog-FieldMask": [
            "displayName",
            "photos",
            "formattedAddress",
            "googleMapsUri",
            "currentOpeningHours",
            "nationalPhoneNumber",
            "priceRange",
            "rating",
            "websiteUri",
            "userRatingCount",
            "location",
            "primaryType",
          ].join(","),
        },
        params: { languageCode: "zh-TW" },
      },
    );

    const photoNum = 2;
    const photoNames = [];
    for (let i = 0; i < Math.min(photoNum, response.data.photos?.length ?? 0); i++) {
      photoNames.push(response.data.photos[i].name);
    }

    const data = {
      displayName: response.data.displayName.text ?? null,
      rating: response.data.rating ?? null,
      userRatingCount: response.data.userRatingCount ?? null,
      startPrice: response.data.priceRange?.startPrice?.units ?? null,
      endPrice: response.data.priceRange?.endPrice?.units ?? null,
      weekDayDescriptions: response.data.currentOpeningHours?.weekdayDescriptions ?? null,
      formattedAddress: response.data.formattedAddress ?? null,
      websiteUri: response.data.websiteUri ?? null,
      nationalPhoneNumber: response.data.nationalPhoneNumber ?? null,
      googleMapsUri: response.data.googleMapsUri,
      openNow: response.data.currentOpeningHours?.openNow ?? null,
      photoIds: photoNames.map((id) => encodeURIComponent(id)),
      lat: response.data.location.latitude,
      lng: response.data.location.longitude,
      placeId: id,
      primaryType: response.data.primaryType ?? null,
    };

    cache.set(cacheKey, data, TTL.DETAIL);
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(404).json({});
  }
};

// 照片
const restaurantPhoto = async (req, res, _next) => {
  const photoId = req.params.id;
  const { maxWidth, maxHeight } = req.query;
  console.log(`[Photo Request] Received photoId: ${photoId}, size: ${maxWidth}x${maxHeight}`);
  
  // Cache key includes size to avoid returning wrong size from cache
  const cacheKey = `photo:${photoId}:${maxWidth || "default"}:${maxHeight || "default"}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[Photo Cache Hit] ${photoId}`);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.contentType(cached.contentType).send(cached.data);
    return;
  }

  if (!checkRateLimit(req, res, "photo")) return;
  if (!dailyQuota.consume()) return staleFallback(res, cacheKey);

  try {
    const decodedPhotoId = decodeURIComponent(photoId);
    console.log(`[Photo Request] Decoded photoId: ${decodedPhotoId}`);
    const response = await axios.get(
      `https://places.googleapis.com/v1/${decodedPhotoId}/media`,
      {
        responseType: "arraybuffer",
        params: {
          key: process.env.API_KEY,
          maxHeightPx: maxHeight || 1024,
          maxWidthPx: maxWidth || 1024,
        },
      },
    );

    const contentType = response.headers["content-type"];
    console.log(`[Photo Success] Content-Type: ${contentType}`);
    cache.set(cacheKey, { data: Buffer.from(response.data), contentType }, TTL.PHOTO);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.contentType(contentType).send(response.data);
  } catch (err) {
    console.error(`[Photo Error] ${photoId}:`, err.response?.data || err.message);
    res.status(404).json({});
  }
};

module.exports = {
  searchByKeywordAndLocation,
  getStaticmap,
  detailOfRestaurant,
  restaurantPhoto,
};

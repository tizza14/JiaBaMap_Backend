const axios = require("axios");

//依關鍵字與地點搜尋
const searchByKeywordAndLocation = async (req, res, _next) => {
  // get query parameter
  const { keyword, lat, lng } = req.query;

  // if (!keyword || !lat || !lng) {
  //   res.status(400).json({ message: "Missing parameter" });
  //   return;
  // }
  // send request to Google API
  try {
    const body = {
      textQuery: keyword,
      includedType: "restaurant",
      languageCode: "zh-TW",
      pageSize: 15,
      locationBias: {
        circle: {
          center: {
            latitude: lat,
            longitude: lng,
          },
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
      {
        headers,
      },
    );

    const places = [];
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
        photoId:
          ele.photos.length > 0 ? encodeURIComponent(ele.photos[0].name) : null,
        lat: ele.location.latitude,
        lng: ele.location.longitude,
      });
    }
    res.json(places);
  } catch (err) {
    console.log(err);
    res.status(404).json([]);
  }
};

//取得staticmap
const getStaticmap = async (req, res, _next) => {
  // get query parameter
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    res.status(400).json({ message: "Missing lat or lng" });
    return;
  }
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
    //prepare data
    res.contentType("image/png").send(response.data);
  } catch (err) {
    // console.log(err);
    res.status(404).json({});
  }
};

//依店家place_id取得詳細資訊
const detailOfRestaurant = async (req, res, _next) => {
  // get query parameter
  const id = req.params.id;

  // send request to Google API
  try {
    const response = await axios.get(
      `https://places.googleapis.com/v1/places/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          fields: [
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
          ].join(","),
          key: process.env.API_KEY,
          languageCode: "zh-TW",
        },
      },
    );

    const photoNum = 2;
    const photoNames = [];
    for (let i = 0; i < photoNum; i++) {
      photoNames.push(response.data.photos[i].name);
    }

    // prepare data
    const data = {
      displayName: response.data.displayName.text ?? null,
      rating: response.data.rating ?? null,
      userRatingCount: response.data.userRatingCount ?? null,
      startPrice: response.data.priceRange?.startPrice?.units ?? null,
      endPrice: response.data.priceRange?.endPrice?.units ?? null,
      weekDayDescriptions:
        response.data.currentOpeningHours?.weekdayDescriptions ?? null,
      formattedAddress: response.data.formattedAddress ?? null,
      websiteUri: response.data.websiteUri ?? null,
      nationalPhoneNumber: response.data.nationalPhoneNumber ?? null,
      googleMapsUri: response.data.googleMapsUri,
      openNow: response.data.currentOpeningHours?.openNow ?? null,
      // 為了避免photoId中的 “/”
      // 影響後端路由的path parameter的取得,
      // 所以先做encode
      photoIds: photoNames.map((id) => encodeURIComponent(id)),
      lat: response.data.location.latitude,
      lng: response.data.location.longitude,
      placeId: id
    };

    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(404).json({});
  }
};

//取得店家照片
const restaurantPhoto = async (req, res, _next) => {
  // get query parameter
  const photoId = req.params.id;

  // send request to Google API
  try {
    const decodedPhotoId = decodeURIComponent(photoId);
    const response = await axios.get(
      `https://places.googleapis.com/v1/${decodedPhotoId}/media`,
      {
        responseType: "arraybuffer",
        params: {
          key: process.env.API_KEY,
          maxHeightPx: 1024,
          maxWidthPx: 1024,
        },
      },
    );

    // prepare data
    res.contentType(response.headers["content-type"]).send(response.data);
  } catch (err) {
    // TODO: error handling
    console.log(err);
    res.status(404).json({});
  }
};

module.exports = {
  searchByKeywordAndLocation,
  getStaticmap,
  detailOfRestaurant,
  restaurantPhoto,
};

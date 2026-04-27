const express = require("express");
const router = express.Router();
const axios = require("axios");
const controller = require("../controllers/restaurantsController");

//根據關鍵字和經緯度搜尋結果
router.get(
  "/search",
  controller.searchByKeywordAndLocation,
  /* 	
    #swagger.summary = 'Search restaurants for the keyword'
    #swagger.description = 'Endpoint to search 15 restaurants from Google API based on the keyword and the coordinate'
    */

  /* 
    #swagger.parameters['keyword'] = {
      in: 'query',
      description: 'The keyword to be searched by user',
      required: 'true',
      type: 'string',
    }
    #swagger.parameters['lat'] = {
      in: 'query',
      description: 'The latitude to be searched by user',
      required: 'true',
      type: 'string',
    }
    #swagger.parameters['lng'] = {
      in: 'query',
      description: 'The longitude to be searched by user',
      required: 'true',
      type: 'string',
    }
  */
);

router.get(
  "/staticmap",
  controller.getStaticmap,
  /* 	
    #swagger.summary = 'Get staticmap image'
    #swagger.description = 'Endpoint to get staticmap image from Google API given by the location'
  */

  /* 
    #swagger.parameters['lat'] = {
      in: 'query',
      description: 'The latitude to be searched by user',
      required: 'true',
      type: 'string',
    }
    #swagger.parameters['lng'] = {
      in: 'query',
      description: 'The longitude to be searched by user',
      required: 'true',
      type: 'string',
    }
  */
);

router.get(
  "/:id",
  controller.detailOfRestaurant,
  /* 	
    #swagger.summary = 'Get place detail information'
    #swagger.description = 'Endpoint to get detail information of a place from Google API'
  */

  /* 
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'The ID of a place assigned by Google Places API',
      required: 'true',
      type: 'string',
    }
  */

  /*
    #swagger.responses[200] = {
      schema: {
        "displayName": "鮨荻 sushi ogi",
        "rating": 4.7,
        "userRatingCount": 41,
        "startPrice": "2000",
        "endPrice": null,
        "weekDayDescriptions": [
          "星期一: 休息",
          "星期二: 12:00 – 14:30, 18:00 – 21:30",
          "星期三: 12:00 – 14:30, 18:00 – 21:30",
          "星期四: 12:00 – 14:30, 18:00 – 21:30",
          "星期五: 12:00 – 14:30, 18:00 – 21:30",
          "星期六: 12:00 – 14:30, 18:00 – 21:30",
          "星期日: 休息"
        ],
        "formattedAddress": "104004台灣台北市中山區天津街21號",
        "websiteUri": "https://www.facebook.com/Sushiogi/",
        "nationalPhoneNumber": null,
        "googleMapsUri": "https://maps.google.com/?cid=10555472622014893236",
        "openNow": false,
        "photoIds": [
          "places/ChIJXb0k11GpQjQRtAyPp2ySfJI/photos/AdDdOWpEd8Nnf4pdqwGqklFuTnLL5v2tEO3Pzs00AONzEElI4ABs3Dp4J6aiQiXxr9eTbQ5O6pnENPKrGDSZXN4s1DL6gP33hGtcZuzqhpfji0hNWPo6U80iIMltTWctOaER8CYm0QrU22N4tyjM-8boOp14sdsho8CpSbrA",
          "places/ChIJXb0k11GpQjQRtAyPp2ySfJI/photos/AdDdOWrntO0i8qHHIxs2ZCNdvJBmBYSpWW3UhK0kJLouTusr91-Fn5zsR75NIytST4JyxSnnLw0RYeSSa-Clehi6TuE_acnMjzfREAFq_VWAO_9I6pmG1AcJZZkCzxOAy8cssKOtQA2qoawMSR5nDCFKm9nxZkT14OE6RdnL"
        ]
      },
      description: "Get place detail successfully."
    }
  */
);

//店家照片
router.get(
  "/photos/:id",
  controller.restaurantPhoto,
  /* 	
    #swagger.summary = 'Get photo'
    #swagger.description = 'Endpoint to get a photo from Google API given by the photo ID'
    */

  /* 
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'The ID of a photo assigned by Google Places API',
      required: 'true',
      type: 'string',
    }
  */
);

module.exports = router;

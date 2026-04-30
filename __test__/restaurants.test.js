const express = require("express");
const request = require("supertest");
const restaurantsRouter = require("../routes/restaurants");
const axios = require("axios");
const { cache } = require("../utils/cache");
const Store = require("../models/storeModel");

// Mock axios and Store model
jest.mock("axios");
jest.mock("../models/storeModel");

const app = express();
app.use(express.json());
app.use("/", restaurantsRouter);

describe("Restaurants API Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.clear();
  });

  describe("GET /search", () => {
    it("should return search response successfully", async () => {
      // Arrange
      const mockPlacesResponse = {
        places: [
          {
            id: "ChIJ4WlbTSipQjQRtfKi0Z35pmc",
            displayName: { text: "スシロー壽司郎 台北館前路店" },
            rating: 4.1,
            userRatingCount: 7380,
            currentOpeningHours: { openNow: true },
            formattedAddress: "100台灣台北市中正區館前路8號2樓",
            priceRange: { startPrice: { units: 400 }, endPrice: { units: 600 } },
            photos: [{ name: "photoId" }],
            location: { latitude: 25.0458, longitude: 121.5147 },
          }
        ],
      };

      axios.post.mockResolvedValue({ data: mockPlacesResponse });
      Store.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ placeId: "ChIJ4WlbTSipQjQRtfKi0Z35pmc" }])
        })
      });

      const expectedResponse = [
        {
          id: "ChIJ4WlbTSipQjQRtfKi0Z35pmc",
          name: "スシロー壽司郎 台北館前路店",
          rating: 4.1,
          userRatingCount: 7380,
          openNow: true,
          address: "100台灣台北市中正區館前路8號2樓",
          startPrice: 400,
          endPrice: 600,
          photoId: "photoId",
          lat: 25.0458,
          lng: 121.5147,
          isOrderable: true
        }
      ];

      // Act
      const response = await request(app).get("/search").query({
        keyword: "sushi",
        lat: "25.04",
        lng: "121.51",
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedResponse);
    });

    it("should return 400 if parameters are missing", async () => {
      const response = await request(app).get("/search").query({ keyword: "sushi" });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Missing parameter");
    });
  });

  describe("GET /:id", () => {
    it("should return details successfully", async () => {
      const mockDetailResponse = {
        displayName: { text: "鮨荻 sushi ogi" },
        rating: 4.7,
        userRatingCount: 41,
        priceRange: { startPrice: { units: "2000" }, endPrice: null },
        currentOpeningHours: { weekdayDescriptions: ["星期一: 休息"], openNow: false },
        formattedAddress: "天津街21號",
        websiteUri: "https://ogisushi.com",
        location: { latitude: 25.01, longitude: 121.47 },
        photos: [{ name: "photo1" }]
      };

      axios.get.mockResolvedValue({ data: mockDetailResponse });

      const response = await request(app).get("/123");

      expect(response.status).toBe(200);
      expect(response.body.displayName).toBe("鮨荻 sushi ogi");
      expect(response.body.placeId).toBe("123");
    });

    it("should return 404 if external API fails", async () => {
      axios.get.mockRejectedValue(new Error("API Error"));
      const response = await request(app).get("/123");
      expect(response.status).toBe(404);
    });
  });

  describe("GET /photos/:id", () => {
    it("should return photo data successfully", async () => {
      const mockBuffer = Buffer.from("fake-image");
      axios.get.mockResolvedValue({
        data: mockBuffer,
        headers: { "content-type": "image/jpeg" }
      });

      const response = await request(app).get("/photos/123");
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("image/jpeg");
    });
  });

  describe("GET /staticmap", () => {
    it("should return 400 if lat/lng is missing", async () => {
      const response = await request(app).get("/staticmap");
      expect(response.status).toBe(400);
    });
  });
});

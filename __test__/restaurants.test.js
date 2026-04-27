const express = require("express");
const request = require("supertest");
const restaurantsRouter = require("../routes/restaurants");
const axios = require("axios");

// Mock axios
jest.mock("axios");
const app = express();
app.use(express.json());
app.use(restaurantsRouter);

describe("GET /search", () => {
  it("Return search response successfully", async () => {
    // Arrange
    const mockResponse = {
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
          location: { latitude: 25.045826700000003, longitude: 121.5147169 },
        },
        {
          id: "ChIJFwLH-fepQjQRFssrBEb-Gz0",
          displayName: { text: "米達人壽司 新光站前門市_B1" },
          rating: 3.6,
          userRatingCount: 38,
          currentOpeningHours: { openNow: false },
          formattedAddress: "100台灣台北市中正區忠孝西路一段66號",
          priceRange: null,
          photos: [],
          location: { latitude: 25.045661799999998, longitude: 121.5147282 },
        },
      ],
    };

    axios.post.mockResolvedValue({ data: mockResponse });

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
        lat: 25.045826700000003,
        lng: 121.5147169,
      },
      {
        id: "ChIJFwLH-fepQjQRFssrBEb-Gz0",
        name: "米達人壽司 新光站前門市_B1",
        rating: 3.6,
        userRatingCount: 38,
        openNow: false,
        address: "100台灣台北市中正區忠孝西路一段66號",
        startPrice: null,
        endPrice: null,
        photoId: null,
        lat: 25.045661799999998,
        lng: 121.5147282,
      },
    ];
    // Act
    const response = await request(app).get("/search").query({
      keyword: "sushi",
      lat: "25.04679241938268",
      lng: "121.51566570837251",
    });
    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expectedResponse);
  });

  it("Fail to search", async () => {
    // Arrange
    axios.post.mockRejectedValue(new Error("Request failed"));
    //Act
    const response = await request(app)
      .get("/search")
      .query({ key: "aaa", lat: null, lng: null });
    // Assert
    // FIXME
    expect(response.body).toEqual({ message: "Missing parameter" });
    expect(response.status).toBe(400);
  });
});

describe("GET /:id", () => {
  it("Return details successfully", async () => {
    // Arrange
    const mockResponse = {
      displayName: { text: "鮨荻 sushi ogi" },
      rating: 4.7,
      userRatingCount: 41,
      priceRange: {
        startPrice: { units: "2000" },
        endPrice: null,
      },
      currentOpeningHours: {
        weekdayDescriptions: [
          "星期一: 休息",
          "星期二: 12:00 – 14:30, 18:00 – 21:30",
          "星期三: 12:00 – 14:30, 18:00 – 21:30",
          "星期四: 12:00 – 14:30, 18:00 – 21:30",
          "星期五: 12:00 – 14:30, 18:00 – 21:30",
          "星期六: 12:00 – 14:30, 18:00 – 21:30",
          "星期日: 休息",
        ],
        openNow: false,
      },
      formattedAddress: "104004台灣台北市中山區天津街21號",
      websiteUri: "https://www.facebook.com/Sushiogi/",
      nationalPhoneNumber: null,
      googleMapsUri: "https://maps.google.com/?cid=10555472622014893236",
      photos: [
        {
          name: "places/ChIJXb0k11GpQjQRtAyPp2ySfJI/photos/AdDdOWpEd8Nnf4pdqwGqklFuTnLL5v2tEO3Pzs00AONzEElI4ABs3Dp4J6aiQiXxr9eTbQ5O6pnENPKrGDSZXN4s1DL6gP33hGtcZuzqhpfji0hNWPo6U80iIMltTWctOaER8CYm0QrU22N4tyjM-8boOp14sdsho8CpSbrA",
        },
        {
          name: "places/ChIJXb0k11GpQjQRtAyPp2ySfJI/photos/AdDdOWrntO0i8qHHIxs2ZCNdvJBmBYSpWW3UhK0kJLouTusr91-Fn5zsR75NIytST4JyxSnnLw0RYeSSa-Clehi6TuE_acnMjzfREAFq_VWAO_9I6pmG1AcJZZkCzxOAy8cssKOtQA2qoawMSR5nDCFKm9nxZkT14OE6RdnL",
        },
      ],
      location: { latitude: 25.0124499, longitude: 121.47545519999998 },
    };

    axios.get.mockResolvedValue({ data: mockResponse });

    const expectedResponse = {
      displayName: "鮨荻 sushi ogi",
      rating: 4.7,
      userRatingCount: 41,
      startPrice: "2000",
      endPrice: null,
      weekDayDescriptions: [
        "星期一: 休息",
        "星期二: 12:00 – 14:30, 18:00 – 21:30",
        "星期三: 12:00 – 14:30, 18:00 – 21:30",
        "星期四: 12:00 – 14:30, 18:00 – 21:30",
        "星期五: 12:00 – 14:30, 18:00 – 21:30",
        "星期六: 12:00 – 14:30, 18:00 – 21:30",
        "星期日: 休息",
      ],
      formattedAddress: "104004台灣台北市中山區天津街21號",
      websiteUri: "https://www.facebook.com/Sushiogi/",
      nationalPhoneNumber: null,
      googleMapsUri: "https://maps.google.com/?cid=10555472622014893236",
      openNow: false,
      photoIds: [
        "places%2FChIJXb0k11GpQjQRtAyPp2ySfJI%2Fphotos%2FAdDdOWpEd8Nnf4pdqwGqklFuTnLL5v2tEO3Pzs00AONzEElI4ABs3Dp4J6aiQiXxr9eTbQ5O6pnENPKrGDSZXN4s1DL6gP33hGtcZuzqhpfji0hNWPo6U80iIMltTWctOaER8CYm0QrU22N4tyjM-8boOp14sdsho8CpSbrA",
        "places%2FChIJXb0k11GpQjQRtAyPp2ySfJI%2Fphotos%2FAdDdOWrntO0i8qHHIxs2ZCNdvJBmBYSpWW3UhK0kJLouTusr91-Fn5zsR75NIytST4JyxSnnLw0RYeSSa-Clehi6TuE_acnMjzfREAFq_VWAO_9I6pmG1AcJZZkCzxOAy8cssKOtQA2qoawMSR5nDCFKm9nxZkT14OE6RdnL",
      ],
      lat: 25.0124499,
      lng: 121.47545519999998,
    };
    //Act
    const response = await request(app).get("/123");
    //Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expectedResponse);
  });

  it("Fail to return details response", async () => {
    // Arrange
    axios.get.mockRejectedValue(new Error("Request failed"));
    // Act
    const response = await request(app).get("/123");
    // Assert
    // FIXME
    expect(response.body).toEqual({});
    expect(response.status).toBe(404);
  });
});

describe("GET /photos/:id", () => {
  it("Return photo successfully", async () => {
    // Arrange
    const mockBuffer = Buffer.from("mock image data"); // 模擬圖片二進位資料
    const mockHeaders = { "content-type": "image/jpeg" };
    axios.get.mockResolvedValue({
      data: mockBuffer,
      headers: mockHeaders,
    });

    const expectedResponse = mockBuffer;
    // Act
    const response = await request(app).get("/photos/123");
    //Assert
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toBe("image/jpeg");
    expect(response.body).toEqual(expectedResponse);
  });

  it("Fail to return photo", async () => {
    // Arrange
    axios.get.mockRejectedValue(new Error("Request failed"));
    // Act
    const response = await request(app).get("/photos/123");
    // Assert
    // FIXME
    expect(response.body).toEqual({});
    expect(response.status).toBe(404);
  });
});

describe("GET /staticmap", () => {
  it("Return staticmap image successfully", async () => {
    // Arrange
    const mockBuffer = Buffer.from("mock image data"); // 模擬圖片二進位資料
    const mockHeaders = { "content-type": "image/png" };
    axios.get.mockResolvedValue({
      data: mockBuffer,
      headers: mockHeaders,
    });

    const expectedResponse = mockBuffer;
    // Act
    const response = await request(app).get("/staticmap").query({
      lat: "25.04679241938268",
      lng: "121.51566570837251",
    });
    // Assert
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
    expect(response.body).toEqual(expectedResponse);
  });

  it("Fail to return staticmap image", async () => {
    // Arrange
    axios.get.mockRejectedValue(new Error("Request failed"));
    //Act
    const response = await request(app)
      .get("/staticmap")
      .query({ lat: 123, lng: 456 });
    //Assert
    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });
});

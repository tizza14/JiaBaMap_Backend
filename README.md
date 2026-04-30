# Welcome to JiaBaMap-backend 👋

<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
</p>

> The backend project of JiaBaMap.

### 🏠 [Homepage](https://github.com/orangeCatGang/JiaBaMap-backend)

## Install

1.

```sh
$ npm install
```

2. Install and launch MongoDB in your machine

- [macOS](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/)
- [Windows](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/)

## Usage

1. Create an .env file with your Google API key

```
API_KEY =
MONGO_URI =
GOOGLE_CLIENT_ID =
JWT_SECRET =
GOOGLE_PROJECT_ID=
BUCKET_NAME=
GOOGLE_CLOUD_STORAGE_BASE_URL=
FRONTEND_URL="現在啟用的本地網址"
# LinePay Sandbox
CHANNEL_ID=
CHANNEL_SECRET=
LINE_PAY_API_URL=https://sandbox-api-pay.line.me
BACKEND_NGROK_URL=
```

2. Generate the api document JSON first

```sh
$ npm run swagger
```

3. Run the dev server

```sh
$ npm run dev
```

## API Document

Please go to `http://localhost:3000/api-docs`
to interact with the API document.

## Deployment

Deployment status, environment variables, and the Render/Vercel/AWS rollout checklist are tracked in [DEPLOYMENT_PROGRESS.md](./DEPLOYMENT_PROGRESS.md).

## Authors

👤 **JiaBaMap Developers**

- GitHub: [@JiaBaMap Developers](https://github.com/jabamapdevelopers)

### 👤 廖冠韋

> jkk54623@gmail.com

- 搜尋頁切版
- 個人頁熱門餐廳切版
- 關鍵字與搜尋跳轉
- 訂餐頁後台

### 👤 蕭國祥

> hsiaokuohsiang@gmail.com

- Google 地圖標記、API 串接
- 搜尋頁切版
- 相似與推薦餐廳輪播圖
- 食記後台切版
- 食記列表切版
- 食記評論、回覆與按讚功能

### 👤 王婕瑜

> juliewah8785@gmail.com

- 專案管理、企劃書
- 線上訂餐結帳、金流 API
- 店家評論、按讚、分享
- 熱門餐廳
- 首頁切版
- 個人頁切版

### 👤 吳宥蓁

> apple5964315@gmail.com

- 導覽列、頁尾切版
- 店家頁切板
- 編輯個人資料切版、功能
- 撰寫食記切版、功能

### 👤 廖婉如

> wan0917ru@gmail.com

- 店家頁詳細資訊設置
- 後端 API 創建
- 串接 Google places API
- 後端測試
- 會員資訊與評論資料庫建立
- 串接 Google Cloud Storage
- 店家註冊與登入切版與功能
- 簡報製作、專案報告

### 👤 陳文瀚

> qoo98471@gmail.com

- 串接 API
- 關鍵字搜尋
- 搜尋頁進階排序
- 串接 Google 第三方登入
- 頁面訪問驗證

## Show your support

Give a ⭐️ if this project helped you!

---

_This README was generated with ❤️ by JiaBaMap team_

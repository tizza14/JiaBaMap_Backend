const axios = require('axios');
require('dotenv').config();

const testGoogleAPI = async () => {
  const apiKey = process.env.API_KEY;
  console.log('Testing with API Key (first 5 chars):', apiKey ? apiKey.substring(0, 5) + '...' : 'MISSING');

  if (!apiKey) {
    console.error('Error: API_KEY is missing in .env');
    return;
  }

  const body = {
    textQuery: 'Spicy',
    includedType: 'restaurant',
    languageCode: 'zh-TW',
    pageSize: 1,
  };

  const headers = {
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'places.id,places.displayName',
  };

  try {
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      body,
      { headers }
    );
    console.log('Success! Connection to Google Places API (New) established.');
    console.log('Sample Result:', response.data.places?.[0]?.displayName?.text);
  } catch (err) {
    console.error('API Test Failed!');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Error Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Message:', err.message);
    }
  }
};

testGoogleAPI();

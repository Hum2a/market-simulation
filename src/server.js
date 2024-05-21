const express = require('express');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const db = require('./backend/firebase/initAdmin');
const app = express();
const PORT = process.env.PORT || 5000;

const API_KEY = 'Z2G35L67NYNFFXHT';

// Fetch and Cache Stock Data
async function fetchAndCacheStockData(symbol) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  await db.collection('Stock Market Data').doc(symbol).set({
    data,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });
}

// Middleware to check and fetch stock data if outdated
async function checkAndFetchStockData(req, res, next) {
  const symbol = req.params.symbol;
  const stockDoc = await db.collection('Stock Market Data').doc(symbol).get();

  if (stockDoc.exists) {
    const stock = stockDoc.data();
    const lastUpdated = stock.lastUpdated.toDate();
    if (new Date() - lastUpdated < 24 * 60 * 60 * 1000) {
      req.stockData = stock.data;
    } else {
      await fetchAndCacheStockData(symbol);
      const updatedStockDoc = await db.collection('Stock Market Data').doc(symbol).get();
      req.stockData = updatedStockDoc.data().data;
    }
  } else {
    await fetchAndCacheStockData(symbol);
    const newStockDoc = await db.collection('Stock Market Data').doc(symbol).get();
    req.stockData = newStockDoc.data().data;
  }
  next();
}

// API Endpoint to get stock data
app.get('/api/stocks/:symbol', checkAndFetchStockData, (req, res) => {
  res.json(req.stockData);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

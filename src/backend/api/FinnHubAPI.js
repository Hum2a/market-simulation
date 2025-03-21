import axios from 'axios';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const db = getFirestore();
const API_KEY = process.env.VUE_APP_FINNHUB_API_KEY;

// List of companies to fetch real-time data for
const companies = [
  { name: 'Amazon', symbol: 'AMZN' },
  { name: 'Apple', symbol: 'AAPL' },
  { name: 'Barclays', symbol: 'BCS' },
  { name: 'Boeing', symbol: 'BA' },
  { name: 'Coca-Cola', symbol: 'KO' },
  { name: 'Disney', symbol: 'DIS' },
  { name: 'IBM', symbol: 'IBM' },
  { name: 'Microsoft', symbol: 'MSFT' },
  { name: 'Nike', symbol: 'NKE' },
  { name: 'NVIDIA', symbol: 'NVDA' },
  { name: 'Pfizer', symbol: 'PFE' },
  { name: 'Roblox', symbol: 'RBLX' },
  { name: 'Shell', symbol: 'SHEL' },
  { name: 'Spotify', symbol: 'SPOT' },
  { name: 'Tesla', symbol: 'TSLA' },
  { name: 'Visa', symbol: 'V' },
  { name: 'Walmart', symbol: 'WMT' }
];

// Function to fetch real-time stock data from Finnhub
const fetchRealTimeStockData = async (symbol) => {
  console.log(`Fetching data for ${symbol}`);
  try {
    const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`);
    const stockData = response.data;

    // Prepare the data to be saved in Firestore
    const now = new Date();
    const day = now.toISOString().split('T')[0]; // Get the date part (YYYY-MM-DD)
    const time = now.toISOString().split('T')[1].split('.')[0]; // Get the time part (HH:MM:SS)
    const dataToSave = {
      currentPrice: stockData.c,
      highPrice: stockData.h,
      lowPrice: stockData.l,
      openPrice: stockData.o,
      previousClosePrice: stockData.pc
    };

    // Document reference
    const docRef = doc(db, 'Real Time Stock Market Data', symbol);
    
    // Check if the document exists
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Update the existing document
      await updateDoc(docRef, {
        [`days.${day}.${time}`]: dataToSave
      });
    } else {
      // Set the document with the initial structure
      await setDoc(docRef, {
        days: {
          [day]: {
            [time]: dataToSave
          }
        }
      });
    }

    console.log(`Real-time data for ${symbol} saved successfully.`);
  } catch (error) {
    console.error(`Error fetching real-time data for ${symbol}:`, error);
  }
};

// Function to fetch data for all companies
const fetchAllRealTimeStockData = async () => {
  for (const company of companies) {
    await fetchRealTimeStockData(company.symbol);
  }
};

// Call the function to fetch and save data for all companies
fetchAllRealTimeStockData();

export { fetchRealTimeStockData, fetchAllRealTimeStockData };

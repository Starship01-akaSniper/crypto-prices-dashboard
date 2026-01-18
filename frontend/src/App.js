import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// CoinGecko API - free, no API key required
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

function App() {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchCryptoPrices();
    // Refresh every 60 seconds
    const interval = setInterval(fetchCryptoPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchCryptoPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        }
      });
      
      const cryptoData = response.data.map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        currentPrice: coin.current_price,
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        totalVolume: coin.total_volume,
        priceChange24h: coin.price_change_percentage_24h,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        image: coin.image,
        lastUpdated: coin.last_updated
      }));

      setCryptoData(cryptoData);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError('Failed to fetch crypto prices. Please check your internet connection and try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCryptoDetails = async (id) => {
    try {
      const response = await axios.get(`${COINGECKO_API}/coins/${id}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        }
      });

      const coin = response.data;
      const marketData = coin.market_data;

      const cryptoDetails = {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        description: coin.description?.en || 'No description available',
        currentPrice: marketData.current_price.usd,
        marketCap: marketData.market_cap.usd,
        marketCapRank: marketData.market_cap_rank,
        totalVolume: marketData.total_volume.usd,
        priceChange24h: marketData.price_change_percentage_24h,
        priceChange7d: marketData.price_change_percentage_7d,
        priceChange30d: marketData.price_change_percentage_30d,
        high24h: marketData.high_24h.usd,
        low24h: marketData.low_24h.usd,
        allTimeHigh: marketData.ath.usd,
        allTimeLow: marketData.atl.usd,
        circulatingSupply: marketData.circulating_supply,
        totalSupply: marketData.total_supply,
        image: coin.image?.large,
        homepage: coin.links?.homepage?.[0],
        lastUpdated: marketData.last_updated
      };

      setSelectedCrypto(cryptoDetails);
    } catch (err) {
      console.error('Error fetching details:', err);
    }
  };

  const filteredCrypto = cryptoData.filter(crypto =>
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price) => {
    if (price < 0.01) return price.toFixed(8);
    if (price < 1) return price.toFixed(4);
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatNumber = (num) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>💰 Crypto Prices Dashboard</h1>
        <p className="subtitle">Real-time cryptocurrency market data</p>
        {lastUpdated && (
          <p className="last-updated">Last updated: {formatDate(lastUpdated)}</p>
        )}
      </header>

      <div className="container">
        {loading && !cryptoData.length ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading cryptocurrency data...</p>
          </div>
        ) : error ? (
          <div className="error">
            <p>⚠️ {error}</p>
            <button onClick={fetchCryptoPrices} className="retry-btn">
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search cryptocurrencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button onClick={fetchCryptoPrices} className="refresh-btn" title="Refresh">
                🔄
              </button>
            </div>

            <div className="crypto-grid">
              {filteredCrypto.map((crypto) => (
                <div
                  key={crypto.id}
                  className="crypto-card"
                  onClick={() => fetchCryptoDetails(crypto.id)}
                >
                  <div className="crypto-header">
                    <img src={crypto.image} alt={crypto.name} className="crypto-image" />
                    <div className="crypto-info">
                      <h3>{crypto.name}</h3>
                      <span className="crypto-symbol">{crypto.symbol}</span>
                    </div>
                    <span className="rank">#{crypto.marketCapRank}</span>
                  </div>
                  
                  <div className="crypto-price">
                    <span className="price">${formatPrice(crypto.currentPrice)}</span>
                    <span
                      className={`price-change ${
                        crypto.priceChange24h >= 0 ? 'positive' : 'negative'
                      }`}
                    >
                      {crypto.priceChange24h >= 0 ? '↑' : '↓'}{' '}
                      {Math.abs(crypto.priceChange24h).toFixed(2)}%
                    </span>
                  </div>

                  <div className="crypto-stats">
                    <div className="stat">
                      <span className="stat-label">Market Cap</span>
                      <span className="stat-value">{formatNumber(crypto.marketCap)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Volume 24h</span>
                      <span className="stat-value">{formatNumber(crypto.totalVolume)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCrypto.length === 0 && (
              <div className="no-results">
                <p>No cryptocurrencies found matching "{searchTerm}"</p>
              </div>
            )}
          </>
        )}
      </div>

      {selectedCrypto && (
        <div className="modal-overlay" onClick={() => setSelectedCrypto(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedCrypto(null)}>
              ×
            </button>
            <div className="modal-header">
              <img src={selectedCrypto.image} alt={selectedCrypto.name} className="modal-image" />
              <div>
                <h2>{selectedCrypto.name}</h2>
                <span className="modal-symbol">{selectedCrypto.symbol}</span>
              </div>
            </div>
            
            <div className="modal-body">
              <div className="modal-price-section">
                <div className="modal-price">${formatPrice(selectedCrypto.currentPrice)}</div>
                <div className="modal-price-changes">
                  <span className={`change ${selectedCrypto.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                    24h: {selectedCrypto.priceChange24h >= 0 ? '+' : ''}
                    {selectedCrypto.priceChange24h.toFixed(2)}%
                  </span>
                  <span className={`change ${selectedCrypto.priceChange7d >= 0 ? 'positive' : 'negative'}`}>
                    7d: {selectedCrypto.priceChange7d >= 0 ? '+' : ''}
                    {selectedCrypto.priceChange7d.toFixed(2)}%
                  </span>
                  <span className={`change ${selectedCrypto.priceChange30d >= 0 ? 'positive' : 'negative'}`}>
                    30d: {selectedCrypto.priceChange30d >= 0 ? '+' : ''}
                    {selectedCrypto.priceChange30d.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="modal-stats-grid">
                <div className="modal-stat">
                  <span className="modal-stat-label">Market Cap</span>
                  <span className="modal-stat-value">{formatNumber(selectedCrypto.marketCap)}</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-label">24h High</span>
                  <span className="modal-stat-value">${formatPrice(selectedCrypto.high24h)}</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-label">24h Low</span>
                  <span className="modal-stat-value">${formatPrice(selectedCrypto.low24h)}</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-label">24h Volume</span>
                  <span className="modal-stat-value">{formatNumber(selectedCrypto.totalVolume)}</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-label">All Time High</span>
                  <span className="modal-stat-value">${formatPrice(selectedCrypto.allTimeHigh)}</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-label">All Time Low</span>
                  <span className="modal-stat-value">${formatPrice(selectedCrypto.allTimeLow)}</span>
                </div>
                {selectedCrypto.circulatingSupply && (
                  <div className="modal-stat">
                    <span className="modal-stat-label">Circulating Supply</span>
                    <span className="modal-stat-value">
                      {selectedCrypto.circulatingSupply.toLocaleString()} {selectedCrypto.symbol}
                    </span>
                  </div>
                )}
                {selectedCrypto.totalSupply && (
                  <div className="modal-stat">
                    <span className="modal-stat-label">Total Supply</span>
                    <span className="modal-stat-value">
                      {selectedCrypto.totalSupply.toLocaleString()} {selectedCrypto.symbol}
                    </span>
                  </div>
                )}
              </div>

              {selectedCrypto.homepage && (
                <div className="modal-links">
                  <a href={selectedCrypto.homepage} target="_blank" rel="noopener noreferrer" className="homepage-link">
                    Visit Official Website →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
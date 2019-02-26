exports.run = async (MFBGB, message, args) => {
  const moment = require('moment'),
        Decimal = require('decimal.js-light'),
        UNIT_SATOSHI = 10 ** 8;
  let marketInfosCache = null;
  const wr = require('../../underside/webRequester.js');
  Decimal.set({
    toExpPos: 10,
    toExpNeg: -10,
  });

  /* eslint-disable one-var */
  // Get infomation of the given currency from CoinExchange and return its wallet status
  const getWalletStatus = tickerCode => {
    return wr.get(MFBGB, 'https://www.coinexchange.io/api/v1/getcurrency', {ticker_code: tickerCode}, true)
      .then(res => {
        if (res.result && res.result.WalletStatus) return res.result.WalletStatus;
        else return 'Unknown';
      });
  };

  // Get all of market data from CoinExchange (if not cached), and return id of market of the given currency pair
  const getMarketID = (assetName, baseCurrency) => {
    const funcFind = elem => elem.MarketAssetName === assetName && elem.BaseCurrency === baseCurrency;
    if (marketInfosCache === null) {
      return wr.get(MFBGB, 'https://www.coinexchange.io/api/v1/getmarkets', {}, true)
        .then(res => {
          MFBGB.Logger.log('|BS-Discord| [via CoinExchange] Successfully received all market data');
          marketInfosCache = res.result;
          const data = marketInfosCache.find(funcFind);

          if (data && data.MarketID) return data.MarketID;
          else return null;
        });
    } else {
      MFBGB.Logger.log('|BS-Discord| Cached market data will be used');
      const data = marketInfosCache.find(funcFind);

      if (data && data.MarketID) return data.MarketID;
      else return null;
    }
  };

  // Get the summary (e.g. price of bid and ask) of the given currency pair from CoinExchange
  const getMarketSummary = marketId => {
    return wr.get(MFBGB, 'https://www.coinexchange.io/api/v1/getmarketsummary', {market_id: marketId}, true)
      .then(res => {
        if (res.result) return res.result;
        else return null;
      });
  };

  // Get exchange rate of the given currency pair via CoinGecko API
  const getCurrencyExchangeRate = (currency, baseCurrencyTicker) => {
    return wr.get(MFBGB, 'https://api.coingecko.com/api/v3/simple/price',
                  {ids: currency, vs_currencies: baseCurrencyTicker}, true)
      .then(res => {
        if (res[currency] && res[currency][baseCurrencyTicker]) return res[currency][baseCurrencyTicker];
        else return null;
      });
  };
  /* eslint-enable one-var */

  let walletStatus = null,
      infoXpcDoge = {marketId: null, bid: null, ask: null, vol: null, btcVol: null}, // eslint-disable-line prefer-const
      infoXpcBtc = {marketId: null, bid: null, ask: null, vol: null}, // eslint-disable-line prefer-const
      strXpcDoge = '',
      // strXpcBtc = '', // unused for now
      rateBtcDoge = 0, // Rounded off to the 9th decimal place in btcs
      rateSatoshiDoge = 0, // Rounded off to integer in satoshis
      infoXpcDogeSatoshi = {bid: null, ask: null}; // eslint-disable-line prefer-const

  // Indicate the bot is getting data
  await message.channel.startTyping();

  // Get XPC's wallet status
  walletStatus = await getWalletStatus('XPC');
  MFBGB.Logger.log(`|BS-Discord| [via CoinExchange] Wallet status: ${walletStatus}`);

  // Get XPC/DOGE market id
  infoXpcDoge.marketId = await getMarketID('eXPerience Chain', 'Dogecoin');
  if (infoXpcDoge.marketId !== null) {
    MFBGB.Logger.log(`|BS-Discord| [via CoinExchange] XPC/DOGE MarketID: ${infoXpcDoge.marketId}`);

    // Get XPC/DOGE market summary
    const bookXpcDoge = await getMarketSummary(infoXpcDoge.marketId);
    infoXpcDoge.bid = new Decimal(bookXpcDoge.BidPrice);
    infoXpcDoge.ask = new Decimal(bookXpcDoge.AskPrice);
    infoXpcDoge.vol = new Decimal(bookXpcDoge.Volume);
    infoXpcDoge.btcVol = new Decimal(bookXpcDoge.BTCVolume);
    MFBGB.Logger.log(`|BS-Discord| [via CoinExchange] XPC/DOGE Bid: ${infoXpcDoge.bid}, Ask: ${infoXpcDoge.ask}, Vol: ${infoXpcDoge.vol} (eq. to ${infoXpcDoge.btcVol} BTC)`);

    // Get exchange rate of BTC/DOGE
    rateBtcDoge = new Decimal(await getCurrencyExchangeRate('dogecoin', 'btc'));
    // rateBtcDoge = rateBtcDoge.toFixed(8);
    rateSatoshiDoge = rateBtcDoge.mul(UNIT_SATOSHI).toint(); // Number((rateBtcDoge * UNIT_SATOSHI).toFixed(0));
    MFBGB.Logger.log(`|BS-Discord| [via CoinGecko] ${rateBtcDoge} BTC/DOGE (eq. to ${rateSatoshiDoge} sat/DOGE)`);

    // Calculate virtual XPC/satoshi market price
    infoXpcDogeSatoshi.bid = (infoXpcDoge.bid).mul(rateSatoshiDoge);
    infoXpcDogeSatoshi.ask = (infoXpcDoge.ask).mul(rateSatoshiDoge);
    MFBGB.Logger.log(`|BS-Discord| Virtual XPC/satoshi Bid: ${infoXpcDogeSatoshi.bid}, Ask: ${infoXpcDogeSatoshi.ask}`);

    strXpcDoge = `**[DOGE建て]** (1 DOGE = ${rateSatoshiDoge} sat)
売値: ${infoXpcDogeSatoshi.bid} sat
買値: ${infoXpcDogeSatoshi.ask} sat
取引高: ${infoXpcDoge.vol} DOGE (${infoXpcDoge.btcVol} BTC)`;
  } else {
    MFBGB.Logger.warn(`|BS-Discord| [via CoinExchange] XPC/DOGE MarketID: Not found`);
    strXpcDoge = `**[DOGE建て]**
(上場廃止)`;
  }


  // Get XPC/BTC market id
  infoXpcBtc.marketId = await getMarketID('eXPerience Chain', 'Bitcoin');
  MFBGB.Logger.log(`|BS-Discord| [via CoinExchange] XPC/BTC MarketID: ${infoXpcBtc.marketId}`);

  // Get XPC/BTC market summary
  const bookXpcBtc = await getMarketSummary(infoXpcBtc.marketId);
  infoXpcBtc.bid = new Decimal(bookXpcBtc.BidPrice);
  infoXpcBtc.ask = new Decimal(bookXpcBtc.AskPrice);
  infoXpcBtc.vol = new Decimal(bookXpcBtc.Volume);
  MFBGB.Logger.log(`|BS-Discord| [via CoinExchange] XPC/BTC Bid: ${infoXpcBtc.bid}, Ask: ${infoXpcBtc.ask}, Vol: ${infoXpcBtc.vol} BTC`);

  // Send all data to the requester
  await message.reply(`
__**:tools: XPC CoinExchange wallet status :tools:**__
Status: **${walletStatus}**

__**:bank: XPC CoinExchange 市場状況 :bank:**__

${strXpcDoge}

**[BTC建て]**
売値: ${(infoXpcBtc.bid).mul(UNIT_SATOSHI)} sat
買値: ${(infoXpcBtc.ask).mul(UNIT_SATOSHI)} sat
取引高: ${infoXpcBtc.vol} BTC

(${moment().format('YYYY年MM月DD日 HH時mm分ss秒')})`);
  message.channel.stopTyping();
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 'USR',
};

exports.help = {
  name: 'cexpc',
  category: 'MISC',
  description: 'cexpc',
  usage: 'cexpc',
};

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
      infoXpcBtc = {marketId: null, bid: null, ask: null, vol: null, usdBid: null, usdAsk: null}, // eslint-disable-line prefer-const
      strXpcDoge = '',
      // strXpcBtc = '', // unused for now
      rateDogeBtc = 0, // Rounded off to the 9th decimal place in btcs
      rateDogeSatoshi = 0, // Rounded off to integer in satoshis
      rateBtcUsd = 0,
      rateSatoshiUsd = 0,
      infoXpcDogeSatoshi = {bid: null, ask: null, usdBid: null, usdAsk: null}; // eslint-disable-line prefer-const

  // Indicate the bot is getting data
  await message.channel.startTyping();

  // Get XPC's wallet status
  walletStatus = await getWalletStatus('XPC');
  MFBGB.Logger.log(`|BS-Discord| [via CoinExchange] Wallet status: ${walletStatus}`);

  // Get exchange rate of USD/BTC
  rateBtcUsd = new Decimal(await getCurrencyExchangeRate('bitcoin', 'usd'));
  rateSatoshiUsd = rateBtcUsd.div(UNIT_SATOSHI);
  MFBGB.Logger.log(`|BS-Discord| [via CoinGecko] BTC/USD = ${rateBtcUsd} (eq. to sat/USD = ${rateSatoshiUsd})`);

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

    // Get exchange rate of DOGE/BTC
    rateDogeBtc = new Decimal(await getCurrencyExchangeRate('dogecoin', 'btc'));
    rateDogeSatoshi = rateDogeBtc.mul(UNIT_SATOSHI).toint();
    MFBGB.Logger.log(`|BS-Discord| [via CoinGecko] DOGE/BTC = ${rateDogeBtc} (eq. to DOGE/sat = ${rateDogeSatoshi})`);

    // Calculate virtual XPC/satoshi market price
    infoXpcDogeSatoshi.bid = (infoXpcDoge.bid).mul(rateDogeSatoshi);
    infoXpcDogeSatoshi.ask = (infoXpcDoge.ask).mul(rateDogeSatoshi);
    MFBGB.Logger.log(`|BS-Discord| Virtual XPC/satoshi Bid: ${infoXpcDogeSatoshi.bid}, Ask: ${infoXpcDogeSatoshi.ask}`);

    // Calculate virtual XPC/USD market price based on XPC/DOGE
    infoXpcDogeSatoshi.usdBid = (infoXpcDogeSatoshi.bid).mul(rateSatoshiUsd).todp(8);
    infoXpcDogeSatoshi.usdAsk = (infoXpcDogeSatoshi.ask).mul(rateSatoshiUsd).todp(8);
    MFBGB.Logger.log(`|BS-Discord| Virtual XPC/USD (DOGE) Bid: ${infoXpcDogeSatoshi.usdBid}, Ask: ${infoXpcDogeSatoshi.usdAsk}`);

    strXpcDoge = `**[DOGE建て]** (1 DOGE = ${rateDogeSatoshi} sat)
売値: ${infoXpcDogeSatoshi.bid} sat ($ ${infoXpcDogeSatoshi.usdBid})
買値: ${infoXpcDogeSatoshi.ask} sat ($ ${infoXpcDogeSatoshi.usdAsk})
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

  // Calculate virtual XPC/USD market price based on XPC/BTC
  infoXpcBtc.usdBid = (infoXpcBtc.bid).mul(UNIT_SATOSHI).mul(rateSatoshiUsd).todp(8);
  infoXpcBtc.usdAsk = (infoXpcBtc.ask).mul(UNIT_SATOSHI).mul(rateSatoshiUsd).todp(8);
  MFBGB.Logger.log(`|BS-Discord| Virtual XPC/USD (BTC) Bid: ${infoXpcBtc.usdBid}, Ask: ${infoXpcBtc.usdAsk}`);

  // Send all data to the requester
  await message.reply(`
__**:tools: XPC CoinExchange wallet status :tools:**__
Status: **${walletStatus}**

__**:bank: XPC CoinExchange 市場状況 :bank:**__

${strXpcDoge}

**[BTC建て]**
売値: ${(infoXpcBtc.bid).mul(UNIT_SATOSHI)} sat ($ ${infoXpcBtc.usdBid})
買値: ${(infoXpcBtc.ask).mul(UNIT_SATOSHI)} sat ($ ${infoXpcBtc.usdAsk})
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
  category: 'CRYPTOCURRENCY',
  description: 'CoinExchangeのXPCの市場状況を表示します。',
  usage: 'cexpc',
};

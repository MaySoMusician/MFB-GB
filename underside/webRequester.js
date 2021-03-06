/* eslint-disable one-var */
const querystring = require('querystring'),
      rpn = require('request-promise-native'),
      ch = require('cheerio-httpcli');
      // USERAGENT = 'Request-Promise-Native/1.0.5';

const get = (client, uri, queryStrings, parseJson) => {
  const userAgent = 'Request-Promise-Native/1.0.5';
  // Format query string for logging debug information
  const strQueryString = querystring.stringify(queryStrings);

  client.logger.debug(`|WebRequester| Get: ${uri}`);
  client.logger.debug(`|WebRequester| ${strQueryString === '' ? '(no query string)': '?' + strQueryString}`);
  client.logger.debug(`|WebRequester| user-agent: ${userAgent}, parseJson: ${parseJson}`);

  return rpn({uri: uri, qs: queryStrings, headers: {'User-Agent': userAgent}, json: parseJson}).then(res => {
    client.logger.debug(`|WebRequester| Get: Successful`);
    return res;
  }).catch(e => client.logger.error(`|WebRequester| Get: Failed: ${e}`));
};

const fetch = (client, uri, queryStrings, encode = undefined) => {
  const userAgent = 'Cheerio-Httpcli/0.7.3';
  ch.reset();
  ch.set('headers', {'User-Agent': userAgent});
  ch.set('referer', false);

  // Format query string for logging debug information
  const strQueryString = querystring.stringify(queryStrings);

  client.logger.debug(`|WebRequester| Fetch: ${uri}`);
  client.logger.debug(`|WebRequester| ${strQueryString === '' ? '(no query string)': '?' + strQueryString}`);
  client.logger.debug(`|WebRequester| user-agent: ${userAgent}`);

  return ch.fetch(uri, queryStrings, encode).then(res => {
    client.logger.debug(`|WebRequester| Fetch: Successful`);
    return res;
  }).catch(e => client.logger.error(`|WebRequester| Fetch: Failed: ${e}`));
};

module.exports = {
  'get': get,
  'fetch': fetch,
};

/* eslint-disable one-var */
const querystring = require('querystring'),
      rpn = require('request-promise-native');
      // USERAGENT = 'Request-Promise-Native/1.0.5';

const get = (MFBGB, uri, queryStrings, parseJson) => {
  const userAgent = 'Request-Promise-Native/1.0.5';
  // Format query string for logging debug information
  const strQueryString = querystring.stringify(queryStrings);

  MFBGB.Logger.debug(`|WebRequester| Get: ${uri}`);
  MFBGB.Logger.debug(`|WebRequester| ${strQueryString === '' ? '(no query string)': '?' + strQueryString}`);
  MFBGB.Logger.debug(`|WebRequester| user-agent: ${userAgent}, parseJson: ${parseJson}`);

  return rpn({uri: uri, qs: queryStrings, headers: {'User-Agent': userAgent}, json: parseJson}).then(res => {
    MFBGB.Logger.debug(`|WebRequester| Get: Successful`);
    return res;
  }).catch(e => MFBGB.Logger.error(`|WebRequester| Get: Failed: ${e}`));
};

module.exports = {
  'get': get,
};

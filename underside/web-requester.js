/* eslint-disable one-var */
const querystring = require('querystring'),
      rpn = require('request-promise-native');
      // USERAGENT = 'Request-Promise-Native/1.0.5';

const get = (MFBGB, uri, queryStrings, parseJson) => {
  const userAgent = 'Request-Promise-Native/1.0.5';
  // Format query string for logging debug information
  const strQueryString = querystring.stringify(queryStrings);

  MFBGB.Logger.debug(`GET: ${uri}`);
  MFBGB.Logger.debug(`${strQueryString === '' ? '(no query string)': '?' + strQueryString}`);
  MFBGB.Logger.debug(`user-agent: ${userAgent}, parseJson: ${parseJson}`);

  return rpn({uri: uri, qs: queryStrings, headers: {'User-Agent': userAgent}, json: parseJson}).then(res => {
    MFBGB.Logger.debug(`GET: Successful`);
    return res;
  }).catch(e => MFBGB.Logger.error(`GET: Failed: ${e}`));
};

module.exports = {
  'get': get,
};

/* eslint-disable one-var */
const rpn = require('request-promise-native'),
      USERAGENT = 'Request-Promise-Native/1.0.5';

const get = (MFBGB, uri, queryStrings, parseJson) => {
  let strQueryString = '';
  // Format query string for logging debug information
  Object.keys(queryStrings).forEach(k => {
    strQueryString += `${strQueryString === '' ? '?' : '&'}${k}=${queryStrings[k]}`;
  });
  MFBGB.Logger.debug(`GET: ${uri}`);
  MFBGB.Logger.debug(`${strQueryString === '' ? '(no query string)': strQueryString}`);
  MFBGB.Logger.debug(`user-agent: ${USERAGENT}, parseJson: ${parseJson}`);

  return rpn({uri: uri, qs: queryStrings, headers: {'User-Agent': USERAGENT}, json: parseJson}).then(res => {
    MFBGB.Logger.debug(`GET: Successful`);
    return res;
  }).catch(e => MFBGB.Logger.error(`GET: Failed: ${e}`));
};

module.exports = {
  'get': get,
};

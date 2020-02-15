const srcBase = 16,
      destBase = 64,
      srcBitLength = Math.log2(srcBase),
      destBitLength = Math.log2(destBase),
      srcChars = '0123456789abcdef',
      destChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUCVWXYZ+/',
      pad0 = (num, len) => ('0'.repeat(len) + num).substr(-len);

module.exports = class CompressedHexadecimal {
  static compress(rawHex) {
    return rawHex.replace(/./g, e => pad0(srcChars.indexOf(e).toString(2), srcBitLength)).replace(
      new RegExp(`(.{1,${destBitLength}}$)|.{${destBitLength}}`, 'g'),
      (m, a) => a ? destChars.charAt(parseInt(m, 2)) + m.length
                  : destChars.charAt(parseInt(m, 2)), // eslint-disable-line indent, operator-linebreak
    );
  }

  static expand(compressed) {
    return compressed.replace(
      /(.)(.)$|./g,
      (m, a, b) => a ? pad0(destChars.indexOf(a).toString(2), destBitLength).substr(-b)
                     : pad0(destChars.indexOf(m).toString(2), destBitLength), // eslint-disable-line indent, operator-linebreak
    ).replace(new RegExp(`.{${srcBitLength}}`, 'g'), e => srcChars.charAt(parseInt(e, 2)));
  }
};

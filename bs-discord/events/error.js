module.exports = async (MFBGB, error) => {
  let sessionData;
  if (error.target._socket._tlsOptions.session) {
    sessionData = error.target._socket._tlsOptions.session.data;
  } else {
    sessionData = 'N/A';
  }
  MFBGB.Logger.error(`|BS-Discord| An error event was sent by Discord.js: '${error.message}' (Type: ${error.type}, ErrNo: ${error.error.errno}, Code: ${error.error.code}, Syscall: ${error.error.syscall})
More detailed information:
[General] URL: ${error.target.url}
[Receiver] Type: ${error.target._receiver._binaryType}, Length: ${error.target._receiver._payloadLength}

[Socket] Session: ${sessionData}`);

  MFBGB.Logger.error(`\nRaw Data: \n${JSON.stringify(error)}`);
};

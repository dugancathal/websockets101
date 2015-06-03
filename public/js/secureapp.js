var SecureAuth = {
  outgoing: function(message, callback) {
    if(message.channel != '/meta/subscribe') {
      callback(message);
    }

    message.ext = message.ext || {};

    message.ext.authToken = $('#password').val();

    callback(message);
  }
};


websocketClient.addExtension(SecureAuth);

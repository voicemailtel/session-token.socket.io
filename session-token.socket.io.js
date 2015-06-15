var jwt = require('jsonwebtoken');
module.exports = SessionSockets;

function SessionSockets(io, sessionStore, secret) {
  var sessionSockets = this;
  this.io = io;

  this.on = function(event, callback) {
    return bind(event, callback, io.sockets);
  };

  this.of = function(namespace) {
    return {
      on: function(event, callback) {
        return bind(event, callback, io.of(namespace));
      }
    };
  };

  this.getSession = function(socket, callback) {
      var sessionLookupMethod = sessionStore.load || sessionStore.get;
      sessionLookupMethod.call(sessionStore, findToken(socket.handshake), function (storeErr, session) {
        var err = resolveErr( storeErr, session);
        callback(err, session);
      });
  };

  function bind(event, callback, namespace) {
    namespace.on(event, function (socket) {
      sessionSockets.getSession(socket, function (err, session) {
        callback(err, socket, session);
      });
    });
  }

  function findToken(handshake) {
    if (handshake) {
        var session_id = JSON.parse(jwt.decode(handshake.query.token,secret));
        return session_id;
    }
  }

  function resolveErr(parseErr, storeErr, session) {
    var err = parseErr || storeErr || null;
    if (!err && !session) err = new Error('Could not lookup session by token');
    return err;
  }
}

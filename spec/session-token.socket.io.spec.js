var path = require('path')
  , expect = require('expect.js')
  , SessionSockets = require(path.resolve('session-token.socket.io'))
  , jonnySocket = stub({ foo: 'bar' });

describe('SessionSockets', function () {
  this.timeout(3000);

  beforeEach(function () {
    this.socketIo = io();
    this.sessionSockets = new SessionSockets(this.socketIo, sessionStore(), secret);
  });

  it('exposes a reference to the underlying socket.io', function () {
    expect(this.sessionSockets.io).to.be(this.socketIo);
  });

  it('gets the corresponding session for a given socket client', function (done) {
    this.sessionSockets.getSession(jonnySocket, function (err, session) {
      expect(err).to.be(null);
      expect(session.foo).to.equal('bar');
      done();
    });
  });

  it('provides session in connection callbacks on the global namespace', function (done) {
    this.sessionSockets.on('connection', function (err, socket, session) {
      expect(err).to.be(null);
      expect(session.foo).to.equal('bar');
      done();
    });
  });

  it('provides session in connection callbacks on a specific namespace', function (done) {
    this.sessionSockets.of('/foobar').on('connection', function (err, socket, session) {
      expect(err).to.be(null);
      expect(session.foo).to.equal('bar');
      done();
    });
  });

  it('gives a SessionStoreError upon invalid handshakes', function (done) {
    this.sessionSockets.getSession({ handshake: 'invalid' }, function (err, session) {
      expect(err).to.be.a(SessionStoreError);
      expect(session).to.be(null);
      done();
    });
  });

});

function stub(attributes) {
  attributes.handshake = { query: { 'token': 42 }};
  return attributes;
}

function ns() {
  return {
    on: function(event, callback) {
      if (event === 'connection') callback(jonnySocket);
    }
  };
}

function io() {
  return {
    of: function() { return ns() },
    sockets: ns()
  };
}

function sessionStore() {
  return {
    load: function(secret, callback) {
      if (secret) callback(null, jonnySocket);
      else callback(new SessionStoreError(), null);
    }
  };
}

function SessionStoreError() {}

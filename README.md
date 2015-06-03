# Websockets

A binary protocol for "real-time" data over TCP.

## Handshake

This is the "web" in Websockets.

### Client Handshake request

- Must be `HTTP 1.1` or greater
- Must be a `GET` request
- Must include a `Connection: Upgrade` header (some servers even require the
  capital "U")
- Must include the `Upgrade: websocket` header (this is required because of the
  previous step)

All "common" headers are allowed: `Auth`, `User-Agent`, `Cookie`, `Referer`,
etc.

```HTTP
GET /chat HTTP/1.1
Host: example.com:8000
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

### Server Handshake response

- Must repeat the `Connection: Upgrade` header
- Must repeat the `Upgrade: websocket` header
- Other headers are allowed (e.g. `Set-Cookie`)
- Note the strange accept header:
  ```ruby
  require 'digest/sha1'
  magic = request.headers['Sec-WebSocket-Key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
  Digest::SHA1.base64digest(magic)
  ```

```HTTP
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

## Protocol

Bit number 1 (the FIN bit) specifies if the message is the last in a series. If
it is set to 1, the message receiver should keep waiting for more in that
series.

The next 3 bits are reserved.

The next octet is the "opcode", which is (effectively) the mime-type and allows
you to specify the type of data:

  - `0x0` for a continuation of a previous message
  - `0x1` for text (always UTF-8)
  - `0x2` for binary
  - etc.

Data going to the client from the server is normal and follows the following
format:

- Reference diagram at
  https://developer.mozilla.org/en-US/docs/WebSockets/Writing_WebSocket_servers#Format

Data coming from the client to the server is masked using XOR encryption (with a
32 bit key). Note bit number 8 is the "MASK" bit. For client communications,
this bit is set to 1.

Bits 9-80 are reserved for the payload length.

To decode the data, read 4 octets from bits 81-113. Call the data in those 32
bits `MASK`. The demasking looks like:

```javascript
var DECODED = "";
for (var i = 0; i < ENCODED.length; i++) {
    DECODED[i] = ENCODED[i] ^ MASK[i % 4];
}
```

### Pings and Pongs

Messages with an opcode of `0x9` are a ping and `0xA` are a pong. Either party
may send either message. If a party receives a ping, they are required to send a
pong as soon as possible. Additionally, some short (less than 125 bits) message
should be included in the ping payload and that must be returned in the pong.

### Subprotocols

The client in the original handshake request can specify a "subprotocol" to use
over the websocket connection.

```HTTP
Sec-WebSocket-Protocol: soap, json
```

The server should respond with the one they can actually handle and respond in
kind. But they can __only pick one__.

```HTTP
Sec-WebSocket-Protocol: json
```

### Closing the connection

Either the client or the server can send a message with opcode `0x8` to initiate
a connection close. The server, if it receives a CLOSE frame, MUST respond in
kind.

## Security

The client may also connect to the server via a `wss://` URL if the server
supports it. This follows the exact same protocol with the data being encrypted
via TLS. __This is the minimum you should do.__

Because all the headers are passed through normally, you can use the standard
Authorization header to verify access on the initial handshake using something
like a bearer token, etc.

# Gotchas

## In Software

Dealing with websockets in Ruby is interesting. Because of the nature of the
messaging you're dealing with, Websockets should be asynchronous (or at least
really fast). To make this work, the Rubyist that wrote Faye used EventMachine
which is an asynchronous framework for writing Ruby.

What this means for you is, any time that you need to add logic to your Faye
server (be it auth, message sanitization/validation, whatever), you have to
start thinking in async. There are libraries out there for EventMachine that
provide async support for HTTP, Redis, and other datastores.

## In Infrastructure

You're now dealing with a new protocol; it's layered over TCP, but nevertheless,
it's not HTTP. You must, therefore, make sure that your infrastructure isn't
doing something silly like ignoring "random" TCP connections.

This usually means ensuring that your load balancers are configured properly
(sticky connections are one "normal" piece of this). Most HTTP servers support
SSL offloading so it should be a relatively simple task to change to wss and
then route to your backend (use something like nginx >=1.4.0).


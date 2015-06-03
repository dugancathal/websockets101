# Websockets

A binary protocol for "real-time" data over TCP.

???

- A way to make things "real-time" (eliminates polling).
- Not technically useful unless a browser is involved
- Involved a browser API for initializing the socket
- Still "client-driven"

---

background-image: url(http://cdn1.sciencefiction.com/wp-content/uploads/2013/12/TheFlash.jpg)

# Why Websockets?

???

- In the beginning, there was the static web.
- Flash
- XHR
- jQuery

---

# How do they work?

---

# It all starts with a handshake

## Client Request

```HTTP
GET /chat HTTP/1.1
Host: example.com:8000
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

???

- Must be HTTP/1.1
- Must be a GET
- Must include a `Connection: Upgrade` header (some servers even require the
  capital "U")
- Must include the `Upgrade: websocket` header (this is required because of the
  previous step)
- All "common" headers are allowed: `Auth`, `User-Agent`, `Cookie`, `Referer`,

---

# It all starts with a handshake

## Server Response

```HTTP
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

???

- Must repeat the `Connection: Upgrade` header
- Must repeat the `Upgrade: websocket` header
- Other headers are allowed (e.g. `Set-Cookie`)

- Lead in to the next:
  - See the weird sec-accept header there?
  - Who's heard of Van Halen asking for no brown M&Ms?

--

### "Security"

```ruby
require 'digest/sha1'
request.headers['Sec-WebSocket-Key'] #=> 'dGhlIHNhbXBsZSBub25jZQ=='
MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
magic = request.headers['Sec-WebSocket-Key'] + MAGIC_STRING
Digest::SHA1.base64digest(magic) #=> 's3pPLMBiTxaQ9kYGzzhZRbK+xOo='
```

???

- Yes, it's really a "Magic" string set down in the RFC
- Only reasoning? Because we want to make sure the server isn't faking it.

---

# The Protocol

```
      0                   1                   2                   3
      0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
     +-+-+-+-+-------+-+-------------+-------------------------------+
     |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
     |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
     |N|V|V|V|       |S|             |   (if payload len==126/127)   |
     | |1|2|3|       |K|             |                               |
     +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
     |     Extended payload length continued, if payload len == 127  |
     + - - - - - - - - - - - - - - - +-------------------------------+
     |                               |Masking-key, if MASK set to 1  |
     +-------------------------------+-------------------------------+
     | Masking-key (continued)       |          Payload Data         |
     +-------------------------------- - - - - - - - - - - - - - - - +
     :                     Payload Data continued ...                :
     + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
     |                     Payload Data continued ...                |
     +---------------------------------------------------------------+
```

???

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

---

# Protocol

## Data Masking

???

Data coming from the client to the server is masked using XOR encryption (with a
32 bit key). Note bit number 8 is the "MASK" bit. For client communications,
this bit is set to 1.

--

```javascript
var DECODED = bits[81..113];
var ENCODED = bits[114..-1];
for (var i = 0; i < ENCODED.length; i++) {
    DECODED[i] = ENCODED[i] ^ MASK[i % 4];
}
```

???

The "MASK" is chosen at random by the client from a "strong source of entropy".
Each subsequent frame is required to have a new MASK.

Bits 9-80 are reserved for the payload length.

To decode the data, read 4 octets from bits 81-113. Call the data in those 32
bits `MASK`. The demasking looks like:

---

background-image: url(http://statfaking2.firstpost.in/wp-content/uploads/2014/11/heartbeat.jpg)

???

# Heartbeating

- Built into the protocol.
- Initiated by either client or server
- Mandatory pongs
- Application data may be included in ping

---

# Demo

---

# Gotchas

## Software

- Async
- Callback soup

## Infrastructure

- TLS
- Binary protocol
- Load balancing

## Security 

???

## Software
- Asynchronous code is hard
- Pick a good library (faye, socket.io, etc)
- Auth becomes difficult

## Infrastructure
- Not in Kansas anymore
- SSL offloading makes it easier
  - Nginx >=1.4.0


# BitEater (based on BitBuffer by [Anthony Pesch](https://github.com/inolen))

[![Build Status](https://travis-ci.org/jpoikela/bit-eater.svg?branch=master)](https://travis-ci.org/jpoikela/bit-eater)

BitEater provides two objects, `BitView` and `BitStream`. `BitView` is a wrapper for ArrayBuffers, similar to JavaScript's [DataView](https://developer.mozilla.org/en-US/docs/JavaScript/Typed_arrays/DataView), but with support for bit-level reads and writes. `BitStream` is a wrapper for a `BitView` used to help maintain your current buffer position, as well as to provide higher-level read / write operations such as for ASCII strings.

NOTE! BitEater is not compatible with BitBuffer: it uses opposite bit ordering. Additionally BitEater does not supports floats nor UTF, but instead allows setting endianness.


## BitView

### Attributes

```javascript
bb.buffer  // Underlying ArrayBuffer.
```

### Methods

#### BitView(buffer, optional byteOffset, optional byteLength, optional endianness)

Default constructor, takes in a single argument of an ArrayBuffer. Optional are the `byteOffset` and `byteLength` arguments to offset and truncate the view's representation of the buffer.

### getBits(offset, bits, signed)

Reads `bits` number of bits starting at `offset`, twiddling the bits appropriately to return a proper 32-bit signed or unsigned value. NOTE: While JavaScript numbers are 64-bit floating-point values, we don't bother with anything other than the first 32 bits.

Example data
```
0xB7     0xF4
10110111 11110100
```
Result for examplary getBits calls:
```javascript
view.getBit(0, 1, false);
1 // "uint"
view.getBit(1, 1, false);
0 // "uint"
view.getBits(0, 3, false);
5 // "uint"
view.getBits(0, 3, true);
-2 // "int" highest bit:sign, the rest: one's complement of 2
view.getBits(0, 4, false);
11 // "uint"
```

### getInt8, getUint8, getInt16, getUint16, getInt32, getUint32(offset)

Shortcuts for getBits, setting the correct `bits` / `signed` values.

Example data
```
0xB7     0xF4
10110111 11110100
```
Result for examplary getUint calls:
```javascript
big_endian_view.getUint8(0, false);
183 // 0xB7
big_endian_view.getUint16(0, false);
47092 // 0xB7F4
little_endian_view.getUint16(0, false);
62647// 0xF4B7
```

### setBits(offset, value, bits)

Sets `bits` number of bits at `offset`.

### setInt8, setUint8, setInt16, setUint16, setInt32, setUint32(offset)

Shortcuts for setBits, setting the correct `bits` count.


## BitStream

### Attributes

```javascript
bb.byteIndex; // Get current index in bytes.
bb.byteIndex = 0;  // Set current index in bytes.
```

```javascript
bb.view;  // Underlying BitView
```

```javascript
bb.length; // Get the length of the stream in bits
```

```javascript
bb.bitsLeft; // The number of bits left in the stream
```

```javascript
bb.index; // Get the current index in bits
bb.index = 0// Set the current index in bits
```

### Methods

#### BitStream(view)

Default constructor, takes in a single argument of a `BitView`, `ArrayBuffer`, `Uint8Array` or node `Buffer`.

#### BitSteam(buffer, optional byteOffset, optional byteLength)

Shortcut constructor that initializes a new `BitView(buffer, byteOffset, byteLength)` for the stream to use.

#### readBits(bits, signed)

Returns `bits` numbers of bits from the view at the current index, updating the index.

#### writeBits(value, bits)

Sets `bits` numbers of bits from `value` in the view at the current index, updating the index.

#### readUint8(), readUint16(), readUint32(), readInt8(), readInt16(), readInt32()

Read a 8, 16 or 32 bits (unsigned) integer at the current index, updating the index.

#### writeUint8(value), writeUint16(value), writeUint32(value), writeInt8(value), writeInt16(value), writeInt32(value)

Write 8, 16 or 32 bits from `value` as (unsigned) integer at the current index, updating the index.

#### readBoolean()

Read a single bit from the view at the current index, updating the index.

#### writeBoolean(value)

Write a single bit to the view at the current index, updating the index.

#### readASCIIString(optional bytes)

Reads bytes from the underlying view at the current index until either `bytes` count is reached or a 0x00 terminator is reached.

#### writeASCIIString(string, optional bytes)

Writes a string followed by a NULL character to the underlying view starting at the current index. If the string is longer than `bytes` it will be truncated, and if it is shorter 0x00 will be written in its place.

#### readBitStream(length)

Create a new `BitStream` from the underlying view starting the the current index and a length of `length` bits. Updating the index of the existing `BitStream`

#### readArrayBuffer(byteLength)

Read `byteLength` bytes of data from the underlying view as `ArrayBuffer`, updating the index.

## license

MIT

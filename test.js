var assert = require('assert'),
	BitView = require('./bit-buffer').BitView,
	BitStream = require('./bit-buffer').BitStream,
	Endianness = require('./bit-buffer').Endianness;

suite('BitBuffer', function () {
	var array, bv, bsw, bsr;

	setup(function () {
		array = new ArrayBuffer(64);
		bv = new BitView(array);
		bsw = new BitStream(bv);
		// Test initializing straight from the array.
		bsr = new BitStream(array, null, null, 1);
	});

	test('Documentation bit read', function () {
		var value = 0xB7;

		bsw.writeBits(value, 8);
		assert.equal(bv.getBits(0, 1, false), 0x1);
		assert.equal(bv.getBits(1, 1, false), 0x0);
		assert.equal(bv.getBits(0, 3, false), 0x5);
		assert.equal(bv.getBits(0, 3, true), -0x3);
		assert.equal(bv.getBits(0, 4, false), 0xB);
	});

	test('Write high and low bits', function () {
		var high = 0xA;
		var low = 5;

		bsw.writeBits(high, 4);
		bsw.writeBits(low, 4);
		assert.equal(bsr.readUint8(), 0xA5);
	});

	test('Min / max signed 5 bits', function () {
		var signed_max = (1 << 4) - 1;

		bsw.writeBits(signed_max, 5);
		bsw.writeBits(-signed_max - 1, 5);
		assert.equal(bsr.readBits(5, true), signed_max);
		assert.equal(bsr.readBits(5, true), -signed_max - 1);
	});

	test('Min / max unsigned 5 bits', function () {
		var unsigned_max = (1 << 5) - 1;

		bsw.writeBits(unsigned_max, 5);
		bsw.writeBits(-unsigned_max, 5);
		assert.equal(bsr.readBits(5), unsigned_max);
		assert.equal(bsr.readBits(5), 1);
	});

	test('Min / max int8', function () {
		var signed_max = 0x7F;

		bsw.writeInt8(signed_max);
		bsw.writeInt8(-signed_max - 1);
		assert.equal(bsr.readInt8(), signed_max);
		assert.equal(bsr.readInt8(), -signed_max - 1);
	});

	test('Min / max uint8', function () {
		var unsigned_max = 0xFF;

		bsw.writeUint8(unsigned_max);
		bsw.writeUint8(-unsigned_max);
		assert.equal(bsr.readUint8(), unsigned_max);
		assert.equal(bsr.readUint8(), 1);
	});

	test('Min / max int16', function () {
		var signed_max = 0x7FFF;

		bsw.writeInt16(signed_max);
		bsw.writeInt16(-signed_max - 1);
		assert.equal(bsr.readInt16(), signed_max);
		assert.equal(bsr.readInt16(), -signed_max - 1);
	});

	test('Min / max uint16', function () {
		var unsigned_max = 0xFFFF;

		bsw.writeUint16(unsigned_max);
		bsw.writeUint16(-unsigned_max);
		assert.equal(bsr.readUint16(), unsigned_max);
		assert.equal(bsr.readUint16(), 1);
	});

	test('Min / max int32', function () {
		var signed_max = 0x7FFFFFFF;

		bsw.writeInt32(signed_max);
		bsw.writeInt32(-signed_max - 1);
		assert.equal(bsr.readInt32(), signed_max);
		assert.equal(bsr.readInt32(), -signed_max - 1);
	});

	test('Min / max uint32', function () {
		var unsigned_max = 0xFFFFFFFF;

		bsw.writeUint32(unsigned_max);
		bsw.writeUint32(-unsigned_max);
		assert.equal(bsr.readUint32(), unsigned_max);
		assert.equal(bsr.readUint32(), 1);
	});

	test('Unaligned reads', function () {
		bsw.writeBits(13, 5);
		bsw.writeUint8(0xFF);
		bsw.writeBits(14, 5);

		assert.equal(bsr.readBits(5), 13);
		assert.equal(bsr.readUint8(), 0xFF);
		assert.equal(bsr.readBits(5), 14);
	});

	test('Unaligned read 5, 3', function () {
		bsw.writeUint8(0x8d); //0b10001101
		assert.equal(bsr.readBits(5), 17);
		assert.equal(bsr.readBits(3), 5);
	});

	test('Unaligned read(2,9) 0xAEBF', function () {
		bsw.writeUint8(0xAE); //0b
		bsw.writeUint8(0xBF); //0b

		bsr.readBits(2);
		assert.equal(bsr.readBits(9), 373);
	});


	test('Overwrite previous value with 0', function () {
		bv.setUint8(0, 13);
		bv.setUint8(0, 0);

		assert.equal(bv.getUint8(0), 0);
	});

	test('Read / write ASCII string, fixed length', function () {
		var str = 'foobar';
		var len = 16;

		bsw.writeASCIIString(str, len);
		assert.equal(bsw.byteIndex, len);

		assert.equal(bsr.readASCIIString(len), str);
		assert.equal(bsr.byteIndex, len);
	});

	test('Read / write ASCII string, unknown length', function () {
		var str = 'foobar';

		bsw.writeASCIIString(str);
		assert.equal(bsw.byteIndex, str.length + 1);  // +1 for 0x00

		assert.equal(bsr.readASCIIString(), str);
		assert.equal(bsr.byteIndex, str.length + 1);
	});

	test('Read ASCII string, 0 length', function () {
		var str = 'foobar';

		bsw.writeASCIIString(str);
		assert.equal(bsw.byteIndex, str.length + 1);  // +1 for 0x00

		assert.equal(bsr.readASCIIString(0), '');
		assert.equal(bsr.byteIndex, 0);
	});

	test('Read overflow', function () {
		var exception = false;

		try {
			bsr.readASCIIString(128);
		} catch (e) {
			exception = true;
		}

		assert(exception);
	});

	test('Write overflow', function () {
		var exception = false;

		try {
			bsw.writeASCIIString('foobar', 128);
		} catch (e) {
			exception = true;
		}

		assert(exception);
	});

	test('Get boolean', function () {
		bv.setUint8(0, 1);

		assert(bv.getBoolean(7));

		bv.setUint8(0, 0);
		assert(!bv.getBoolean(7));
	});

	test('Set boolean', function () {
		bv.setBoolean(0, true);

		assert(bv.getBoolean(0));

		bv.setBoolean(0, false);

		assert(!bv.getBoolean(0));
	});

	test('Read boolean', function () {
		bv.setBits(0, 1, 1);
		bv.setBits(1, 0, 1);

		assert(bsr.readBoolean());
		assert(!bsr.readBoolean());
	});

	test('Write boolean', function () {
		bsr.writeBoolean(true);
		assert.equal(bv.getBits(0, 1, false), 1);
		bsr.writeBoolean(false);
		assert.equal(bv.getBits(1, 1, false), 0);
	});

	test('readBitStream', function () {
		bsw.writeBits(0xF0, 8); //0b11110000
		bsw.writeBits(0xF1, 8); //0b11110001
		bsr.readBits(3); //offset
		var slice = bsr.readBitStream(8);
		assert.equal(slice.readBits(6), 0x21); //0b111110
		assert.equal(9, slice._index);
		assert.equal(6, slice.index);
		assert.equal(8, slice.length);
		assert.equal(2, slice.bitsLeft);

		assert.equal(bsr._index, 11);
		assert.equal((64 * 8) - 11, bsr.bitsLeft);
	});

	test('readBitStream overflow', function () {
		bsw.writeBits(0xF0, 8); //0b11110000
		bsw.writeBits(0xF1, 8); //0b11110001
		bsr.readBits(3); //offset
		var slice = bsr.readBitStream(4);

		var exception = false;

		try {
			slice.readUint8();
		} catch (e) {
			exception = true;
		}

		assert(exception);
	});

	test('writeBitStream', function () {
		var sourceStream = new BitStream(new ArrayBuffer(64));

		sourceStream.writeBits(0xF0, 8); //0b11110000
		sourceStream.writeBits(0xF1, 8); //0b11110001
		sourceStream.index = 0;
		sourceStream.readBits(3); //offset
		bsr.writeBitStream(sourceStream, 8);
		assert.equal(8, bsr.index);
		bsr.index = 0;
		assert.equal(bsr.readBits(6), 0x21); //0b00111110
		assert.equal(11, sourceStream.index);
	});

	test('writeBitStream long', function () {
		var sourceStream = new BitStream(new ArrayBuffer(64));

		sourceStream.writeBits(0xF0, 8); //0b11110000
		sourceStream.writeBits(0xF1, 8); //0b11110001
		sourceStream.writeBits(0xF1, 8); //0b11110001
		sourceStream.writeBits(0xF1, 8); //0b11110001
		sourceStream.writeBits(0xF1, 8); //0b11110001
		sourceStream.index = 0;
		sourceStream.readBits(3); //offset
		bsr.index = 3;
		bsr.writeBitStream(sourceStream, 35); // 18194660476 = 100 00111100 01111100 01111100 01111100
		assert.equal(38, bsr.index);
		bsr.index = 3;
		assert.throws(function () { bsr.readBits(35); }, 'Too many bits read');// 1044266558);
		assert.equal(38, sourceStream.index);
		assert.equal(3, bsr.index);
	});

	test('readArrayBuffer', function () {
		bsw.writeBits(0xF0, 8); //0b11110000
		bsw.writeBits(0xF1, 8); //0b11110001
		bsw.writeBits(0xF0, 8); //0b11110000
		bsr.readBits(3); //offset

		var buffer = bsr.readArrayBuffer(2);

		assert.equal(0x87, buffer[0]); //0b10000111
		assert.equal(0x8F, buffer[1]); //0b10001111

		assert.equal(3 + (2 * 8), bsr._index);
	});

	test('writeArrayBuffer', function () {
		var source = new Uint8Array(4);
		source[0] = 0xF0; //0b11110000
		source[1] = 0xF1; //0b11110001
		source[2] = 0xF1; //0b11110001
		bsw.writeBits(0x00, 8);
		bsr.readBits(3); //offset

		bsr.writeArrayBuffer(source.buffer, 2); //0b00011110 00011110 001
		assert.equal(19, bsr.index);

		bsr.index = 0;

		assert.equal(bsr.readBits(8), 30);
	});

	test('Get buffer from view', function () {
		bv.setBits(0, 0xFFFFFFFF, 32);
		var buffer = bv.buffer;

		assert.equal(64, buffer.length);
		assert.equal(0xFFFF, buffer.readUInt16LE(0));
	});

	test('Get buffer from stream', function () {
		bsw.writeBits(0xFFFFFFFF, 32);
		var buffer = bsr.buffer;

		assert.equal(64, buffer.length);
		assert.equal(0xFFFF, buffer.readUInt16LE(0));
	});
});

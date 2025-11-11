(function () {
  const STATUS = document.getElementById('statusMessage');
  const downloadBtn = document.getElementById('downloadZip');
  const openBtn = document.getElementById('openOffline');

  const FILES_TO_PACKAGE = [
    'page.html',
    'account.html',
    'carpai.html',
    'carpai.js',
    'carpai.css',
    'carpfish.html',
    'settings.html',
    'social.html',
    'social.js',
    'styles.css',
    'scripts.js',
    'offline.js',
    'download.js',
    'download.html',
    'chats.html',
    'chats.js',
    'settings.js',
    'sw.js'
  ];

  let building = false;

  function setStatus(message) {
    if (STATUS) {
      STATUS.textContent = message;
    }
  }

  function logError(err) {
    console.error(err);
    setStatus('Something went wrong while building the offline package.');
  }

  openBtn.addEventListener('click', () => {
    window.location.href = 'page.html#offline';
  });

  downloadBtn.addEventListener('click', () => {
    if (!building) {
      createOfflineBundle();
    }
  });

  const textEncoder = new TextEncoder();
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let c = index;
      for (let k = 0; k < 8; k += 1) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[index] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < bytes.length; i += 1) {
      const byte = bytes[i];
      crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function toDosDateTime(date) {
    const year = date.getFullYear() - 1980;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = Math.floor(date.getSeconds() / 2);
    const dosTime = (hours << 11) | (minutes << 5) | seconds;
    const dosDate = (year << 9) | (month << 5) | day;
    return { dosTime, dosDate };
  }

  class ZipBuilder {
    constructor() {
      this.files = [];
    }

    addFile(name, data) {
      const nameBytes = textEncoder.encode(name);
      const crc = crc32(data);
      const timestamp = toDosDateTime(new Date());
      this.files.push({
        name,
        nameBytes,
        data,
        crc,
        modTime: timestamp.dosTime,
        modDate: timestamp.dosDate
      });
    }

    build() {
      let localSize = 0;
      let centralSize = 0;
      this.files.forEach((file) => {
        localSize += 30 + file.nameBytes.length + file.data.length;
        centralSize += 46 + file.nameBytes.length;
      });

      const totalSize = localSize + centralSize + 22;
      const output = new Uint8Array(totalSize);
      let offset = 0;

      this.files.forEach((file) => {
        file.localOffset = offset;
        offset = this.writeLocalHeader(output, offset, file);
      });

      const centralStart = offset;
      this.files.forEach((file) => {
        offset = this.writeCentralDirectoryRecord(output, offset, file);
      });

      const centralSizeFinal = offset - centralStart;
      this.writeEndOfCentralDirectory(output, offset, centralSizeFinal, centralStart, this.files.length);

      return output.buffer;
    }

    writeLocalHeader(buffer, offset, file) {
      offset = writeUint32(buffer, offset, 0x04034B50);
      offset = writeUint16(buffer, offset, 20);
      offset = writeUint16(buffer, offset, 0);
      offset = writeUint16(buffer, offset, 0);
      offset = writeUint16(buffer, offset, file.modTime);
      offset = writeUint16(buffer, offset, file.modDate);
      offset = writeUint32(buffer, offset, file.crc);
      offset = writeUint32(buffer, offset, file.data.length);
      offset = writeUint32(buffer, offset, file.data.length);
      offset = writeUint16(buffer, offset, file.nameBytes.length);
      offset = writeUint16(buffer, offset, 0);
      buffer.set(file.nameBytes, offset);
      offset += file.nameBytes.length;
      buffer.set(file.data, offset);
      offset += file.data.length;
      return offset;
    }

    writeCentralDirectoryRecord(buffer, offset, file) {
      offset = writeUint32(buffer, offset, 0x02014B50);
      offset = writeUint16(buffer, offset, 0x0014);
      offset = writeUint16(buffer, offset, 20);
      offset = writeUint16(buffer, offset, 0);
      offset = writeUint16(buffer, offset, 0);
      offset = writeUint16(buffer, offset, file.modTime);
      offset = writeUint16(buffer, offset, file.modDate);
      offset = writeUint32(buffer, offset, file.crc);
      offset = writeUint32(buffer, offset, file.data.length);
      offset = writeUint32(buffer, offset, file.data.length);
      offset = writeUint16(buffer, offset, file.nameBytes.length);
      offset = writeUint16(buffer, offset, 0);
      offset = writeUint16(buffer, offset, 0);
      offset = writeUint16(buffer, offset, 0);
      offset = writeUint16(buffer, offset, 0);
      offset = writeUint32(buffer, offset, 0);
      offset = writeUint32(buffer, offset, file.localOffset);
      buffer.set(file.nameBytes, offset);
      offset += file.nameBytes.length;
      return offset;
    }

    writeEndOfCentralDirectory(buffer, offset, centralSize, centralStart, fileCount) {
      offset = writeUint32(buffer, offset, 0x06054B50);
      offset = writeUint16(buffer, offset, 0);
      offset = writeUint16(buffer, offset, 0);
      offset = writeUint16(buffer, offset, fileCount);
      offset = writeUint16(buffer, offset, fileCount);
      offset = writeUint32(buffer, offset, centralSize);
      offset = writeUint32(buffer, offset, centralStart);
      writeUint16(buffer, offset, 0);
    }
  }

  function writeUint16(buffer, offset, value) {
    buffer[offset] = value & 0xFF;
    buffer[offset + 1] = (value >>> 8) & 0xFF;
    return offset + 2;
  }

  function writeUint32(buffer, offset, value) {
    buffer[offset] = value & 0xFF;
    buffer[offset + 1] = (value >>> 8) & 0xFF;
    buffer[offset + 2] = (value >>> 16) & 0xFF;
    buffer[offset + 3] = (value >>> 24) & 0xFF;
    return offset + 4;
  }

  async function fetchAsBytes(path) {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path} (${response.status})`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  async function createOfflineBundle() {
    building = true;
    downloadBtn.disabled = true;
    setStatus('Building offline package…');
    try {
      const zip = new ZipBuilder();
      for (let i = 0; i < FILES_TO_PACKAGE.length; i += 1) {
        const filePath = FILES_TO_PACKAGE[i];
        setStatus(`Packing ${filePath}…`);
        const bytes = await fetchAsBytes(filePath);
        zip.addFile(filePath, bytes);
      }

      const blob = new Blob([zip.build()], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'carp-offline.zip';
      document.body.appendChild(link);
      link.click();
      requestAnimationFrame(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
      setStatus('All set! Your offline copy is downloaded.');
    } catch (error) {
      logError(error);
      downloadBtn.disabled = false;
    } finally {
      building = false;
    }
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!building) {
        createOfflineBundle();
      }
    }, 600);
  });
})();

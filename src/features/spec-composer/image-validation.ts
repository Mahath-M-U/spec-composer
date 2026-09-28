const MAX_IMAGE_BYTES = 5_000_000;
const MAX_IMAGE_PIXELS = 32_000_000;

export function detectImageType(
  bytes: Uint8Array,
): "image/png" | "image/jpeg" | "image/webp" | undefined {
  if (
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
  )
    return "image/png";
  if (
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    return "image/jpeg";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return undefined;
}

/** Reads the file headers without allocating a decoded bitmap. */
export function imageDimensions(
  bytes: Uint8Array,
  type: "image/png" | "image/jpeg" | "image/webp",
): { width: number; height: number } | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    type === "image/png" &&
    bytes.length >= 24 &&
    String.fromCharCode(...bytes.slice(12, 16)) === "IHDR"
  )
    return { width: view.getUint32(16), height: view.getUint32(20) };
  if (type === "image/jpeg") {
    let offset = 2;
    while (offset + 4 < bytes.length) {
      if (bytes[offset] !== 0xff) return undefined;
      let marker = bytes[offset + 1]!;
      while (marker === 0xff) marker = bytes[++offset + 1]!;
      offset += 2;
      if (marker === 0xd9 || marker === 0xda) return undefined;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) return undefined;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) return undefined;
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker)
      ) {
        if (length < 7) return undefined;
        return {
          height: view.getUint16(offset + 3),
          width: view.getUint16(offset + 5),
        };
      }
      offset += length;
    }
  }
  if (type === "image/webp" && bytes.length >= 30) {
    const chunk = String.fromCharCode(...bytes.slice(12, 16));
    if (chunk === "VP8X")
      return {
        width: 1 + bytes[24]! + (bytes[25]! << 8) + (bytes[26]! << 16),
        height: 1 + bytes[27]! + (bytes[28]! << 8) + (bytes[29]! << 16),
      };
    if (
      chunk === "VP8 " &&
      bytes[23] === 0x9d &&
      bytes[24] === 0x01 &&
      bytes[25] === 0x2a
    )
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    if (chunk === "VP8L" && bytes[20] === 0x2f) {
      const packed = view.getUint32(21, true);
      return {
        width: (packed & 0x3fff) + 1,
        height: ((packed >> 14) & 0x3fff) + 1,
      };
    }
  }
  return undefined;
}

function withinLimits(width: number, height: number) {
  return (
    width >= 1 &&
    height >= 1 &&
    width <= 8192 &&
    height <= 8192 &&
    width * height <= MAX_IMAGE_PIXELS
  );
}

export async function validateImageUpload(file: File): Promise<void> {
  if (file.size > MAX_IMAGE_BYTES)
    throw new Error("Choose an image smaller than 5 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageType(bytes);
  if (!detected || detected !== file.type)
    throw new Error(
      "Choose a PNG, JPEG or WebP image. SVG upload is unavailable.",
    );
  const dimensions = imageDimensions(bytes, detected);
  if (!dimensions)
    throw new Error("Image dimensions could not be read safely.");
  if (!withinLimits(dimensions.width, dimensions.height))
    throw new Error(
      "Image must be at most 8192 px per side and 32 megapixels.",
    );
  const image = await createImageBitmap(file).catch(() => {
    throw new Error("This image could not be decoded.");
  });
  try {
    if (!withinLimits(image.width, image.height))
      throw new Error(
        "Image must be at most 8192 px per side and 32 megapixels.",
      );
  } finally {
    image.close();
  }
}

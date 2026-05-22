// Cloudinary image transform injector.
// Adds f_auto,q_auto and optional width/height so the CDN serves the smallest
// modern format (AVIF/WebP) at the right size for the device.
// Non-Cloudinary URLs are returned untouched, so external/static images keep working.

const CLOUDINARY_HOST = "res.cloudinary.com";

/**
 * Insert Cloudinary transforms into an existing delivery URL.
 * @param {string} url  Original image URL.
 * @param {object} opts { w?: number, h?: number, q?: string|number, dpr?: number, crop?: string }
 */
export function optimizeImage(url, opts = {}) {
    if (!url || typeof url !== "string") return url;
    try {
        const u = new URL(url);
        if (!u.hostname.includes(CLOUDINARY_HOST)) return url;
        // Avoid double-transforming if already optimized.
        if (u.pathname.includes("/f_auto") || u.pathname.includes("/q_auto")) return url;

        const parts = ["f_auto", "q_auto"];
        if (opts.w) parts.push(`w_${Math.round(opts.w)}`);
        if (opts.h) parts.push(`h_${Math.round(opts.h)}`);
        if (opts.crop) parts.push(`c_${opts.crop}`);
        else if (opts.w || opts.h) parts.push("c_fill");
        if (opts.dpr) parts.push(`dpr_${opts.dpr}`);
        const transform = parts.join(",");

        // Cloudinary URL shape: /<cloud>/image/upload/<transforms?>/<public_id>
        // We splice transforms right after /upload/.
        const path = u.pathname.replace(/\/upload\//, `/upload/${transform}/`);
        u.pathname = path;
        return u.toString();
    } catch {
        return url;
    }
}

/**
 * Build a `srcset` string for a Cloudinary image at multiple widths.
 * Lets the browser pick the smallest acceptable variant per viewport.
 */
export function buildSrcSet(url, widths = [320, 480, 768, 1024]) {
    if (!url) return undefined;
    return widths.map((w) => `${optimizeImage(url, { w })} ${w}w`).join(", ");
}

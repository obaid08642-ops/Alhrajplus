// Cloudinary image transform injector.
// Adds f_auto,q_auto,dpr_auto + optional width/height so the CDN serves the
// smallest modern format (AVIF/WebP) at the right size for the device.
// Non-Cloudinary URLs are returned untouched, so external/static images keep working.

const CLOUDINARY_HOST = "res.cloudinary.com";

function _splice(url, transform) {
    try {
        const u = new URL(url);
        if (!u.hostname.includes(CLOUDINARY_HOST)) return url;
        if (u.pathname.includes("/upload/")) {
            u.pathname = u.pathname.replace(/\/upload\//, `/upload/${transform}/`);
        }
        return u.toString();
    } catch {
        return url;
    }
}

/**
 * Insert Cloudinary transforms into an existing delivery URL.
 * @param {string} url  Original image URL.
 * @param {object} opts { w?: number, h?: number, q?: string|number, dpr?: number|"auto", crop?: string }
 */
export function optimizeImage(url, opts = {}) {
    if (!url || typeof url !== "string") return url;
    try {
        const u = new URL(url);
        if (!u.hostname.includes(CLOUDINARY_HOST)) return url;
        // Avoid double-transforming if already optimized.
        if (u.pathname.includes("/f_auto") || u.pathname.includes("/q_auto")) return url;

        const parts = ["f_auto", "q_auto"];
        // dpr_auto lets Cloudinary pick the right resolution for retina/2x/3x displays.
        parts.push(opts.dpr ? `dpr_${opts.dpr}` : "dpr_auto");
        if (opts.w) parts.push(`w_${Math.round(opts.w)}`);
        if (opts.h) parts.push(`h_${Math.round(opts.h)}`);
        if (opts.crop) parts.push(`c_${opts.crop}`);
        else if (opts.w || opts.h) parts.push("c_fill");
        return _splice(url, parts.join(","));
    } catch {
        return url;
    }
}

/**
 * Tiny Low-Quality Image Placeholder (LQIP) for progressive loading.
 * Returns a ~20px wide, blurred, low-quality variant of the same Cloudinary asset.
 * Use as `style.backgroundImage` while the real image streams in.
 */
export function lqipUrl(url) {
    if (!url || typeof url !== "string") return url;
    try {
        const u = new URL(url);
        if (!u.hostname.includes(CLOUDINARY_HOST)) return url;
        if (u.pathname.includes("/e_blur")) return url;
        return _splice(url, "f_auto,q_10,w_24,e_blur:800");
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

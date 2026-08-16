
## Post-deployment retest

After the user confirmed deployment, the live Web homepage loaded successfully. The AI assistant control now appears as `Hide assistant` instead of the previous Arabic-only label, confirming that the deployed translation dictionary contains at least the repaired key. The homepage still shows `No results` while the live `/api/listings?country_code=SA` endpoint has Saudi items. This remains a separate feed/request-state issue and must be diagnosed before claiming staging success.

## Confirmed homepage empty-feed cause

The live browser console showed the actual request as `GET https://alhrajplus.onrender.com/api/listings?limit=20&page=1&country_code=UA`, while the supported country picker contains SA, AE, KW, QA, BH, OM, and EG. The API correctly returned no items for UA, so the homepage `No results` was caused by accepting an unsupported IP-detection result, not by a broken listings endpoint. The CountryContext was fixed to validate stored/detected/manual codes against the configured country list and deterministically fall back to SA for unsupported codes. Web build succeeded after this fix.

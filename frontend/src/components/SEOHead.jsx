import { Helmet } from 'react-helmet-async';

const BASE = 'https://vamppe.com';
const DEFAULT_IMG = `${BASE}/og-image.png`;

export default function SEOHead({
  title,
  description = 'Connect, share moments, discover trending content, and chat in real time on Vamppe.',
  image = DEFAULT_IMG,
  url,
  type = 'website',
  noIndex = false,
  jsonLd = null,
}) {
  const fullTitle = title ? `${title} — Vamppe` : 'Vamppe — Connect, Share & Discover';
  const canonical = url ? `${BASE}${url}` : BASE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Vamppe" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}

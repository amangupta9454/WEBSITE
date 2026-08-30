import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title,
  description,
  canonicalUrl,
  noIndex = false,
  ogType = 'website',
  ogImage = 'https://code-a-nova.online/LOGO.png',
  schema,
}) => {
  const siteName = 'Code-A-Nova';
  const defaultTitle = 'Code-A-Nova | Web Development, AI & Business Software Solutions';
  const defaultDescription = 'Code-A-Nova provides web development, e-commerce, AI automation, ERP and custom software solutions for modern businesses.';

  const seoTitle = title ? title : defaultTitle;
  const seoDescription = description ? description : defaultDescription;

  return (
    <Helmet>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      
      {/* Canonical Link */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Robots indexing */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />

      {/* Twitter Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data (Schema) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

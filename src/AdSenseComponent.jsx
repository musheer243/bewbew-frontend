// AdSenseComponent.jsx
import React, { useEffect } from 'react';

const AdSenseComponent = () => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Adsense error", e);
    }
  }, []);

  return (
    <ins className="adsbygoogle"
         style={{ display: 'block' }}
         data-ad-client="ca-pub-4966281949270678"
         data-ad-slot="6088177450"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  );
};

export default AdSenseComponent;

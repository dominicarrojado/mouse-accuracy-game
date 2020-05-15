import React from 'react';

import images from '../assets/images';

const FONT_FAMILY_RAZER_F5 =
  "'RazerF5', 'Roboto', Arial, 'Microsoft YaHei New', 'Microsoft Yahei', '微软雅黑', 宋体, SimSun, STXihei, '华文细黑', sans-serif";

// To pre-load all assets after page load
function PreLoader() {
  return (
    <div
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Fonts */}
      <span />
      <span
        style={{
          fontFamily: FONT_FAMILY_RAZER_F5,
        }}
      />
      <span
        style={{
          fontFamily: FONT_FAMILY_RAZER_F5,
          fontWeight: 'bold',
        }}
      />

      {/* Images */}
      {images.map((img, index) => (
        <span key={index} style={{ backgroundImage: `url(${img})` }} />
      ))}
    </div>
  );
}

export default PreLoader;

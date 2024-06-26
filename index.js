const main = () => {
    const imgFile = document.getElementById("imgfile");
    const image = new Image();
    const file = imgFile.files[0];
    const fileReader = new FileReader();
  
    fileReader.onload = () => {
      image.onload = () => {
        const canvas = document.getElementById("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
  
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const rgbValues = buildRgb(imageData);
        const quantizedColors = quantization(rgbValues, 0);
        const sortedColors = sortColorsByLuminance(quantizedColors);
        displayColors(sortedColors, 'palette');
        displayColors(sortedColors.map(createComplementaryColor), 'complementary');
        displayAnalogousColors(sortedColors);
      }
      image.src = fileReader.result;
    }
  
    if (file) {
      fileReader.readAsDataURL(file);
    }
  }
  
  const buildRgb = (imageData) => {
    const rgbValues = [];
    for (let i = 0; i < imageData.length; i += 4) {
      const rgb = {
        r: imageData[i],
        g: imageData[i + 1],
        b: imageData[i + 2],
      };
      rgbValues.push(rgb);
    }
    return rgbValues;
  };
  
  const findBiggestColorRange = (rgbValues) => {
    let rMin = Number.MAX_VALUE;
    let gMin = Number.MAX_VALUE;
    let bMin = Number.MAX_VALUE;
  
    let rMax = Number.MIN_VALUE;
    let gMax = Number.MIN_VALUE;
    let bMax = Number.MIN_VALUE;
  
    rgbValues.forEach((pixel) => {
      rMin = Math.min(rMin, pixel.r);
      gMin = Math.min(gMin, pixel.g);
      bMin = Math.min(bMin, pixel.b);
  
      rMax = Math.max(rMax, pixel.r);
      gMax = Math.max(gMax, pixel.g);
      bMax = Math.max(bMax, pixel.b);
    });
  
    const rRange = rMax - rMin;
    const gRange = gMax - gMin;
    const bRange = bMax - bMin;
  
    const biggestRange = Math.max(rRange, gRange, bRange);
    if (biggestRange === rRange) {
      return "r";
    } else if (biggestRange === gRange) {
      return "g";
    } else {
      return "b";
    }
  };
  
  const quantization = (rgbValues, depth) => {
    const MAX_DEPTH = 4;
    if (depth === MAX_DEPTH || rgbValues.length === 0) {
      const color = rgbValues.reduce(
        (prev, curr) => {
          prev.r += curr.r;
          prev.g += curr.g;
          prev.b += curr.b;
          return prev;
        },
        { r: 0, g: 0, b: 0 }
      );
  
      color.r = Math.round(color.r / rgbValues.length);
      color.g = Math.round(color.g / rgbValues.length);
      color.b = Math.round(color.b / rgbValues.length);
      return [color];
    }
  
    const componentToSortBy = findBiggestColorRange(rgbValues);
    rgbValues.sort((p1, p2) => p1[componentToSortBy] - p2[componentToSortBy]);
  
    const mid = Math.floor(rgbValues.length / 2);
    return [
      ...quantization(rgbValues.slice(0, mid), depth + 1),
      ...quantization(rgbValues.slice(mid), depth + 1),
    ];
  };
  
  const sortColorsByLuminance = (colors) => {
    return colors.sort((a, b) => {
      const luminanceA = 0.2126 * a.r + 0.7152 * a.g + 0.0722 * a.b;
      const luminanceB = 0.2126 * b.r + 0.7152 * b.g + 0.0722 * b.b;
      return luminanceB - luminanceA;
    });
  };
  
  const createComplementaryColor = (color) => {
    return {
      r: 255 - color.r,
      g: 255 - color.g,
      b: 255 - color.b
    };
  };
  
  const createAnalogousColors = (color) => {
    const hsl = rgbToHsl(color.r, color.g, color.b);
    const analogous1 = hslToRgb((hsl.h + 30) % 360, hsl.s, hsl.l);
    const analogous2 = hslToRgb((hsl.h - 30 + 360) % 360, hsl.s, hsl.l);
    return [analogous1, analogous2];
  };
  
  const displayColors = (colors, elementId) => {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    colors.forEach(color => {
      const colorBox = document.createElement('div');
      colorBox.className = 'color-box';
      colorBox.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
      container.appendChild(colorBox);
    });
  };
  
  const displayAnalogousColors = (colors) => {
    const container = document.getElementById('complementary');
    colors.forEach(color => {
      const analogousColors = createAnalogousColors(color);
      analogousColors.forEach(analogousColor => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = `rgb(${analogousColor.r}, ${analogousColor.g}, ${analogousColor.b})`;
        container.appendChild(colorBox);
      });
    });
  };
  
  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
  
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
  
    return { h: h * 360, s, l };
  };
  
  const hslToRgb = (h, s, l) => {
    let r, g, b;
  
    const hueToRgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 3) return q;
      if (t < 1 / 2) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
  
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hueToRgb(p, q, h + 1 / 3);
      g = hueToRgb(p, q, h);
      b = hueToRgb(p, q, h - 1 / 3);
    }
  
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };
  



import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeType = 'light' | 'dark' | 'glass' | 'mint' | 'gray' | 'pinkpurple';
type SidebarSize = 'compact' | 'normal' | 'expanded';
type FontSize = 'small' | 'normal' | 'large';
type FontFamily = 'inter' | 'roboto' | 'opensans' | 'lato' | 'montserrat' | 'poppins' | 'custom';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  sidebarSize: SidebarSize;
  setSidebarSize: (size: SidebarSize) => void;
  dashboardFontSize: FontSize;
  setDashboardFontSize: (size: FontSize) => void;
  appFontSize: FontSize;
  setAppFontSize: (size: FontSize) => void;
  fontFamily: FontFamily;
  setFontFamily: (family: FontFamily) => void;
  customFontName: string | null;
  setCustomFontName: (name: string | null) => void;
  customFontUrl: string | null;
  setCustomFontUrl: (url: string | null) => void;
  customFontFile: string | null;
  setCustomFontFile: (file: string | null) => void;
  customTheme: string | null;
  setCustomTheme: (theme: string | null) => void;
  pinBackground: string;
  setPinBackground: (background: string) => void;
  customPinBackground: string | null;
  setCustomPinBackground: (background: string | null) => void;
  customHexColor: string | null;
  setCustomHexColor: (color: string | null) => void;
}

// Función para calcular si un color HEX es claro u oscuro
const isLightColor = (hex: string): boolean => {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 155;
};

// Función para detectar si un color HSL es claro u oscuro
const isLightHSL = (hsl: string): boolean => {
  const parts = hsl.split(' ');
  const lightness = parseFloat(parts[2]);
  return lightness > 50;
};

// Función para convertir HEX a HSL
const hexToHSL = (hex: string): string => {
  const rgb = parseInt(hex.slice(1), 16);
  let r = ((rgb >> 16) & 0xff) / 255;
  let g = ((rgb >>  8) & 0xff) / 255;
  let b = ((rgb >>  0) & 0xff) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const colorVariants = {
  blue: { primary: '245 75% 60%', primaryForeground: '0 0% 100%' },
  green: { primary: '142 76% 45%', primaryForeground: '0 0% 100%' },
  purple: { primary: '270 75% 60%', primaryForeground: '0 0% 100%' },
  red: { primary: '0 84% 60%', primaryForeground: '0 0% 100%' },
  orange: { primary: '38 92% 50%', primaryForeground: '0 0% 100%' },
  pink: { primary: '330 75% 60%', primaryForeground: '0 0% 100%' },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as ThemeType) || 'light';
  });

  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem('app-primary-color') || 'blue';
  });

  const [sidebarSize, setSidebarSize] = useState<SidebarSize>(() => {
    const saved = localStorage.getItem('app-sidebar-size');
    return (saved as SidebarSize) || 'normal';
  });

  const [dashboardFontSize, setDashboardFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem('app-dashboard-font-size');
    return (saved as FontSize) || 'normal';
  });

  const [appFontSize, setAppFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem('app-font-size');
    return (saved as FontSize) || 'normal';
  });

  const [customTheme, setCustomTheme] = useState<string | null>(() => {
    return localStorage.getItem('app-custom-theme');
  });

  const [pinBackground, setPinBackground] = useState(() => {
    return localStorage.getItem('app-pin-background') || 'default';
  });

  const [customPinBackground, setCustomPinBackground] = useState<string | null>(() => {
    return localStorage.getItem('app-custom-pin-background');
  });

  const [customHexColor, setCustomHexColor] = useState<string | null>(() => {
    return localStorage.getItem('app-custom-hex-color');
  });

  const [fontFamily, setFontFamily] = useState<FontFamily>(() => {
    const saved = localStorage.getItem('app-font-family');
    return (saved as FontFamily) || 'inter';
  });

  const [customFontName, setCustomFontName] = useState<string | null>(() => {
    return localStorage.getItem('app-custom-font-name');
  });

  const [customFontUrl, setCustomFontUrl] = useState<string | null>(() => {
    return localStorage.getItem('app-custom-font-url');
  });

  const [customFontFile, setCustomFontFile] = useState<string | null>(() => {
    return localStorage.getItem('app-custom-font-file');
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'glass', 'mint', 'gray', 'pinkpurple');
    root.classList.add(theme);
    localStorage.setItem('app-theme', theme);
    
    // Establecer sombra de tarjeta según el tema
    const cardShadow = theme === 'dark' ? '0 0 10px rgba(255, 255, 255, 0.10)' : '0 0 10px rgba(0, 0, 0, 0.12)';
    root.style.setProperty('--card-shadow', cardShadow);
  }, [theme]);

  useEffect(() => {
    const colorConfig = colorVariants[primaryColor as keyof typeof colorVariants] || colorVariants.blue;
    const root = document.documentElement;
    
    root.style.setProperty('--primary', colorConfig.primary);
    root.style.setProperty('--primary-foreground', colorConfig.primaryForeground);
    root.style.setProperty('--accent', colorConfig.primary);
    root.style.setProperty('--sidebar-primary', colorConfig.primary);
    root.style.setProperty('--ring', colorConfig.primary);
    
    localStorage.setItem('app-primary-color', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    localStorage.setItem('app-sidebar-size', sidebarSize);
  }, [sidebarSize]);

  useEffect(() => {
    const root = document.documentElement;
    const fontSizeMap = { small: '14px', normal: '16px', large: '18px' };
    root.style.setProperty('--app-font-size', fontSizeMap[appFontSize]);
    localStorage.setItem('app-font-size', appFontSize);
  }, [appFontSize]);

  useEffect(() => {
    const root = document.documentElement;
    const fontSizeMap = { small: '14px', normal: '16px', large: '20px' };
    root.style.setProperty('--dashboard-font-size', fontSizeMap[dashboardFontSize]);
    localStorage.setItem('app-dashboard-font-size', dashboardFontSize);
  }, [dashboardFontSize]);

  useEffect(() => {
    if (customTheme) {
      const root = document.documentElement;
      const themeColors = JSON.parse(customTheme);
      Object.entries(themeColors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value as string);
      });
      localStorage.setItem('app-custom-theme', customTheme);
    }
  }, [customTheme]);

  useEffect(() => {
    localStorage.setItem('app-pin-background', pinBackground);
  }, [pinBackground]);

  useEffect(() => {
    if (customPinBackground) {
      localStorage.setItem('app-custom-pin-background', customPinBackground);
    } else {
      localStorage.removeItem('app-custom-pin-background');
    }
  }, [customPinBackground]);

  useEffect(() => {
    if (customHexColor && /^#[0-9A-Fa-f]{6}$/.test(customHexColor)) {
      const root = document.documentElement;
      const isLight = isLightColor(customHexColor);
      
      // Convertir HEX a HSL
      const hslColor = hexToHSL(customHexColor);
      
      // Aplicar el color como fondo en todas partes
      root.style.setProperty('--background', hslColor);
      root.style.setProperty('--card', hslColor);
      root.style.setProperty('--sidebar-background', hslColor);
      root.style.setProperty('--popover', hslColor);
      
      // Ajustar texto según contraste
      const textColor = isLight ? '0 0% 0%' : '0 0% 100%';
      root.style.setProperty('--foreground', textColor);
      root.style.setProperty('--card-foreground', textColor);
      root.style.setProperty('--sidebar-foreground', textColor);
      root.style.setProperty('--popover-foreground', textColor);
      
      // Hacer bordes invisibles (mismo color que el fondo)
      root.style.setProperty('--border', hslColor);
      root.style.setProperty('--sidebar-border', hslColor);
      
      // Ajustar sombra de tarjeta según luminosidad
      const cardShadow = isLight ? '0 0 10px rgba(0, 0, 0, 0.12)' : '0 0 10px rgba(255, 255, 255, 0.10)';
      root.style.setProperty('--card-shadow', cardShadow);
      
      localStorage.setItem('app-custom-hex-color', customHexColor);
    } else if (customHexColor === null) {
      localStorage.removeItem('app-custom-hex-color');
      
      // Restaurar sombra según tema actual
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      const cardShadow = isDark ? '0 0 10px rgba(255, 255, 255, 0.10)' : '0 0 10px rgba(0, 0, 0, 0.12)';
      root.style.setProperty('--card-shadow', cardShadow);
    }
  }, [customHexColor]);

  useEffect(() => {
    const root = document.documentElement;
    let selectedFont = '';
    
    if (fontFamily === 'custom' && customFontName) {
      // Usar fuente personalizada
      selectedFont = `${customFontName}, system-ui, sans-serif`;
      
      // Remover link y estilo anteriores si existen
      const existingLink = document.getElementById('custom-google-font');
      if (existingLink) {
        existingLink.remove();
      }
      const existingStyle = document.getElementById('custom-uploaded-font');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Si hay archivo de fuente subido, crear regla @font-face
      if (customFontFile) {
        const style = document.createElement('style');
        style.id = 'custom-uploaded-font';
        style.textContent = `
          @font-face {
            font-family: '${customFontName}';
            src: url('${customFontFile}') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
        `;
        document.head.appendChild(style);
      }
      // Si hay URL de Google Fonts, cargar la fuente
      else if (customFontUrl) {
        const link = document.createElement('link');
        link.id = 'custom-google-font';
        link.rel = 'stylesheet';
        link.href = customFontUrl;
        document.head.appendChild(link);
      }
    } else {
      // Remover fuentes personalizadas
      const existingLink = document.getElementById('custom-google-font');
      if (existingLink) {
        existingLink.remove();
      }
      const existingStyle = document.getElementById('custom-uploaded-font');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Usar fuentes predeterminadas
      const fontFamilyMap = {
        inter: 'Inter, system-ui, sans-serif',
        roboto: 'Roboto, system-ui, sans-serif',
        opensans: 'Open Sans, system-ui, sans-serif',
        lato: 'Lato, system-ui, sans-serif',
        montserrat: 'Montserrat, system-ui, sans-serif',
        poppins: 'Poppins, system-ui, sans-serif',
        custom: 'Inter, system-ui, sans-serif', // Fallback
      };
      selectedFont = fontFamilyMap[fontFamily];
    }
    
    root.style.setProperty('font-family', selectedFont);
    document.body.style.fontFamily = selectedFont;
    localStorage.setItem('app-font-family', fontFamily);
  }, [fontFamily, customFontName, customFontUrl, customFontFile]);

  useEffect(() => {
    if (customFontName) {
      localStorage.setItem('app-custom-font-name', customFontName);
    } else {
      localStorage.removeItem('app-custom-font-name');
    }
  }, [customFontName]);

  useEffect(() => {
    if (customFontUrl) {
      localStorage.setItem('app-custom-font-url', customFontUrl);
    } else {
      localStorage.removeItem('app-custom-font-url');
    }
  }, [customFontUrl]);

  useEffect(() => {
    if (customFontFile) {
      localStorage.setItem('app-custom-font-file', customFontFile);
    } else {
      localStorage.removeItem('app-custom-font-file');
    }
  }, [customFontFile]);

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, 
      primaryColor, setPrimaryColor, 
      sidebarSize, setSidebarSize,
      dashboardFontSize, setDashboardFontSize,
      appFontSize, setAppFontSize,
      fontFamily, setFontFamily,
      customFontName, setCustomFontName,
      customFontUrl, setCustomFontUrl,
      customFontFile, setCustomFontFile,
      customTheme, setCustomTheme,
      pinBackground, setPinBackground,
      customPinBackground, setCustomPinBackground,
      customHexColor, setCustomHexColor
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

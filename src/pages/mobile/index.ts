	// src/pages/mobile/index.ts

// --- Vistas Principales (Pantallas) ---
export { default as MobileDashboard } from './MobileDashboard';

// [CORRECCIÓN CLAVE]: Exportamos 'MobileAccountsList' pero con el nombre 'MobileAccounts'
// para que App.tsx lo encuentre sin problemas.
export { default as MobileAccounts } from './MobileAccountsList'; 

// Lo mismo para las tarjetas:
export { default as MobileCards } from './MobileCreditCards';   

export { default as MobileGoals } from './MobileGoals';
export { default as MobileMilesPoints } from './MobileMilesPoints';

// --- Componentes de Estructura y Navegación ---
export { default as MobilePageWrapper } from './MobilePageWrapper';
export { default as MobileTabBar } from './MobileTabBar';
export { default as MobileFloatingActions } from './MobileFloatingActions';
export { default as MobileSectionCard } from './MobileSectionCard';

// --- Otros ---
// export { default as MobileMortgage } from './MobileMortgage';
// export { default as MobileLoans } from './MobileLoans';
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Landmark, 
  CreditCard, 
  Target, 
  Plane, 
  Settings,
  Building2,
  ArrowLeftRight,
  CheckSquare,
  HandCoins,
  PiggyBank,
  Coins,
  Flag,
  Wallet
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import { useTheme } from '@/contexts/ThemeContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { cn } from '@/lib/utils';
import { ProfilePhoto } from './ProfilePhoto';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const iconMap = {
  'Home': Home,
  'Landmark': Landmark,
  'Wallet': Wallet,
  'CreditCard': CreditCard,
  'HandCoins': HandCoins,
  'Flag': Flag,
  'CheckSquare': CheckSquare,
  'Building2': Building2,
  'Plane': Plane,
  'ArrowLeftRight': ArrowLeftRight,
  'PiggyBank': PiggyBank,
  'Coins': Coins,
  'Settings': Settings,
};

const defaultMenuItems = [
  { title: 'HOME', url: '/dash30', iconName: 'Home' },
  { title: 'CUENTAS', url: '/accounts', iconName: 'Landmark' },
  { title: 'TARJETAS', url: '/cards', iconName: 'CreditCard' },
  { title: 'TRANSFERENCIAS', url: '/transfers', iconName: 'ArrowLeftRight' },
  { title: 'HIPOTECA', url: '/mortgage', iconName: 'Home' },
  { title: 'PRÉSTAMOS', url: '/loans', iconName: 'HandCoins' },
  { title: 'BILLETERAS', url: '/wallets', iconName: 'Wallet' },
  { title: 'METAS', url: '/goals', iconName: 'Flag' },
  { title: 'TAREAS', url: '/tasks', iconName: 'CheckSquare' },
  { title: 'PROPIEDADES', url: '/properties', iconName: 'Building2' },
  { title: 'MILLAS Y PUNTOS', url: '/miles', iconName: 'Plane' },
  { title: 'PRESUPUESTOS', url: '/budgets', iconName: 'PiggyBank' },
];

export function AppSidebar() {
  const { theme } = useTheme(); 
  const { editMode, setEditMode } = useEditMode();
  const { open } = useSidebar();
  
  const [menuItems, setMenuItems] = useState(() => {
    const stored = localStorage.getItem('sidebarMenuOrder');
    let items = stored ? JSON.parse(stored) : defaultMenuItems;
    
    const validUrls = defaultMenuItems.map(item => item.url);
    items = items.filter((item: any) => validUrls.includes(item.url));
    
    items = items.map((item: any) => {
      const defaultItem = defaultMenuItems.find(d => d.url === item.url);
      return defaultItem ? { ...item, title: defaultItem.title } : item;
    });
    
    const itemUrls = items.map((item: any) => item.url);
    const newItems = defaultMenuItems.filter(defaultItem => !itemUrls.includes(defaultItem.url));
    
    if (newItems.length > 0) {
      items = [...items, ...newItems];
    }
    
    return items.filter((item: any) => item.iconName !== 'Settings');
  });
  
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  useEffect(() => {
    const filteredItems = menuItems.filter((item: any) => item.iconName !== 'Settings');
    localStorage.setItem('sidebarMenuOrder', JSON.stringify(filteredItems));
  }, [menuItems]);

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newItems = [...menuItems];
    const draggedItemContent = newItems[draggedItem];
    newItems.splice(draggedItem, 1);
    newItems.splice(index, 0, draggedItemContent);

    setDraggedItem(index);
    setMenuItems(newItems);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const isCollapsed = !open;
  
  // --- LÓGICA DE ESTILOS DINÁMICOS ---
  let sidebarContainerClass = "";
  let itemInactiveClass = "";
  let itemActiveClass = "";
  let footerClass = "";
  let labelClass = "";

  if (theme === 'dark' || theme === 'dark-glass' || theme.includes('dark')) {
      // MODO DARK
      sidebarContainerClass = "bg-[#181818] border-r border-[#27272a]";
      itemInactiveClass = "text-gray-400 hover:text-white hover:bg-white/10";
      // Aquí también usamos el color primario para mantener coherencia en dark mode
      itemActiveClass = "bg-primary text-primary-foreground shadow-md"; 
      footerClass = "border-t border-[#27272a] bg-[#181818]";
      labelClass = "text-gray-400";
  } 
  else if (theme === 'glass') {
      // MODO GLASS (AZUL)
      sidebarContainerClass = "bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-2xl";
      itemInactiveClass = "text-blue-100 hover:text-white hover:bg-white/20";
      itemActiveClass = "bg-white/20 text-white shadow-lg ring-1 ring-white/30 font-extrabold";
      footerClass = "border-t border-white/20 bg-white/5";
      labelClass = "text-blue-200";
  } 
  else {
      // MODO LIGHT (AQUÍ ESTÁ EL CAMBIO QUE PEDISTE)
      sidebarContainerClass = "bg-white/80 backdrop-blur-2xl border-r border-gray-200 shadow-xl";
      
      // 1. Letras NEGRAS (text-gray-900) cuando no está seleccionado
      itemInactiveClass = "text-gray-900 hover:bg-gray-100 font-bold"; 
      
      // 2. Se "pinta" del color primario escogido (bg-primary) cuando está activo
      itemActiveClass = "bg-primary text-primary-foreground shadow-md ring-1 ring-black/5";
      
      footerClass = "border-t border-gray-200 bg-white/50";
      labelClass = "text-gray-900 font-bold";
  }

  return (
    <Sidebar className={cn("h-full border-none", sidebarContainerClass)} collapsible="icon">
      <SidebarContent className="flex flex-col h-full bg-transparent">
        
        {/* PERFIL */}
        <div className="flex-none">
          <div className={cn(
            "mb-6 transition-all duration-300",
            isCollapsed ? 'p-2 mt-4' : 'p-6 mt-2'
          )}>
            <ProfilePhoto isCollapsed={isCollapsed} />
          </div>
        </div>

        {/* MENÚ */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-4">
          <SidebarGroup>
            <SidebarGroupContent className="space-y-1.5">
              {menuItems.map((item: any, index: number) => {
                const IconComponent = iconMap[item.iconName as keyof typeof iconMap] || Home;
                return (
                  <div
                    key={item.title}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="cursor-move"
                  >
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        cn(
                          // Clases BASE
                          'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden font-bold mb-1',
                          
                          // Clases DINÁMICAS
                          isActive ? itemActiveClass : itemInactiveClass,
                          
                          isCollapsed ? 'justify-center px-2 py-3' : ''
                        )
                      }
                    >
                      <IconComponent className={cn(
                        "flex-shrink-0 transition-colors",
                        isCollapsed ? "w-6 h-6" : "w-5 h-5"
                      )} />
                      
                      {!isCollapsed && <span className="text-sm tracking-wide">{item.title}</span>}
                      
                      {/* Brillo sutil en hover (solo visible si tiene fondo de color) */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </NavLink>
                  </div>
                );
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* FOOTER */}
        <div className={cn("flex-none p-4 mt-auto space-y-2 backdrop-blur-md", footerClass)}>
            
            {/* Edit Mode Switch */}
            <div className={cn(
              'flex items-center gap-3 py-3 px-3 rounded-xl transition-colors hover:bg-white/10 border border-transparent',
              isCollapsed ? 'justify-center' : 'justify-between'
            )}>
              {!isCollapsed && (
                <Label htmlFor="edit-mode-switch" className={cn("text-xs font-bold uppercase tracking-wider cursor-pointer", labelClass)}>
                  Modo Edición
                </Label>
              )}
              <Switch
                id="edit-mode-switch"
                checked={editMode}
                onCheckedChange={setEditMode}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {/* Configuración Link */}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold',
                  isActive ? itemActiveClass : itemInactiveClass,
                  isCollapsed ? 'justify-center' : ''
                )
              }
            >
              <Settings className={cn("flex-shrink-0", isCollapsed ? "w-6 h-6" : "w-5 h-5")} />
              {!isCollapsed && <span className="text-sm">CONFIGURACIÓN</span>}
            </NavLink>
        </div>

      </SidebarContent>
    </Sidebar>
  );
}
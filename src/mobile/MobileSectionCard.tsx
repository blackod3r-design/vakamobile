import React from 'react';
import { ChevronRight } from 'lucide-react';

interface MobileSectionCardProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle?: string;
  value?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

const MobileSectionCard: React.FC<MobileSectionCardProps> = ({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  value,
  onClick,
  children,
}) => {
  if (children) {
    return (
      <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          <h3 className="font-bold text-gray-900">{title}</h3>
        </div>
        {children}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-[24px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] flex items-center justify-between active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
        <div className="text-left">
          <p className="font-bold text-gray-900">{title}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="font-bold text-gray-900">{value}</span>}
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </button>
  );
};

export default MobileSectionCard;

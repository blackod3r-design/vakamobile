import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import MobileFloatingActions from './MobileFloatingActions';

interface QuickAction {
  label: string;
  icon?: React.ElementType;
  action: () => void;
}

interface MobilePageWrapperProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
  quickActions?: QuickAction[];
}

const MobilePageWrapper: React.FC<MobilePageWrapperProps> = ({
  children,
  title,
  showBackButton = true,
  rightAction,
  quickActions = [],
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F8FA]">
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 bg-[#F8F8FA]/90 backdrop-blur-xl safe-area-top">
          <div className="flex items-center justify-between h-14 px-4">
            {showBackButton ? (
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-7 h-7 text-[#007AFF]" />
              </button>
            ) : (
              <div className="w-10" />
            )}
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            {rightAction || <div className="w-10" />}
          </div>
        </header>
      )}

      {/* Content */}
      <main className="pb-24 px-5">
        {children}
      </main>

      {/* Floating Actions */}
      {quickActions.length > 0 && (
        <MobileFloatingActions actions={quickActions} />
      )}
    </div>
  );
};

export default MobilePageWrapper;

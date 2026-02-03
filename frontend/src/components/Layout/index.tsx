import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { RainbowKitConnectButton } from '../RainbowKitConnectButton';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-between px-6 h-16 border-b border-border">
        <Link to="/" className="text-xl font-bold">
          FlexVaults
        </Link>
        <div className="flex items-center gap-4">
          <RainbowKitConnectButton />
        </div>
      </nav>
      {children}
    </div>
  );
};

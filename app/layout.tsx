// app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import { UserProvider } from './context/UserContext';
import { ReproductorProvider } from './context/ReproductorContext';
import ClientLayout from './components/ClientLayout';

export const metadata = {
  title: 'Lemon Music',
  description: 'Music App',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <UserProvider>
          <ReproductorProvider>
            <ClientLayout>{children}</ClientLayout>
          </ReproductorProvider>
        </UserProvider>
      </body>
    </html>
  );
}
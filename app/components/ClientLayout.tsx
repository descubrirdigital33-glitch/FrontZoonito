'use client';
import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Reproductor from './Reproductor';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <Reproductor /> {/* Ya no necesita props, usa el contexto internamente */}
      {children}
      <Footer />
    </>
  );
}

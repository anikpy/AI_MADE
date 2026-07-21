import { DevUserProvider } from '@/context/DevUserContext';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata = {
  title: 'Workforce ERP',
  description: 'Multi-tier Workforce & Task Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        <DevUserProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </DevUserProvider>
      </body>
    </html>
  );
}

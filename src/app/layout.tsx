import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import StoreProviderWrapper from '@/components/ui/store-provider';
import Providers from "@/components/providers";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: "Pickelball App",
  description: "Cho thuê sân tập Pickelball",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en"> 
      <body suppressHydrationWarning className={`${inter.variable} ${roboto.variable} font-sans antialiased`}>
        <Providers>
          <StoreProviderWrapper>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#fff',
                  color: '#333',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  padding: '12px 20px',
                },
                success: {
                  style: {
                    background: '#effff4',
                    border: '1px solid #c3e6cb',
                  },
                  iconTheme: {
                    primary: '#2e7d32',
                    secondary: '#effff4',
                  },
                },
                error: {
                  style: {
                    background: '#fff6f6',
                    border: '1px solid #f5c6cb',
                  },
                  iconTheme: {
                    primary: '#c62828',
                    secondary: '#fff6f6',
                  },
                },
              }}
            />
          </StoreProviderWrapper>
        </Providers>
      </body>
    </html>
  );
}
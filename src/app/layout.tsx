import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import StoreProviderWrapper from '@/components/ui/store-provider';
import Providers from "@/components/providers";

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
      <body className={`${inter.variable} ${roboto.variable} font-sans antialiased`}>
      <Providers>
         <StoreProviderWrapper>
          {children}
        </StoreProviderWrapper>
        </Providers>
      </body>
    </html>
  );
}
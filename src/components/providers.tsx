"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ZenStackHooksProvider } from '../../generated/hooks';
import StoreProviderWrapper from './ui/store-provider';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { FetchFn } from '@zenstackhq/tanstack-query/runtime-v5';
import { ToastContextProvider } from './ui/toast';

const queryClient = new QueryClient();

const fetchInstance: FetchFn = (url, options) => {
  return fetch(url, options)
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const apiEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/models`;


  return (
    <QueryClientProvider client={queryClient}>
      <ZenStackHooksProvider
        value={{
          endpoint: apiEndpoint,
          fetch: fetchInstance,
        }}
      >
        <ToastContextProvider>
          <StoreProviderWrapper>
            {children}
          </StoreProviderWrapper>
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
        </ToastContextProvider>
      </ZenStackHooksProvider>
    </QueryClientProvider>
  );
}
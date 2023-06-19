import { Layout, Typography } from 'antd';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { RouterProvider } from 'react-router-dom';

import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Layout.Header
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography.Title level={2} style={{ color: 'white', margin: 0 }}>
            GenCO
          </Typography.Title>
        </Layout.Header>
        <Layout.Content style={{ padding: '32px 48px' }}>
          <RouterProvider router={router} />
        </Layout.Content>
      </Layout>
    </QueryClientProvider>
  );
}

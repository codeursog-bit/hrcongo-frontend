
// ============================================================================
// Fichier: frontend/app/admin/layout.tsx
// ============================================================================

import React from 'react';
import { LayoutWrapper } from '@/components/admin/LayoutWrapper'; // ✅ AJOUT

export const metadata = {
  title: 'HRCongo | Super Admin Command Center',
  description: 'Executive-level Super Admin dashboard for HRCongo SaaS platform',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{__html: `
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  brand: {
                    red: '#DC2626',
                    darkRed: '#991B1B',
                    dark: '#111827',
                    darker: '#0B0F19',
                    gold: '#F59E0B',
                  }
                },
                fontFamily: {
                  sans: ['Inter', 'system-ui', 'sans-serif'],
                },
                animation: {
                  'fade-in': 'fadeIn 0.5s ease-out',
                  'slide-up': 'slideUp 0.5s ease-out',
                },
                keyframes: {
                  fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                  },
                  slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                  }
                }
              }
            }
          }
        `}} />
      </head>
      <body className="flex flex-col h-screen overflow-hidden bg-[#0B0F19] text-gray-200 font-sans selection:bg-brand-red selection:text-white">
        {/* ✅ DÉCOMMENTER LAYOUTWRAPPER */}
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}

// import React from 'react';
// import { LayoutWrapper } from '@/components/admin/LayoutWrapper';

// export const metadata = {
//   title: 'HRCongo | Super Admin Command Center',
//   description: 'Executive-level Super Admin dashboard for HRCongo SaaS platform',
// };

// export default function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return <LayoutWrapper>{children}</LayoutWrapper>;
// }

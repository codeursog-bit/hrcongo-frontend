'use client';
import React, { createContext, useContext } from 'react';
import { useCompanyLogo, type CompanyBrand } from '@/hooks/useCompanyLogo';
import { useSubscription } from '@/hooks/useSubscription';

const BrandContext = createContext<CompanyBrand>({ logo: null, name: null });

/** Share the existing company branding read across the shell and its loaders. */
export function CompanyBrandProvider({ children, enabled = true }: { children: React.ReactNode; enabled?: boolean }) {
  const brand = useCompanyLogo(enabled);
  const {subscription}=useSubscription();
  const allowed=subscription?.planDetails?.limits?.hasWhiteLabel===true;
  return <BrandContext.Provider value={allowed?{...brand,applicationLogoAllowed:true}:{logo:null,name:null,applicationLogoAllowed:false}}>{children}</BrandContext.Provider>;
}
export const useShellBrand = () => useContext(BrandContext);

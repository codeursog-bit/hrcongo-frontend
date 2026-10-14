import React from 'react';
import { KonzaLoader } from './KonzaLoader';

// Conservé pour compatibilité : tous les anciens <GlobalLoader /> affichent
// désormais le loader Konza RH (logo K + anneau).
export const GlobalLoader = () => <KonzaLoader variant="page" />;
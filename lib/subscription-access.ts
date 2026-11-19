export function pageEntitlement(pathname:string):string|undefined {
  const path=pathname.split('?')[0].replace(/\/+$/,'');
  if(/^\/cnss-declaration(\/|$)/.test(path)) return 'hasCNSSDeclaration';
  if(/^\/rapports\/(das1|bulletin-annuel|recap-bulletins-annuel)(\/|$)/.test(path)) return 'hasAnnualPayroll';
  if(/^\/rapports\/(das|das-declaration)(\/|$)/.test(path)) return 'hasDASDeclaration';
  if(/^\/contrats\/(nouveau|generer|generation)(\/|$)/.test(path)) return 'hasContractGeneration';
  if(/^\/contrats(\/|$)/.test(path)) return 'hasContractAlerts';
  if(/^\/loans(\/|$)/.test(path)) return 'hasLoansAndAdvances';
  if(/^\/formation(\/|$)/.test(path)) return 'hasTraining';
  if(/^\/materiel(\/|$)/.test(path)) return 'hasAssetManagement';
  if(/^\/performance(\/|$)/.test(path)) return 'hasPerformanceReviews';
  if(/^\/recrutement(\/|$)/.test(path)) return 'hasRecruitmentManual';
  if(/^\/messages(\/|$)/.test(path)) return 'hasInternalMessaging';
  if(/^\/rapports(\/|$)/.test(path)) return 'hasReportsAnalytics';
  if(/^\/apparence(\/|$)/.test(path)) return 'hasAppearanceCustomization';
  return undefined;
}

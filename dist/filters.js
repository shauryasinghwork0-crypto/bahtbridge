(() => {
  'use strict';
  const categoryLabels = [
    ['all', 'All funding'], ['short', 'Short term'], ['long', 'Long term'],
    ['instant', 'Instant credit'], ['24h', 'Within 24 hours'], ['working', 'Working capital'],
    ['invoice', 'Invoice finance'], ['equipment', 'Equipment'], ['supplier', 'Supplier credit']
  ];
  const searchable=values=>values.flatMap(value=>[value,window.BBLocale?.t(value)||value]).join(' ').toLowerCase();
  function providerMatches(lender, filters) {
    const query = (filters.query || '').trim().toLowerCase();
    return (!query || searchable([lender.name,lender.type,lender.description]).includes(query))
      && (!filters.type || filters.type === 'all' || lender.type === filters.type)
      && (!filters.category || filters.category === 'all' || lender.categories.includes(filters.category))
      && (!filters.amount || (Number(filters.amount) >= lender.min && Number(filters.amount) <= lender.max))
      && (!filters.rate || lender.rate <= Number(filters.rate))
      && (!filters.speed || lender.speedHours <= Number(filters.speed))
      && (!filters.term || filters.term === 'all' || (filters.term === 'short' ? lender.termMin <= 12 : lender.termMax > 12))
      && (!filters.collateral || filters.collateral === 'all' || lender.collateral === filters.collateral);
  }
  function vendorCategories(business, lenders) {
    const product = lenders.find(l => l.type === business.fundingType);
    const categories = new Set(product?.categories || []);
    categories.delete('short'); categories.delete('long'); categories.delete('24h'); categories.delete('instant');
    categories.add(business.termPreference);
    if (business.urgencyHours <= 24) categories.add('24h');
    if (business.urgencyHours <= 1) categories.add('instant');
    return categories;
  }
  function vendorMatches(business, filters, lenders) {
    const query = (filters.query || '').trim().toLowerCase();
    return (!query || searchable([business.name,business.sector,business.location,business.fundingType]).includes(query))
      && (!filters.sector || filters.sector === 'all' || business.sector === filters.sector)
      && (!filters.category || filters.category === 'all' || vendorCategories(business, lenders).has(filters.category))
      && (!filters.minScore || business.score >= Number(filters.minScore))
      && (!filters.minRevenue || business.revenue >= Number(filters.minRevenue))
      && (!filters.maxAmount || business.requested <= Number(filters.maxAmount))
      && (!filters.minTrading || business.tradingMonths >= Number(filters.minTrading))
      && (!filters.minPayments || business.paymentPerformance >= Number(filters.minPayments))
      && (!filters.term || filters.term === 'all' || business.termPreference === filters.term)
      && (!filters.speed || business.urgencyHours <= Number(filters.speed));
  }
  window.BBFilters = { categoryLabels, providerMatches, vendorMatches };
})();

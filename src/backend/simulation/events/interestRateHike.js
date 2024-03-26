export const adjustGrowthRatesForInterestRateHike = () => {

  const impactMultipliers = {
    equity: { X: 0.9, Y: 1 }, // Equity tends to decrease in value with interest rate hikes
    bonds: { X: 1.1, Y: 1 }, // Bonds might increase slightly as they become more attractive for the fixed returns
    realEstate: { X: 0.95, Y: 1 }, // Real estate can be negatively impacted due to higher mortgage rates
    banks: { X: 1.05, Y: 1 }, // Bank accounts might see a slight positive impact from higher interest rates
    other: { X: 1, Y: 1 } // Other assets are unaffected in this simplistic model
  };

  return impactMultipliers;
}

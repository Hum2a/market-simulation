// TaxReformFavoringCorporateProfits.js
// Logic to adjust growth rates based on the "TaxReformFavoringCorporateProfits" event

export const TaxReformFavoringCorporateProfitsEffects = () => {
    return {
        equity: { X: 1.1, Y: 1 },
        bonds: { X: 1, Y: 1 },
        realEstate: { X: 1.1, Y: 1 },
        banks: { X: 1.1, Y: 1 },
        other: { X: 1.1, Y: 1 },
    };
};
// MajorCorporationBankruptcy.js
// Logic to adjust growth rates based on the "MajorCorporationBankruptcy" event

export const MajorCorporationBankruptcyEffects = () => {
    return {
        equity: { X: 0.9, Y: 1 },
        bonds: { X: 0.9, Y: 1 },
        realEstate: { X: 0.9, Y: 1 },
        banks: { X: 0.9, Y: 1 },
        other: { X: 0.9, Y: 1 },
    };
};
// RealEstateBoom.js
// Logic to adjust growth rates based on the "RealEstateBoom" event

export const RealEstateBoomEffects = () => {
    return {
        equity: { X: 1.1, Y: 1 },
        bonds: { X: 0.9, Y: 1 },
        realEstate: { X: 1.1, Y: 1 },
        banks: { X: 1.1, Y: 1 },
        other: { X: 1.1, Y: 1 },
    };
};
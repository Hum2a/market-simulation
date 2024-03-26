// PoliticalInstability.js
// Logic to adjust growth rates based on the "Political in stability" event

export const PoliticalInstabilityEffects = () => {
    return {
        equity: { X: 0.9, Y: 1 },
        bonds: { X: 1.1, Y: 1 },
        realEstate: { X: 0.9, Y: 1 },
        banks: { X: 0.9, Y: 1 },
        other: { X: 0.9, Y: 1 },
    };
};
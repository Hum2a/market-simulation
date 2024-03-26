// StringentEnvironmentalRegulations.js
// Logic to adjust growth rates based on the "StringentEnvironmentalRegulations" event

export const StringentEnvironmentalRegulationsEffects = () => {
    return {
        equity: { X: 0.9, Y: 1 },
        bonds: { X: 1, Y: 1 },
        realEstate: { X: 0.9, Y: 1 },
        banks: { X: 1.1, Y: 1 },
        other: { X: 0.9, Y: 1 },
    };
};
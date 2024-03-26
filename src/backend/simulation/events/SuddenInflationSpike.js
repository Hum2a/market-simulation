// SuddenInflationSpike.js
// Logic to adjust growth rates based on the "Sudden in flationSpike" event

export const SuddenInflationSpikeEffects = () => {
    return {
        equity: { X: 0.9, Y: 1 },
        bonds: { X: 0.9, Y: 1 },
        realEstate: { X: 1.1, Y: 1 },
        banks: { X: 0.9, Y: 1 },
        other: { X: 0.9, Y: 1 },
    };
};
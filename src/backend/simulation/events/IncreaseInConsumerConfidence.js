// IncreaseInConsumerConfidence.js
// Logic to adjust growth rates based on the " in crease in ConsumerConfidence" event

export const IncreaseInConsumerConfidenceEffects = () => {
    return {
        equity: { X: 1.1, Y: 1 },
        bonds: { X: 1.1, Y: 1 },
        realEstate: { X: 1.1, Y: 1 },
        banks: { X: 1.1, Y: 1 },
        other: { X: 1.1, Y: 1 },
    };
};

function calculateNutrientValues(nutrients, amount) {
    if (!nutrients || typeof nutrients.calories !== 'number' ||
         typeof nutrients.fiber !== 'number' || 
         typeof nutrients.protein !== 'number' || 
         typeof nutrients.fat !== 'number') {
        throw new Error('Invalid or missing nutrient values');
    }

    if (typeof amount !== 'number' || amount < 0) {
        throw new Error('Amount must be a positive number');
    }

    // Bruker Math.round for å avrunde til nærmeste heltall
    return {
        calories: Math.round((nutrients.calories / 100) * amount),
        fiber: Math.round((nutrients.fiber / 100) * amount),
        protein: Math.round((nutrients.protein / 100) * amount),
        fat: Math.round((nutrients.fat / 100) * amount)
    };
}


module.exports = calculateNutrientValues; 
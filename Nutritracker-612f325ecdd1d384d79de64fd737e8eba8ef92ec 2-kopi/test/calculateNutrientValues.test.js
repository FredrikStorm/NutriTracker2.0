

const chai = require('chai');
const expect = chai.expect;
const calculateNutrientValues = require('./calculateNutrientValues.js');

describe('Nutrition Calculator', () => {
    describe('Happy Path', () => {
        it('should correctly calculate nutrient values for valid inputs', () => {
            const nutrients = {
                calories: 200,
                fiber: 10,
                protein: 5,
                fat: 15
            };
            const amount = 250;  // 250g av matvaren
            const result = calculateNutrientValues(nutrients, amount);
            expect(result).to.deep.equal({
                calories: 500,   // Ingen avrunding nødvendig her
                fiber: 25,
                protein: 13,     // Avrundet opp fra 12.5
                fat: 38          // Avrundet opp fra 37.5
            });
        });
    });

    describe('Bad Path', () => {
        it('should handle missing nutrient values', () => {
            const nutrients = { calories: 200, fiber: 10 }; // Mangler protein og fett
            const amount = 100;
            expect(() => calculateNutrientValues(nutrients, amount)).to.throw('Invalid or missing nutrient values');
        });

        it('should handle negative amounts', () => {
            const nutrients = { calories: 200, fiber: 10, protein: 5, fat: 15 };
            const amount = -100; // Negativt antall
            expect(() => calculateNutrientValues(nutrients, amount)).to.throw('Amount must be a positive number');
        });

        it('should handle zero amount correctly', () => {
            const nutrients = { calories: 200, fiber: 10, protein: 5, fat: 15 };
            const amount = 0;
            const result = calculateNutrientValues(nutrients, amount);
            expect(result).to.deep.equal({
                calories: 0,
                fiber: 0,
                protein: 0,
                fat: 0
            });
        });

        it('should handle very large amounts', () => {
            const nutrients = { calories: 200, fiber: 10, protein: 5, fat: 15 };
            const amount = 1000000; // 1 million grams
            const result = calculateNutrientValues(nutrients, amount);
            expect(result).to.deep.equal({
                calories: 2000000,
                fiber: 100000,
                protein: 50000,
                fat: 150000
            });
        });

        it('should throw an error for non-numeric nutrient values', () => {
            const nutrients = { calories: "two hundred", fiber: 10, protein: 5, fat: 15 };
            const amount = 100;
            expect(() => calculateNutrientValues(nutrients, amount)).to.throw();
        });

        it('should throw an error for non-numeric amounts', () => {
            const nutrients = { calories: 200, fiber: 10, protein: 5, fat: 15 };
            const amount = "one hundred";
            expect(() => calculateNutrientValues(nutrients, amount)).to.throw('Amount must be a positive number');
        });

        it('should correctly calculate and round nutrient values', () => {
            const nutrients = { calories: 123, fiber: 4.5678, protein: 29.12345, fat: 15.98765 };
            const amount = 350;
            const result = calculateNutrientValues(nutrients, amount);
            expect(result).to.deep.equal({
                calories: 431, // Avrundet fra 430.55
                fiber: 16,    // Avrundet fra 15.9873
                protein: 102, // Avrundet fra 101.93
                fat: 56       // Avrundet fra 55.96
            });
        });
    });
});

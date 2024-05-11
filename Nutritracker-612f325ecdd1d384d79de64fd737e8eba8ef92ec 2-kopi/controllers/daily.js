const { fetchNutritionData } = require('../Model/daily.js')

const seeEnergi = async (req, res) => {
    const { userId } = req.params;
    const viewType = req.query.viewType || 'daily';
    const timeGroup = viewType === 'monthly' ? 'day' : 'hour';

    try {
        const [mealsResult, waterResult, metabolismResult, activitiesResult] = await fetchNutritionData(userId, timeGroup);

        // Process results to combine all data into a single response object
        const metabolismRate = metabolismResult.recordset.length ? metabolismResult.recordset[0].stofskifte : 0;
        const metabolismPerHour = viewType === 'monthly' ? metabolismRate : metabolismRate / 24;

        const responseData = Array.from({ length: viewType === 'monthly' ? 31 : 24 }, (_, i) => {
            return {
                timeGroup: i,
                totalKcal: mealsResult.recordset.filter(r => r.TimeGroup === i).reduce((acc, curr) => acc + curr.TotalKcal, 0),
                waterIntake: waterResult.recordset.filter(r => r.TimeGroup === i).reduce((acc, curr) => acc + curr.WaterIntake, 0),
                hourlyBurn: metabolismPerHour,
                totalActivityKcal: activitiesResult.recordset.filter(r => r.TimeGroup === i).reduce((acc, curr) => acc + curr.TotalActivityKcal, 0)
            };
        });

        res.json(responseData);
    } catch (err) {
        res.status(500).send('Databasefejl: ' + err.message);
    }
};

module.exports = { seeEnergi };
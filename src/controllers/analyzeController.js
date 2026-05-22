const pool = require("../db");
const { generateAnalysis } = require("../services/analysisService");

function makeSignature(target, competitor){
    return `${target}|${competitor}`;
};

const analyzeCompetitor = async (req, res) => {
    const { target_url, competitor_url, force_refresh } = req.body;

    const signature = makeSignature(target_url, competitor_url);

    try{
        const cacheResult = await pool.query(
            "SELECT * FROM api_cache_registry WHERE request_signature = $1", [signature]
        );

        if (cacheResult.rows.length > 0 && !force_refresh) {
            return res.json({
                source: "cache",
                data: cacheResult.rows[0].response_payload
            });
        }

        const analysis = await generateAnalysis(target_url, competitor_url);

        const companyExists = await pool.query(
            `SELECT * FROM company_profiles WHERE target_url = $1`, [target_url]
        );

        if (companyExists.rows.length > 0) {
            companyId = companyExists.rows[0].id;
        }

        else {
            const newCompany = await pool.query(
                `INSERT INTO company_profiles (target_url) VALUES ($1) RETURNING id`,
                [target_url]
            );

            companyId = newCompany.rows[0].id
        }

        await pool.query(
            `INSERT INTO competitor_battle_cards (company_id, competitor_url, strategy_summary)
            VALUES ($1, $2, $3)`,
            [companyId, competitor_url, analysis]
        );

        await pool.query(
            `INSERT INTO api_cache_registry (request_signature, response_payload)
            VALUES ($1, $2)`,
            [signature, analysis]
        );

        return res.json({
            source: "live",
            data: analysis,
        });
    }
    
    catch(err) {
        console.error("Analysis error:", err);

        return res.status(500).json({
            error: "Analysis error"
        });

    }
};
module.exports = { analyzeCompetitor }
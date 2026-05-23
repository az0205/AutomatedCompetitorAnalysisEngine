const pool = require("../db");
const { generateAnalysis } = require("../services/analysisService");

const analyzeCompetitor = async (req, res) => {
    const { target_url, competitor_url, force_refresh } = req.body;

    const signature = `${target_url}|${competitor_url}`;

    try{
        // Checks if the information is stored in the cache
        const cacheResult = await pool.query(
            "SELECT * FROM api_cache_registry WHERE request_signature = $1", [signature]
        );

        if (cacheResult.rows.length > 0 && !force_refresh) {
            return res.json({
                source: "cache",
                data: cacheResult.rows[0].response_payload
            });
        }

        // Attempts to acquire the lock
        const lockResult = await pool.query(
            `INSERT INTO request_locks (request_signature) VALUES ($1) ON CONFLICT DO NOTHING RETURNING *`,
            [signature]
        );

        // If the lock fails
        if (lockResult.rows.length === 0) {
            return res.status(202).json({
                status: "processing",
                message: "An analysis is already running for this request"
            });
        }

        const analysis = await generateAnalysis(target_url, competitor_url);

        // Checks if the company exists and collects target company id
        const companyExists = await pool.query(
            `SELECT * FROM company_profiles WHERE target_url = $1`, [target_url]
        );

        if (companyExists.rows.length > 0) {
            let companyId = companyExists.rows[0].id;
        }

        // If no company exists, added into company_profiles
        else {
            const newCompany = await pool.query(
                `INSERT INTO company_profiles (target_url) VALUES ($1) RETURNING id`,
                [target_url]
            );

            let companyId = newCompany.rows[0].id
        }

        // Adding battle card
        await pool.query(
            `INSERT INTO competitor_battle_cards (company_id, competitor_url, strategy_summary)
            VALUES ($1, $2, $3)`,
            [companyId, competitor_url, analysis]
        );

        // Save into cache
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

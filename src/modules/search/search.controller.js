const searchService = require("./search.service");

exports.globalSearch = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 1) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const result = await searchService.globalSearch(q);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Search Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
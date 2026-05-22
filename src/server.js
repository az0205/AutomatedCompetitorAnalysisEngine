const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

const analyzeRoute = require("./routes/analyze");
app.use("/api/v1/analyze", analyzeRoute);

app.get("/", (req, res) =>{
    res.send("Engine is running")
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const TEMPLATE_OWNER = process.env.REPO_OWNER || "iconic05";
const TEMPLATE_REPO = process.env.REPO_NAME || "Space-XMD";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const RENDER_API_KEY = process.env.RENDER_API_KEY;

// Serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Check if user forked
app.post("/checkFork", async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    try {
        const response = await fetch(`https://api.github.com/repos/${username}/${TEMPLATE_REPO}`, {
            headers: { Authorization: `token ${GITHUB_TOKEN}`, "User-Agent": "SpaceXMD-Host" }
        });
        if (response.status === 200) {
            return res.json({ forked: true, repo: `https://github.com/${username}/${TEMPLATE_REPO}` });
        }
        return res.json({ forked: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fork repo
app.post("/fork", async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    try {
        const forkResp = await fetch(`https://api.github.com/repos/${TEMPLATE_OWNER}/${TEMPLATE_REPO}/forks`, {
            method: "POST",
            headers: { Authorization: `token ${GITHUB_TOKEN}`, "User-Agent": "SpaceXMD-Host" }
        });
        const forkData = await forkResp.json();

        if (forkResp.status !== 202 && forkResp.status !== 201) {
            return res.status(400).json({ error: forkData.message });
        }

        res.json({ success: true, repo: `https://github.com/${username}/${TEMPLATE_REPO}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start deployment on Render and stream logs
app.post("/deploy", async (req, res) => {
    const { repoUrl } = req.body;
    if (!repoUrl) return res.status(400).json({ error: "Repo URL required" });

    try {
        // 1. Create deployment
        const deployResp = await fetch("https://api.render.com/deploy/srv-deployments", {
            method: "POST",
            headers: { Authorization: `Bearer ${RENDER_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                serviceId: "srv-your-service-id", // <-- replace with your Render service ID
                repo: repoUrl,
                branch: "main"
            })
        });

        const deployData = await deployResp.json();
        if (!deployData.id) return res.status(400).json({ error: "Failed to start deployment" });

        const deploymentId = deployData.id;
        console.log("Deployment started:", deploymentId);

        // 2. Poll deployment logs
        let logsArray = [];
        const pollLogs = setInterval(async () => {
            const logsResp = await fetch(`https://api.render.com/deploy/srv-deployments/${deploymentId}/events`, {
                headers: { Authorization: `Bearer ${RENDER_API_KEY}` }
            });
            const logsJson = await logsResp.json();
            const newLogs = logsJson.events
                .filter(e => !logsArray.includes(e.id))
                .map(e => e.message);
            logsArray.push(...logsJson.events.map(e => e.id));

            if (newLogs.length > 0) res.write(newLogs.join("\n") + "\n");

            if (logsJson.status === "deployed") {
                res.write("✅ Deployment completed!\n");
                clearInterval(pollLogs);
                res.end();
            }
        }, 2000);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
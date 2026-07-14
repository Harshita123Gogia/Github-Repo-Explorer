const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const cache = new Map(); // username -> {data, timestamp}

app.get('/api/user/:username', async (req, res) => {
  const { username } = req.params;
  const cacheKey = username.toLowerCase();
  const now = Date.now();

  // Check cache
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (now - cached.timestamp < 60000) { // 60 seconds
      return res.json(cached.data);
    }
  }

  try {
    const userResponse = await axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Add GitHub token if available: 'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    });

    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const data = {
      user: userResponse.data,
      repos: reposResponse.data
    };

    // Update cache
    cache.set(cacheKey, { data, timestamp: now });

    res.json(data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.response && error.response.status === 403) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from GitHub' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
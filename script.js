// --- Configuration ---
const BTC2_TICKER_ON_PECUNIA = 'bitcoin2';
// -------------------

// This will hold our data from database.json
let localDb = {};
let lastKnownBlockHeight = 0;
let supplyChartSegmentIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch local data first, so it's ready for other functions
    await fetchLocalData();

    // Now fetch all the live API data
    fetchBtc2Data();
    fetchPecuniaGlobalBtc2Data();
    fetchPecuniaUserData();

    // Set up intervals to refresh API data
    setInterval(fetchBtc2Data, 60000);
    setInterval(fetchPecuniaGlobalBtc2Data, 60000);
    setInterval(fetchPecuniaUserData, 60000);
});

async function fetchLocalData() {
    try {
        const response = await fetch('database.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        localDb = await response.json();

        // Once the data is loaded, update the UI element that depends on it.
        document.getElementById('total-rewards').textContent = `${localDb.totalRewardsEarned.toLocaleString()} BTC2`;

    } catch (error) {
        console.error("Fatal Error: Could not load 'database.json'.", error);
        document.body.innerHTML = '<h1>Error</h1><p>Could not load essential data from database.json. Please ensure the file exists and is correctly formatted.</p>';
    }
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const BTC2_API_URL = 'https://www.bitc2.org/block-explorer/apiquery?q=';

async function fetchApi(url, options = {}) {
    const fetchUrl = url.includes('bitc2.org') ? `${CORS_PROXY}${encodeURIComponent(url)}` : url;
    
    const response = await fetch(fetchUrl, options);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        return text;
    }
}

async function fetchBtc2Data() {
    try {
        const data = await fetchApi(`${BTC2_API_URL}getinfo`);

        // Logic for supply chart animation
        if (lastKnownBlockHeight !== 0 && data.blocks > lastKnownBlockHeight) {
            supplyChartSegmentIndex = (supplyChartSegmentIndex + 1) % 5;
        }
        lastKnownBlockHeight = data.blocks;
        drawBtc2SupplyChart(); 

        // --- CORRECTED DATA POPULATION ---
        
        // Populate the Block Clock
        document.getElementById('block-height-clock').textContent = data.blocks.toLocaleString();
        document.getElementById('difficulty-clock').textContent = `Difficulty: ${data.difficulty.toFixed(2)}`;
        
        // Populate the Total Supply chart text
        const supplyTextElement = document.getElementById('btc2-supply-text');
        if (supplyTextElement) {
            supplyTextElement.innerHTML = `
                <span class="label">Total Supply</span>
                ${Math.round(data.moneysupply).toLocaleString()}
                <span class="label">/ 21,000,000</span>
            `;
        }

    } catch (error) {
        console.error("Error fetching BTC2 data:", error);
        // Add a general error message to a safe element if something goes wrong
        const clockCard = document.querySelector('.card-block-clock');
        if (clockCard) {
            clockCard.innerHTML = "<p>Could not fetch BTC2 data.</p>";
        }
    }
}

async function fetchPecuniaGlobalBtc2Data() {
    if (PECUNIA_API_KEY === "XXX") {
        document.getElementById('btc2-mn-stats').innerHTML = "<p>Please enter your Pecunia API key in config.js</p>";
        return;
    }
    
    try {
        const options = { headers: { 'Authorization': `Api-Key ${PECUNIA_API_KEY}` } };
        const data = await fetchApi(`${PECUNIA_API_BASE_URL}/user/coins-stats?tickers=${BTC2_TICKER_ON_PECUNIA}`, options);
        
        const btc2Stats = data[0]; 
        if (btc2Stats) {
            document.getElementById('mn-online').textContent = `${btc2Stats.count_enabled} / ${localDb.masternodeATH}`;
            
            const percentage = (btc2Stats.count_enabled / localDb.masternodeATH) * 100;
            document.getElementById('btc2-mn-bar').setAttribute('width', `${percentage}%`);

        } else {
            document.getElementById('mn-online').textContent = `Could not find stats for ticker '${BTC2_TICKER_ON_PECUNIA}'.`;
        }
    } catch (error) {
        console.error("Error fetching Pecunia global data:", error);
        document.getElementById('btc2-mn-stats').innerHTML = "<p>Could not fetch Pecunia masternode data.</p>";
    }
}

async function fetchPecuniaUserData() {
    if (PECUNIA_API_KEY === "XXX") {
        document.getElementById('incrypt-stats').innerHTML = "<p>Please enter your Pecunia API key in config.js</p>";
        return;
    }

    try {
        const options = { headers: { 'Authorization': `Api-Key ${PECUNIA_API_KEY}` } };
        const response = await fetchApi(`${PECUNIA_API_BASE_URL}/user/nodes?category=pecunia`, options);
        
        const allUserNodes = response.data;
        const userBtc2Nodes = allUserNodes.filter(node => node.coin === BTC2_TICKER_ON_PECUNIA);
        
        drawIncryptMNChart(userBtc2Nodes);
        
        if (userBtc2Nodes.length > 0) {
            const requiredCollateral = parseFloat(userBtc2Nodes[0].required);
            const totalStaked = userBtc2Nodes.length * requiredCollateral;
            document.getElementById('total-staked').textContent = `${totalStaked.toLocaleString()} BTC2`;
        } else {
            document.getElementById('total-staked').textContent = '0 BTC2';
        }

        // --- UPDATED BLOCK ---
        // This data now comes from our local database file
        const progress = localDb.progressToNextMN;
        document.getElementById('next-mn-progress').textContent = `${progress.current} / ${progress.target}`;

        const progressPercentage = (progress.current / progress.target) * 100;
        document.getElementById('next-mn-bar').setAttribute('width', `${progressPercentage}%`);

    } catch (error) {
        console.error("Error fetching Pecunia user data:", error);
        const textElement = document.getElementById('incrypt-mn-text');
        if (textElement) {
            textElement.textContent = "Error";
            textElement.style.fontSize = '1em'; // Make error text smaller
        }
    }
}

// This function calculates the SVG path data for a single segment of the donut chart.
function describeDonutSegment(x, y, radius, innerRadius, startAngle, endAngle) {
    const start = { x: x + radius * Math.cos(startAngle), y: y + radius * Math.sin(startAngle) };
    const end = { x: x + radius * Math.cos(endAngle), y: y + radius * Math.sin(endAngle) };
    const innerStart = { x: x + innerRadius * Math.cos(startAngle), y: y + innerRadius * Math.sin(startAngle) };
    const innerEnd = { x: x + innerRadius * Math.cos(endAngle), y: y + innerRadius * Math.sin(endAngle) };
    
    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

    const d = [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y,
        "L", innerEnd.x, innerEnd.y,
        "A", innerRadius, innerRadius, 0, largeArcFlag, 0, innerStart.x, innerStart.y,
        "Z"
    ].join(" ");

    return d;
}

// This function clears the old chart and draws a new one based on the node data.
function drawIncryptMNChart(nodes) {
    const svg = document.getElementById('incrypt-mn-chart');
    const textElement = document.getElementById('incrypt-mn-text');
    svg.innerHTML = ''; // Clear previous chart segments

    const totalNodes = nodes.length;
    if (totalNodes === 0) {
        textElement.textContent = '0/0';
        return;
    }

    const onlineCount = nodes.filter(n => n.liststatus === 'ENABLED').length;
    textElement.textContent = `${onlineCount}/${totalNodes}`;

    const angleStep = (2 * Math.PI) / totalNodes;
    let currentAngle = -0.5 * Math.PI; // Start at the top

    nodes.forEach(node => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const segmentPath = describeDonutSegment(50, 50, 48, 35, currentAngle, currentAngle + angleStep);
        
        path.setAttribute("d", segmentPath);
        path.classList.add('chart-segment');
        path.classList.add(node.liststatus === 'ENABLED' ? 'online' : 'offline');

        svg.appendChild(path);
        currentAngle += angleStep;
    });
}

// This function draws the 5-segment BTC2 supply chart.
function drawBtc2SupplyChart() {
    const svg = document.getElementById('btc2-supply-chart');
    if (!svg) return; // Exit if the element isn't there
    svg.innerHTML = ''; // Clear previous chart

    const totalSegments = 5;
    const angleStep = (2 * Math.PI) / totalSegments;
    let currentAngle = -0.5 * Math.PI; // Start at the top

    for (let i = 0; i < totalSegments; i++) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const segmentPath = describeDonutSegment(50, 50, 48, 35, currentAngle, currentAngle + angleStep - 0.05); // -0.05 for a small gap
        
        path.setAttribute("d", segmentPath);
        path.classList.add('chart-segment');

        // The active segment is orange, the rest are inactive (white)
        if (i === supplyChartSegmentIndex) {
            path.classList.add('online'); // Reuse 'online' class for orange color
        } else {
            path.classList.add('inactive');
        }

        svg.appendChild(path);
        currentAngle += angleStep;
    }
}
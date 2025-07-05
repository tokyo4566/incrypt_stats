# BTC2 & InCrypt Community Stats Dashboard

This is a simple, client-side landing page that displays real-time statistics for the Bitcoin2 (BTC2) blockchain and for personal masternodes hosted on the Pecunia platform. It is designed to be run locally or on a private server.

## How to Use

### 1. Configure API Key
Open the `config.js` file in a text editor. Replace `"XXX"` with your actual Pecunia platform API key.
```javascript
const PECUNIA_API_KEY = "XXX";
```

### 2. Configure Manual Data (Optional)
Open the `database.json` file. This file holds values that are not available from the APIs. You can edit these numbers at any time.

*   `masternodeATH`: The All-Time High number of masternodes on the BTC2 network.
*   `progressToNextMN`: The `current` and `target` values for your manual progress bar.
*   `totalRewardsEarned`: The manually-tracked, cumulative total of rewards you have earned.

### 3. Run with a Local Server
For this page to work correctly, you **must run it from a local web server**. Opening the `index.html` file directly from your computer will cause errors.

The easiest way is to use Python's built-in server:

1.  Open a terminal or command prompt in the project folder.
2.  Run the following command:
    ```bash
    python3 -m http.server
    ```
3.  Open your web browser and navigate to **`http://localhost:8000`**.

That's it! The page will automatically fetch and display the latest data.

## Important Notes

*   **API Key Security:** The Pecunia API key in `config.js` is visible in the browser's developer tools. This is suitable for private use but is **not secure** for a public-facing website!
*   **CORS Proxy:** The connection to the `bitc2.org` API relies on a free, public CORS proxy (`api.allorigins.win`). If this service is down, the BTC2 data may not load.

## File Structure

*   `index.html`: The main HTML file containing the layout and SVG graphics.
*   `style.css`: Contains all CSS for styling, layout, and animations.
*   `script.js`: Contains all JavaScript logic for fetching data and updating the UI.
*   `config.js`: For API key configuration.
*   `database.json`: A simple JSON file for storing and editing manual data points.
*   `logos/`: A directory containing the InCrypt and BTC2 image files.
```
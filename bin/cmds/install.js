const fs = require("fs");
const https = require("https");
const path = require("path");

function install(args) {
    const moduleName = args[0];
    if (!moduleName) return console.error("No module name provided.");
    const downTo = args[1];
    if(!downTo) return console.error("No download path provided.");

    const parts = moduleName.split(".");
    const basePath = `https://beanthealien.github.io/ghost/modules/${parts.join("/")}`;
    const isRoot = parts.length == 1;

    // Try index.json first if it's a root module
    if (isRoot) {
        tryFetch(`${basePath}/index.json`, (exists) => {
            if (exists) {
                // Folder module with index.json
                downloadIndex(basePath);
            } else {
                // Maybe a single root-level file (like test.js)
                tryFetch(`${basePath}.js`, (fileExists) => {
                    if (fileExists) {
                        const localFilePath = path.join(downTo, `${parts[0]}.js`);
                        downloadFile(`${basePath}.js`, localFilePath);
                    } else {
                        console.error(`Module "${moduleName}" not found.`);
                    }
                });
            }
        });
    } else {
        // Nested file like ghost.io or ghost/test
        const fileUrl = `${basePath}.js`;
        const localFilePath = path.join(downTo, path.basename(fileUrl));
        tryFetch(fileUrl, (exists) => {
            if (exists) downloadFile(fileUrl, localFilePath);
            else console.error(`Module "${moduleName}" not found.`);
        });
    }

    function tryFetch(url, callback) {
        https.get(url, (res) => {
            res.destroy(); // We just care about the status code
            callback(res.statusCode === 200);
        }).on("error", () => callback(false));
    }

    function downloadIndex(baseUrl) {
        const indexUrl = `${baseUrl}/index.json`;
        console.log(`Fetching module index from ${indexUrl}`);

        https.get(indexUrl, (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => {
                if (res.statusCode !== 200) {
                    console.error(`Failed to fetch module index (${res.statusCode})`);
                    return;
                }

                try {
                    const index = JSON.parse(data);
                    if (!index.files || !Array.isArray(index.files)) {
                        console.error("Invalid module index format.");
                        return;
                    }

                    index.files.forEach(file => {
                        const fileUrl = `${baseUrl}/${file}`;
                        const localFilePath = path.join(downTo, file);
                        downloadFile(fileUrl, localFilePath);
                    });
                } catch (err) {
                    console.error(`Error parsing module index: ${err.message}`);
                }
            });
        }).on("error", (err) => {
            console.error(`Error fetching module index: ${err.message}`);
        });
    }

    function downloadFile(url, dest) {
        console.log(`Downloading ${url} -> ${dest}`);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(dest);
                response.pipe(file);
                file.on("finish", () => {
                    file.close();
                    console.log(`Downloaded: ${dest}`);
                });
            } else {
                console.error(`Failed to download ${url} (${response.statusCode})`);
            }
        }).on("error", (err) => {
            console.error(`Error downloading ${url}: ${err.message}`);
        });
    }
}

module.exports = { default: install };
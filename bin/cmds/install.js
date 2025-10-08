const fs = require("fs");
const https = require("https");
const path = require("path");

function install(args) {
    const moduleName = args[0];
    if(!moduleName) return console.error("No module name provided.");
    const fileUrl = `https://beanthealien.github.io/ghost/modules/${moduleName}`;
    const fileName = path.basename(fileUrl); // "test.txt"
    const localFilePath = path.join("C:/Users/benal/OneDrive/Desktop", fileName);

    console.log(`Downloading ${fileUrl} -> ${localFilePath}`);

    https.get(fileUrl, (response) => {
        if(response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            // handle redirect
            console.log("Redirecting to:", response.headers.location);
            https.get(response.headers.location, handleResponse);
            return;
        }
        handleResponse(response);
    }).on("error", (err) => {
        console.error(`Error during download: ${err.message}`);
    });

    function handleResponse(response) {
        if(response.statusCode == 200) {
            const file = fs.createWriteStream(localFilePath);
            response.pipe(file);
            file.on("finish", () => {
                file.close();
                console.log(`File downloaded successfully to ${localFilePath}`);
            });
        } else {
            console.error(`Failed to download file. Status code: ${response.statusCode}`);
        }
    }
}

module.exports = { default: install };
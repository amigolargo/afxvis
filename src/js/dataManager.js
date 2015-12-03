import d3 from 'd3';

function loadCSV(file, callback) {
    return new Promise(
        function (resolve, reject) {
            d3.csv(file, (error, data) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(data);
                });
        });
}

function loadJSON(file, callback) {
    return new Promise(
        function (resolve, reject) {
            d3.json(file, (error, data) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(data);
                });
        });
}

// TODO. refactor / rename more semantically. perhaps needs refactoring to accept
// multiple data types in the manager
function readJsonFiles(filenames) {
    return Promise.all(filenames.map(loadJSON));
}

export { loadCSV, loadJSON, readJsonFiles };
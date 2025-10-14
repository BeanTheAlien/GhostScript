const fs = require("fs");
const mysql = require("mysql2/promise");

function expect(obj, keys) {
    return keys.every(k => Object.prototype.hasOwnProperty.call(obj, k));
}

function findMissing(input, expected) {
    return expected.filter(k => !Object.prototype.hasOwnProperty.call(input, k));
}

class Database {
    constructor(settings) {
        const keys = ["host", "user", "password", "database"];
        if(!expect(settings, keys)) throw new Error(`Missing keys in settings. (missing: ${findMissing(settings, keys).join(", ")})`);
        const { host, user, password, database } = settings;
        this.pool = mysql.createPool({
            host, user, password, database,
            waitForConnections: settings.waitForConnections ?? true,
            connectionLimit: settings.connectionLimit ?? 10,
            queueLimit: settings.queueLimit ?? 0
        });
        this.isPersistent = settings.isPersistent ?? true;
    }
    async query(sql, args = []) {
        return await this.pool.query(sql, args);
    }
}
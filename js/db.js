/* =========================================================
   BAIX FINANCE MONITOR
   Database Engine - IndexedDB
   Version: 1.0
   ========================================================= */

const DB_NAME = "baix-finance-monitor";
const DB_VERSION = 1;

let dbInstance = null;

/**
 * Struktur database:
 *
 * accounts
 * transactions
 * categories
 * savings_goals
 * budgets
 * recurring_transactions
 * settings
 */

function openDatabase() {
    return new Promise((resolve, reject) => {

        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {

            const db = event.target.result;

            // ==============================================
            // ACCOUNTS
            // ==============================================

            if (!db.objectStoreNames.contains("accounts")) {

                const accounts = db.createObjectStore("accounts", {
                    keyPath: "id"
                });

                accounts.createIndex("name", "name", {
                    unique: false
                });

                accounts.createIndex("type", "type", {
                    unique: false
                });

                accounts.createIndex("isActive", "isActive", {
                    unique: false
                });
            }


            // ==============================================
            // TRANSACTIONS
            // ==============================================

            if (!db.objectStoreNames.contains("transactions")) {

                const transactions = db.createObjectStore("transactions", {
                    keyPath: "id"
                });

                transactions.createIndex("type", "type", {
                    unique: false
                });

                transactions.createIndex("accountId", "accountId", {
                    unique: false
                });

                transactions.createIndex("categoryId", "categoryId", {
                    unique: false
                });

                transactions.createIndex("paymentMethod", "paymentMethod", {
                    unique: false
                });

                transactions.createIndex("date", "date", {
                    unique: false
                });

                transactions.createIndex("createdAt", "createdAt", {
                    unique: false
                });
            }


            // ==============================================
            // CATEGORIES
            // ==============================================

            if (!db.objectStoreNames.contains("categories")) {

                const categories = db.createObjectStore("categories", {
                    keyPath: "id"
                });

                categories.createIndex("name", "name", {
                    unique: false
                });

                categories.createIndex("type", "type", {
                    unique: false
                });
            }


            // ==============================================
            // SAVINGS GOALS
            // ==============================================

            if (!db.objectStoreNames.contains("savings_goals")) {

                const goals = db.createObjectStore("savings_goals", {
                    keyPath: "id"
                });

                goals.createIndex("name", "name", {
                    unique: false
                });

                goals.createIndex("status", "status", {
                    unique: false
                });
            }


            // ==============================================
            // BUDGETS
            // ==============================================

            if (!db.objectStoreNames.contains("budgets")) {

                const budgets = db.createObjectStore("budgets", {
                    keyPath: "id"
                });

                budgets.createIndex("categoryId", "categoryId", {
                    unique: false
                });

                budgets.createIndex("month", "month", {
                    unique: false
                });
            }


            // ==============================================
            // RECURRING TRANSACTIONS
            // ==============================================

            if (!db.objectStoreNames.contains("recurring_transactions")) {

                const recurring = db.createObjectStore(
                    "recurring_transactions",
                    {
                        keyPath: "id"
                    }
                );

                recurring.createIndex("type", "type", {
                    unique: false
                });

                recurring.createIndex("accountId", "accountId", {
                    unique: false
                });

                recurring.createIndex("isActive", "isActive", {
                    unique: false
                });
            }


            // ==============================================
            // SETTINGS
            // ==============================================

            if (!db.objectStoreNames.contains("settings")) {

                db.createObjectStore("settings", {
                    keyPath: "key"
                });
            }
        };


        request.onsuccess = (event) => {

            dbInstance = event.target.result;

            dbInstance.onerror = (event) => {
                console.error(
                    "BAIX Finance Database Error:",
                    event.target.error
                );
            };

            resolve(dbInstance);
        };


        request.onerror = (event) => {

            console.error(
                "BAIX Finance: gagal membuka database",
                event.target.error
            );

            reject(event.target.error);
        };
    });
}


/* =========================================================
   GENERATE ID
   ========================================================= */

function generateId(prefix = "id") {

    return `${prefix}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
}


/* =========================================================
   GENERIC DATABASE FUNCTIONS
   ========================================================= */

async function addData(storeName, data) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);

        const request = store.add(data);

        request.onsuccess = () => {
            resolve(data);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


async function putData(storeName, data) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);

        const request = store.put(data);

        request.onsuccess = () => {
            resolve(data);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


async function getData(storeName, id) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            storeName,
            "readonly"
        );

        const store = transaction.objectStore(storeName);

        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


async function getAllData(storeName) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            storeName,
            "readonly"
        );

        const store = transaction.objectStore(storeName);

        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


async function deleteData(storeName, id) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);

        const request = store.delete(id);

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


/* =========================================================
   CLEAR STORE
   ========================================================= */

async function clearStore(storeName) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);

        const request = store.clear();

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


/* =========================================================
   DATABASE STATUS
   ========================================================= */

async function getDatabaseStatus() {

    const db = await openDatabase();

    return {
        name: db.name,
        version: db.version,
        stores: Array.from(db.objectStoreNames)
    };
}

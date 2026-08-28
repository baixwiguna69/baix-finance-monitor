/* =========================================================
   BAIX FINANCE MONITOR
   Application Bootstrap
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("BAIX Finance Monitor starting...");

    try {

        const status = await getDatabaseStatus();

        console.log("Database berhasil dibuka.");

        console.table({
            Database: status.name,
            Version: status.version,
            Stores: status.stores.join(", ")
        });

    } catch (error) {

        console.error(
            "BAIX Finance Monitor gagal memulai:",
            error
        );
    }
});

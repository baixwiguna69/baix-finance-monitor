/* =========================================================
   BAIX FINANCE MONITOR
   Application Controller
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("BAIX Finance Monitor starting...");

    try {

        // Initialize database
        const status = await getDatabaseStatus();

        console.log("Database:", status.name);
        console.log("Version:", status.version);
        console.log("Stores:", status.stores);

        initializeNavigation();
        initializeQuickActions();

        console.log(
            "BAIX Finance Monitor berhasil dijalankan."
        );

    } catch (error) {

        console.error(
            "BAIX Finance Monitor gagal dijalankan:",
            error
        );

    }

});


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {

    const navItems =
        document.querySelectorAll(".nav-item[data-page]");

    const pages =
        document.querySelectorAll(".page");


    navItems.forEach(button => {

        button.addEventListener("click", () => {

            const targetPage =
                button.dataset.page;


            // Hide all pages
            pages.forEach(page => {
                page.classList.remove("active");
            });


            // Show selected page
            const page =
                document.getElementById(targetPage);

            if (page) {
                page.classList.add("active");
            }


            // Update navigation state
            navItems.forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

        });

    });

}


/* =========================================================
   QUICK ACTION
   ========================================================= */

function initializeQuickActions() {

    const modal =
        document.getElementById("quickActionModal");

    const quickAdd =
        document.getElementById("quickAddBtn");

    const bottomAdd =
        document.getElementById("bottomAddBtn");

    const closeButton =
        document.getElementById("closeQuickAction");

    const overlay =
        modal?.querySelector(".modal-overlay");


    function openModal() {

        modal?.classList.remove("hidden");

    }


    function closeModal() {

        modal?.classList.add("hidden");

    }


    quickAdd?.addEventListener(
        "click",
        openModal
    );


    bottomAdd?.addEventListener(
        "click",
        openModal
    );


    closeButton?.addEventListener(
        "click",
        closeModal
    );


    overlay?.addEventListener(
        "click",
        closeModal
    );

/* =========================================================
   BAIX FINANCE MONITOR
   Account Engine
   ========================================================= */

const ACCOUNT_TYPES = {
    BANK: "bank",
    EWALLET: "ewallet",
    CASH: "cash",
    OTHER: "other"
};

const ACCOUNT_TYPE_LABELS = {
    bank: "Bank",
    ewallet: "E-Wallet",
    cash: "Cash",
    other: "Lainnya"
};


/* =========================================================
   ACCOUNT CRUD
   ========================================================= */

async function createAccount({
    name,
    type,
    initialBalance = 0,
    note = ""
}) {

    if (!name || !name.trim()) {
        throw new Error("Nama rekening wajib diisi.");
    }

    const account = {
        id: generateId("account"),

        name: name.trim(),

        type: type || ACCOUNT_TYPES.OTHER,

        initialBalance: Number(initialBalance) || 0,

        note: note.trim(),

        isActive: true,

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString()
    };

    await addData("accounts", account);

    return account;
}


async function getAccounts() {

    return await getAllData("accounts");
}


async function getActiveAccounts() {

    const accounts = await getAccounts();

    return accounts.filter(account => account.isActive !== false);
}


async function getAccount(accountId) {

    return await getData("accounts", accountId);
}


async function updateAccount(accountId, changes) {

    const account = await getAccount(accountId);

    if (!account) {
        throw new Error("Rekening tidak ditemukan.");
    }

    const updatedAccount = {
        ...account,
        ...changes,
        updatedAt: new Date().toISOString()
    };

    await putData("accounts", updatedAccount);

    return updatedAccount;
}


/*
 * Rekening tidak langsung dihapus.
 *
 * Alasannya:
 * transaksi lama masih membutuhkan rekening tersebut.
 *
 * Jadi kita menggunakan soft delete:
 * isActive = false
 */

async function deactivateAccount(accountId) {

    return await updateAccount(accountId, {
        isActive: false
    });
}


async function activateAccount(accountId) {

    return await updateAccount(accountId, {
        isActive: true
    });
}


/* =========================================================
   ACCOUNT BALANCE
   ========================================================= */

async function calculateAccountBalance(accountId) {

    const account = await getAccount(accountId);

    if (!account) {
        return 0;
    }

    const transactions =
        await getAllData("transactions");


    let balance =
        Number(account.initialBalance) || 0;


    transactions
        .filter(transaction => transaction.status !== "cancelled")
        .forEach(transaction => {

            /*
             * INCOME
             * Uang masuk ke rekening
             */

            if (
                transaction.type === "income" &&
                transaction.accountId === accountId
            ) {

                balance += Number(transaction.amount) || 0;
            }


            /*
             * EXPENSE
             * Uang keluar dari rekening
             */

            if (
                transaction.type === "expense" &&
                transaction.accountId === accountId
            ) {

                balance -= Number(transaction.amount) || 0;
            }


            /*
             * SAVING
             * Untuk sementara tabungan dianggap
             * sebagai pengeluaran/alokasi.
             *
             * Nanti kita sempurnakan ketika Savings Engine
             * sudah selesai.
             */

            if (
                transaction.type === "saving" &&
                transaction.accountId === accountId
            ) {

                balance -= Number(transaction.amount) || 0;
            }


            /*
             * TRANSFER KELUAR
             */

            if (
                transaction.type === "transfer" &&
                transaction.fromAccountId === accountId
            ) {

                balance -= Number(transaction.amount) || 0;
            }


            /*
             * TRANSFER MASUK
             */

            if (
                transaction.type === "transfer" &&
                transaction.toAccountId === accountId
            ) {

                balance += Number(transaction.amount) || 0;
            }

        });


    return balance;
}


async function calculateTotalBalance() {

    const accounts = await getActiveAccounts();

    let total = 0;

    for (const account of accounts) {

        total += await calculateAccountBalance(
            account.id
        );

    }

    return total;
}


/* =========================================================
   FORMAT ACCOUNT
   ========================================================= */

function getAccountTypeLabel(type) {

    return ACCOUNT_TYPE_LABELS[type] ||
        ACCOUNT_TYPE_LABELS.other;
}


function getAccountIcon(type) {

    switch (type) {

        case ACCOUNT_TYPES.BANK:
            return "🏦";

        case ACCOUNT_TYPES.EWALLET:
            return "📱";

        case ACCOUNT_TYPES.CASH:
            return "💵";

        default:
            return "💰";
    }
}


/* =========================================================
   ACCOUNT UI
   ========================================================= */

async function renderAccounts() {

    const containers = [
        document.getElementById("accountsList"),
        document.getElementById("allAccountsList")
    ];

    const accounts =
        await getActiveAccounts();


    if (!accounts.length) {

        containers.forEach(container => {

            if (!container) return;

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-icon">
                        🏦
                    </div>

                    <h3>Belum ada rekening</h3>

                    <p>
                        Tambahkan bank, e-wallet,
                        atau cash kamu.
                    </p>

                    <button
                        class="primary-btn"
                        onclick="openAccountForm()"
                    >
                        + Tambah Rekening
                    </button>

                </div>
            `;

        });

        return;
    }


    const accountHTML = [];


    for (const account of accounts) {

        const balance =
            await calculateAccountBalance(account.id);


        accountHTML.push(`

            <div
                class="account-card"
                data-account-id="${account.id}"
            >

                <div class="account-icon">
                    ${getAccountIcon(account.type)}
                </div>

                <div class="account-info">

                    <strong>
                        ${escapeHTML(account.name)}
                    </strong>

                    <small>
                        ${getAccountTypeLabel(account.type)}
                    </small>

                </div>

                <div class="account-balance">

                    <strong>
                        ${formatRupiah(balance)}
                    </strong>

                    <button
                        class="account-menu-btn"
                        onclick="openAccountMenu('${account.id}')"
                    >
                        ⋮
                    </button>

                </div>

            </div>

        `);

    }


    containers.forEach(container => {

        if (!container) return;

        container.innerHTML =
            accountHTML.join("");

    });


    await updateTotalBalance();

}


/* =========================================================
   ACCOUNT FORM
   ========================================================= */

function openAccountForm(accountId = null) {

    let modal =
        document.getElementById("accountModal");


    if (!modal) {

        modal = document.createElement("div");

        modal.id = "accountModal";

        modal.className = "modal";

        document.body.appendChild(modal);

    }


    modal.classList.remove("hidden");


    loadAccountForm(accountId);
}


async function loadAccountForm(accountId) {

    const modal =
        document.getElementById("accountModal");


    let account = null;


    if (accountId) {
        account = await getAccount(accountId);
    }


    modal.innerHTML = `

        <div
            class="modal-overlay"
            onclick="closeAccountForm()"
        ></div>


        <div class="modal-sheet">

            <div class="modal-header">

                <h2>
                    ${account
                        ? "Edit Rekening"
                        : "Tambah Rekening"}
                </h2>

                <button
                    class="icon-btn"
                    onclick="closeAccountForm()"
                >
                    ✕
                </button>

            </div>


            <form
                id="accountForm"
                class="account-form"
            >

                <input
                    type="hidden"
                    id="accountId"
                    value="${account?.id || ""}"
                >


                <label>
                    Nama Rekening
                </label>

                <input
                    type="text"
                    id="accountName"
                    placeholder="Contoh: BCA"
                    value="${account
                        ? escapeAttribute(account.name)
                        : ""}"
                    required
                >


                <label>
                    Jenis
                </label>

                <select id="accountType">

                    <option
                        value="bank"
                        ${account?.type === "bank"
                            ? "selected"
                            : ""}
                    >
                        🏦 Bank
                    </option>

                    <option
                        value="ewallet"
                        ${account?.type === "ewallet"
                            ? "selected"
                            : ""}
                    >
                        📱 E-Wallet
                    </option>

                    <option
                        value="cash"
                        ${account?.type === "cash"
                            ? "selected"
                            : ""}
                    >
                        💵 Cash
                    </option>

                    <option
                        value="other"
                        ${account?.type === "other"
                            ? "selected"
                            : ""}
                    >
                        💰 Lainnya
                    </option>

                </select>


                <label>
                    Saldo Awal
                </label>

                <input
                    type="number"
                    id="accountInitialBalance"
                    placeholder="0"
                    min="0"
                    step="1"
                    value="${account?.initialBalance || 0}"
                    ${account ? "readonly" : ""}
                >

                ${
                    account
                        ? `
                            <small class="form-help">
                                Saldo awal tidak diubah.
                                Koreksi saldo nanti dilakukan
                                melalui transaksi penyesuaian.
                            </small>
                        `
                        : ""
                }


                <label>
                    Catatan
                </label>

                <textarea
                    id="accountNote"
                    placeholder="Opsional"
                >${account
                    ? escapeHTML(account.note || "")
                    : ""}</textarea>


                <button
                    type="submit"
                    class="primary-btn form-submit"
                >
                    ${account
                        ? "Simpan Perubahan"
                        : "Simpan Rekening"}
                </button>

            </form>

        </div>
    `;


    document
        .getElementById("accountForm")
        .addEventListener(
            "submit",
            handleAccountSubmit
        );
}


async function handleAccountSubmit(event) {

    event.preventDefault();


    const id =
        document.getElementById("accountId").value;


    const name =
        document.getElementById("accountName").value;


    const type =
        document.getElementById("accountType").value;


    const initialBalance =
        document.getElementById(
            "accountInitialBalance"
        ).value;


    const note =
        document.getElementById("accountNote").value;


    try {

        if (id) {

            await updateAccount(id, {
                name,
                type,
                note
            });

        } else {

            await createAccount({
                name,
                type,
                initialBalance,
                note
            });

        }


        closeAccountForm();

        await renderAccounts();

        console.log(
            "Rekening berhasil disimpan."
        );

    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Gagal menyimpan rekening."
        );

    }

}


function closeAccountForm() {

    const modal =
        document.getElementById("accountModal");

    modal?.classList.add("hidden");

}


/* =========================================================
   ACCOUNT MENU
   ========================================================= */

async function openAccountMenu(accountId) {

    const account =
        await getAccount(accountId);


    if (!account) return;


    const balance =
        await calculateAccountBalance(accountId);


    const action =
        prompt(
            `${account.name}\n` +
            `${formatRupiah(balance)}\n\n` +
            `1 = Edit\n` +
            `2 = Nonaktifkan`
        );


    if (action === "1") {

        openAccountForm(accountId);

    }


    if (action === "2") {

        const confirmed =
            confirm(
                `Nonaktifkan rekening "${account.name}"?`
            );


        if (confirmed) {

            await deactivateAccount(accountId);

            await renderAccounts();

        }

    }

}


/* =========================================================
   TOTAL BALANCE UI
   ========================================================= */

async function updateTotalBalance() {

    const element =
        document.getElementById("totalBalance");


    if (!element) return;


    const total =
        await calculateTotalBalance();


    element.textContent =
        formatRupiah(total);


    const status =
        document.getElementById("balanceStatus");


    if (status) {

        const accounts =
            await getActiveAccounts();


        status.textContent =
            accounts.length
                ? `${accounts.length} rekening aktif`
                : "Belum ada rekening";

    }

}


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {

    return escapeHTML(value);
}


/* =========================================================
   ACCOUNT INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await renderAccounts();

        } catch (error) {

            console.error(
                "Account Engine Error:",
                error
            );

        }


        const addButton =
            document.getElementById(
                "addAccountBtn"
            );


        const emptyButton =
            document.getElementById(
                "emptyAddAccountBtn"
            );


        addButton?.addEventListener(
            "click",
            () => openAccountForm()
        );


        emptyButton?.addEventListener(
            "click",
            () => openAccountForm()
        );

    }
);

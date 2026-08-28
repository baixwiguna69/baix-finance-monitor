/* =========================================================
   BAIX FINANCE MONITOR
   Transaction Engine
   ========================================================= */


/* =========================================================
   CONSTANTS
   ========================================================= */

const TRANSACTION_TYPES = {
    INCOME: "income",
    EXPENSE: "expense",
    TRANSFER: "transfer",
    SAVING: "saving"
};


const PAYMENT_METHODS = {
    CASH: "cash",
    QRIS: "qris",
    MBANKING: "mbanking",
    VA: "va",
    TRANSFER: "transfer",
    OTHER: "other"
};


const PAYMENT_METHOD_LABELS = {
    cash: "Tunai",
    qris: "QRIS",
    mbanking: "M-Banking",
    va: "Virtual Account",
    transfer: "Transfer",
    other: "Lainnya"
};


/* =========================================================
   TRANSACTION CRUD
   ========================================================= */

async function createIncome({
    amount,
    category = "Pemasukan",
    accountId,
    date,
    note = ""
}) {

    validateAmount(amount);

    await validateAccount(accountId);

    const transaction = {
        id: generateId("trx"),

        type: TRANSACTION_TYPES.INCOME,

        amount: Number(amount),

        categoryId: category,

        accountId,

        paymentMethod: null,

        date: date || getToday(),

        note: note.trim(),

        status: "completed",

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString()
    };

    await addData(
        "transactions",
        transaction
    );

    return transaction;
}


async function createExpense({
    amount,
    category = "Pengeluaran",
    accountId,
    paymentMethod,
    date,
    note = ""
}) {

    validateAmount(amount);

    await validateAccount(accountId);

    if (!paymentMethod) {
        throw new Error(
            "Metode pembayaran wajib dipilih."
        );
    }


    /*
     * Cek saldo sebelum pengeluaran.
     */

    const balance =
        await calculateAccountBalance(accountId);


    if (Number(amount) > balance) {

        throw new Error(
            `Saldo tidak cukup.\n\n` +
            `Saldo tersedia: ${formatRupiah(balance)}`
        );
    }


    const transaction = {
        id: generateId("trx"),

        type: TRANSACTION_TYPES.EXPENSE,

        amount: Number(amount),

        categoryId: category,

        accountId,

        paymentMethod,

        date: date || getToday(),

        note: note.trim(),

        status: "completed",

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString()
    };


    await addData(
        "transactions",
        transaction
    );

    return transaction;
}


async function createTransfer({
    amount,
    fromAccountId,
    toAccountId,
    date,
    note = ""
}) {

    validateAmount(amount);


    if (!fromAccountId) {
        throw new Error(
            "Rekening asal wajib dipilih."
        );
    }


    if (!toAccountId) {
        throw new Error(
            "Rekening tujuan wajib dipilih."
        );
    }


    if (fromAccountId === toAccountId) {
        throw new Error(
            "Rekening asal dan tujuan tidak boleh sama."
        );
    }


    await validateAccount(fromAccountId);

    await validateAccount(toAccountId);


    const balance =
        await calculateAccountBalance(
            fromAccountId
        );


    if (Number(amount) > balance) {

        throw new Error(
            `Saldo tidak cukup.\n\n` +
            `Saldo tersedia: ${formatRupiah(balance)}`
        );
    }


    const transaction = {

        id: generateId("trx"),

        type: TRANSACTION_TYPES.TRANSFER,

        amount: Number(amount),

        categoryId: null,

        accountId: null,

        fromAccountId,

        toAccountId,

        paymentMethod: null,

        date: date || getToday(),

        note: note.trim(),

        status: "completed",

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString()
    };


    await addData(
        "transactions",
        transaction
    );


    return transaction;
}


/* =========================================================
   GET TRANSACTIONS
   ========================================================= */

async function getTransactions() {

    return await getAllData(
        "transactions"
    );
}


async function getCompletedTransactions() {

    const transactions =
        await getTransactions();

    return transactions.filter(
        transaction =>
            transaction.status !== "cancelled"
    );
}


async function getTransaction(transactionId) {

    return await getData(
        "transactions",
        transactionId
    );
}


/* =========================================================
   CANCEL TRANSACTION
   =========================================================
   
   Jangan hapus transaksi secara permanen.
   Kita pertahankan histori dan ubah status menjadi cancelled.
   ========================================================= */

async function cancelTransaction(
    transactionId
) {

    const transaction =
        await getTransaction(transactionId);


    if (!transaction) {

        throw new Error(
            "Transaksi tidak ditemukan."
        );
    }


    if (transaction.status === "cancelled") {

        throw new Error(
            "Transaksi sudah dibatalkan."
        );
    }


    transaction.status = "cancelled";

    transaction.updatedAt =
        new Date().toISOString();


    await putData(
        "transactions",
        transaction
    );


    return transaction;
}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateAmount(amount) {

    const value = Number(amount);


    if (!Number.isFinite(value)) {

        throw new Error(
            "Nominal transaksi tidak valid."
        );
    }


    if (value <= 0) {

        throw new Error(
            "Nominal harus lebih dari Rp0."
        );
    }
}


async function validateAccount(accountId) {

    if (!accountId) {

        throw new Error(
            "Rekening wajib dipilih."
        );
    }


    const account =
        await getAccount(accountId);


    if (!account) {

        throw new Error(
            "Rekening tidak ditemukan."
        );
    }


    if (account.isActive === false) {

        throw new Error(
            "Rekening tersebut sudah tidak aktif."
        );
    }


    return account;
}


/* =========================================================
   DATE
   ========================================================= */

function getToday() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");


    return `${year}-${month}-${day}`;
}


/* =========================================================
   TRANSACTION FORM
   ========================================================= */

async function openTransactionForm(
    type = "expense"
) {

    const accounts =
        await getActiveAccounts();


    if (!accounts.length) {

        alert(
            "Tambahkan rekening terlebih dahulu."
        );

        return;
    }


    let modal =
        document.getElementById(
            "transactionModal"
        );


    if (!modal) {

        modal =
            document.createElement("div");

        modal.id =
            "transactionModal";

        modal.className =
            "modal";

        document.body.appendChild(
            modal
        );
    }


    modal.classList.remove(
        "hidden"
    );


    renderTransactionForm(
        type,
        accounts
    );
}


/* =========================================================
   RENDER FORM
   ========================================================= */

function renderTransactionForm(
    type,
    accounts
) {

    const modal =
        document.getElementById(
            "transactionModal"
        );


    const title =
        type === "income"
            ? "Tambah Pemasukan"
            : type === "expense"
                ? "Tambah Pengeluaran"
                : "Transfer Antar Rekening";


    const isTransfer =
        type === "transfer";


    const accountOptions =
        accounts.map(account => `

            <option value="${account.id}">
                ${getAccountIcon(account.type)}
                ${escapeHTML(account.name)}
            </option>

        `).join("");


    modal.innerHTML = `

        <div
            class="modal-overlay"
            onclick="closeTransactionForm()"
        ></div>


        <div class="modal-sheet">

            <div class="modal-header">

                <h2>${title}</h2>

                <button
                    class="icon-btn"
                    onclick="closeTransactionForm()"
                >
                    ✕
                </button>

            </div>


            <form
                id="transactionForm"
                class="transaction-form"
                data-type="${type}"
            >

                <!-- NOMINAL -->

                <label>
                    Nominal
                </label>

                <input
                    type="number"
                    id="transactionAmount"
                    placeholder="0"
                    min="1"
                    step="1"
                    inputmode="numeric"
                    required
                >


                ${
                    isTransfer
                        ? `

                            <!-- REKENING ASAL -->

                            <label>
                                Dari Rekening
                            </label>

                            <select
                                id="fromAccountId"
                                required
                            >

                                <option value="">
                                    Pilih rekening asal
                                </option>

                                ${accountOptions}

                            </select>


                            <!-- REKENING TUJUAN -->

                            <label>
                                Ke Rekening
                            </label>

                            <select
                                id="toAccountId"
                                required
                            >

                                <option value="">
                                    Pilih rekening tujuan
                                </option>

                                ${accountOptions}

                            </select>

                        `
                        : `

                            <!-- KATEGORI -->

                            <label>
                                Kategori
                            </label>

                            <input
                                type="text"
                                id="transactionCategory"
                                placeholder="${
                                    type === "income"
                                        ? "Contoh: Gaji"
                                        : "Contoh: Makanan"
                                }"
                                required
                            >


                            <!-- REKENING -->

                            <label>
                                ${
                                    type === "income"
                                        ? "Masuk ke"
                                        : "Bayar dari"
                                }
                            </label>

                            <select
                                id="transactionAccountId"
                                required
                            >

                                <option value="">
                                    Pilih rekening
                                </option>

                                ${accountOptions}

                            </select>


                            <!-- METODE PEMBAYARAN -->

                            <label>
                                Metode Pembayaran
                            </label>

                            <select
                                id="paymentMethod"
                                required
                            >

                                <option value="">
                                    Pilih metode
                                </option>

                                ${Object.entries(
                                    PAYMENT_METHOD_LABELS
                                ).map(
                                    ([value, label]) => `
                                        <option
                                            value="${value}"
                                        >
                                            ${label}
                                        </option>
                                    `
                                ).join("")}

                            </select>

                        `
                }


                <!-- TANGGAL -->

                <label>
                    Tanggal
                </label>

                <input
                    type="date"
                    id="transactionDate"
                    value="${getToday()}"
                    required
                >


                <!-- CATATAN -->

                <label>
                    Catatan
                </label>

                <textarea
                    id="transactionNote"
                    placeholder="Opsional"
                ></textarea>


                <button
                    type="submit"
                    class="primary-btn form-submit"
                >
                    ${
                        type === "income"
                            ? "Simpan Pemasukan"
                            : type === "expense"
                                ? "Simpan Pengeluaran"
                                : "Transfer Sekarang"
                    }
                </button>

            </form>

        </div>
    `;


    document
        .getElementById(
            "transactionForm"
        )
        .addEventListener(
            "submit",
            handleTransactionSubmit
        );
}


/* =========================================================
   SUBMIT TRANSACTION
   ========================================================= */

async function handleTransactionSubmit(
    event
) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const type =
        form.dataset.type;


    const amount =
        document.getElementById(
            "transactionAmount"
        ).value;


    const date =
        document.getElementById(
            "transactionDate"
        ).value;


    const note =
        document.getElementById(
            "transactionNote"
        ).value;


    try {

        if (type === "income") {

            const category =
                document.getElementById(
                    "transactionCategory"
                ).value;


            const accountId =
                document.getElementById(
                    "transactionAccountId"
                ).value;


            await createIncome({

                amount,

                category,

                accountId,

                date,

                note

            });

        }


        else if (type === "expense") {

            const category =
                document.getElementById(
                    "transactionCategory"
                ).value;


            const accountId =
                document.getElementById(
                    "transactionAccountId"
                ).value;


            const paymentMethod =
                document.getElementById(
                    "paymentMethod"
                ).value;


            await createExpense({

                amount,

                category,

                accountId,

                paymentMethod,

                date,

                note

            });

        }


        else if (type === "transfer") {

            const fromAccountId =
                document.getElementById(
                    "fromAccountId"
                ).value;


            const toAccountId =
                document.getElementById(
                    "toAccountId"
                ).value;


            await createTransfer({

                amount,

                fromAccountId,

                toAccountId,

                date,

                note

            });

        }


        closeTransactionForm();


        await refreshFinancialUI();


        console.log(
            "Transaksi berhasil disimpan."
        );


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Gagal menyimpan transaksi."
        );

    }

}


/* =========================================================
   CLOSE FORM
   ========================================================= */

function closeTransactionForm() {

    const modal =
        document.getElementById(
            "transactionModal"
        );


    modal?.classList.add(
        "hidden"
    );
}


/* =========================================================
   TRANSACTION UI
   ========================================================= */

async function renderRecentTransactions() {

    const container =
        document.getElementById(
            "recentTransactions"
        );


    if (!container) return;


    const transactions =
        await getCompletedTransactions();


    transactions.sort(
        (a, b) =>
            new Date(
                b.createdAt
            ) -
            new Date(
                a.createdAt
            )
    );


    const recent =
        transactions.slice(0, 5);


    if (!recent.length) {

        container.innerHTML = `

            <div class="empty-state small">

                <div class="empty-icon">
                    🧾
                </div>

                <p>
                    Belum ada transaksi.
                </p>

            </div>

        `;

        return;
    }


    const accounts =
        await getAccounts();


    container.innerHTML =
        recent.map(
            transaction => {

                const account =
                    accounts.find(
                        account =>
                            account.id ===
                            transaction.accountId
                    );


                let icon = "🧾";

                let sign = "";


                if (
                    transaction.type ===
                    "income"
                ) {

                    icon = "↗";

                    sign = "+";

                }


                if (
                    transaction.type ===
                    "expense"
                ) {

                    icon = "↘";

                    sign = "-";

                }


                if (
                    transaction.type ===
                    "transfer"
                ) {

                    icon = "⇄";

                }


                const displayAccount =
                    transaction.type ===
                    "transfer"

                        ? getTransferAccountName(
                            transaction,
                            accounts
                        )

                        : (
                            account
                                ? account.name
                                : "Rekening"
                        );


                return `

                    <div class="transaction-card">

                        <div class="transaction-icon">
                            ${icon}
                        </div>

                        <div class="transaction-info">

                            <strong>
                                ${escapeHTML(
                                    transaction.category ||
                                    getTransactionLabel(
                                        transaction
                                    )
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    displayAccount
                                )}
                                ${
                                    transaction.paymentMethod
                                        ? " • " +
                                          PAYMENT_METHOD_LABELS[
                                              transaction.paymentMethod
                                          ]
                                        : ""
                                }
                            </small>

                        </div>

                        <div class="transaction-amount">

                            <strong
                                class="${
                                    transaction.type ===
                                    "income"
                                        ? "positive"
                                        : transaction.type ===
                                          "expense"
                                            ? "negative"
                                            : ""
                                }"
                            >
                                ${sign}
                                ${formatRupiah(
                                    transaction.amount
                                )}
                            </strong>

                        </div>

                    </div>

                `;
            }
        ).join("");
}


function getTransactionLabel(
    transaction
) {

    switch (transaction.type) {

        case "income":
            return "Pemasukan";

        case "expense":
            return "Pengeluaran";

        case "transfer":
            return "Transfer";

        case "saving":
            return "Tabungan";

        default:
            return "Transaksi";
    }
}


function getTransferAccountName(
    transaction,
    accounts
) {

    const from =
        accounts.find(
            account =>
                account.id ===
                transaction.fromAccountId
        );


    const to =
        accounts.find(
            account =>
                account.id ===
                transaction.toAccountId
        );


    return `${from?.name || "?"} → ${to?.name || "?"}`;
}


/* =========================================================
   FINANCIAL UI REFRESH
   ========================================================= */

async function refreshFinancialUI() {

    if (
        typeof renderAccounts ===
        "function"
    ) {

        await renderAccounts();

    }


    if (
        typeof renderRecentTransactions ===
        "function"
    ) {

        await renderRecentTransactions();

    }


    if (
        typeof updateTotalBalance ===
        "function"
    ) {

        await updateTotalBalance();

    }

}


/* =========================================================
   QUICK ACTION CONNECTION
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        const actionButton =
            event.target.closest(
                ".quick-action"
            );


        if (!actionButton) {
            return;
        }


        const action =
            actionButton.dataset.action;


        if (
            action === "income" ||
            action === "expense" ||
            action === "transfer"
        ) {

            openTransactionForm(
                action
            );

        }

    }
);

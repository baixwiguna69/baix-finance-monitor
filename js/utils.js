/* =========================================================
   BAIX FINANCE MONITOR
   Utility Functions
   ========================================================= */

function formatRupiah(amount) {

    const number =
        Number(amount) || 0;

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    ).format(number);
}


function formatNumber(amount) {

    return new Intl.NumberFormat(
        "id-ID"
    ).format(Number(amount) || 0);
}

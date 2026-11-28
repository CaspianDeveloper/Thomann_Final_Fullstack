function Pagination({ page, totalPages, onChange }) {
    if (!totalPages || totalPages <= 1) return null;

    // 1 ... 4 5 6 ... 8 şəklində pəncərə
    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
        else if (pages[pages.length - 1] !== "...") pages.push("...");
    };

    const base = 
        "min-w-12 px-4 py-2 rounded-full font-bold text-2xl transition-all duration-300 cursor-pointer";
    const idle = 
        "bg-gray-200 hover:bg-[#7e00f3] hover:text-white dark:bg-gray-800 dark:text-[#01b4bc] dark:hover:bg-[#01b4bc] dark:hover:text-gray-800";
    const active = "bg-[#7e00f3] text-white dark:bg-[#01b4bc] dark:text-gray-800";

    return (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2 py-5 dark:bg-gray-900">
            <button className={`${base} ${idle} disabled:opacity-40 disabled:cursor-not-allowed`} disabled={page <= 1} onClick={() => onChange(page - 1)}>
                Prev
            </button>
            {pages.map((p , i) => 
                p === "..." ? (
                    <span key={`dots-${i}`} className="px-2 dark:text-[#01b4bc]">...</span>
                ) :  (
                    <button key={p} className={`${base} ${p === page ? active : idle}`} onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined}>
                        {p}
                    </button>  
                ) 
            )}
            <button className={`${base} ${idle} disabled:opacity-40 disabled:cursor-not-allowed`} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
                Next
            </button>
        </nav>
    )
};

export default Pagination;
type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">

      {/* Left Section */}
      <div className="flex min-w-0 items-center gap-3">

        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="
            flex h-9 w-9 shrink-0 items-center justify-center
            rounded-lg border border-slate-200
            bg-white text-slate-600
            transition
            hover:bg-blue-50 hover:text-blue-600
            active:scale-95
            lg:hidden
          "
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        </button>

        {/* Page Title */}
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-800 sm:text-lg">
            Admin Dashboard
          </h2>

          <p className="truncate text-[11px] text-slate-500 sm:text-xs">
            Production Monitoring System
          </p>
        </div>

      </div>

      {/* User */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">
            Administrator
          </p>

          <p className="text-xs text-slate-500">
            ADMIN
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-600/20">
          A
        </div>

      </div>

    </header>
  );
}
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="w-full border-t border-[#e7dfd7] bg-[#f5f3f1]">
      <div className="flex w-full items-end justify-between px-8 py-8 text-sm text-slate-500 lg:px-12">
        <div className="shrink-0">
          <p className="text-base font-semibold text-slate-800">CRETE Solutions</p>
          <p className="mt-2 max-w-md leading-6">
            A simpler way to connect people with reliable home help.
          </p>
          <p className="mt-4 text-xs">© {new Date().getFullYear()} CRETE Solutions</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-5 text-sm">
          <Link to="/about" className="transition hover:text-[#7b2e2f] whitespace-nowrap">
            About
          </Link>
          <Link to="/categories" className="transition hover:text-[#7b2e2f] whitespace-nowrap">
            Categories
          </Link>
          <Link to="/contact" className="transition hover:text-[#7b2e2f] whitespace-nowrap">
            Help
          </Link>
          <Link to="/register" className="transition hover:text-[#7b2e2f] whitespace-nowrap">
            Become a Tasker
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-12 border-t border-[#e7dfd7] bg-[#f6f4f2]">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8 py-6 text-[11px] text-slate-500">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">CRETE Solutions</p>
            <p className="mt-1 max-w-md">
              A simpler way to connect people with reliable home help.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-[11px]">
            <Link to="/about" className="hover:text-[#7b2e2f] transition-colors">
              About
            </Link>
            <Link
              to="/categories"
              className="hover:text-[#7b2e2f] transition-colors"
            >
              Categories
            </Link>
            <Link to="/contact" className="hover:text-[#7b2e2f] transition-colors">
              Help
            </Link>
            <Link
              to="/register"
              className="hover:text-[#7b2e2f] transition-colors"
            >
              Become a Tasker
            </Link>
          </div>
        </div>

        <p className="mt-4">© {new Date().getFullYear()} CRETE Solutions</p>
      </div>
    </footer>
  );
}

export default Footer;

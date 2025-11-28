import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-10 border-t border-neutral-200 pt-6 pb-8 text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800 text-sm">
            CRETE Handyman
          </p>
          <p className="mt-1">
            A smarter way to match clients with trusted Taskers.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link to="/about" className="hover:text-[#E65A5A]">
            About
          </Link>
          <Link to="/register" className="hover:text-[#E65A5A]">
            Become a Tasker
          </Link>
          <Link to="/categories" className="hover:text-[#E65A5A]">
            Categories
          </Link>
          <Link to="/contact" className="hover:text-[#E65A5A]">
            Help &amp; Support
          </Link>
        </div>
      </div>

      <p className="mt-4 text-[11px]">
        © {new Date().getFullYear()} CRETE. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;

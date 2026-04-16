import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = ({ items }) => {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
      <Link to="/" className="hover:text-slate-700 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          {item.href ? (
            <Link to={item.href} className="hover:text-slate-700 transition-colors">{item.label}</Link>
          ) : (
            <span className="text-slate-800 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumb;

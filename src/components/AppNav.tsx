import { NavLink } from "react-router";

export function AppNav() {
  return (
    <nav className="fixed top-6 right-8 flex gap-6 bg-white/90 backdrop-blur px-6 py-3 rounded-xl shadow-lg z-50">
      <NavLink
        to="/table"
        end
        className={({ isActive }) =>
          `text-lg font-semibold transition-colors ${
            isActive ? "text-blue-600 underline" : "text-gray-800 hover:text-blue-500"
          }`
        }
      >
        Home
      </NavLink>

      <NavLink
        to="/diagram"
        className={({ isActive }) =>
          `text-lg font-semibold transition-colors ${
            isActive ? "text-blue-600 underline" : "text-gray-800 hover:text-blue-500"
          }`
        }
      >
        Diagram
      </NavLink>

      <NavLink
        to="/demo"
        end
        className={({ isActive }) =>
          `text-lg font-semibold transition-colors ${
            isActive ? "text-blue-600 underline" : "text-gray-800 hover:text-blue-500"
          }`
        }
      >
        demo
      </NavLink>
      <NavLink
        to="/fta"
        end
        className={({ isActive }) =>
          `text-lg font-semibold transition-colors ${
            isActive ? "text-blue-600 underline" : "text-gray-800 hover:text-blue-500"
          }`
        }
      >
        FTA
      </NavLink>
    </nav>
  );
}
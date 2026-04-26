import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

const baseNavigation = [
  { label: "Home", to: "/" },
  { label: "Cart", to: "/cart" },
  { label: "Checkout", to: "/checkout" },
];

function navClassName({ isActive }) {
  return [
    "rounded-full px-4 py-2 text-sm font-semibold transition duration-200",
    isActive ? "bg-ink text-white" : "text-ink hover:bg-white/70",
  ].join(" ");
}

export default function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = useCart();
  const { isAuthenticated, logout, user } = useAuth();
  const navigation = user?.isAdmin
    ? [...baseNavigation, { label: "Admin", to: "/admin" }]
    : baseNavigation;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-12 top-10 h-44 w-44 rounded-full bg-aqua/20 blur-3xl animate-float" />
        <div className="absolute right-0 top-24 h-56 w-56 rounded-full bg-brand/20 blur-3xl animate-float" />
        <div className="absolute bottom-12 left-1/3 h-40 w-40 rounded-full bg-white/70 blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-40 border-b border-white/50 bg-white/60 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <Link className="flex items-center gap-4" to="/">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-lg font-bold text-white">
                  WC
                </div>
                <div>
                  <p className="font-heading text-lg font-bold text-ink">Wholesale Current</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Faster bulk buying
                  </p>
                </div>
              </Link>

              <nav className="hidden items-center gap-2 md:flex">
                {navigation.map((item) => (
                  <NavLink className={navClassName} key={item.to} to={item.to}>
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="hidden items-center gap-3 md:flex">
                <Link className="btn-ghost" to="/cart">
                  Cart
                  <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-xs text-white">
                    {cart.totalItems}
                  </span>
                </Link>

                {isAuthenticated ? (
                  <>
                    <div className="panel-muted px-4 py-2">
                      <p className="text-sm font-semibold text-ink">{user.mobileNumber}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        {user.isAdmin
                          ? "Admin access active"
                          : user.isTrusted
                            ? "Trusted buyer"
                            : "Pay now enabled"}
                      </p>
                    </div>
                    <button className="btn-secondary" onClick={handleLogout} type="button">
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link className="btn-ghost" to="/login">
                      Login
                    </Link>
                    <Link className="btn-primary" to="/register">
                      Register
                    </Link>
                  </>
                )}
              </div>

              <button
                className="btn-ghost md:hidden"
                onClick={() => setIsMenuOpen((open) => !open)}
                type="button"
              >
                {isMenuOpen ? "Close" : "Menu"}
              </button>
            </div>

            {isMenuOpen ? (
              <div className="space-y-4 border-t border-white/50 pb-5 pt-4 md:hidden">
                <div className="grid gap-2">
                  {navigation.map((item) => (
                    <NavLink className={navClassName} key={item.to} to={item.to}>
                      {item.label}
                    </NavLink>
                  ))}
                </div>

                {isAuthenticated ? (
                  <div className="panel-muted flex flex-col gap-3 px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-ink">{user.mobileNumber}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {user.isAdmin
                          ? "Admin access active"
                          : user.isTrusted
                            ? "Trusted buyer"
                            : "Pay now enabled"}
                      </p>
                    </div>
                    <button className="btn-secondary w-full" onClick={handleLogout} type="button">
                      Log out
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <Link className="btn-secondary w-full" to="/login">
                      Login
                    </Link>
                    <Link className="btn-primary w-full" to="/register">
                      Register
                    </Link>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-white/50 bg-white/40">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-slate-600 sm:px-6 md:grid-cols-2 lg:px-8">
            <div>
              <p className="font-heading text-lg font-bold text-ink">Wholesale Current</p>
              <p className="mt-2 max-w-md leading-7">
                Responsive ordering for water bottles, beverages, and fast-moving inventory with
                clear stock visibility from browsing to checkout.
              </p>
            </div>
            <div className="md:text-right">
              <p className="font-semibold text-ink">Built for store owners on the move</p>
              <p className="mt-2 leading-7">
                Mobile-first browsing, cart management, and checkout tuned for phone, tablet, and
                desktop screens.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

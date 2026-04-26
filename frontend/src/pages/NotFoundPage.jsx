import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="panel p-8 text-center sm:p-12">
      <span className="badge-ink">404</span>
      <h1 className="mt-4 text-4xl font-bold text-ink">This page drifted off route.</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
        Head back to the product catalog and keep the wholesale flow moving.
      </p>
      <Link className="btn-primary mt-6" to="/">
        Return home
      </Link>
    </section>
  );
}

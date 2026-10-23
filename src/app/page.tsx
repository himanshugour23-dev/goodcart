"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Offer = {
  id: string;
  title: string;
  description: string | null;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  supermarketId: string;
  supermarketName: string;
  city: string;
};

type OfferReply = {
  offers: Offer[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function endDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function Home() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [search, setSearch] = useState({ q: "", city: "" });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const loadOffers = useCallback(async () => {
    setBusy(true);
    setError("");

    const params = new URLSearchParams();
    if (search.q) params.set("q", search.q);
    if (search.city) params.set("city", search.city);
    params.set("page", String(page));

    try {
      const res = await fetch(`/api/offers?${params.toString()}`, { cache: "no-store" });
      const data = (await res.json()) as OfferReply | { error?: string };

      if (!res.ok || !("offers" in data)) {
        throw new Error("error" in data ? data.error : "Could not load offers.");
      }

      setOffers(data.offers);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load offers.");
      setOffers([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setBusy(false);
    }
  }, [search, page]);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch({ q: q.trim(), city: city.trim() });
  }

  function clearSearch() {
    setQ("");
    setCity("");
    setPage(1);
    setSearch({ q: "", city: "" });
  }

  return (
    <main>
      <nav className="nav wrap">
        <a className="brand" href="/" aria-label="GoodCart home">
          <span className="brand-mark">g</span>
          <span>goodcart</span>
        </a>
        <span className="nav-note">LOCAL DEALS, LESS HASSLE</span>
      </nav>

      <section className="hero">
        <div className="wrap hero-inner">
          <div className="eyebrow"><span className="eyebrow-dot" /> THE GOOD STUFF, ON SALE</div>
          <h1>Good deals.<br /><em>Right around</em> the corner.</h1>
          <p className="hero-copy">Find the offers worth leaving the house for. All in one place, from supermarkets in your city.</p>

          <form className="search-box" onSubmit={submitSearch}>
            <label className="search-field">
              <span className="field-icon" aria-hidden="true">⌕</span>
              <span className="sr-only">Search offers</span>
              <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="What are you looking for?" />
            </label>
            <span className="search-divider" />
            <label className="city-field">
              <span className="pin" aria-hidden="true">⌖</span>
              <span className="sr-only">City</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Your city" />
            </label>
            <button className="search-button" type="submit">Find offers <span aria-hidden="true">↗</span></button>
          </form>
          <p className="search-hint">Try “coffee”, “rice”, or your neighbourhood.</p>
        </div>
        <div className="hero-stamp" aria-hidden="true"><span>smart</span><strong>shop</strong><span>local</span></div>
      </section>

      <section className="wrap offers-section">
        <div className="section-head">
          <div>
            <p className="section-kicker">FRESH FROM YOUR STORES</p>
            <h2>Offers worth a look <span>✳</span></h2>
          </div>
          <span className="offer-count">{busy ? "Checking…" : `${total} ${total === 1 ? "offer" : "offers"}`}</span>
        </div>

        {error ? (
          <div className="state-box error-box">
            <strong>We couldn’t load the offers.</strong>
            <p>{error}</p>
            <button className="text-button" onClick={() => void loadOffers()}>Try again ↗</button>
          </div>
        ) : busy ? (
          <div className="offer-grid" aria-label="Loading offers">
            {[1, 2, 3].map((item) => <div className="skeleton" key={item} />)}
          </div>
        ) : offers.length === 0 ? (
          <div className="state-box">
            <div className="empty-icon">＋</div>
            <h3>No offers just yet</h3>
            <p>Try another search or clear the filters. New deals will show up here.</p>
            {(search.q || search.city) && <button className="text-button" onClick={clearSearch}>Clear filters ↗</button>}
          </div>
        ) : (
          <div className="offer-grid">
            {offers.map((offer, index) => (
              <article className={`offer-card card-${index % 3}`} key={offer.id}>
                <div className="card-top">
                  <span className="offer-tag">LOCAL OFFER</span>
                  <span className="discount"><strong>{offer.discountPercent}%</strong><small>OFF</small></span>
                </div>
                <div className="card-copy">
                  <p className="store-name"><span className="store-dot" /> {offer.supermarketName}</p>
                  <h3>{offer.title}</h3>
                  <p className="offer-description">{offer.description || "A little saving on your next shop."}</p>
                </div>
                <div className="card-bottom">
                  <span className="offer-city">⌖ {offer.city}</span>
                  <span className="expiry">Until {endDate(offer.endsAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}

        {!busy && !error && totalPages > 1 && (
          <div className="pagination">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>← Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>Next →</button>
          </div>
        )}
      </section>

      <footer className="wrap footer">
        <a className="brand footer-brand" href="/">
          <span className="brand-mark">g</span><span>goodcart</span>
        </a>
        <span>Good finds for everyday life.</span>
        <span className="footer-small">Built for local shopping.</span>
      </footer>
    </main>
  );
}

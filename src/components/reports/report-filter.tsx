import { SORT_OPTIONS } from "@/lib/constants";
import type { OptionRow } from "@/types/app";

type Props = {
  categories: OptionRow[];
  defaultSearch?: string;
  defaultCategory?: string;
  defaultSort?: string;
  defaultOrder?: string;
};

export function ReportFilter({
  categories,
  defaultSearch = "",
  defaultCategory = "",
  defaultSort = "created_at",
  defaultOrder = "desc"
}: Props) {
  return (
    <form className="search-row">
      <input
        className="search-input"
        type="search"
        name="q"
        placeholder="Cari laporan"
        defaultValue={defaultSearch}
      />

      <details className="filter-wrap">
        <summary className="filter-button" aria-label="Filter laporan">
          ⚙
        </summary>
        <div className="filter-panel">
          <label>
            <div className="label">Kategori</div>
            <select className="select" name="category" defaultValue={defaultCategory}>
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div className="label">Sort</div>
            <select className="select" name="sort" defaultValue={defaultSort}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div className="label">Urutan</div>
            <select className="select" name="order" defaultValue={defaultOrder}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>

          <button type="submit" className="btn primary">
            Terapkan
          </button>
        </div>
      </details>
    </form>
  );
}

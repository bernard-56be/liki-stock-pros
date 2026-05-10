'use client';

import { useState } from 'react';
import { Button } from '../ui/button';

interface Filters {
  category: string;
  showLowStock: boolean;
}

interface ProductFiltersProps {
  categories: string[];
  onFilterChange: (filters: Filters) => void;
}

export const ProductFilters = ({ categories, onFilterChange }: ProductFiltersProps) => {
  const [category, setCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const applyFilters = () => {
    onFilterChange({ category, showLowStock });
  };

  const resetFilters = () => {
    setCategory('');
    setShowLowStock(false);
    onFilterChange({ category: '', showLowStock: false });
  };

  return (
    <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-lg shadow">
      <div className="w-48">
        <label htmlFor="category-select" className="block text-sm font-medium text-gray-700">Catégorie</label>
        <select
          id="category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Toutes</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showLowStock}
          onChange={(e) => setShowLowStock(e.target.checked)}
          className="h-4 w-4 text-blue-600"
        />
        <span className="text-sm">Stock critique (≤ 5)</span>
      </label>

      <Button onClick={applyFilters}>Appliquer</Button>
      <Button variant="outline" onClick={resetFilters}>Réinitialiser</Button>
    </div>
  );
};
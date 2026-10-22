"use client";

import { useCallback, useEffect, useState } from "react";
import ProductForm from "@/components/admin/ProductForm";
import ProductList from "@/components/admin/ProductList";

export type Product = {
  id: number;

  productCode: string;
  productName: string;
  description: string | null;

  isActive: boolean;

  shotWeight: number | null;
  shotWeightUnit: string | null;

  quantityUnit: string | null;

  productionTarget8H: number | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] =
    useState(true);

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);

      const response = await fetch(
        "/api/products",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Gagal mengambil data product"
        );
      }

      setProducts(
        Array.isArray(data.products)
          ? data.products
          : []
      );
    } catch (error) {
      console.error(
        "Load products error:",
        error
      );

      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <div>
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Master Product
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Kelola data product produksi
        </p>
      </div>

      {/* =================================================
          CREATE PRODUCT
      ================================================= */}

      <div className="mb-8">
        <ProductForm />
      </div>

      {/* =================================================
          PRODUCT LIST
      ================================================= */}

      <ProductList
        products={products}
        loading={loadingProducts}
        onRefresh={loadProducts}
      />
    </div>
  );
}
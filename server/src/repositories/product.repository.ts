import { query } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { Product, CreateProductInput, UpdateProductInput } from '../types/product.types';

// In-memory fallback store with seeded sample products
const memoryProducts: Product[] = [
  {
    id: 1,
    product_code: 'PRD-101',
    name: 'زيت عباد الشمس النقي 1 لتر',
    description: 'عبوة زيت عباد الشمس نقية عالية الجودة كرتونة 12 زجاجة',
    unit: 'كرتونة',
    purchase_price: 620.0,
    selling_price: 710.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    product_code: 'PRD-102',
    name: 'أرز أبيض فاخر عريض الحبة 5 كجم',
    description: 'أرز مصري منقى ومعبأ آلياً درجة أولى',
    unit: 'شيكارة',
    purchase_price: 165.0,
    selling_price: 195.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    product_code: 'PRD-103',
    name: 'سكر أبيض ناعم مكرر 1 كجم',
    description: 'سكر بلوري نقي مخصص لمنافذ التوزيع باكت 10 كجم',
    unit: 'باكت',
    purchase_price: 280.0,
    selling_price: 320.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    product_code: 'PRD-104',
    name: 'مكرونة فرن ممتازة 400 جم',
    description: 'مكرونة مصنوعة من سميد القمح الفاخر كرتونة 20 كيس',
    unit: 'كرتونة',
    purchase_price: 190.0,
    selling_price: 230.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export class ProductRepository {
  async findAll(search?: string, activeOnly?: boolean): Promise<Product[]> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        let sql = `SELECT * FROM products WHERE 1=1`;
        const params: unknown[] = [];
        let pIndex = 1;

        if (search) {
          sql += ` AND (LOWER(name) LIKE $${pIndex} OR LOWER(product_code) LIKE $${pIndex})`;
          params.push(`%${search.toLowerCase()}%`);
          pIndex++;
        }

        if (activeOnly) {
          sql += ` AND is_active = TRUE`;
        }

        sql += ` ORDER BY created_at DESC;`;
        const result = await query<Product>(sql, params);
        return result.rows;
      } catch (err) {
        // Fallback to memory
      }
    }

    return memoryProducts.filter((p) => {
      if (search) {
        const s = search.toLowerCase();
        const match = p.name.toLowerCase().includes(s) || p.product_code.toLowerCase().includes(s);
        if (!match) return false;
      }
      if (activeOnly && !p.is_active) return false;
      return true;
    });
  }

  async findById(id: number): Promise<Product | null> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `SELECT * FROM products WHERE id = $1 LIMIT 1;`;
        const result = await query<Product>(sql, [id]);
        return result.rows[0] || null;
      } catch (err) {
        // Fallback to memory
      }
    }

    const p = memoryProducts.find((item) => item.id === id);
    return p ? { ...p } : null;
  }

  async findByCode(code: string): Promise<Product | null> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `SELECT * FROM products WHERE LOWER(product_code) = $1 LIMIT 1;`;
        const result = await query<Product>(sql, [code.trim().toLowerCase()]);
        return result.rows[0] || null;
      } catch (err) {
        // Fallback to memory
      }
    }

    const p = memoryProducts.find((item) => item.product_code.toLowerCase() === code.trim().toLowerCase());
    return p ? { ...p } : null;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const now = new Date().toISOString();
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          INSERT INTO products (product_code, name, description, unit, purchase_price, selling_price, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;
        const result = await query<Product>(sql, [
          input.product_code.trim().toUpperCase(),
          input.name.trim(),
          input.description || null,
          input.unit || 'قطعة',
          input.purchase_price,
          input.selling_price,
          input.is_active !== undefined ? input.is_active : true,
        ]);
        return result.rows[0];
      } catch (err) {
        // Fallback to memory
      }
    }

    const newProd: Product = {
      id: memoryProducts.length + 1,
      product_code: input.product_code.trim().toUpperCase(),
      name: input.name.trim(),
      description: input.description || null,
      unit: input.unit || 'قطعة',
      purchase_price: Number(input.purchase_price),
      selling_price: Number(input.selling_price),
      is_active: input.is_active !== undefined ? input.is_active : true,
      created_at: now,
      updated_at: now,
    };
    memoryProducts.unshift(newProd);
    return newProd;
  }

  async update(id: number, input: UpdateProductInput): Promise<Product | null> {
    const now = new Date().toISOString();
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          UPDATE products
          SET
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            unit = COALESCE($3, unit),
            purchase_price = COALESCE($4, purchase_price),
            selling_price = COALESCE($5, selling_price),
            is_active = COALESCE($6, is_active),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $7
          RETURNING *;
        `;
        const result = await query<Product>(sql, [
          input.name || null,
          input.description || null,
          input.unit || null,
          input.purchase_price !== undefined ? input.purchase_price : null,
          input.selling_price !== undefined ? input.selling_price : null,
          input.is_active !== undefined ? input.is_active : null,
          id,
        ]);
        return result.rows[0] || null;
      } catch (err) {
        // Fallback to memory
      }
    }

    const idx = memoryProducts.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    memoryProducts[idx] = {
      ...memoryProducts[idx],
      ...input,
      updated_at: now,
    };
    return memoryProducts[idx];
  }

  async toggleActive(id: number): Promise<Product | null> {
    const product = await this.findById(id);
    if (!product) return null;
    return this.update(id, { is_active: !product.is_active });
  }

  async delete(id: number): Promise<boolean> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      try {
        const res = await query('DELETE FROM products WHERE id = $1', [id]);
        return (res.rowCount ?? 0) > 0;
      } catch (err) {
        // Fallback
      }
    }

    const idx = memoryProducts.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    memoryProducts.splice(idx, 1);
    return true;
  }
}

export const productRepository = new ProductRepository();

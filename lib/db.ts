import pg from "pg";
import type { PoolClient, Pool } from "pg";

import fs from "node:fs";
import path from "node:path";

const { Pool: PgPool } = pg;
let poolInstance: Pool | null = null;

// Ensure drone-store-system/.env is loaded if running in standalone context
if (!process.env.DB_HOST) {
  try {
    const envPath = path.resolve(process.cwd(), "drone-store-system/.env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      for (const line of envContent.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  } catch {
    // Rely on process.env in production environments
  }
}

export function getDbPool(): Pool {
  if (!poolInstance) {
    const dbHost = process.env.DB_HOST;
    const dbUser = process.env.DB_USERNAME || process.env.DB_USER;
    let dbPass = process.env.DB_PASSWORD;
    // Guard against dotenv parsers stripping unquoted trailing '#' comments
    if (dbPass && dbPass === "Esha2909123") {
      dbPass = "Esha2909123#";
    }
    const dbName = process.env.DB_NAME || "postgres";
    const dbPort = parseInt(process.env.DB_PORT || "6543", 10);

    // Prefer explicit host credentials loaded from drone-store-system/.env
    if (dbHost && dbUser) {
      poolInstance = new PgPool({
        host: dbHost,
        port: isNaN(dbPort) ? 6543 : dbPort,
        database: dbName,
        user: dbUser,
        password: dbPass,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    } else {
      const rawConnectionString =
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.DATABASE_URL ||
        process.env.DB_URL ||
        process.env.POSTGRES_URL_NON_POOLING;
      const connectionString = rawConnectionString
        ? rawConnectionString.replace(/^jdbc:/, "")
        : undefined;

      if (
        connectionString &&
        !connectionString.includes("${") &&
        (connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://"))
      ) {
        poolInstance = new PgPool({
          connectionString,
          ssl: { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        });
      } else {
        // Fallback default Supabase pooler
        poolInstance = new PgPool({
          host: dbHost || "aws-0-ap-northeast-1.pooler.supabase.com",
          port: isNaN(dbPort) ? 6543 : dbPort,
          database: dbName || "postgres",
          user: dbUser || "postgres.shuomuvvemiesoxyabnp",
          password: dbPass || process.env.DB_PASSWORD || "",
          ssl: { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        });
      }
    }

    poolInstance.on("error", (err) => {
      console.error("[PostgreSQL Pool Error]:", err);
    });
  }
  return poolInstance;
}

let schemaInitialized = false;

export async function initEnquirySchema(): Promise<void> {
  if (schemaInitialized) return;
  const pool = getDbPool();
  let client: PoolClient;
  try {
    client = await pool.connect();
  } catch (connectErr) {
    poolInstance = null;
    throw connectErr;
  }
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id SERIAL PRIMARY KEY,
        reference VARCHAR(64) UNIQUE NOT NULL,
        enquiry_type VARCHAR(50) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        message TEXT,
        specifications JSONB,
        product_items JSONB,
        total_items INTEGER DEFAULT 0,
        indicative_total NUMERIC(12, 2) DEFAULT 0,
        delivery_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        delivery_error TEXT,
        delivery_attempts INTEGER DEFAULT 0,
        last_attempted_at TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS enquiry_attachments (
        id SERIAL PRIMARY KEY,
        enquiry_id INTEGER NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        content_type VARCHAR(128) NOT NULL,
        file_size BIGINT NOT NULL,
        file_data BYTEA NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_enquiries_reference ON enquiries(reference);
      CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_enquiries_type ON enquiries(enquiry_type);
      CREATE INDEX IF NOT EXISTS idx_enquiries_delivery_status ON enquiries(delivery_status);
      CREATE INDEX IF NOT EXISTS idx_enquiry_attachments_enquiry_id ON enquiry_attachments(enquiry_id);
    `);
    schemaInitialized = true;
  } catch (err) {
    console.error("[initEnquirySchema] Error initializing schema:", err);
    throw err;
  } finally {
    client.release();
  }
}

export interface EnquiryAttachmentMetadata {
  id: number;
  enquiryId: number;
  filename: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface AttachmentInput {
  filename: string;
  contentType: string;
  fileSize: number;
  buffer: Buffer;
}

export interface EnquiryRecord {
  id: number;
  reference: string;
  enquiryType: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  message?: string | null;
  specifications?: Record<string, any> | null;
  productItems?: any[] | null;
  totalItems: number;
  indicativeTotal: number;
  deliveryStatus: "PENDING" | "SENT" | "FAILED";
  deliveryError?: string | null;
  deliveryAttempts: number;
  lastAttemptedAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: EnquiryAttachmentMetadata[];
}

export interface CreateEnquiryInput {
  reference: string;
  enquiryType: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  message?: string;
  specifications?: Record<string, any>;
  productItems?: any[];
  totalItems?: number;
  indicativeTotal?: number;
}

export async function createEnquiry(
  input: CreateEnquiryInput,
  attachments: AttachmentInput[] = []
): Promise<EnquiryRecord> {
  await initEnquirySchema();
  const pool = getDbPool();
  let client: PoolClient;
  try {
    client = await pool.connect();
  } catch (connectErr) {
    poolInstance = null;
    throw connectErr;
  }

  try {
    await client.query("BEGIN");

    const insertQuery = `
      INSERT INTO enquiries (
        reference, enquiry_type, customer_name, customer_email, customer_phone,
        message, specifications, product_items, total_items, indicative_total,
        delivery_status, delivery_attempts, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', 0, NOW(), NOW())
      RETURNING *;
    `;

    const values = [
      input.reference,
      input.enquiryType,
      input.customerName,
      input.customerEmail,
      input.customerPhone || null,
      input.message || null,
      input.specifications ? JSON.stringify(input.specifications) : null,
      input.productItems ? JSON.stringify(input.productItems) : null,
      input.totalItems || 0,
      input.indicativeTotal || 0,
    ];

    const res = await client.query(insertQuery, values);
    const row = res.rows[0];

    const attachmentMetas: EnquiryAttachmentMetadata[] = [];

    for (const att of attachments) {
      const attInsert = `
        INSERT INTO enquiry_attachments (enquiry_id, filename, content_type, file_size, file_data, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, enquiry_id, filename, content_type, file_size, created_at;
      `;
      const attRes = await client.query(attInsert, [
        row.id,
        att.filename,
        att.contentType,
        att.fileSize,
        att.buffer,
      ]);
      const attRow = attRes.rows[0];
      attachmentMetas.push({
        id: attRow.id,
        enquiryId: attRow.enquiry_id,
        filename: attRow.filename,
        contentType: attRow.content_type,
        fileSize: Number(attRow.file_size),
        createdAt: attRow.created_at.toISOString(),
      });
    }

    await client.query("COMMIT");

    return mapEnquiryRow(row, attachmentMetas);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[createEnquiry] Transaction rolled back:", err);
    throw err;
  } finally {
    client.release();
  }
}

export async function updateEnquiryDeliveryStatus(
  id: number,
  status: "SENT" | "FAILED" | "PENDING",
  error?: string | null
): Promise<void> {
  const pool = getDbPool();
  const query = `
    UPDATE enquiries
    SET delivery_status = $1::varchar,
        delivery_error = $2::text,
        delivery_attempts = delivery_attempts + 1,
        last_attempted_at = NOW(),
        sent_at = CASE WHEN $1::varchar = 'SENT' THEN NOW() ELSE sent_at END,
        updated_at = NOW()
    WHERE id = $3::integer;
  `;
  await pool.query(query, [status, error || null, id]);
}

export interface GetEnquiriesOptions {
  type?: string;
  status?: string;
  search?: string;
  sort?: "newest" | "oldest";
  limit?: number;
  offset?: number;
}

export interface PaginatedEnquiries {
  enquiries: EnquiryRecord[];
  total: number;
  limit: number;
  offset: number;
}

export async function getEnquiries(
  options: GetEnquiriesOptions = {}
): Promise<PaginatedEnquiries> {
  await initEnquirySchema();
  const pool = getDbPool();

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (options.type && options.type !== "all") {
    conditions.push(`enquiry_type = $${paramIdx++}`);
    params.push(options.type);
  }

  if (options.status && options.status !== "all") {
    conditions.push(`delivery_status = $${paramIdx++}`);
    params.push(options.status.toUpperCase());
  }

  if (options.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    conditions.push(
      `(reference ILIKE $${paramIdx} OR customer_name ILIKE $${paramIdx} OR customer_email ILIKE $${paramIdx} OR customer_phone ILIKE $${paramIdx})`
    );
    params.push(term);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortDirection = options.sort === "oldest" ? "ASC" : "DESC";

  // Get total count
  const countRes = await pool.query(
    `SELECT COUNT(*) FROM enquiries ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const limit = Math.min(Math.max(options.limit || 20, 1), 100);
  const offset = Math.max(options.offset || 0, 0);

  const listQuery = `
    SELECT e.*,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', a.id,
                 'enquiryId', a.enquiry_id,
                 'filename', a.filename,
                 'contentType', a.content_type,
                 'fileSize', a.file_size,
                 'createdAt', a.created_at
               )
             ) FILTER (WHERE a.id IS NOT NULL), '[]'
           ) as attachments_list
    FROM enquiries e
    LEFT JOIN enquiry_attachments a ON e.id = a.enquiry_id
    ${whereClause}
    GROUP BY e.id
    ORDER BY e.created_at ${sortDirection}
    LIMIT $${paramIdx++} OFFSET $${paramIdx++};
  `;

  const listParams = [...params, limit, offset];
  const listRes = await pool.query(listQuery, listParams);

  const enquiries = listRes.rows.map((row) => {
    const attachments = (row.attachments_list || []).map((att: any) => ({
      ...att,
      fileSize: Number(att.fileSize),
      createdAt: new Date(att.createdAt).toISOString(),
    }));
    return mapEnquiryRow(row, attachments);
  });

  return { enquiries, total, limit, offset };
}

export async function getEnquiryById(id: number): Promise<EnquiryRecord | null> {
  await initEnquirySchema();
  const pool = getDbPool();

  const query = `
    SELECT e.*,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', a.id,
                 'enquiryId', a.enquiry_id,
                 'filename', a.filename,
                 'contentType', a.content_type,
                 'fileSize', a.file_size,
                 'createdAt', a.created_at
               )
             ) FILTER (WHERE a.id IS NOT NULL), '[]'
           ) as attachments_list
    FROM enquiries e
    LEFT JOIN enquiry_attachments a ON e.id = a.enquiry_id
    WHERE e.id = $1
    GROUP BY e.id;
  `;

  const res = await pool.query(query, [id]);
  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  const attachments = (row.attachments_list || []).map((att: any) => ({
    ...att,
    fileSize: Number(att.fileSize),
    createdAt: new Date(att.createdAt).toISOString(),
  }));

  return mapEnquiryRow(row, attachments);
}

export async function getEnquiryAttachmentData(
  enquiryId: number,
  attachmentId: number
): Promise<{ filename: string; contentType: string; buffer: Buffer } | null> {
  await initEnquirySchema();
  const pool = getDbPool();

  const query = `
    SELECT filename, content_type, file_data
    FROM enquiry_attachments
    WHERE id = $1 AND enquiry_id = $2;
  `;

  const res = await pool.query(query, [attachmentId, enquiryId]);
  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  return {
    filename: row.filename,
    contentType: row.content_type,
    buffer: row.file_data,
  };
}

export async function getAllAttachmentsForEnquiry(
  enquiryId: number
): Promise<Array<{ filename: string; contentType: string; buffer: Buffer; fileSize: number }>> {
  await initEnquirySchema();
  const pool = getDbPool();

  const query = `
    SELECT filename, content_type, file_data, file_size
    FROM enquiry_attachments
    WHERE enquiry_id = $1;
  `;

  const res = await pool.query(query, [enquiryId]);
  return res.rows.map((row) => ({
    filename: row.filename,
    contentType: row.content_type,
    buffer: row.file_data,
    fileSize: Number(row.file_size),
  }));
}

export async function deleteEnquiry(id: number): Promise<boolean> {
  await initEnquirySchema();
  const pool = getDbPool();

  // Cascade delete handles enquiry_attachments automatically
  const res = await pool.query("DELETE FROM enquiries WHERE id = $1 RETURNING id;", [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function getEnquiryStats(): Promise<{
  total: number;
  sent: number;
  failed: number;
  pending: number;
}> {
  await initEnquirySchema();
  const pool = getDbPool();

  const query = `
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE delivery_status = 'SENT') as sent,
      COUNT(*) FILTER (WHERE delivery_status = 'FAILED') as failed,
      COUNT(*) FILTER (WHERE delivery_status = 'PENDING') as pending
    FROM enquiries;
  `;

  const res = await pool.query(query);
  const row = res.rows[0];
  return {
    total: parseInt(row.total || "0", 10),
    sent: parseInt(row.sent || "0", 10),
    failed: parseInt(row.failed || "0", 10),
    pending: parseInt(row.pending || "0", 10),
  };
}

function mapEnquiryRow(row: any, attachments?: EnquiryAttachmentMetadata[]): EnquiryRecord {
  return {
    id: row.id,
    reference: row.reference,
    enquiryType: row.enquiry_type,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    message: row.message,
    specifications: typeof row.specifications === "string" ? JSON.parse(row.specifications) : row.specifications,
    productItems: typeof row.product_items === "string" ? JSON.parse(row.product_items) : row.product_items,
    totalItems: row.total_items || 0,
    indicativeTotal: Number(row.indicative_total || 0),
    deliveryStatus: row.delivery_status,
    deliveryError: row.delivery_error,
    deliveryAttempts: row.delivery_attempts || 0,
    lastAttemptedAt: row.last_attempted_at ? new Date(row.last_attempted_at).toISOString() : null,
    sentAt: row.sent_at ? new Date(row.sent_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    attachments,
  };
}

import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;

export async function initDuckDB() {
  if (db) return db;

  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

  // Select a bundle based on browser capabilities
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
  );

  // Instantiate the asynchronous version of DuckDB-wasm
  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);

  return db;
}

export async function loadParquetData(filePath: string): Promise<any[]> {
  const database = await initDuckDB();
  const connection = await database.connect();

  // Read the parquet file from the public directory
  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();

  // Register the file with DuckDB
  await database.registerFileBuffer('data.parquet', new Uint8Array(arrayBuffer));

  // Query the data
  const result = await connection.query(`
    SELECT * FROM read_parquet('data.parquet')
  `);

  // Convert to JavaScript array
  const data = result.toArray().map(row => row.toJSON());

  await connection.close();
  return data;
}

export async function queryParquet(filePath: string, query: string): Promise<any[]> {
  const database = await initDuckDB();
  const connection = await database.connect();

  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();

  await database.registerFileBuffer('data.parquet', new Uint8Array(arrayBuffer));

  const result = await connection.query(query);
  const data = result.toArray().map(row => row.toJSON());

  await connection.close();
  return data;
}

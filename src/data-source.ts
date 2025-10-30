import "reflect-metadata"
import { DataSource } from "typeorm"
import { configDotenv } from "dotenv"

configDotenv()

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.DB_LOGGING === "true",
    entities: [__dirname + '/**/*.entity.js'],
    migrations: [__dirname + "/**/*.migration.js"],
    subscribers: [__dirname +  "/**/*.subscriber.js"],
})
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import passport from './config/passport';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'yaml';
import path from 'path';

const app = express();
app.use(
  cors({
    origin: [],
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(yaml.parse(fs.readFileSync(path.join(path.resolve(), 'openapi.yaml'), 'utf-8')))
);

export default app;

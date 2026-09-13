import express from 'express';
import morgan from 'morgan';
import connectDB from './db/db.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import aiRoutes from './routes/ai.routes.js';
import { corsOptions } from './config/cors.js';

connectDB();


const app = express();
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/users" , userRoutes);
app.use("/projects" , projectRoutes);
app.use("/ai" , aiRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'devchat-api' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;

import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../config/db';
import { errorHandler } from './middlewares/errorMiddleware';
import morgan from 'morgan';
// Load .env
dotenv.config();


const app: Application = express();
app.use(express.json());



// MongoDB connection
connectDB();
app.use(morgan(':method :url :status - :response-time ms'));
app.use(errorHandler);

export default app;

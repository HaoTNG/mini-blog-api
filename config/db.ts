import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error(' MONGODB_URI is not defined in .env');
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(mongoUri);
        console.log(` MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(` MongoDB connection error: ${(err as Error).message}`);
        process.exit(1);
    }
};

export default connectDB;

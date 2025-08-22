import app from "./app";
import postRoutes from './routes/postRoutes';
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import commentRoutes from "./routes/commentRoutes";

app.use('/', postRoutes, authRoutes, userRoutes, commentRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
  
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import testRoutes from './routes/test.js';

dotenv.config();
const app = express();

//Middleware 
app.use(cors());
app.use(express.json());

//Routes
app.use('/api', testRoutes);


app.get('/', (req, res) => res.send('API is running'));

app.listen(process.env.PORT || 5000, () => 
    console.log(`Server running on port ${process.env.PORT || 5000}`)
)

import express from 'express';
import favoriteController from '../controllers/FavoriteController';

const favoriteRouter = express.Router();

favoriteRouter.get('/', favoriteController.getAllFavoriteDrivers);

favoriteRouter.post('/drivers/:id', favoriteController.createFavorite);

favoriteRouter.delete('/drivers/:id', favoriteController.deleteFavorite);

export default favoriteRouter;
